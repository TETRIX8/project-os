import type { Metadata } from "next"
import { requireUserPage } from "@/lib/rbac"
import { PageHeader } from "@/components/shell/page-header"
import { ProfileForm } from "@/components/dashboard/profile-form"
import { RoleBadge, TariffBadge } from "@/components/status-badge"
import { formatDate, initials } from "@/lib/format"

export const metadata: Metadata = { title: "Профиль" }

export default async function ProfilePage() {
  const user = await requireUserPage()
  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Профиль" description="Имя отображается кураторам и в комментариях к проверкам." />
      <div className="grid gap-6 lg:grid-cols-[320px_minmax(0,1fr)]">
        <section aria-label="Карточка аккаунта" className="flex flex-col items-center gap-4 rounded-2xl border border-border bg-card p-6 text-center">
          <span className="flex size-20 items-center justify-center rounded-full bg-primary/15 text-2xl font-semibold text-primary">
            {initials(user.name) || "?"}
          </span>
          <div className="flex flex-col gap-1">
            <p className="font-semibold">{user.name}</p>
            <p className="text-sm text-muted-foreground">{user.email}</p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-2">
            <TariffBadge tariff={user.tariff} />
            <RoleBadge role={user.role} />
          </div>
          <p className="text-xs text-muted-foreground">На курсе с {formatDate(user.createdAt)}</p>
        </section>
        <ProfileForm name={user.name} email={user.email} />
      </div>
    </div>
  )
}
