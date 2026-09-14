import type { Metadata } from "next"
import Link from "next/link"
import { ArrowRight, ClipboardList } from "lucide-react"
import { requireUserPage } from "@/lib/rbac"
import { getUserSubmissions } from "@/lib/queries/course"
import { PageHeader } from "@/components/shell/page-header"
import { StatusBadge } from "@/components/status-badge"
import { EmptyState } from "@/components/empty-state"
import { LinkButton } from "@/components/ui/link-button"
import { ReviewHistory } from "@/components/lesson/review-history"
import { formatDateTime } from "@/lib/format"
import type { SubmissionStatus } from "@/lib/constants"

export const metadata: Metadata = { title: "Мои задания" }

const ORDER: SubmissionStatus[] = ["needs_revision", "pending", "draft", "accepted", "not_submitted"]

export default async function AssignmentsPage() {
  const user = await requireUserPage()
  const rows = await getUserSubmissions(user.id)
  const sorted = [...rows].sort(
    (a, b) => ORDER.indexOf(a.submission.status as SubmissionStatus) - ORDER.indexOf(b.submission.status as SubmissionStatus),
  )
  const counts = {
    pending: rows.filter((r) => r.submission.status === "pending").length,
    needs_revision: rows.filter((r) => r.submission.status === "needs_revision").length,
    accepted: rows.filter((r) => r.submission.status === "accepted").length,
    draft: rows.filter((r) => r.submission.status === "draft").length,
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Мои задания"
        description="Все отправленные работы, статусы и комментарии кураторов в одном месте."
      />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="На доработку" value={counts.needs_revision} tone="destructive" />
        <Stat label="На проверке" value={counts.pending} tone="warning" />
        <Stat label="Принято" value={counts.accepted} tone="success" />
        <Stat label="Черновики" value={counts.draft} tone="muted" />
      </div>

      {sorted.length === 0 ? (
        <EmptyState
          icon={ClipboardList}
          title="Заданий пока нет"
          description="Откройте первый урок, посмотрите видео и отправьте задание — оно появится здесь."
          action={
            <LinkButton href="/dashboard/program">
              К программе <ArrowRight />
            </LinkButton>
          }
        />
      ) : (
        <ul className="flex flex-col gap-3">
          {sorted.map(({ submission, lessonTitle, lessonOrder, reviews }) => (
            <li key={submission.id} className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex min-w-0 flex-col gap-1">
                  <p className="font-mono text-xs text-muted-foreground">Урок {String(lessonOrder).padStart(2, "0")}</p>
                  <Link href={`/dashboard/lessons/${submission.lessonId}`} className="font-medium leading-snug hover:underline underline-offset-4">
                    {lessonTitle}
                  </Link>
                  <p className="text-xs text-muted-foreground">
                    {submission.submittedAt ? `Отправлено ${formatDateTime(submission.submittedAt)}` : `Изменено ${formatDateTime(submission.updatedAt)}`}
                    {submission.version > 1 && ` · версия ${submission.version}`}
                    {submission.grade != null && ` · оценка ${submission.grade}/10`}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <StatusBadge status={submission.status as SubmissionStatus} />
                  <LinkButton href={`/dashboard/lessons/${submission.lessonId}`} size="sm" variant={submission.status === "needs_revision" ? "default" : "outline"}>
                    {submission.status === "needs_revision" ? "Доработать" : submission.status === "draft" ? "Продолжить" : "Открыть"}
                  </LinkButton>
                </div>
              </div>
              {reviews.length > 0 && (
                <div className="border-t border-border pt-4">
                  <ReviewHistory reviews={reviews.slice(0, 2)} compact />
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function Stat({ label, value, tone }: { label: string; value: number; tone: "destructive" | "warning" | "success" | "muted" }) {
  const color = {
    destructive: "text-destructive",
    warning: "text-warning",
    success: "text-success",
    muted: "text-muted-foreground",
  }[tone]
  return (
    <div className="flex flex-col gap-1 rounded-xl border border-border bg-card p-4">
      <span className={`font-mono text-2xl font-semibold tabular-nums ${color}`}>{value}</span>
      <span className="text-xs text-muted-foreground">{label}</span>
    </div>
  )
}
