import { and, asc, desc, eq, inArray } from "drizzle-orm"
import { db } from "@/lib/db"
import { lessons, levels, lessonProgress, submissions, submissionReviews, user as userTable } from "@/lib/db/schema"
import { hasTariffAccess } from "@/lib/rbac"
import type { SubmissionStatus, Tariff } from "@/lib/constants"

export type LessonWithState = typeof lessons.$inferSelect & {
  watched: boolean
  status: SubmissionStatus
  unlocked: boolean
  tariffOk: boolean
}

export type LevelWithLessons = typeof levels.$inferSelect & {
  lessons: LessonWithState[]
  unlocked: boolean
  completed: boolean
  acceptedCount: number
}

export async function getCourseForUser(userId: string, tariff: Tariff): Promise<LevelWithLessons[]> {
  const [lvls, lsns, progress, subs] = await Promise.all([
    db.select().from(levels).orderBy(asc(levels.order)),
    db
      .select()
      .from(lessons)
      .where(and(eq(lessons.published, true), eq(lessons.archived, false)))
      .orderBy(asc(lessons.order)),
    db.select().from(lessonProgress).where(eq(lessonProgress.userId, userId)),
    db
      .select({ lessonId: submissions.lessonId, status: submissions.status })
      .from(submissions)
      .where(eq(submissions.userId, userId)),
  ])

  const watchedSet = new Set(progress.filter((p) => p.watched).map((p) => p.lessonId))
  const statusMap = new Map(subs.map((s) => [s.lessonId, s.status as SubmissionStatus]))

  // Level N+1 unlocks only once every lesson in level N is accepted.
  let previousLevelComplete = true
  const result: LevelWithLessons[] = []

  for (const lvl of lvls) {
    const lvlLessons = lsns.filter((l) => l.levelId === lvl.id)
    const acceptedCount = lvlLessons.filter((l) => statusMap.get(l.id) === "accepted").length
    const completed = lvlLessons.length > 0 && acceptedCount === lvlLessons.length
    const unlocked = previousLevelComplete

    result.push({
      ...lvl,
      unlocked,
      completed,
      acceptedCount,
      lessons: lvlLessons.map((l) => ({
        ...l,
        watched: watchedSet.has(l.id),
        status: statusMap.get(l.id) ?? "not_submitted",
        unlocked,
        tariffOk: hasTariffAccess(tariff, l.minTariff as Tariff),
      })),
    })
    previousLevelComplete = completed
  }

  return result
}

export function summarizeProgress(course: LevelWithLessons[]) {
  const all = course.flatMap((l) => l.lessons)
  const accepted = all.filter((l) => l.status === "accepted").length
  const total = all.length
  const currentLevel = course.find((l) => l.unlocked && !l.completed) ?? course[course.length - 1]
  const nextLesson =
    all.find((l) => l.unlocked && l.status !== "accepted" && l.tariffOk) ?? null
  const pending = all.filter((l) => l.status === "pending").length
  const needsRevision = all.filter((l) => l.status === "needs_revision").length
  return {
    accepted,
    total,
    percent: total ? Math.round((accepted / total) * 100) : 0,
    currentLevel,
    nextLesson,
    pending,
    needsRevision,
  }
}

