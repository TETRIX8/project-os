import type { Metadata } from "next"
import { CheckCircle2, Eye, Send, TrendingDown } from "lucide-react"
import { requirePermissionPage } from "@/lib/rbac"
import { getActivitySeries, getAdminKpis, getFunnel, getTariffStats } from "@/lib/queries/admin"
import { PageHeader } from "@/components/shell/page-header"
import { KpiCard } from "@/components/admin/kpi-card"
import { ActivityChart } from "@/components/admin/activity-chart"
import { TariffDonut } from "@/components/admin/tariff-donut"
import { FunnelChart } from "@/components/admin/funnel-chart"
import { cn } from "@/lib/utils"

export const metadata: Metadata = { title: "Аналитика" }

export default async function AnalyticsPage() {
  await requirePermissionPage("analytics.view")
  const [kpis, series, tariffs, funnel] = await Promise.all([getAdminKpis(), getActivitySeries(30), getTariffStats(), getFunnel()])

  const totalWatched = funnel.reduce((s, f) => s + f.watched, 0)
  const totalSubmitted = funnel.reduce((s, f) => s + f.submitted, 0)
  const totalAccepted = funnel.reduce((s, f) => s + f.accepted, 0)
  const conversion = totalWatched ? Math.round((totalAccepted / totalWatched) * 100) : 0

  // Biggest drop between watching a lesson and getting the assignment accepted.
  const dropOff = funnel
    .filter((f) => f.watched >= 3)
    .map((f) => ({ ...f, rate: f.watched ? f.accepted / f.watched : 1 }))
    .sort((a, b) => a.rate - b.rate)[0]

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow="Аналитика"
        title="Воронка прохождения"
        description="Где ученики застревают: просмотр урока, отправка задания, принятие куратором."
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <KpiCard label="Просмотров уроков" value={totalWatched} icon={Eye} />
        <KpiCard label="Отправлено заданий" value={totalSubmitted} icon={Send} tone="accent" />
        <KpiCard label="Принято" value={totalAccepted} icon={CheckCircle2} tone="success" />
        <KpiCard label="Конверсия просмотр → зачёт" value={`${conversion}%`} icon={TrendingDown} tone={conversion < 40 ? "warning" : "primary"} />
      </div>

      <section aria-labelledby="funnel-heading" className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <h2 id="funnel-heading" className="font-semibold">
            Воронка по урокам
          </h2>
          {dropOff && (
            <p className="text-sm text-muted-foreground">
              Самое узкое место: <span className="font-medium text-foreground">урок {String(dropOff.order).padStart(2, "0")} «{dropOff.title}»</span> — зачёт получают{" "}
              {Math.round(dropOff.rate * 100)}% посмотревших.
            </p>
          )}
        </div>
        <FunnelChart data={funnel} />
      </section>

      <div className="grid gap-4 xl:grid-cols-3">
        <section aria-labelledby="activity30-heading" className="rounded-2xl border border-border bg-card p-6 xl:col-span-2">
          <h2 id="activity30-heading" className="mb-4 font-semibold">
            Активность за 30 дней
          </h2>
          <ActivityChart data={series} />
        </section>
        <section aria-labelledby="tariff2-heading" className="rounded-2xl border border-border bg-card p-6">
          <h2 id="tariff2-heading" className="mb-4 font-semibold">
            Тарифы
          </h2>
          <TariffDonut data={tariffs} />
          <p className="mt-4 text-xs text-muted-foreground">
            Всего учеников: {kpis.students}. Прошли курс полностью: {kpis.completed}.
          </p>
        </section>
      </div>

      <section aria-labelledby="table-heading" className="overflow-hidden rounded-2xl border border-border bg-card">
        <h2 id="table-heading" className="border-b border-border px-6 py-4 font-semibold">
          Детали по урокам
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/30 text-left text-xs text-muted-foreground">
              <tr>
                <th className="px-6 py-2.5 font-medium">Урок</th>
                <th className="px-4 py-2.5 text-right font-medium">Смотрели</th>
                <th className="px-4 py-2.5 text-right font-medium">Отправили</th>
                <th className="px-4 py-2.5 text-right font-medium">Приняли</th>
                <th className="px-6 py-2.5 text-right font-medium">Конверсия</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {funnel.map((f) => {
                const rate = f.watched ? Math.round((f.accepted / f.watched) * 100) : 0
                return (
                  <tr key={f.lessonId}>
                    <td className="px-6 py-2.5">
                      <span className="mr-2 font-mono text-xs text-muted-foreground tabular-nums">{String(f.order).padStart(2, "0")}</span>
                      {f.title}
                    </td>
                    <td className="px-4 py-2.5 text-right tabular-nums">{f.watched}</td>
                    <td className="px-4 py-2.5 text-right tabular-nums">{f.submitted}</td>
                    <td className="px-4 py-2.5 text-right tabular-nums">{f.accepted}</td>
                    <td className={cn("px-6 py-2.5 text-right font-medium tabular-nums", f.watched && rate < 40 ? "text-warning" : "text-foreground")}>
                      {f.watched ? `${rate}%` : "—"}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}
