"use server"

import { and, eq, sql } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { z } from "zod"
import { db } from "@/lib/db"
import { lessonProgress, submissions, notifications, user as userTable, session as sessionTable } from "@/lib/db/schema"
import { requireUser, AuthError } from "@/lib/rbac"
import { audit, notify } from "@/lib/audit"
import { canAccessLesson } from "@/lib/queries/course"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"

type ActionResult<T = undefined> = { ok: true; data?: T } | { ok: false; error: string }

function fail(err: unknown): ActionResult<never> {
  if (err instanceof AuthError) return { ok: false, error: err.message }
  if (err instanceof z.ZodError) return { ok: false, error: err.issues[0]?.message ?? "Некорректные данные" }
  console.error("[action]", err)
  return { ok: false, error: "Не удалось выполнить действие. Попробуйте позже." }
}

const submissionSchema = z.object({
  lessonId: z.number().int().positive(),
  contentText: z.string().max(20000, "Слишком длинный текст (макс. 20 000 символов)").optional().default(""),
  contentLink: z
    .string()
    .max(2048)
    .optional()
    .default("")
    .refine((v) => v === "" || /^https?:\/\/.+/i.test(v), "Ссылка должна начинаться с http:// или https://"),
  fields: z.record(z.string(), z.string().max(5000)).optional().default({}),
})

export async function markLessonWatched(lessonId: number): Promise<ActionResult> {
  try {
    const user = await requireUser()
    const access = await canAccessLesson(user.id, user.tariff, lessonId)
    if (!access.ok) throw new AuthError("Урок недоступен", 403)

    await db
      .insert(lessonProgress)
      .values({ userId: user.id, lessonId, watched: true, watchedAt: new Date() })
      .onConflictDoUpdate({
        target: [lessonProgress.userId, lessonProgress.lessonId],
        set: { watched: true, watchedAt: new Date() },
      })
    revalidatePath(`/dashboard/lessons/${lessonId}`)
    revalidatePath("/dashboard")
    return { ok: true }
  } catch (e) {
    return fail(e)
  }
}

export async function saveDraft(input: z.input<typeof submissionSchema>): Promise<ActionResult> {
  try {
    const user = await requireUser()
    const data = submissionSchema.parse(input)
    const access = await canAccessLesson(user.id, user.tariff, data.lessonId)
    if (!access.ok) throw new AuthError("Урок недоступен", 403)

    const [existing] = await db
      .select({ id: submissions.id, status: submissions.status })
      .from(submissions)
      .where(and(eq(submissions.userId, user.id), eq(submissions.lessonId, data.lessonId)))
      .limit(1)

    if (existing && (existing.status === "pending" || existing.status === "accepted")) {
      return { ok: false, error: "Задание уже отправлено — черновик недоступен" }
    }

    await db
      .insert(submissions)
      .values({
        userId: user.id,
        lessonId: data.lessonId,
        status: "draft",
        contentText: data.contentText || null,
        contentLink: data.contentLink || null,
        fields: data.fields,
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: [submissions.userId, submissions.lessonId],
        set: {
          contentText: data.contentText || null,
          contentLink: data.contentLink || null,
          fields: data.fields,
          // A "needs_revision" submission keeps its status while the student edits;
          // only fresh work becomes a draft.
          status: sql`CASE WHEN ${submissions.status} = 'needs_revision' THEN 'needs_revision' ELSE 'draft' END`,
          updatedAt: new Date(),
        },
      })
    revalidatePath(`/dashboard/lessons/${data.lessonId}`)
    return { ok: true }
  } catch (e) {
    return fail(e)
  }
}

