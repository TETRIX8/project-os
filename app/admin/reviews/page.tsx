import type { Metadata } from "next"
import Link from "next/link"
import { ArrowRight, ClipboardCheck } from "lucide-react"
import { requirePermissionPage } from "@/lib/rbac"
import { getReviewQueue } from "@/lib/queries/admin"
import { PageHeader } from "@/components/shell/page-header"
import { StatusBadge, TariffBadge } from "@/components/status-badge"
import { EmptyState } from "@/components/empty-state"
import { FilterTabs } from "@/components/admin/filter-tabs"
import { timeAgo } from "@/lib/format"
import type { SubmissionStatus, Tariff } from "@/lib/constants"

export const metadata: Metadata = { title: "Очередь проверки" }

type Filter = "pending" | "needs_revision" | "accepted" | "all"

export default async function ReviewsPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  await requirePermissionPage("reviews.view")
  const { status } = await searchParams
  const filter: Filter = (["pending", "needs_revision", "accepted", "all"] as Filter[]).includes(status as Filter) ? (status as Filter) : "pending"
  const rows = await getReviewQueue(filter)

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Проверка заданий"
        description="Работы отсортированы по времени отправки — сначала те, что ждут дольше всех."
      />
      <FilterTabs
        param="status"
        value={filter}
        options={[
          { value: "pending", label: "На проверке" },
          { value: "needs_revision", label: "На доработке" },
          { value: "accepted", label: "Принятые" },
          { value: "all", label: "Все" },
        ]}
      />

      {rows.length === 0 ? (
        <EmptyState icon={ClipboardCheck} title="Здесь пусто" description="Нет работ с выбранным статусом." />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-border bg-card">
          <table className="w-full text-sm">
            <thead className="border-b border-border bg-muted/40 text-left text-xs text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-medium">Урок</th>
                <th className="px-4 py-3 font-medium">Ученик</th>
                <th className="hidden px-4 py-3 font-medium md:table-cell">Тариф</th>
                <th className="hidden px-4 py-3 font-medium sm:table-cell">Статус</th>
                <th className="hidden px-4 py-3 font-medium lg:table-cell">Отправлено</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {rows.map((r) => (
                <tr key={r.id} className="transition-colors hover:bg-muted/30">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-xs text-muted-foreground tabular-nums">{String(r.lessonOrder).padStart(2, "0")}</span>
                      <span className="line-clamp-1 font-medium">{r.lessonTitle}</span>
                      {r.version > 1 && <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium">v{r.version}</span>}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-col">
                      <span className="line-clamp-1">{r.studentName}</span>
                      <span className="line-clamp-1 text-xs text-muted-foreground">{r.studentEmail}</span>
                    </div>
                  </td>
                  <td className="hidden px-4 py-3 md:table-cell">
                    <TariffBadge tariff={r.studentTariff as Tariff} />
                  </td>
                  <td className="hidden px-4 py-3 sm:table-cell">
                    <StatusBadge status={r.status as SubmissionStatus} />
                  </td>
                  <td className="hidden px-4 py-3 text-xs text-muted-foreground lg:table-cell">{timeAgo(r.submittedAt ?? r.updatedAt)}</td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/admin/reviews/${r.id}`}
                      className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline underline-offset-4"
                    >
                      {r.status === "pending" ? "Проверить" : "Открыть"} <ArrowRight className="size-3.5" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
