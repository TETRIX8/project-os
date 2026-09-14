import type { Metadata } from "next"
import Link from "next/link"
import { Check, Clock, Lock, Play, Sparkles } from "lucide-react"
import { requireUserPage } from "@/lib/rbac"
import { getCourseForUser, summarizeProgress } from "@/lib/queries/course"
import { PageHeader } from "@/components/shell/page-header"
import { StatusBadge, TariffBadge } from "@/components/status-badge"
import { TARIFF_LABELS, type Tariff } from "@/lib/constants"
import { cn } from "@/lib/utils"

export const metadata: Metadata = { title: "Программа" }

export default async function ProgramPage() {
  const user = await requireUserPage()
  const course = await getCourseForUser(user.id, user.tariff)
  const summary = summarizeProgress(course)

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        eyebrow="6 уровней · 25 уроков"
        title="Программа курса"
        description={`Принято ${summary.accepted} из ${summary.total}. Следующий уровень открывается после проверки всех заданий текущего.`}
      />

      <ol className="flex flex-col gap-8">
        {course.map((lvl) => (
          <li key={lvl.id} id={`level-${lvl.id}`} className="scroll-mt-24">
            <div className="mb-3 flex flex-wrap items-center gap-3">
              <span
                className={cn(
                  "flex size-8 items-center justify-center rounded-lg font-mono text-sm font-semibold",
                  lvl.completed ? "bg-success text-success-foreground" : lvl.unlocked ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground",
                )}
              >
                {lvl.completed ? <Check className="size-4" /> : lvl.unlocked ? lvl.order : <Lock className="size-3.5" />}
              </span>
              <div className="flex flex-col">
                <h2 className="font-semibold leading-tight">{lvl.title}</h2>
                {lvl.subtitle && <p className="text-xs text-muted-foreground">{lvl.subtitle}</p>}
              </div>
              <span className="ml-auto font-mono text-xs text-muted-foreground tabular-nums">
                {lvl.acceptedCount}/{lvl.lessons.length} принято
              </span>
            </div>
            {lvl.description && <p className="mb-4 max-w-2xl text-sm text-muted-foreground text-pretty">{lvl.description}</p>}

            <ul className="grid gap-2 md:grid-cols-2">
              {lvl.lessons.map((lesson) => {
                const locked = !lesson.unlocked
                const gated = !lesson.tariffOk
                const disabled = locked || gated
                const body = (
                  <>
                    <div className="flex items-start gap-3">
                      <span className="mt-0.5 font-mono text-xs text-muted-foreground tabular-nums">
                        {String(lesson.order).padStart(2, "0")}
                      </span>
                      <div className="flex min-w-0 flex-1 flex-col gap-1">
                        <p className={cn("text-sm font-medium leading-snug text-pretty", disabled && "text-muted-foreground")}>{lesson.title}</p>
                        {lesson.description && !disabled && (
                          <p className="text-xs text-muted-foreground line-clamp-2">{lesson.description}</p>
                        )}
                      </div>
                    </div>
                    <div className="mt-auto flex flex-wrap items-center gap-2 pl-7 text-xs text-muted-foreground">
                      <span className="inline-flex items-center gap-1">
                        <Clock className="size-3" /> {lesson.durationMin} мин
                      </span>
                      {lesson.minTariff !== "base" && <TariffBadge tariff={lesson.minTariff as Tariff} />}
                      {gated ? (
                        <span className="ml-auto inline-flex items-center gap-1 text-primary">
                          <Sparkles className="size-3" /> Доступно на {TARIFF_LABELS[lesson.minTariff as Tariff]}
                        </span>
                      ) : locked ? (
                        <span className="ml-auto inline-flex items-center gap-1">
                          <Lock className="size-3" /> Откроется позже
                        </span>
                      ) : (
                        <span className="ml-auto">
                          <StatusBadge status={lesson.status} />
                        </span>
                      )}
                    </div>
                  </>
                )
                const cls = cn(
                  "flex h-full min-h-28 flex-col gap-3 rounded-xl border p-4 transition-colors",
                  disabled ? "border-border bg-surface/40" : "border-border bg-card hover:border-primary/40 hover:bg-primary/5",
                  lesson.status === "needs_revision" && "border-destructive/30",
                )
                return (
                  <li key={lesson.id}>
                    {gated ? (
                      <Link href="/dashboard/tariff" className={cls}>
                        {body}
                      </Link>
                    ) : locked ? (
                      <div className={cls}>{body}</div>
                    ) : (
                      <Link href={`/dashboard/lessons/${lesson.id}`} className={cls}>
                        {body}
                      </Link>
                    )}
                  </li>
                )
              })}
            </ul>
          </li>
        ))}
      </ol>
    </div>
  )
}