export async function getLessonForUser(userId: string, lessonId: number) {
  const [lesson] = await db
    .select()
    .from(lessons)
    .where(and(eq(lessons.id, lessonId), eq(lessons.published, true), eq(lessons.archived, false)))
    .limit(1)
  if (!lesson) return null

  const [level] = await db.select().from(levels).where(eq(levels.id, lesson.levelId)).limit(1)
  const [sub] = await db
    .select()
    .from(submissions)
    .where(and(eq(submissions.userId, userId), eq(submissions.lessonId, lessonId)))
    .limit(1)
  const [prog] = await db
    .select()
    .from(lessonProgress)
    .where(and(eq(lessonProgress.userId, userId), eq(lessonProgress.lessonId, lessonId)))
    .limit(1)

  const reviews = sub
    ? await db
        .select({
          id: submissionReviews.id,
          action: submissionReviews.action,
          comment: submissionReviews.comment,
          grade: submissionReviews.grade,
          version: submissionReviews.version,
          createdAt: submissionReviews.createdAt,
          curatorName: userTable.name,
        })
        .from(submissionReviews)
        .leftJoin(userTable, eq(userTable.id, submissionReviews.curatorId))
        .where(eq(submissionReviews.submissionId, sub.id))
        .orderBy(desc(submissionReviews.createdAt))
    : []

  // Neighbouring lessons for prev/next navigation.
  const siblings = await db
    .select({ id: lessons.id, order: lessons.order, title: lessons.title })
    .from(lessons)
    .where(and(eq(lessons.published, true), eq(lessons.archived, false)))
    .orderBy(asc(lessons.order))
  const idx = siblings.findIndex((s) => s.id === lessonId)

  return {
    lesson,
    level,
    submission: sub ?? null,
    watched: prog?.watched ?? false,
    reviews,
    prev: idx > 0 ? siblings[idx - 1] : null,
    next: idx >= 0 && idx < siblings.length - 1 ? siblings[idx + 1] : null,
  }
}

/** Server-side gate: is this lesson reachable for the user (level unlocked + tariff)? */
export async function canAccessLesson(userId: string, tariff: Tariff, lessonId: number) {
  const course = await getCourseForUser(userId, tariff)
  const lesson = course.flatMap((l) => l.lessons).find((l) => l.id === lessonId)
  if (!lesson) return { ok: false as const, reason: "not_found" as const }
  if (!lesson.unlocked) return { ok: false as const, reason: "locked" as const }
  if (!lesson.tariffOk) return { ok: false as const, reason: "tariff" as const, required: lesson.minTariff as Tariff }
  return { ok: true as const, lesson }
}

export async function getUserSubmissions(userId: string) {
  const rows = await db
    .select({
      submission: submissions,
      lessonTitle: lessons.title,
      lessonOrder: lessons.order,
    })
    .from(submissions)
    .innerJoin(lessons, eq(lessons.id, submissions.lessonId))
    .where(eq(submissions.userId, userId))
    .orderBy(desc(submissions.updatedAt))

  const ids = rows.map((r) => r.submission.id)
  const reviews = ids.length
    ? await db
        .select({
          id: submissionReviews.id,
          submissionId: submissionReviews.submissionId,
          action: submissionReviews.action,
          comment: submissionReviews.comment,
          grade: submissionReviews.grade,
          version: submissionReviews.version,
          createdAt: submissionReviews.createdAt,
          curatorName: userTable.name,
        })
        .from(submissionReviews)
        .leftJoin(userTable, eq(userTable.id, submissionReviews.curatorId))
        .where(inArray(submissionReviews.submissionId, ids))
        .orderBy(desc(submissionReviews.createdAt))
    : []

  return rows.map((r) => ({
    ...r,
    reviews: reviews.filter((rv) => rv.submissionId === r.submission.id),
  }))
}

export async function getLatestCuratorComment(userId: string) {
  const [row] = await db
    .select({
      comment: submissionReviews.comment,
      action: submissionReviews.action,
      createdAt: submissionReviews.createdAt,
      curatorName: userTable.name,
      lessonTitle: lessons.title,
      lessonId: lessons.id,
    })
    .from(submissionReviews)
    .innerJoin(submissions, eq(submissions.id, submissionReviews.submissionId))
    .innerJoin(lessons, eq(lessons.id, submissions.lessonId))
    .leftJoin(userTable, eq(userTable.id, submissionReviews.curatorId))
    .where(eq(submissions.userId, userId))
    .orderBy(desc(submissionReviews.createdAt))
    .limit(1)
  return row ?? null
}
