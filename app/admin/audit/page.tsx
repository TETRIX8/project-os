import type { Metadata } from "next"
import { requirePermissionPage } from "@/lib/rbac"
import { getAuditLog } from "@/lib/queries/admin"
import { PageHeader } from "@/components/shell/page-header"
import { FilterTabs } from "@/components/admin/filter-tabs"
import { AuditList } from "@/components/admin/audit-list"
import { AuditSearch } from "@/components/admin/audit-search"

export const metadata: Metadata = { title: "Аудит" }

const GROUPS = [
  { value: "all", label: "Все" },
  { value: "auth", label: "Вход и сессии" },
  { value: "submission", label: "Задания" },
  { value: "lesson", label: "Контент" },
  { value: "user", label: "Пользователи" },
  { value: "session", label: "Сессии (админ)" },
]

export default async function AuditPage({ searchParams }: { searchParams: Promise<{ q?: string; action?: string }> }) {
  await requirePermissionPage("audit.view")
  const { q, action } = await searchParams
  const group = GROUPS.some((g) => g.value === action) ? (action as string) : "all"
  const rows = await getAuditLog({ q, action: group === "all" ? undefined : group, limit: 300 })

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Журнал аудита" description="Кто, что и когда сделал. Записи не редактируются и не удаляются." />
      <div className="flex flex-wrap items-center gap-3">
        <FilterTabs param="action" value={group} options={GROUPS} />
        <AuditSearch q={q ?? ""} />
      </div>
      <div className="flex flex-col gap-2">
        <p className="text-xs text-muted-foreground">
          Показано {rows.length} {rows.length === 300 ? "последних" : ""} записей
        </p>
        <div className="overflow-hidden rounded-2xl border border-border bg-card">
          <AuditList rows={rows} />
        </div>
      </div>
    </div>
  )
}
