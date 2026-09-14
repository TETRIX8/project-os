import { and, count, eq } from "drizzle-orm"
import {
  BookOpen,
  ClipboardList,
  CreditCard,
  FolderOpen,
  Home,
  LifeBuoy,
  Shield,
  UserRound,
} from "lucide-react"
import { db } from "@/lib/db"
import { notifications } from "@/lib/db/schema"
import { hasPermission, requireUserPage } from "@/lib/rbac"
import { AppShell } from "@/components/shell/app-shell"
import { TariffBadge } from "@/components/status-badge"
import { LinkButton } from "@/components/ui/link-button"

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUserPage()
  const [{ unread }] = await db
    .select({ unread: count() })
    .from(notifications)
    .where(and(eq(notifications.userId, user.id), eq(notifications.read, false)))

  const sections = [
    {
      items: [
        { href: "/dashboard", label: "Главная", icon: Home, exact: true },
        { href: "/dashboard/program", label: "Программа", icon: BookOpen },
        { href: "/dashboard/assignments", label: "Мои задания", icon: ClipboardList },
        { href: "/dashboard/materials", label: "Материалы", icon: FolderOpen },
      ],
    },
    {
      title: "Аккаунт",
      items: [
        { href: "/dashboard/profile", label: "Профиль", icon: UserRound },
        { href: "/dashboard/security", label: "Безопасность", icon: Shield },
        { href: "/dashboard/tariff", label: "Тариф", icon: CreditCard },
        { href: "/dashboard/support", label: "Поддержка", icon: LifeBuoy },
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
