import { db } from "@/lib/db"
import { auditLog, notifications } from "@/lib/db/schema"
import { getClientIp, type CurrentUser } from "@/lib/rbac"

export async function audit(
  actor: Pick<CurrentUser, "id" | "email"> | null,
  action: string,
  entity?: string,
  entityId?: string | number | null,
  metadata: Record<string, unknown> = {},
) {
  try {
    await db.insert(auditLog).values({
      actor: actor?.id ?? null,
      actorEmail: actor?.email ?? null,
      action,
      entity: entity ?? null,
      entityId: entityId == null ? null : String(entityId),
      ip: await getClientIp(),
      metadata,
    })
  } catch (err) {
    console.error("[audit] failed to write entry", action, err)
  }
}

export async function notify(
  userId: string,
  title: string,
  body?: string,
  type: "info" | "success" | "warning" | "error" = "info",
) {
  try {
    await db.insert(notifications).values({ userId, title, body: body ?? null, type })
  } catch (err) {
    console.error("[notify] failed", err)
  }
}
