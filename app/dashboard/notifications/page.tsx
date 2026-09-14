import type { Metadata } from "next"
import { desc, eq } from "drizzle-orm"
import { Bell } from "lucide-react"
import { db } from "@/lib/db"
import { notifications } from "@/lib/db/schema"
import { requireUserPage } from "@/lib/rbac"
import { PageHeader } from "@/components/shell/page-header"
import { EmptyState } from "@/components/empty-state"
import { MarkReadButton } from "@/components/dashboard/mark-read-button"
import { formatDateTime } from "@/lib/format"
import { cn } from "@/lib/utils"

export const metadata: Metadata = { title: "Уведомления" }

export default async function NotificationsPage() {
  const user = await requireUserPage()
  const rows = await db.select().from(notifications).where(eq(notifications.userId, user.id)).orderBy(desc(notifications.createdAt)).limit(100)
  const unread = rows.filter((n) => !n.read).length

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Уведомления"
        description={unread ? `${unread} непрочитанных` : "Все уведомления прочитаны"}
        actions={unread > 0 ? <MarkReadButton /> : undefined}
      />
      {rows.length === 0 ? (
        <EmptyState icon={Bell} title="Уведомлений нет" description="Здесь появятся результаты проверок и новости курса." />
      ) : (
        <ul className="flex flex-col divide-y divide-border rounded-2xl border border-border bg-card">
          {rows.map((n) => (
            <li key={n.id} className={cn("flex items-start gap-4 p-4", !n.read && "bg-primary/5")}>
              <span
                className={cn(
                  "mt-1.5 size-2 shrink-0 rounded-full",
                  n.type === "success" ? "bg-success" : n.type === "warning" ? "bg-warning" : n.type === "error" ? "bg-destructive" : "bg-accent",
                  n.read && "opacity-30",
                )}
                aria-hidden
              />
              <div className="flex min-w-0 flex-1 flex-col gap-1">
                <p className={cn("text-sm leading-snug", !n.read && "font-medium")}>{n.title}</p>
                {n.body && <p className="text-sm text-muted-foreground leading-relaxed text-pretty">{n.body}</p>}
                <p className="text-xs text-muted-foreground">{formatDateTime(n.createdAt)}</p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
