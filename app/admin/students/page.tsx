import type { Metadata } from "next"
import Link from "next/link"
import { ArrowRight, Users } from "lucide-react"
import { requirePermissionPage } from "@/lib/rbac"
import { listStudents } from "@/lib/queries/admin"
import { PageHeader } from "@/components/shell/page-header"
import { RoleBadge, TariffBadge } from "@/components/status-badge"
import { EmptyState } from "@/components/empty-state"
import { StudentsFilters } from "@/components/admin/students-filters"
import { formatDate } from "@/lib/format"
import type { Role, Tariff } from "@/lib/constants"

export const metadata: Metadata = { title: "Ученики" }

export default async function StudentsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; role?: string; tariff?: string; status?: string }>
}) {
  await requirePermissionPage("students.view")
  const sp = await searchParams
  const { rows, totalLessons } = await listStudents(sp)

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Ученики" description={`${rows.length} человек по текущему фильтру. Клик по строке открывает карточку.`} />
      <StudentsFilters q={sp.q ?? ""} role={sp.role ?? "all"} tariff={sp.tariff ?? "all"} status={sp.status ?? "all"} />

      {rows.length === 0 ? (
        <EmptyState icon={Users} title="Никого не найдено" description="Попробуйте изменить запрос или сбросить фильтры." />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-border bg-card">
          <table className="w-full text-sm">
            <thead className="border-b border-border bg-muted/40 text-left text-xs text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-medium">Ученик</th>
                <th className="hidden px-4 py-3 font-medium sm:table-cell">Роль</th>
                <th className="hidden px-4 py-3 font-medium md:table-cell">Тариф</th>
                <th className="px-4 py-3 font-medium">Прогресс</th>
                <th className="hidden px-4 py-3 font-medium lg:table-cell">Регистрация</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {rows.map((u) => {
                const pct = totalLessons ? Math.round((u.accepted / totalLessons) * 100) : 0
                return (
                  <tr key={u.id} className="transition-colors hover:bg-muted/30">
                    <td className="px-4 py-3">
                      <div className="flex flex-col">
                        <span className="flex items-center gap-2 font-medium">
                          <span className="line-clamp-1">{u.name}</span>
                          {u.banned && <span className="rounded bg-destructive/15 px-1.5 py-0.5 text-[10px] font-medium text-destructive">Заблокирован</span>}
                        </span>
                        <span className="line-clamp-1 text-xs text-muted-foreground">{u.email}</span>
                      </div>
                    </td>
                    <td className="hidden px-4 py-3 sm:table-cell">
                      <RoleBadge role={u.role as Role} />
                    </td>
                    <td className="hidden px-4 py-3 md:table-cell">
                      <TariffBadge tariff={u.tariff as Tariff} />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="h-1.5 w-24 overflow-hidden rounded-full bg-muted">
                          <div className="h-full bg-primary" style={{ width: `${pct}%` }} />
                        </div>
                        <span className="font-mono text-xs tabular-nums text-muted-foreground">
                          {u.accepted}/{totalLessons}
                        </span>
                        {u.pending > 0 && <span className="rounded bg-warning/15 px-1.5 py-0.5 text-[10px] font-medium text-warning">{u.pending} ждут</span>}
                      </div>
                    </td>
                    <td className="hidden px-4 py-3 text-xs text-muted-foreground lg:table-cell">{formatDate(u.createdAt)}</td>
                    <td className="px-4 py-3 text-right">
                      <Link href={`/admin/students/${u.id}`} className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline underline-offset-4">
                        Открыть <ArrowRight className="size-3.5" />
                      </Link>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
