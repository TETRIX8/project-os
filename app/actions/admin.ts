"use server"

import { and, eq } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { z } from "zod"
import { db } from "@/lib/db"
import {
  submissions,
  submissionReviews,
  lessons,
  levels,
  materials,
  user as userTable,
  session as sessionTable,
} from "@/lib/db/schema"
import { requirePermission, canAssignRole, AuthError, isRole } from "@/lib/rbac"
import { audit, notify } from "@/lib/audit"
import { TARIFFS, ASSIGNMENT_FORMATS, type Tariff } from "@/lib/constants"

type ActionResult<T = undefined> = { ok: true; data?: T } | { ok: false; error: string }

function fail(err: unknown): ActionResult<never> {
  if (err instanceof AuthError) return { ok: false, error: err.message }
  if (err instanceof z.ZodError) return { ok: false, error: err.issues[0]?.message ?? "Некорректные данные" }
  console.error("[admin-action]", err)
  return { ok: false, error: "Не удалось выполнить действие" }
}

// ---------------- Reviews ----------------

const reviewSchema = z.object({
  submissionId: z.number().int().positive(),
  action: z.enum(["accept", "revise"]),
  comment: z.string().trim().max(5000, "Комментарий слишком длинный"),
  grade: z.number().int().min(1).max(10).nullable(),
})

export async function reviewSubmission(input: z.input<typeof reviewSchema>): Promise<ActionResult> {
  try {
    const curator = await requirePermission("reviews.grade")
    const data = reviewSchema.parse(input)

    if (data.action === "revise" && data.comment.length < 10) {
      return { ok: false, error: "При запросе доработки напишите комментарий (минимум 10 символов)" }
    }

    const [sub] = await db.select().from(submissions).where(eq(submissions.id, data.submissionId)).limit(1)
    if (!sub) return { ok: false, error: "Задание не найдено" }
    if (sub.status !== "pending") return { ok: false, error: "Задание уже проверено" }

    const newStatus = data.action === "accept" ? "accepted" : "needs_revision"

    await db.transaction(async (tx) => {
      await tx
        .update(submissions)
        .set({ status: newStatus, grade: data.grade, updatedAt: new Date() })
        .where(eq(submissions.id, sub.id))
      await tx.insert(submissionReviews).values({
        submissionId: sub.id,
        curatorId: curator.id,
        action: data.action,
        comment: data.comment || null,
        grade: data.grade,
        version: sub.version,
      })
    })

    const [lesson] = await db.select({ title: lessons.title }).from(lessons).where(eq(lessons.id, sub.lessonId)).limit(1)
    await notify(
      sub.userId,
      data.action === "accept" ? `Задание принято: ${lesson?.title ?? ""}` : `Нужна доработка: ${lesson?.title ?? ""}`,
      data.comment || undefined,
      data.action === "accept" ? "success" : "warning",
    )
    await audit(curator, `submission.${data.action}`, "submission", sub.id, {
      studentId: sub.userId,
      lessonId: sub.lessonId,
      version: sub.version,
      grade: data.grade,
    })

    revalidatePath("/admin/reviews")
    revalidatePath("/admin")
    revalidatePath("/dashboard")
    revalidatePath(`/dashboard/lessons/${sub.lessonId}`)
    revalidatePath("/dashboard/assignments")
    return { ok: true }
  } catch (e) {
    return fail(e)
  }
}

// ---------------- Students ----------------

export async function setUserTariff(userId: string, tariff: string): Promise<ActionResult> {
  try {
    const actor = await requirePermission("students.manage")
    if (!(TARIFFS as readonly string[]).includes(tariff)) return { ok: false, error: "Неизвестный тариф" }
    const [before] = await db.select({ tariff: userTable.tariff }).from(userTable).where(eq(userTable.id, userId)).limit(1)
    if (!before) return { ok: false, error: "Пользователь не найден" }
    await db.update(userTable).set({ tariff, updatedAt: new Date() }).where(eq(userTable.id, userId))
    await audit(actor, "user.tariff_change", "user", userId, { from: before.tariff, to: tariff })
    await notify(userId, `Ваш тариф изменён на ${tariff.toUpperCase()}`, undefined, "info")
    revalidatePath(`/admin/students/${userId}`)
    revalidatePath("/admin/students")
    return { ok: true }
  } catch (e) {
    return fail(e)
  }
}

