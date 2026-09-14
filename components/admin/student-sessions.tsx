"use client"

import { useTransition } from "react"
import { useRouter } from "next/navigation"
import { Loader2, MonitorSmartphone, X } from "lucide-react"
import { toast } from "sonner"
import { revokeUserSessions } from "@/app/actions/admin"
import { Button } from "@/components/ui/button"
import { formatDateTime, parseUserAgent } from "@/lib/format"

type Session = { id: string; ipAddress: string | null; userAgent: string | null; createdAt: Date; expiresAt: Date }

export function StudentSessions({ userId, sessions, canRevoke }: { userId: string; sessions: Session[]; canRevoke: boolean }) {
  const [pending, start] = useTransition()
  const router = useRouter()

  function revoke(sessionId?: string) {
    start(async () => {
      const res = await revokeUserSessions(userId, sessionId)
      if (res.ok) {
        toast.success(sessionId ? "Сессия завершена" : "Все сессии завершены")
        router.refresh()
      } else toast.error(res.error)
    })
  }

  const active = sessions.filter((s) => new Date(s.expiresAt) > new Date())

  return (
    <section aria-labelledby="sess-heading" className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-5">
      <div className="flex items-center justify-between gap-2">
        <h2 id="sess-heading" className="flex items-center gap-2 font-semibold">
          <MonitorSmartphone className="size-4 text-muted-foreground" /> Сессии
          <span className="font-mono text-xs text-muted-foreground tabular-nums">{active.length}</span>
        </h2>
        {canRevoke && active.length > 0 && (
          <Button variant="ghost" size="sm" disabled={pending} onClick={() => revoke()}>
            {pending && <Loader2 className="animate-spin" />}
            Завершить все
          </Button>
        )}
      </div>
      {active.length === 0 ? (
        <p className="text-sm text-muted-foreground">Активных сессий нет.</p>
      ) : (
        <ul className="flex flex-col divide-y divide-border">
          {active.map((s) => (
            <li key={s.id} className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0">
              <div className="flex min-w-0 flex-1 flex-col">
                <p className="truncate text-sm">{parseUserAgent(s.userAgent)}</p>
                <p className="text-xs text-muted-foreground">
                  {s.ipAddress ?? "IP неизвестен"} · {formatDateTime(s.createdAt)}
                </p>
              </div>
              {canRevoke && (
                <Button variant="ghost" size="icon-sm" disabled={pending} onClick={() => revoke(s.id)} aria-label="Завершить сессию">
                  <X />
                </Button>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
