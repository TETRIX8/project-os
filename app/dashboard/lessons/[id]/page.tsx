import type { Metadata } from "next"
import Link from "next/link"
import { notFound, redirect } from "next/navigation"
import { ArrowLeft, ArrowRight, Clock, FileText, Lock, Paperclip, Sparkles, Target } from "lucide-react"
import { requireUserPage } from "@/lib/rbac"
import { canAccessLesson, getLessonForUser } from "@/lib/queries/course"
import { toEmbedUrl } from "@/lib/format"
import { TARIFF_LABELS, type SubmissionStatus, type Tariff } from "@/lib/constants"
import { StatusBadge } from "@/components/status-badge"
import { LinkButton } from "@/components/ui/link-button"
import { VideoPlayer } from "@/components/lesson/video-player"
import { LessonNotes } from "@/components/lesson/lesson-notes"
import { AssignmentForm } from "@/components/lesson/assignment-form"
import { ReviewHistory } from "@/components/lesson/review-history"

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params
  return { title: `Урок ${id}` }
}

export default async function LessonPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUserPage()
  const { id } = await params
  const lessonId = Number(id)
  if (!Number.isInteger(lessonId)) notFound()

  const access = await canAccessLesson(user.id, user.tariff, lessonId)
  if (!access.ok) {
    if (access.reason === "not_found") notFound()
    if (access.reason === "tariff") {
      return (
        <GateScreen
          icon={Sparkles}
          title={`Урок доступен на тарифе ${TARIFF_LABELS[access.required]}`}
          description="Улучшите тариф, чтобы открыть этот урок, бонусные материалы и шаблоны."
          cta={{ href: "/dashboard/tariff", label: "Посмотреть тарифы" }}
        />
      )
    }
    return (
      <GateScreen
        icon={Lock}
        title="Урок пока закрыт"
        description="Следующий уровень открывается, когда куратор примет все задания предыдущего."
        cta={{ href: "/dashboard/program", label: "К программе" }}
      />
    )
  }

  const data = await getLessonForUser(user.id, lessonId)
  if (!data) notFound()
  const { lesson, level, submission, watched, reviews, prev, next } = data
  const status = (submission?.status ?? "not_submitted") as SubmissionStatus
  const embed = toEmbedUrl(lesson.videoUrl)
  const files = (lesson.files ?? []) as { name: string; url: string }[]

  return (
    <div className="flex flex-col gap-6">
      <nav aria-label="Навигация по курсу" className="flex items-center justify-between gap-3 text-sm">
        <Link href="/dashboard/program" className="inline-flex items-center gap-1.5 text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-4" /> Программа
        </Link>
        <div className="flex items-center gap-2">
          {prev && (
            <LinkButton href={`/dashboard/lessons/${prev.id}`} variant="ghost" size="sm" aria-label={`Предыдущий урок: ${prev.title}`}>
              <ArrowLeft /> Урок {prev.order}
            </LinkButton>
          )}
          {next && (
            <LinkButton href={`/dashboard/lessons/${next.id}`} variant="ghost" size="sm" aria-label={`Следующий урок: ${next.title}`}>
              Урок {next.order} <ArrowRight />
            </LinkButton>
          )}
        </div>
      </nav>

      <header className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <span className="font-semibold uppercase tracking-wider text-primary">
            Уровень {level?.order} · {level?.title}
          </span>
          <span aria-hidden>·</span>
          <span className="font-mono">Урок {String(lesson.order).padStart(2, "0")}</span>
          <span aria-hidden>·</span>
          <span className="inline-flex items-center gap-1">
            <Clock className="size-3" /> {lesson.durationMin} мин
          </span>
          <StatusBadge status={status} className="ml-auto" />
        </div>
        <h1 className="text-2xl font-semibold tracking-tight text-balance sm:text-3xl">{lesson.title}</h1>
        {lesson.description && <p className="max-w-3xl text-sm text-muted-foreground leading-relaxed text-pretty">{lesson.description}</p>}
      </header>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
        <div className="flex min-w-0 flex-col gap-6">
          <VideoPlayer embedUrl={embed} coverUrl={lesson.coverUrl} lessonId={lesson.id} watched={watched} title={lesson.title} />

          {lesson.goal && (
            <section className="flex gap-3 rounded-xl border border-accent/30 bg-accent/10 p-4">
              <Target className="mt-0.5 size-4 shrink-0 text-accent" />
              <div className="flex flex-col gap-1">
                <p className="text-xs font-semibold uppercase tracking-wider text-accent">Цель урока</p>
                <p className="text-sm leading-relaxed text-pretty">{lesson.goal}</p>
              </div>
            </section>
          )}

          {lesson.notes && (
            <section aria-labelledby="notes-heading" className="rounded-2xl border border-border bg-card p-6">
              <div className="mb-4 flex items-center gap-2">
                <FileText className="size-4 text-muted-foreground" />
                <h2 id="notes-heading" className="font-semibold">
                  Конспект
                </h2>
              </div>
              <LessonNotes markdown={lesson.notes} />
            </section>
          )}

          {files.length > 0 && (
            <section aria-labelledby="files-heading" className="rounded-2xl border border-border bg-card p-6">
              <div className="mb-3 flex items-center gap-2">
                <Paperclip className="size-4 text-muted-foreground" />
                <h2 id="files-heading" className="font-semibold">
                  Файлы к уроку
                </h2>
              </div>
              <ul className="flex flex-col divide-y divide-border">
                {files.map((f) => (
                  <li key={f.url} className="py-2 first:pt-0 last:pb-0">
                    <a href={f.url} target="_blank" rel="noopener noreferrer" className="text-sm underline-offset-4 hover:underline">
                      {f.name}
                    </a>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>

        <aside className="flex flex-col gap-6 xl:sticky xl:top-24 xl:self-start">
          <AssignmentForm
            lessonId={lesson.id}
            format={lesson.assignmentFormat as "text" | "link" | "file" | "fields"}
            assignment={lesson.assignment}
            submission={
              submission
                ? {
                    status,
                    contentText: submission.contentText,
                    contentLink: submission.contentLink,
                    fields: (submission.fields ?? {}) as Record<string, string>,
                    version: submission.version,
                    grade: submission.grade,
                    submittedAt: submission.submittedAt,
                  }
                : null
            }
            watched={watched}
          />
          <ReviewHistory reviews={reviews} />
        </aside>
      </div>
    </div>
  )
}

function GateScreen({
  icon: Icon,
  title,
  description,
  cta,
}: {
  icon: typeof Lock
  title: string
  description: string
  cta: { href: string; label: string }
}) {
  return (
    <div className="flex flex-col items-center gap-5 rounded-2xl border border-border bg-card px-6 py-16 text-center">
      <span className="flex size-14 items-center justify-center rounded-full bg-primary/15 text-primary">
        <Icon className="size-6" />
      </span>
      <div className="flex flex-col gap-2">
        <h1 className="text-xl font-semibold tracking-tight text-balance">{title}</h1>
        <p className="max-w-md text-sm text-muted-foreground text-pretty">{description}</p>
      </div>
      <LinkButton href={cta.href} size="lg">
        {cta.label} <ArrowRight />
      </LinkButton>
    </div>
  )
}
