import type { Metadata } from "next"
import Link from "next/link"
import { and, desc, eq } from "drizzle-orm"
import { ArrowRight, Bell, CheckCircle2, Clock, MessageSquareText, Play, RotateCcw } from "lucide-react"
import { db } from "@/lib/db"
import { notifications } from "@/lib/db/schema"
import { requireUserPage } from "@/lib/rbac"
import { getCourseForUser, getLatestCuratorComment, summarizeProgress } from "@/lib/queries/course"
import { formatDateTime, pluralize, timeAgo } from "@/lib/format"
import { PageHeader } from "@/components/shell/page-header"
import { LinkButton } from "@/components/ui/link-button"
import { ProgressRing } from "@/components/dashboard/progress-ring"
import { LevelStepper } from "@/components/dashboard/level-stepper"
import { StatusBadge } from "@/components/status-badge"
import { cn } from "@/lib/utils"

export const metadata: Metadata = { title: "Кабинет" }

export default async function DashboardHome() {
  const user = await requireUserPage()
  const course = await getCourseForUser(user.id, user.tariff)
  const summary = summarizeProgress(course)
  const [lastComment, recentNotifications] = await Promise.all([
    getLatestCuratorComment(user.id),
    db
      .select()
      .from(notifications)
      .where(eq(notifications.userId, user.id))
      .orderBy(desc(notifications.createdAt))
      .limit(4),
  ])

  const firstName = user.name.split(" ")[0]
  const next = summary.nextLesson
  const allDone = summary.total > 0 && summary.accepted === summary.total

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow={`Уровень ${summary.currentLevel?.order ?? 1} из ${course.length}`}
        title={allDone ? `Курс пройден, ${firstName}!` : `Привет, ${firstName}`}
        description={
          allDone
            ? "Все 25 заданий приняты. Теперь — план на следующий месяц и первые деньги."
            : summary.needsRevision > 0
              ? `${summary.needsRevision} ${pluralize(summary.needsRevision, ["задание требует", "задания требуют", "заданий требуют"])} доработки — начните с них.`
              : summary.pending > 0
                ? `${summary.pending} ${pluralize(summary.pending, ["задание", "задания", "заданий"])} на проверке. Продолжайте следующий урок.`
                : "Продолжайте с текущего шага — один урок в день держит темп."
        }
      />

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Next step card — the signature element */}
        <section
          aria-labelledby="next-step"
          className="relative overflow-hidden rounded-2xl border border-primary/30 bg-card p-6 lg:col-span-2 glow-primary"
        >
          <div className="grid-fade pointer-events-none absolute inset-0 opacity-60" aria-hidden />
          <div className="relative flex flex-col gap-5">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-primary">
              <Play className="size-3.5" /> Следующий шаг
            </div>
            {next ? (
              <>
                <div className="flex flex-col gap-2">
                  <p className="text-sm text-muted-foreground">
                    Урок {next.order} · {course.find((l) => l.id === next.levelId)?.title}
                  </p>
                  <h2 id="next-step" className="text-2xl font-semibold tracking-tight text-balance sm:text-3xl">
                    {next.title}
                  </h2>
                  {next.goal && <p className="max-w-xl text-sm text-muted-foreground text-pretty">{next.goal}</p>}
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <LinkButton href={`/dashboard/lessons/${next.id}`} size="xl">
                    {next.status === "needs_revision" ? "Доработать задание" : next.watched ? "Перейти к заданию" : "Смотреть урок"}
                    <ArrowRight />
                  </LinkButton>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="size-4" /> {next.durationMin} мин
                    <span aria-hidden>·</span>
                    <StatusBadge status={next.status} />
                  </div>
                </div>
              </>
            ) : (
              <div className="flex flex-col gap-3">
                <h2 id="next-step" className="text-2xl font-semibold tracking-tight">
                  {allDone ? "Все уроки пройдены" : "Ожидаем проверку куратора"}
                </h2>
                <p className="text-sm text-muted-foreground text-pretty">
                  {allDone
                    ? "Скачайте шаблоны и материалы, чтобы закрепить результат."
                    : "Следующий уровень откроется, как только куратор примет все задания текущего."}
                </p>
                <LinkButton href={allDone ? "/dashboard/materials" : "/dashboard/assignments"} size="lg" variant="outline" className="w-fit">
                  {allDone ? "К материалам" : "Мои задания"} <ArrowRight />
                </LinkButton>
              </div>
            )}
          </div>
        </section>

        <section aria-label="Общий прогресс" className="flex flex-col items-center justify-center gap-4 rounded-2xl border border-border bg-card p-6">
          <ProgressRing value={summary.percent} size={148} />
          <div className="flex flex-col items-center gap-1 text-center">
            <p className="text-sm font-medium">
              {summary.accepted} из {summary.total} {pluralize(summary.total, ["задания", "заданий", "заданий"])} принято
            </p>
            <p className="text-xs text-muted-foreground">
              {summary.pending > 0 ? `${summary.pending} на проверке` : "Ничего не ждёт проверки"}
            </p>
          </div>
        </section>
      </div>

      <section aria-labelledby="levels-heading" className="rounded-2xl border border-border bg-card p-6">
        <div className="mb-5 flex items-center justify-between">
          <h2 id="levels-heading" className="font-semibold">
            Карта уровней
          </h2>
          <Link href="/dashboard/program" className="text-sm text-muted-foreground hover:text-foreground">
            Вся программа →
          </Link>
        </div>
        <LevelStepper levels={course} />
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        <section aria-labelledby="comment-heading" className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-6">
          <div className="flex items-center gap-2">
            <MessageSquareText className="size-4 text-accent" />
            <h2 id="comment-heading" className="font-semibold">
              Последний комментарий куратора
            </h2>
          </div>
          {lastComment ? (
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                {lastComment.action === "accept" ? (
                  <CheckCircle2 className="size-3.5 text-success" />
                ) : (
                  <RotateCcw className="size-3.5 text-destructive" />
                )}
                <span>{lastComment.curatorName ?? "Куратор"}</span>
                <span aria-hidden>·</span>
                <span>{timeAgo(lastComment.createdAt)}</span>
              </div>
              <blockquote className="border-l-2 border-accent/50 pl-4 text-sm leading-relaxed text-pretty">
                {lastComment.comment || (lastComment.action === "accept" ? "Задание принято без замечаний." : "Требуется доработка.")}
              </blockquote>
              <Link
                href={`/dashboard/lessons/${lastComment.lessonId}`}
                className="text-sm text-muted-foreground hover:text-foreground"
              >
                К уроку «{lastComment.lessonTitle}» →
              </Link>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-pretty">
              Комментариев пока нет. Отправьте первое задание — куратор проверит его и оставит обратную связь.
            </p>
          )}
        </section>

        <section aria-labelledby="notif-heading" className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bell className="size-4 text-accent" />
              <h2 id="notif-heading" className="font-semibold">
                Уведомления
              </h2>
            </div>
            <Link href="/dashboard/notifications" className="text-sm text-muted-foreground hover:text-foreground">
              Все →
            </Link>
          </div>
          {recentNotifications.length ? (
            <ul className="flex flex-col divide-y divide-border">
              {recentNotifications.map((n) => (
                <li key={n.id} className="flex items-start gap-3 py-2.5 first:pt-0 last:pb-0">
                  <span
                    className={cn(
                      "mt-1.5 size-2 shrink-0 rounded-full",
                      n.type === "success" ? "bg-success" : n.type === "warning" ? "bg-warning" : n.type === "error" ? "bg-destructive" : "bg-accent",
                      n.read && "opacity-40",
                    )}
                    aria-hidden
                  />
                  <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                    <p className={cn("truncate text-sm", !n.read && "font-medium")}>{n.title}</p>
                    <p className="text-xs text-muted-foreground">{formatDateTime(n.createdAt)}</p>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">Пока тихо. Здесь появятся результаты проверок и новости курса.</p>
          )}
        </section>
      </div>
    </div>
  )
}
