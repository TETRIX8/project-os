import { and, asc, count, desc, eq, gte, ilike, or, sql } from "drizzle-orm"
import { db } from "@/lib/db"
import {
  auditLog,
  lessons,
  levels,
  lessonProgress,
  materials,
  session as sessionTable,
  submissions,
  submissionReviews,
  user as userTable,
} from "@/lib/db/schema"

export async function getAdminKpis() {
  const since7d = new Date(Date.now() - 7 * 86400000)
  const [
    [{ students }],
    [{ newStudents }],
    [{ pending }],
    [{ accepted }],
    [{ activeSessions }],
    [{ watched }],
    [{ completed }],
  ] = await Promise.all([
    db.select({ students: count() }).from(userTable).where(eq(userTable.role, "student")),
    db.select({ newStudents: count() }).from(userTable).where(and(eq(userTable.role, "student"), gte(userTable.createdAt, since7d))),
    db.select({ pending: count() }).from(submissions).where(eq(submissions.status, "pending")),
    db.select({ accepted: count() }).from(submissions).where(eq(submissions.status, "accepted")),
    db.select({ activeSessions: count() }).from(sessionTable).where(gte(sessionTable.expiresAt, new Date())),
    db.select({ watched: count() }).from(lessonProgress).where(eq(lessonProgress.watched, true)),
    // Students who have every published lesson accepted.
    db
      .select({ completed: sql<number>`count(*)`.mapWith(Number) })
      .from(
        db
          .select({ userId: submissions.userId })
          .from(submissions)
          .where(eq(submissions.status, "accepted"))
          .groupBy(submissions.userId)
          .having(
            sql`count(*) >= (select count(*) from ${lessons} where ${lessons.published} = true and ${lessons.archived} = false)`,
          )
          .as("done"),
      ),
  ])
  return { students, newStudents, pending, accepted, activeSessions, watched, completed }
}

export async function getActivitySeries(days = 14) {
  const since = new Date(Date.now() - days * 86400000)
  const [subs, regs, reviews] = await Promise.all([
    db
      .select({ day: sql<string>`to_char(${submissions.submittedAt}, 'YYYY-MM-DD')`, n: count() })
      .from(submissions)
      .where(gte(submissions.submittedAt, since))
      .groupBy(sql`1`),
    db
      .select({ day: sql<string>`to_char(${userTable.createdAt}, 'YYYY-MM-DD')`, n: count() })
      .from(userTable)
      .where(gte(userTable.createdAt, since))
      .groupBy(sql`1`),
    db
      .select({ day: sql<string>`to_char(${submissionReviews.createdAt}, 'YYYY-MM-DD')`, n: count() })
      .from(submissionReviews)
      .where(gte(submissionReviews.createdAt, since))
      .groupBy(sql`1`),
  ])
  const map = new Map<string, { day: string; submissions: number; registrations: number; reviews: number }>()
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(Date.now() - i * 86400000)
    const key = d.toISOString().slice(0, 10)
    map.set(key, { day: key, submissions: 0, registrations: 0, reviews: 0 })
  }
  for (const r of subs) map.get(r.day) && (map.get(r.day)!.submissions = Number(r.n))
  for (const r of regs) map.get(r.day) && (map.get(r.day)!.registrations = Number(r.n))
  for (const r of reviews) map.get(r.day) && (map.get(r.day)!.reviews = Number(r.n))
  return Array.from(map.values())
}

export async function getFunnel() {
  const rows = await db
    .select({
      lessonId: lessons.id,
      order: lessons.order,
      title: lessons.title,
      levelId: lessons.levelId,
      accepted: sql<number>`count(*) filter (where ${submissions.status} = 'accepted')`.mapWith(Number),
      submitted: sql<number>`count(*) filter (where ${submissions.status} in ('pending','accepted','needs_revision'))`.mapWith(Number),
    })
    .from(lessons)
    .leftJoin(submissions, eq(submissions.lessonId, lessons.id))
    .where(and(eq(lessons.published, true), eq(lessons.archived, false)))
    .groupBy(lessons.id)
    .orderBy(asc(lessons.order))
  const watched = await db
    .select({ lessonId: lessonProgress.lessonId, n: count() })
    .from(lessonProgress)
    .where(eq(lessonProgress.watched, true))
    .groupBy(lessonProgress.lessonId)
  const wmap = new Map(watched.map((w) => [w.lessonId, Number(w.n)]))
  return rows.map((r) => ({ ...r, watched: wmap.get(r.lessonId) ?? 0 }))
}

export async function getReviewQueue(status: "pending" | "needs_revision" | "accepted" | "all" = "pending") {
  const where = status === "all" ? undefined : eq(submissions.status, status)
  return db
    .select({
      id: submissions.id,
      status: submissions.status,
      version: submissions.version,
      submittedAt: submissions.submittedAt,
      updatedAt: submissions.updatedAt,
      grade: submissions.grade,
      studentId: userTable.id,
      studentName: userTable.name,
      studentEmail: userTable.email,
      studentTariff: userTable.tariff,
      lessonId: lessons.id,
      lessonTitle: lessons.title,
      lessonOrder: lessons.order,
    })
    .from(submissions)
    .innerJoin(userTable, eq(userTable.id, submissions.userId))
    .innerJoin(lessons, eq(lessons.id, submissions.lessonId))
    .where(where)
    .orderBy(asc(submissions.submittedAt))
    .limit(200)
}

