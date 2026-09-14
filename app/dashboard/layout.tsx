import { and, count, eq } from "drizzle-orm"
import { Shield } from "lucide-react"
import { db } from "@/lib/db"
import { notifications } from "@/lib/db/schema"
import { hasPermission, requireUserPage } from "@/lib/rbac"
import { AppShell } from "@/components/shell/app-shell"
import type { NavItem } from "@/components/shell/nav-links"
import { TariffBadge } from "@/components/status-badge"
import { LinkButton } from "@/components/ui/link-button"

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUserPage()
  const [{ unread }] = await db
    .select({ unread: count() })
    .from(notifications)
    .where(and(eq(notifications.userId, user.id), eq(notifications.read, false)))

  const sections: { title?: string; items: NavItem[] }[] = [
    {
      items: [
        { href: "/dashboard", label: "Главная", icon: "home", exact: true },
        { href: "/dashboard/program", label: "Программа", icon: "book" },
        { href: "/dashboard/assignments", label: "Мои задания", icon: "clipboardList" },
        { href: "/dashboard/materials", label: "Материалы", icon: "folder" },
      ],
    },
    {
      title: "Аккаунт",
      items: [
        { href: "/dashboard/profile", label: "Профиль", icon: "user" },
        { href: "/dashboard/security", label: "Безопасность", icon: "shield" },
        { href: "/dashboard/tariff", label: "Тариф", icon: "card" },
        { href: "/dashboard/support", label: "Поддержка", icon: "lifeBuoy" },
      ],
    },
  ]

  const footer = hasPermission(user.role, "admin.access") ? (
    <LinkButton href="/admin" variant="outline" className="w-full justify-start">
      <Shield className="text-primary" /> Админ-панель
    </LinkButton>
  ) : user.tariff !== "vip" ? (
    <div className="flex flex-col gap-2 rounded-xl border border-primary/25 bg-primary/10 p-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium">Ваш тариф</span>
        <TariffBadge tariff={user.tariff} />
      </div>
      <p className="text-xs text-muted-foreground text-pretty">Откройте все уроки и бонусные материалы.</p>
      <LinkButton href="/dashboard/tariff" size="sm" className="w-full">
        Улучшить тариф
      </LinkButton>
    </div>
  ) : null

  return (
    <AppShell user={user} sections={sections} unreadCount={unread} footer={footer}>
      {children}
    </AppShell>
  )
}
