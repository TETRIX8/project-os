// Pure role/permission logic. Safe to import from client components —
// no database or auth server imports here.

import { ASSIGNABLE_ROLES, ROLES, TARIFF_RANK, type Role, type Tariff } from "@/lib/constants"

export type Permission =
  | "admin.access"
  | "students.view"
  | "students.manage"
  | "students.ban"
  | "sessions.revoke"
  | "roles.manage"
  | "content.view"
  | "content.edit"
  | "content.publish"
  | "content.delete"
  | "reviews.view"
  | "reviews.grade"
  | "tariffs.manage"
  | "audit.view"
  | "settings.manage"
  | "analytics.view"

const PERMISSIONS: Record<Role, Permission[]> = {
  owner: [
    "admin.access", "students.view", "students.manage", "students.ban", "sessions.revoke",
    "roles.manage", "content.view", "content.edit", "content.publish", "content.delete",
    "reviews.view", "reviews.grade", "tariffs.manage", "audit.view", "settings.manage",
    "analytics.view",
  ],
  admin: [
    "admin.access", "students.view", "students.manage", "students.ban", "sessions.revoke",
    "roles.manage", "content.view", "content.edit", "content.publish", "content.delete",
    "reviews.view", "reviews.grade", "tariffs.manage", "audit.view", "settings.manage",
    "analytics.view",
  ],
  curator: ["admin.access", "students.view", "content.view", "reviews.view", "reviews.grade", "analytics.view"],
  content_editor: ["admin.access", "content.view", "content.edit", "content.publish", "analytics.view"],
  support: ["admin.access", "students.view", "students.manage", "sessions.revoke", "content.view"],
  student: [],
}

export type CurrentUser = {
  id: string
  name: string
  email: string
  role: Role
  tariff: Tariff
  banned: boolean
  emailVerified: boolean
  twoFactorEnabled: boolean
  image: string | null
  createdAt: Date
  sessionId: string
}

export function isRole(value: unknown): value is Role {
  return typeof value === "string" && (ROLES as readonly string[]).includes(value)
}

export function hasPermission(role: Role, permission: Permission) {
  return PERMISSIONS[role]?.includes(permission) ?? false
}

export function canAssignRole(actorRole: Role, targetRole: Role) {
  return ASSIGNABLE_ROLES[actorRole]?.includes(targetRole) ?? false
}

export function hasTariffAccess(userTariff: Tariff, required: Tariff) {
  return TARIFF_RANK[userTariff] >= TARIFF_RANK[required]
}