export async function setUserRole(userId: string, role: string): Promise<ActionResult> {
  try {
    const actor = await requirePermission("roles.manage")
    if (!isRole(role)) return { ok: false, error: "Неизвестная роль" }
    if (userId === actor.id) return { ok: false, error: "Нельзя менять собственную роль" }
    if (!canAssignRole(actor.role, role)) return { ok: false, error: "У вас нет права назначать эту роль" }

    const [target] = await db.select({ role: userTable.role }).from(userTable).where(eq(userTable.id, userId)).limit(1)
    if (!target) return { ok: false, error: "Пользователь не найден" }
    if (target.role === "owner" && actor.role !== "owner") return { ok: false, error: "Только владелец может менять роль владельца" }

    await db.update(userTable).set({ role, updatedAt: new Date() }).where(eq(userTable.id, userId))
    await audit(actor, "user.role_change", "user", userId, { from: target.role, to: role })
    revalidatePath(`/admin/students/${userId}`)
    revalidatePath("/admin/students")
    return { ok: true }
  } catch (e) {
    return fail(e)
  }
}

export async function setUserBanned(userId: string, banned: boolean, reason?: string): Promise<ActionResult> {
  try {
    const actor = await requirePermission("students.ban")
    if (userId === actor.id) return { ok: false, error: "Нельзя заблокировать себя" }
    const [target] = await db.select({ role: userTable.role }).from(userTable).where(eq(userTable.id, userId)).limit(1)
    if (!target) return { ok: false, error: "Пользователь не найден" }
    if (target.role === "owner") return { ok: false, error: "Владельца нельзя заблокировать" }

    await db.transaction(async (tx) => {
      await tx
        .update(userTable)
        .set({ banned, banReason: banned ? reason?.trim() || null : null, updatedAt: new Date() })
        .where(eq(userTable.id, userId))
      // Banning also terminates every active session so access stops immediately.
      if (banned) await tx.delete(sessionTable).where(eq(sessionTable.userId, userId))
    })
    await audit(actor, banned ? "user.ban" : "user.unban", "user", userId, { reason })
    revalidatePath(`/admin/students/${userId}`)
    revalidatePath("/admin/students")
    return { ok: true }
  } catch (e) {
    return fail(e)
  }
}

export async function revokeUserSessions(userId: string, sessionId?: string): Promise<ActionResult> {
  try {
    const actor = await requirePermission("sessions.revoke")
    if (sessionId) {
      await db.delete(sessionTable).where(and(eq(sessionTable.id, sessionId), eq(sessionTable.userId, userId)))
    } else {
      await db.delete(sessionTable).where(eq(sessionTable.userId, userId))
    }
    await audit(actor, sessionId ? "session.revoke" : "session.revoke_all", "user", userId, { sessionId })
    revalidatePath(`/admin/students/${userId}`)
    return { ok: true }
  } catch (e) {
    return fail(e)
  }
}

// ---------------- Content ----------------

const lessonSchema = z.object({
  id: z.number().int().positive().optional(),
  levelId: z.number().int().positive(),
  order: z.number().int().min(1).max(999),
  title: z.string().trim().min(3, "Название слишком короткое").max(200),
  description: z.string().trim().max(2000).optional().default(""),
  goal: z.string().trim().max(1000).optional().default(""),
  notes: z.string().trim().max(50000).optional().default(""),
  videoUrl: z.string().trim().max(2048).optional().default(""),
  coverUrl: z.string().trim().max(2048).optional().default(""),
  durationMin: z.number().int().min(0).max(600),
  assignment: z.string().trim().max(5000).optional().default(""),
  assignmentFormat: z.enum(ASSIGNMENT_FORMATS),
  minTariff: z.enum(TARIFFS),
  published: z.boolean(),
})