export async function getSubmissionDetail(id: number) {
  const [row] = await db
    .select({
      submission: submissions,
      student: {
        id: userTable.id,
        name: userTable.name,
        email: userTable.email,
        tariff: userTable.tariff,
      },
      lesson: lessons,
    })
    .from(submissions)
    .innerJoin(userTable, eq(userTable.id, submissions.userId))
    .innerJoin(lessons, eq(lessons.id, submissions.lessonId))
    .where(eq(submissions.id, id))
    .limit(1)
  if (!row) return null
  const reviews = await db
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
    .where(eq(submissionReviews.submissionId, id))
    .orderBy(desc(submissionReviews.createdAt))
  return { ...row, reviews }
}

export async function listStudents(opts: { q?: string; role?: string; tariff?: string; status?: string }) {
  const conds = []
  if (opts.q) conds.push(or(ilike(userTable.name, `%${opts.q}%`), ilike(userTable.email, `%${opts.q}%`)))
  if (opts.role && opts.role !== "all") conds.push(eq(userTable.role, opts.role))
  if (opts.tariff && opts.tariff !== "all") conds.push(eq(userTable.tariff, opts.tariff))
  if (opts.status === "banned") conds.push(eq(userTable.banned, true))
  if (opts.status === "active") conds.push(eq(userTable.banned, false))

  const rows = await db
    .select({
      id: userTable.id,
      name: userTable.name,
      email: userTable.email,
      role: userTable.role,
      tariff: userTable.tariff,
      banned: userTable.banned,
      emailVerified: userTable.emailVerified,
      createdAt: userTable.createdAt,
      accepted: sql<number>`(select count(*) from ${submissions} s where s."userId" = ${userTable.id} and s.status = 'accepted')`.mapWith(Number),
      pending: sql<number>`(select count(*) from ${submissions} s where s."userId" = ${userTable.id} and s.status = 'pending')`.mapWith(Number),
    })
    .from(userTable)
    .where(conds.length ? and(...conds) : undefined)
    .orderBy(desc(userTable.createdAt))
    .limit(200)
  const [{ total }] = await db
    .select({ total: count() })
    .from(lessons)
    .where(and(eq(lessons.published, true), eq(lessons.archived, false)))
  return { rows, totalLessons: total }
}

export async function getStudentDetail(id: string) {
  const [u] = await db.select().from(userTable).where(eq(userTable.id, id)).limit(1)
  if (!u) return null
  const [sessions, subs, audits] = await Promise.all([
    db
      .select({
        id: sessionTable.id,
        ipAddress: sessionTable.ipAddress,
        userAgent: sessionTable.userAgent,
        createdAt: sessionTable.createdAt,
        expiresAt: sessionTable.expiresAt,
      })
      .from(sessionTable)
      .where(eq(sessionTable.userId, id))
      .orderBy(desc(sessionTable.createdAt)),
    db
      .select({
        id: submissions.id,
        status: submissions.status,
        version: submissions.version,
        grade: submissions.grade,
        submittedAt: submissions.submittedAt,
        lessonTitle: lessons.title,
        lessonOrder: lessons.order,
      })
      .from(submissions)
      .innerJoin(lessons, eq(lessons.id, submissions.lessonId))
      .where(eq(submissions.userId, id))
      .orderBy(asc(lessons.order)),
    db
      .select()
      .from(auditLog)
      .where(or(eq(auditLog.actor, id), and(eq(auditLog.entity, "user"), eq(auditLog.entityId, id))))
      .orderBy(desc(auditLog.createdAt))
      .limit(30),
  ])
  return { user: u, sessions, submissions: subs, audits }
}

export async function getContentTree() {
  const [lvls, lsns] = await Promise.all([
    db.select().from(levels).orderBy(asc(levels.order)),
    db.select().from(lessons).orderBy(asc(lessons.order)),
  ])
  return lvls.map((l) => ({ ...l, lessons: lsns.filter((x) => x.levelId === l.id) }))
}

export async function getAllMaterials() {
  return db.select().from(materials).orderBy(asc(materials.id))
}

export async function getAuditLog(opts: { q?: string; action?: string; limit?: number }) {
  const conds = []
  if (opts.q)
    conds.push(
      or(
        ilike(auditLog.actorEmail, `%${opts.q}%`),
        ilike(auditLog.action, `%${opts.q}%`),
        ilike(auditLog.entityId, `%${opts.q}%`),
      ),
    )
  if (opts.action && opts.action !== "all") conds.push(ilike(auditLog.action, `${opts.action}%`))
  return db
    .select()
    .from(auditLog)
    .where(conds.length ? and(...conds) : undefined)
    .orderBy(desc(auditLog.createdAt))
    .limit(opts.limit ?? 200)
}

export async function getTariffStats() {
  const rows = await db
    .select({ tariff: userTable.tariff, n: count() })
    .from(userTable)
    .where(eq(userTable.role, "student"))
    .groupBy(userTable.tariff)
  return Object.fromEntries(rows.map((r) => [r.tariff, Number(r.n)])) as Record<string, number>
}
