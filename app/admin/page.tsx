import type { Metadata } from "next"
import Link from "next/link"
import { ArrowRight, CheckCircle2, ClipboardCheck, Eye, MonitorSmartphone, Trophy, UserPlus, Users } from "lucide-react"
import { requirePermissionPage, hasPermission } from "@/lib/rbac"
import { getActivitySeries, getAdminKpis, getReviewQueue, getTariffStats } from "@/lib/queries/admin"
import { PageHeader } from "@/components/shell/page-header"
import { KpiCard } from "@/components/admin/kpi-card"
import { ActivityChart } from "@/components/admin/activity-chart"
import { TariffDonut } from "@/components/admin/tariff-donut"
import { TariffBadge } from "@/components/status-badge"
import { LinkButton } from "@/components/ui/link-button"
import { timeAgo } from "@/lib/format"
import type { Tariff } from "@/lib/constants"

export const metadata: Metadata = { title: "Админ-панель" }

export default async function AdminOverview() {
  const user = await requirePermissionPage("admin.access")
  const canReview = hasPermission(user.role, "reviews.view")
  const [kpis, series, tariffs, queue] = await Promise.all([
    getAdminKpis(),
    getActivitySeries(14),
    getTariffStats(),
    canReview ? getReviewQueue("pending") : Promise.resolve([]),
  ])

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow="Обзор"
        title="Что происходит на курсе"
        description="Ключевые метрики, активность за 14 дней и очередь проверки."
        actions={
          canReview && kpis.pending > 0 ? (
            <LinkButton href="/admin/reviews">
              Проверить {kpis.pending} <ArrowRight />
            </LinkButton>
          ) : undefined
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 xl:grid-cols-7">
        <KpiCard label="Учеников" value={kpis.students} icon={Users} />
        <KpiCard label="Новых за 7 дней" value={kpis.newStudents} icon={UserPlus} tone="accent" />
        <KpiCard label="На проверке" value={kpis.pending} icon={ClipboardCheck} tone={kpis.pending > 0 ? "warning" : "default"} href={canReview ? "/admin/reviews" : undefined} />
        <KpiCard label="Принято работ" value={kpis.accepted} icon={CheckCircle2} tone="success" />
        <KpiCard label="Просмотров уроков" value={kpis.watched} icon={Eye} />
        <KpiCard label="Активных сессий" value={kpis.activeSessions} icon={MonitorSmartphone} />
        <KpiCard label="Прошли курс" value={kpis.completed} icon={Trophy} tone="primary" />
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <section aria-labelledby="activity-heading" className="rounded-2xl border border-border bg-card p-6 xl:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h2 id="activity-heading" className="font-semibold">
              Активность за 14 дней
            </h2>
            <Link href="/admin/analytics" className="text-sm text-muted-foreground hover:text-foreground">
              Подробнее →
            </Link>
          </div>
          <ActivityChart data={series} />
        </section>
        <section aria-labelledby="tariff-heading" className="rounded-2xl border border-border bg-card p-6">
          <h2 id="tariff-heading" className="mb-4 font-semibold">
            Распределение тарифов
          </h2>
          <TariffDonut data={tariffs} />
        </section>
      </div>

      {canReview && (
        <section aria-labelledby="queue-heading" className="rounded-2xl border border-border bg-card">
          <div className="flex items-center justify-between border-b border-border px-6 py-4">
            <h2 id="queue-heading" className="font-semibold">
              Очередь проверки
            </h2>
            <Link href="/admin/reviews" className="text-sm text-muted-foreground hover:text-foreground">
              Вся очередь →
            </Link>
          </div>
          {queue.length === 0 ? (
            <p className="px-6 py-10 text-center text-sm text-muted-foreground">Очередь пуста — все работы проверены.</p>
          ) : (
            <ul className="divide-y divide-border">
              {queue.slice(0, 6).map((q) => (
                <li key={q.id}>
                  <Link href={`/admin/reviews/${q.id}`} className="flex items-center gap-4 px-6 py-3 transition-colors hover:bg-muted/40">
                    <span className="font-mono text-xs text-muted-foreground tabular-nums">#{String(q.lessonOrder).padStart(2, "0")}</span>
                    <div className="flex min-w-0 flex-1 flex-col">
                      <p className="truncate text-sm font-medium">{q.lessonTitle}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {q.studentName} · {q.studentEmail}
                      </p>
                    </div>
                    <TariffBadge tariff={q.studentTariff as Tariff} className="hidden sm:inline-flex" />
                    <span className="text-xs text-muted-foreground whitespace-nowrap">{timeAgo(q.submittedAt)}</span>
                    {q.version > 1 && <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium">v{q.version}</span>}
                    <ArrowRight className="size-4 text-muted-foreground" />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}
    </div>
  )
}
