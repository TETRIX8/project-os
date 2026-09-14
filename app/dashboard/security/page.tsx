import type { Metadata } from "next"
import { requireUserPage } from "@/lib/rbac"
import { listMySessions } from "@/app/actions/student"
import { PageHeader } from "@/components/shell/page-header"
import { SessionsList } from "@/components/dashboard/sessions-list"
import { TwoFactorToggle } from "@/components/dashboard/two-factor-toggle"
import { ChangePasswordForm } from "@/components/dashboard/change-password-form"
import { SESSION_LIMIT } from "@/lib/constants"

export const metadata: Metadata = { title: "Безопасность" }

export default async function SecurityPage() {
  const user = await requireUserPage()
  const sessions = await listMySessions()

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Безопасность"
        description={`Активные сессии, смена пароля и двухфакторная защита. Лимит одновременных входов — ${SESSION_LIMIT} устройства.`}
      />
      <div className="grid gap-6 lg:grid-cols-2">
        <SessionsList sessions={sessions} limit={SESSION_LIMIT} />
        <div className="flex flex-col gap-6">
          <TwoFactorToggle enabled={user.twoFactorEnabled} />
          <ChangePasswordForm />
        </div>
      </div>
    </div>
  )
}
