import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft, ArrowRight } from "lucide-react"
import { hasPermission, requirePermissionPage } from "@/lib/rbac"
import { getStudentDetail } from "@/lib/queries/admin"
import { PageHeader } from "@/components/shell/page-header"
import { RoleBadge, StatusBadge, TariffBadge } from "@/components/status-badge"
import { StudentControls } from "@/components/admin/student-controls"
import { StudentSessions } from "@/components/admin/student-sessions"
import { AuditList } from "@/components/admin/audit-list"
import { formatDate, formatDateTime, initials } from "@/lib/format"
import type { Role, SubmissionStatus, Tariff } from "@/lib/constants"

export const metadata: Metadata = { title: "Карточка ученика" }

export default async function StudentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const actor = await requirePermissionPage("students.view")
  const { id } = await params
  const detail = await getStudentDetail(id)
  if (!detail) notFound()
  const { user, sessions, submissions, audits } = detail

  const perms = {
    manage: hasPermission(actor.role, "students.manage"),
    ban: hasPermission(actor.role, "students.ban"),
    roles: hasPermission(actor.role, "roles.manage"),
    sessions: hasPermission(actor.role, "sessions.revoke"),
    audit: hasPermission(actor.role, "audit.view"),
  }
  const accepted = submissions.filter((s) => s.status === "accepted").length

  return (
    <div className="flex flex-col gap-6">
      <Link href="/admin/students" className="inline-flex w-fit items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" /> К списку
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <span className="flex size-14 items-center justify-center rounded-full bg-primary/15 text-lg font-semibold text-primary">{initials(user.name)}</span>
          <div className="flex flex-col gap-1">
            <h1 className="text-2xl font-semibold tracking-tight">{user.name}</h1>
            <p className="text-sm text-muted-foreground">{user.email}</p>
            <div className="flex flex-wrap items-center gap-2">
              <RoleBadge role={user.role as Role} />
              <TariffBadge tariff={user.tariff as Tariff} />
              {user.banned && <span className="rounded-md bg-destructive/15 px-2 py-0.5 text-xs font-medium text-destructive">Заблокирован</span>}
              {user.twoFactorEnabled && <span className="rounded-md bg-success/15 px-2 py-0.5 text-xs font-medium text-success">2FA</span>}
            </div>
          </div>
        </div>
        <div className="text-right text-xs text-muted-foreground">
          <p>Регистрация {formatDate(user.createdAt)}</p>
          <p>Обновлён {formatDateTime(user.updatedAt)}</p>
        </div>
      </div>

      {user.banned && user.banReason && (
        <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm">
          <span className="font-medium text-destructive">Причина блокировки:</span> {user.banReason}
        </div>
      )}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="flex flex-col gap-6">
          <section aria-labelledby="subs-heading" className="rounded-2xl border border-border bg-card">
            <div className="flex items-center justify-between border-b border-border px-6 py-4">
              <h2 id="subs-heading" className="font-semibold">
                Задания
              </h2>
              <span className="font-mono text-xs text-muted-foreground tabular-nums">
                принято {accepted} из {submissions.length}
              </span>
            </div>
            {submissions.length === 0 ? (
              <p className="px-6 py-10 text-center text-sm text-muted-foreground">Ученик ещё не отправлял задания.</p>
            ) : (
              <ul className="divide-y divide-border">
                {submissions.map((s) => (
                  <li key={s.id}>
                    <Link href={`/admin/reviews/${s.id}`} className="flex items-center gap-4 px-6 py-3 transition-colors hover:bg-muted/40">
                      <span className="font-mono text-xs text-muted-foreground tabular-nums">{String(s.lessonOrder).padStart(2, "0")}</span>
                      <span className="flex-1 truncate text-sm">{s.lessonTitle}</span>
                      {s.grade != null && <span className="font-mono text-xs text-muted-foreground">{s.grade}/10</span>}
                      {s.version > 1 && <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium">v{s.version}</span>}
                      <StatusBadge status={s.status as SubmissionStatus} />
                      <ArrowRight className="size-4 text-muted-foreground" />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {perms.audit && (
            <section aria-labelledby="audit-heading" className="rounded-2xl border border-border bg-card">
              <h2 id="audit-heading" className="border-b border-border px-6 py-4 font-semibold">
                Журнал действий
              </h2>
              <AuditList rows={audits} compact />
            </section>
          )}
        </div>

        <aside className="flex flex-col gap-6">
          <StudentControls
            userId={user.id}
            role={user.role as Role}
            tariff={user.tariff as Tariff}
            banned={user.banned}
            isSelf={user.id === actor.id}
            actorRole={actor.role}
            perms={perms}
          />
          <StudentSessions userId={user.id} sessions={sessions} canRevoke={perms.sessions} />
        </aside>
      </div>
    </div>
  )
}
