import type { Metadata } from "next"
import Link from "next/link"
import { asc } from "drizzle-orm"
import { Download, FileText, FolderOpen, Lock, Sparkles } from "lucide-react"
import { db } from "@/lib/db"
import { materials } from "@/lib/db/schema"
import { hasTariffAccess, requireUserPage } from "@/lib/rbac"
import { PageHeader } from "@/components/shell/page-header"
import { TariffBadge } from "@/components/status-badge"
import { EmptyState } from "@/components/empty-state"
import { TARIFF_LABELS, type Tariff } from "@/lib/constants"
import { cn } from "@/lib/utils"

export const metadata: Metadata = { title: "Материалы" }

const CATEGORY_LABELS: Record<string, string> = {
  template: "Шаблоны",
  checklist: "Чек-листы",
  bonus: "Бонусы",
  guide: "Гайды",
}

export default async function MaterialsPage() {
  const user = await requireUserPage()
  const rows = await db.select().from(materials).orderBy(asc(materials.category), asc(materials.createdAt))
  const grouped = rows.reduce<Record<string, typeof rows>>((acc, m) => {
    ;(acc[m.category] ??= []).push(m)
    return acc
  }, {})

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="Материалы"
        description="Шаблоны, чек-листы и бонусы. Часть материалов доступна только на тарифах Pro и VIP."
      />

      {rows.length === 0 ? (
        <EmptyState icon={FolderOpen} title="Материалов пока нет" description="Редакторы курса скоро добавят шаблоны и чек-листы." />
      ) : (
        Object.entries(grouped).map(([cat, items]) => (
          <section key={cat} aria-labelledby={`cat-${cat}`} className="flex flex-col gap-3">
            <h2 id={`cat-${cat}`} className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {CATEGORY_LABELS[cat] ?? cat}
            </h2>
            <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {items.map((m) => {
                const ok = hasTariffAccess(user.tariff, m.minTariff as Tariff)
                const inner = (
                  <>
                    <div className="flex items-start justify-between gap-3">
                      <span className={cn("flex size-9 items-center justify-center rounded-lg", ok ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground")}>
                        {ok ? <FileText className="size-4" /> : <Lock className="size-4" />}
                      </span>
                      {m.minTariff !== "base" && <TariffBadge tariff={m.minTariff as Tariff} />}
                    </div>
                    <div className="flex flex-col gap-1">
                      <p className={cn("font-medium leading-snug text-pretty", !ok && "text-muted-foreground")}>{m.title}</p>
                      {m.description && <p className="text-xs text-muted-foreground line-clamp-2">{m.description}</p>}
                    </div>
                    <p className="mt-auto inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                      {ok ? (
                        <>
                          <Download className="size-3.5" /> Открыть
                        </>
                      ) : (
                        <>
                          <Sparkles className="size-3.5 text-primary" /> Доступно на {TARIFF_LABELS[m.minTariff as Tariff]}
                        </>
                      )}
                    </p>
                  </>
                )
                const cls = "flex h-full min-h-40 flex-col gap-3 rounded-2xl border border-border bg-card p-5 transition-colors hover:border-primary/40"
                return (
                  <li key={m.id}>
                    {ok && m.fileUrl ? (
                      <a href={m.fileUrl} target="_blank" rel="noopener noreferrer" className={cls}>
                        {inner}
                      </a>
                    ) : ok ? (
                      <div className={cls}>{inner}</div>
                    ) : (
                      <Link href="/dashboard/tariff" className={cls}>
                        {inner}
                      </Link>
                    )}
                  </li>
                )
              })}
            </ul>
          </section>
        ))
      )}
    </div>
  )
}
