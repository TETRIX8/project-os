import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft, ExternalLink, FileText, Paperclip, User } from "lucide-react"
import { hasPermission, requirePermissionPage } from "@/lib/rbac"
import { getSubmissionDetail } from "@/lib/queries/admin"
import { PageHeader } from "@/components/shell/page-header"
import { StatusBadge, TariffBadge } from "@/components/status-badge"
import { ReviewForm } from "@/components/admin/review-form"
import { ReviewHistory } from "@/components/lesson/review-history"
import { formatDateTime } from "@/lib/format"
import { ASSIGNMENT_FORMAT_LABELS, type AssignmentFormat, type SubmissionStatus, type Tariff } from "@/lib/constants"

export const metadata: Metadata = { title: "Проверка работы" }

export default async function ReviewDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requirePermissionPage("reviews.view")
  const { id } = await params
  const numId = Number(id)
  if (!Number.isInteger(numId)) notFound()
  const detail = await getSubmissionDetail(numId)
  if (!detail) notFound()

  const { submission, student, lesson, reviews } = detail
  const canGrade = hasPermission(user.role, "reviews.grade")
  const fields = (submission.fields ?? {}) as Record<string, string>

  return (
    <div className="flex flex-col gap-6">
      <Link href="/admin/reviews" className="inline-flex w-fit items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" /> К очереди
      </Link>

      <PageHeader
        eyebrow={`Урок ${String(lesson.order).padStart(2, "0")} · версия ${submission.version}`}
        title={lesson.title}
        actions={<StatusBadge status={submission.status as SubmissionStatus} />}
      />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
        <div className="flex flex-col gap-6">
          <section aria-labelledby="work-heading" className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-6">
            <div className="flex items-center justify-between">
              <h2 id="work-heading" className="font-semibold">
                Работа ученика
              </h2>
              <span className="text-xs text-muted-foreground">
                {submission.submittedAt ? `Отправлено ${formatDateTime(submission.submittedAt)}` : "Черновик"}
              </span>
            </div>

            {submission.contentText && (
              <div className="rounded-xl bg-surface p-4">
                <p className="whitespace-pre-wrap text-sm leading-relaxed">{submission.contentText}</p>
              </div>
            )}

            {submission.contentLink && (
              <a
                href={submission.contentLink}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-lg border border-border bg-surface px-3 py-2 text-sm text-primary hover:border-primary/40"
              >
                <ExternalLink className="size-4" /> <span className="truncate">{submission.contentLink}</span>
              </a>
            )}

            {submission.fileUrl && (
              <a
                href={submission.fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-lg border border-border bg-surface px-3 py-2 text-sm hover:border-primary/40"
              >
                <Paperclip className="size-4" /> Прикреплённый файл
              </a>
            )}

            {Object.keys(fields).length > 0 && (
              <dl className="grid gap-3 sm:grid-cols-2">
                {Object.entries(fields).map(([k, v]) => (
                  <div key={k} className="flex flex-col gap-1 rounded-lg bg-surface p-3">
                    <dt className="text-xs text-muted-foreground">{k}</dt>
                    <dd className="whitespace-pre-wrap text-sm">{v}</dd>
                  </div>
                ))}
              </dl>
            )}

            {!submission.contentText && !submission.contentLink && !submission.fileUrl && Object.keys(fields).length === 0 && (
              <p className="text-sm text-muted-foreground">Ученик пока ничего не отправил.</p>
            )}
          </section>

          <section aria-labelledby="task-heading" className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-6">
            <h2 id="task-heading" className="flex items-center gap-2 font-semibold">
              <FileText className="size-4 text-muted-foreground" /> Условие задания
            </h2>
            <p className="text-xs text-muted-foreground">Формат: {ASSIGNMENT_FORMAT_LABELS[lesson.assignmentFormat as AssignmentFormat]}</p>
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">{lesson.assignment ?? "—"}</p>
          </section>

          {reviews.length > 0 && <ReviewHistory reviews={reviews} />}
        </div>

        <aside className="flex flex-col gap-6">
          <section aria-labelledby="student-heading" className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-5">
            <h2 id="student-heading" className="flex items-center gap-2 text-sm font-semibold">
              <User className="size-4 text-muted-foreground" /> Ученик
            </h2>
            <div className="flex flex-col gap-1">
              <Link href={`/admin/students/${student.id}`} className="font-medium hover:underline underline-offset-4">
                {student.name}
              </Link>
              <span className="text-sm text-muted-foreground">{student.email}</span>
            </div>
            <TariffBadge tariff={student.tariff as Tariff} className="w-fit" />
          </section>

          {canGrade && submission.status === "pending" ? (
            <ReviewForm submissionId={submission.id} />
          ) : (
            <div className="rounded-2xl border border-dashed border-border bg-surface/40 p-5 text-sm text-muted-foreground">
              {submission.status === "pending" ? "У вашей роли нет права выставлять оценки." : "Работа уже проверена. Новая версия появится в очереди после переотправки."}
            </div>
          )}
        </aside>
      </div>
    </div>
  )
}
