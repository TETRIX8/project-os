import {
  pgTable,
  text,
  timestamp,
  boolean,
  integer,
  serial,
  jsonb,
  unique,
} from "drizzle-orm/pg-core"

// ---------- Better Auth tables (column names must stay camelCase) ----------

export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("emailVerified").notNull().default(false),
  image: text("image"),
  role: text("role").notNull().default("student"),
  tariff: text("tariff").notNull().default("base"),
  banned: boolean("banned").notNull().default(false),
  banReason: text("banReason"),
  twoFactorEnabled: boolean("twoFactorEnabled").notNull().default(false),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
})

export const session = pgTable("session", {
  id: text("id").primaryKey(),
  expiresAt: timestamp("expiresAt").notNull(),
  token: text("token").notNull().unique(),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
  ipAddress: text("ipAddress"),
  userAgent: text("userAgent"),
  userId: text("userId")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
})

export const account = pgTable("account", {
  id: text("id").primaryKey(),
  accountId: text("accountId").notNull(),
  providerId: text("providerId").notNull(),
  userId: text("userId")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  accessToken: text("accessToken"),
  refreshToken: text("refreshToken"),
  idToken: text("idToken"),
  accessTokenExpiresAt: timestamp("accessTokenExpiresAt"),
  refreshTokenExpiresAt: timestamp("refreshTokenExpiresAt"),
  scope: text("scope"),
  password: text("password"),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
})

export const verification = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expiresAt").notNull(),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
})

// ---------- Course content ----------

export const levels = pgTable("levels", {
  id: serial("id").primaryKey(),
  order: integer("order").notNull(),
  title: text("title").notNull(),
  subtitle: text("subtitle"),
  description: text("description"),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
})

export const lessons = pgTable("lessons", {
  id: serial("id").primaryKey(),
  levelId: integer("levelId").notNull(),
  order: integer("order").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  goal: text("goal"),
  notes: text("notes"),
  videoUrl: text("videoUrl"),
  coverUrl: text("coverUrl"),
  durationMin: integer("durationMin").notNull().default(0),
  files: jsonb("files").$type<{ name: string; url: string }[]>().notNull().default([]),
  assignment: text("assignment"),
  assignmentFormat: text("assignmentFormat").notNull().default("text"),
  minTariff: text("minTariff").notNull().default("base"),
  published: boolean("published").notNull().default(true),
  archived: boolean("archived").notNull().default(false),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
})

export const materials = pgTable("materials", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  category: text("category").notNull().default("bonus"),
  fileUrl: text("fileUrl"),
  minTariff: text("minTariff").notNull().default("base"),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
})

// ---------- Student progress ----------

export const lessonProgress = pgTable(
  "lesson_progress",
  {
    id: serial("id").primaryKey(),
    userId: text("userId").notNull(),
    lessonId: integer("lessonId").notNull(),
    watched: boolean("watched").notNull().default(false),
    watchedAt: timestamp("watchedAt"),
  },
  (t) => [unique().on(t.userId, t.lessonId)],
)

export const submissions = pgTable(
  "submissions",
  {
    id: serial("id").primaryKey(),
    userId: text("userId").notNull(),
    lessonId: integer("lessonId").notNull(),
    status: text("status").notNull().default("draft"),
    contentText: text("contentText"),
    contentLink: text("contentLink"),
    fileUrl: text("fileUrl"),
    fields: jsonb("fields").$type<Record<string, string>>().notNull().default({}),
    version: integer("version").notNull().default(1),
    grade: integer("grade"),
    submittedAt: timestamp("submittedAt"),
    createdAt: timestamp("createdAt").notNull().defaultNow(),
    updatedAt: timestamp("updatedAt").notNull().defaultNow(),
  },
  (t) => [unique().on(t.userId, t.lessonId)],
)

export const submissionReviews = pgTable("submission_reviews", {
  id: serial("id").primaryKey(),
  submissionId: integer("submissionId").notNull(),
  curatorId: text("curatorId").notNull(),
  action: text("action").notNull(),
  comment: text("comment"),
  grade: integer("grade"),
  version: integer("version").notNull().default(1),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
})

export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  userId: text("userId").notNull(),
  title: text("title").notNull(),
  body: text("body"),
  type: text("type").notNull().default("info"),
  read: boolean("read").notNull().default(false),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
})

export const auditLog = pgTable("audit_log", {
  id: serial("id").primaryKey(),
  actor: text("actor"),
  actorEmail: text("actorEmail"),
  action: text("action").notNull(),
  entity: text("entity"),
  entityId: text("entityId"),
  ip: text("ip"),
  metadata: jsonb("metadata").$type<Record<string, unknown>>().notNull().default({}),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
})

// ---------- Types ----------

export type User = typeof user.$inferSelect
export type Level = typeof levels.$inferSelect
export type Lesson = typeof lessons.$inferSelect
export type Material = typeof materials.$inferSelect
export type Submission = typeof submissions.$inferSelect
export type SubmissionReview = typeof submissionReviews.$inferSelect
export type Notification = typeof notifications.$inferSelect
export type AuditEntry = typeof auditLog.$inferSelect
