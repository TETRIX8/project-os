import { count, eq } from "drizzle-orm"
import { db } from "@/lib/db"
import { submissions } from "@/lib/db/schema"
import { hasPermission, requirePermissionPage } from "@/lib/rbac"
import { AppShell } from "@/components/shell/app-shell"
import { RoleBadge } from "@/components/status-badge"
import { LinkButton } from "@/components/ui/link-button"
import type { NavItem } from "@/components/shell/nav-links"

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await requirePermissionPage("admin.access")
  const [{ pending }] = await db.select({ pending: count() }).from(submissions).where(eq(submissions.status, "pending"))

  const main: NavItem[] = [{ href: "/admin", label: "Обзор", icon: "dashboard", exact: true }]
  if (hasPermission(user.role, "reviews.view")) main.push({ href: "/admin/reviews", label: "Проверка", icon: "clipboardCheck", badge: pending })
  if (hasPermission(user.role, "students.view")) main.push({ href: "/admin/students", label: "Ученики", icon: "users" })
  if (hasPermission(user.role, "content.view")) {
    main.push({ href: "/admin/content", label: "Контент", icon: "book" })
    main.push({ href: "/admin/materials", label: "Материалы", icon: "folder" })
  }

  const system: NavItem[] = []
  if (hasPermission(user.role, "analytics.view")) system.push({ href: "/admin/analytics", label: "Аналитика", icon: "chart" })
  if (hasPermission(user.role, "audit.view")) system.push({ href: "/admin/audit", label: "Аудит", icon: "scroll" })

  const sections = [{ title: "Управление", items: main }, ...(system.length ? [{ title: "Система", items: system }] : [])]

  return (
    <AppShell
      user={user}
      sections={sections}
      notificationsHref="/dashboard/notifications"
      footer={
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs text-muted-foreground">Ваша роль</span>
            <RoleBadge role={user.role} />
          </div>
          <LinkButton href="/dashboard" variant="outline" size="sm" className="w-full">
            Кабинет ученика
          </LinkButton>
        </div>
      }
    >
      {children}
    </AppShell>
  )
}