export async function saveLesson(input: z.input<typeof lessonSchema>): Promise<ActionResult<{ id: number }>> {
  try {
    const actor = await requirePermission("content.edit")
    const data = lessonSchema.parse(input)
    const values = {
      levelId: data.levelId,
      order: data.order,
      title: data.title,
      description: data.description || null,
      goal: data.goal || null,
      notes: data.notes || null,
      videoUrl: data.videoUrl || null,
      coverUrl: data.coverUrl || null,
      durationMin: data.durationMin,
      assignment: data.assignment || null,
      assignmentFormat: data.assignmentFormat,
      minTariff: data.minTariff,
      published: data.published,
    }

    let id = data.id
    if (id) {
      await db.update(lessons).set(values).where(eq(lessons.id, id))
      await audit(actor, "lesson.update", "lesson", id, { title: data.title })
    } else {
      const [row] = await db.insert(lessons).values(values).returning({ id: lessons.id })
      id = row.id
      await audit(actor, "lesson.create", "lesson", id, { title: data.title })
    }
    revalidatePath("/admin/content")
    revalidatePath(`/admin/content/lessons/${id}`)
    revalidatePath("/dashboard", "layout")
    revalidatePath("/program")
    return { ok: true, data: { id } }
  } catch (e) {
    return fail(e)
  }
}

export async function setLessonPublished(lessonId: number, published: boolean): Promise<ActionResult> {
  try {
    const actor = await requirePermission("content.publish")
    await db.update(lessons).set({ published }).where(eq(lessons.id, lessonId))
    await audit(actor, published ? "lesson.publish" : "lesson.unpublish", "lesson", lessonId)
    revalidatePath("/admin/content")
    revalidatePath("/dashboard", "layout")
    return { ok: true }
  } catch (e) {
    return fail(e)
  }
}

/** Soft delete: lessons are archived, never physically removed. */
export async function archiveLesson(lessonId: number, archived: boolean): Promise<ActionResult> {
  try {
    const actor = await requirePermission("content.delete")
    await db.update(lessons).set({ archived, published: archived ? false : undefined }).where(eq(lessons.id, lessonId))
    await audit(actor, archived ? "lesson.archive" : "lesson.restore", "lesson", lessonId)
    revalidatePath("/admin/content")
    revalidatePath("/dashboard", "layout")
    return { ok: true }
  } catch (e) {
    return fail(e)
  }
}

const levelSchema = z.object({
  id: z.number().int().positive(),
  title: z.string().trim().min(2).max(120),
  subtitle: z.string().trim().max(120).optional().default(""),
  description: z.string().trim().max(1000).optional().default(""),
})

export async function saveLevel(input: z.input<typeof levelSchema>): Promise<ActionResult> {
  try {
    const actor = await requirePermission("content.edit")
    const data = levelSchema.parse(input)
    await db
      .update(levels)
      .set({ title: data.title, subtitle: data.subtitle || null, description: data.description || null })
      .where(eq(levels.id, data.id))
    await audit(actor, "level.update", "level", data.id, { title: data.title })
    revalidatePath("/admin/content")
    revalidatePath("/dashboard", "layout")
    return { ok: true }
  } catch (e) {
    return fail(e)
  }
}

const materialSchema = z.object({
  id: z.number().int().positive().optional(),
  title: z.string().trim().min(2).max(200),
  description: z.string().trim().max(1000).optional().default(""),
  category: z.enum(["template", "guide", "checklist", "bonus"]),
  minTariff: z.enum(TARIFFS),
})

export async function saveMaterial(input: z.input<typeof materialSchema>): Promise<ActionResult> {
  try {
    const actor = await requirePermission("content.edit")
    const data = materialSchema.parse(input)
    const values = {
      title: data.title,
      description: data.description || null,
      category: data.category,
      minTariff: data.minTariff,
    }
    if (data.id) {
      await db.update(materials).set(values).where(eq(materials.id, data.id))
      await audit(actor, "material.update", "material", data.id)
    } else {
      const [row] = await db.insert(materials).values(values).returning({ id: materials.id })
      await audit(actor, "material.create", "material", row.id)
    }
    revalidatePath("/admin/content")
    revalidatePath("/dashboard/materials")
    return { ok: true }
  } catch (e) {
    return fail(e)
  }
}

export async function deleteMaterial(id: number): Promise<ActionResult> {
  try {
    const actor = await requirePermission("content.delete")
    const [row] = await db.select().from(materials).where(eq(materials.id, id)).limit(1)
    if (!row) return { ok: false, error: "Материал не найден" }
    // Record the full snapshot in the audit log before deleting.
    await audit(actor, "material.delete", "material", id, { snapshot: row })
    await db.delete(materials).where(eq(materials.id, id))
    revalidatePath("/admin/content")
    revalidatePath("/dashboard/materials")
    return { ok: true }
  } catch (e) {
    return fail(e)
  }
}