export async function submitAssignment(input: z.input<typeof submissionSchema>): Promise<ActionResult> {
  try {
    const user = await requireUser()
    const data = submissionSchema.parse(input)
    const access = await canAccessLesson(user.id, user.tariff, data.lessonId)
    if (!access.ok) throw new AuthError("Урок недоступен", 403)

    const fmt = access.lesson.assignmentFormat
    const hasContent =
      (fmt === "text" && data.contentText.trim().length >= 20) ||
      (fmt === "link" && data.contentLink.length > 0) ||
      (fmt === "file" && (data.contentLink.length > 0 || data.contentText.trim().length > 0)) ||
      (fmt === "fields" && Object.values(data.fields).some((v) => v.trim().length > 0))
    if (!hasContent) {
      return {
        ok: false,
        error:
          fmt === "text"
            ? "Ответ слишком короткий — минимум 20 символов"
            : fmt === "link"
              ? "Добавьте ссылку на результат"
              : "Заполните хотя бы одно поле",
      }
    }

    const [existing] = await db
      .select({ id: submissions.id, status: submissions.status, version: submissions.version })
      .from(submissions)
      .where(and(eq(submissions.userId, user.id), eq(submissions.lessonId, data.lessonId)))
      .limit(1)

    if (existing?.status === "pending") return { ok: false, error: "Задание уже на проверке" }
    if (existing?.status === "accepted") return { ok: false, error: "Задание уже принято" }

    const nextVersion = existing?.status === "needs_revision" ? existing.version + 1 : existing?.version ?? 1

    await db
      .insert(submissions)
      .values({
        userId: user.id,
        lessonId: data.lessonId,
        status: "pending",
        contentText: data.contentText || null,
        contentLink: data.contentLink || null,
        fields: data.fields,
        version: nextVersion,
        submittedAt: new Date(),
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: [submissions.userId, submissions.lessonId],
        set: {
          status: "pending",
          contentText: data.contentText || null,
          contentLink: data.contentLink || null,
          fields: data.fields,
          version: nextVersion,
          grade: null,
          submittedAt: new Date(),
          updatedAt: new Date(),
        },
      })

    await audit(user, "submission.submit", "submission", `${user.id}:${data.lessonId}`, {
      lessonId: data.lessonId,
      version: nextVersion,
    })
    revalidatePath(`/dashboard/lessons/${data.lessonId}`)
    revalidatePath("/dashboard")
    revalidatePath("/dashboard/assignments")
    revalidatePath("/admin/reviews")
    return { ok: true }
  } catch (e) {
    return fail(e)
  }
}

export async function markNotificationsRead(): Promise<ActionResult> {
  try {
    const user = await requireUser()
    await db.update(notifications).set({ read: true }).where(eq(notifications.userId, user.id))
    revalidatePath("/dashboard/notifications")
    return { ok: true }
  } catch (e) {
    return fail(e)
  }
}

const profileSchema = z.object({
  name: z.string().trim().min(2, "Минимум 2 символа").max(80, "Слишком длинное имя"),
})

export async function updateProfile(input: { name: string }): Promise<ActionResult> {
  try {
    const user = await requireUser()
    const { name } = profileSchema.parse(input)
    await db.update(userTable).set({ name, updatedAt: new Date() }).where(eq(userTable.id, user.id))
    await audit(user, "profile.update", "user", user.id, { name })
    revalidatePath("/dashboard", "layout")
    return { ok: true }
  } catch (e) {
    return fail(e)
  }
}

export async function listMySessions() {
  const user = await requireUser()
  return db
    .select({
      id: sessionTable.id,
      ipAddress: sessionTable.ipAddress,
      userAgent: sessionTable.userAgent,
      createdAt: sessionTable.createdAt,
      expiresAt: sessionTable.expiresAt,
    })
    .from(sessionTable)
    .where(eq(sessionTable.userId, user.id))
    .orderBy(sessionTable.createdAt)
    .then((rows) => rows.map((r) => ({ ...r, current: r.id === user.sessionId })))
}

export async function revokeMySession(sessionId: string): Promise<ActionResult> {
  try {
    const user = await requireUser()
    if (sessionId === user.sessionId) return { ok: false, error: "Текущую сессию завершите через «Выйти»" }
    // Scoped by userId so a user can only kill their own sessions.
    await db.delete(sessionTable).where(and(eq(sessionTable.id, sessionId), eq(sessionTable.userId, user.id)))
    await audit(user, "session.revoke_own", "session", sessionId)
    revalidatePath("/dashboard/security")
    return { ok: true }
  } catch (e) {
    return fail(e)
  }
}

export async function revokeMyOtherSessions(): Promise<ActionResult> {
  try {
    const user = await requireUser()
    await auth.api.revokeOtherSessions({ headers: await headers() })
    await audit(user, "session.revoke_others", "user", user.id)
    revalidatePath("/dashboard/security")
    return { ok: true }
  } catch (e) {
    return fail(e)
  }
}

export async function toggleTwoFactor(enabled: boolean): Promise<ActionResult> {
  try {
    const user = await requireUser()
    // The flag is persisted so the UI and admin panel reflect the user's intent.
    // TOTP enrollment and challenge verification are the next step for this flow.
    await db
      .update(userTable)
      .set({ twoFactorEnabled: enabled, updatedAt: new Date() })
      .where(eq(userTable.id, user.id))
    await audit(user, enabled ? "2fa.enable" : "2fa.disable", "user", user.id)
    revalidatePath("/dashboard/security")
    return { ok: true }
  } catch (e) {
    return fail(e)
  }
}
