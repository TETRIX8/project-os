import { headers } from "next/headers"
import { redirect } from "next/navigation"
import { eq } from "drizzle-orm"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { user as userTable } from "@/lib/db/schema"
import type { Tariff } from "@/lib/constants"
import { isRole, hasPermission, type CurrentUser, type Permission } from "@/lib/permissions"

// Server-only: session lookup + guards. Pure permission helpers live in
// lib/permissions.ts so client components can import them without pulling
// in the database driver.
export { hasPermission, canAssignRole, hasTariffAccess, isRole } from "@/lib/permissions"
export type { CurrentUser, Permission } from "@/lib/permissions"

export async function getCurrentUser(): Promise<CurrentUser | null> {
  const s = await auth.api.getSession({ headers: await headers() })
  if (!s?.user) return null
  // Always re-read role/tariff/banned from the database so a revoked or demoted
  // account cannot keep acting on a stale session payload.
  const [row] = await db
    .select({
      role: userTable.role,
      tariff: userTable.tariff,
      banned: userTable.banned,
      twoFactorEnabled: userTable.twoFactorEnabled,
    })
    .from(userTable)
    .where(eq(userTable.id, s.user.id))
    .limit(1)
  if (!row) return null
  return {
    id: s.user.id,
    name: s.user.name,
    email: s.user.email,
    emailVerified: s.user.emailVerified,
    image: s.user.image ?? null,
    createdAt: s.user.createdAt,
    role: isRole(row.role) ? row.role : "student",
    tariff: (row.tariff as Tariff) ?? "base",
    banned: row.banned,
    twoFactorEnabled: row.twoFactorEnabled,
    sessionId: s.session.id,
  }
}

export class AuthError extends Error {
  status: number
  constructor(message: string, status = 401) {
    super(message)
    this.status = status
  }
}

/** For server actions / route handlers: throws instead of redirecting. */
export async function requireUser(): Promise<CurrentUser> {
  const u = await getCurrentUser()
  if (!u) throw new AuthError("Требуется авторизация", 401)
  if (u.banned) throw new AuthError("Аккаунт заблокирован", 403)
  return u
}

export async function requirePermission(permission: Permission): Promise<CurrentUser> {
  const u = await requireUser()
  if (!hasPermission(u.role, permission)) {
    throw new AuthError("Недостаточно прав", 403)
  }
  return u
}

/** For pages: redirects to sign-in / forbidden pages. */
export async function requireUserPage(): Promise<CurrentUser> {
  const u = await getCurrentUser()
  if (!u) redirect("/login")
  if (u.banned) redirect("/blocked")
  return u
}

export async function requirePermissionPage(permission: Permission): Promise<CurrentUser> {
  const u = await requireUserPage()
  if (!hasPermission(u.role, permission)) redirect("/forbidden")
  return u
}

export async function getClientIp() {
  const h = await headers()
  return (
    h.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    h.get("x-real-ip") ??
    null
  )
}
