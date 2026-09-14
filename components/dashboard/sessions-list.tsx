"use client"

import { useTransition } from "react"
import { useRouter } from "next/navigation"
import { Loader2, MonitorSmartphone, X } from "lucide-react"
import { toast } from "sonner"
import { revokeMyOtherSessions, revokeMySession } from "@/app/actions/student"
import { Button } from "@/components/ui/button"
import { formatDateTime, parseUserAgent } from "@/lib/format"
import { cn } from "@/lib/utils"

type Session = {
  id: string
  ipAddress: string | null
  userAgent: string | null
  createdAt: Date
  expiresAt: Date
  current: boolean
}

export function SessionsList({ sessions, limit }: { sessions: Session[]; limit: number }) {
  const [pending, start] = useTransition()
  const router = useRouter()

  function revoke(id: string) {
    start(async () => {
      const res = await revokeMySession(id)
      if (res.ok) {
        toast.success("Сессия завершена")
        router.refresh()
      } else toast.error(res.error)
    })
  }

  function revokeOthers() {
    start(async () => {
      const res = await revokeMyOtherSessions()
      if (res.ok) {
        toast.success("Остальные сессии завершены")
        router.refresh()
      } else toast.error(res.error)
    })
  }

  return (
    <section aria-labelledby="sessions-heading" className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-6">
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-col gap-1">
          <h2 id="sessions-heading" className="flex items-center gap-2 font-semibold">
            <MonitorSmartphone className="size-4 text-muted-foreground" /> Активные сессии
          </h2>
          <p className="text-xs text-muted-foreground">
            {sessions.length} из {limit}. При входе с нового устройства самая старая сессия завершится автоматически.
          </p>
        </div>
        {sessions.length > 1 && (
          <Button variant="outline" size="sm" onClick={revokeOthers} disabled={pending}>
            {pending && <Loader2 className="animate-spin" />}
            Завершить остальные
          </Button>
        )}
      </div>
      <ul className="flex flex-col divide-y divide-border">
        {sessions.map((s) => (
          <li key={s.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
            <span className={cn("size-2 shrink-0 rounded-full", s.current ? "bg-success" : "bg-muted-foreground/40")} aria-hidden />
            <div className="flex min-w-0 flex-1 flex-col gap-0.5">
              <p className="truncate text-sm font-medium">
                {parseUserAgent(s.userAgent)}
                {s.current && <span className="ml-2 text-xs font-normal text-success">Это устройство</span>}
              </p>
              <p className="text-xs text-muted-foreground">
                {s.ipAddress ?? "IP неизвестен"} · вход {formatDateTime(s.createdAt)}
              </p>
            </div>
            {!s.current && (
              <Button variant="ghost" size="icon-sm" onClick={() => revoke(s.id)} disabled={pending} aria-label="Завершить сессию">
                <X />
              </Button>
            )}
          </li>
        ))}
      </ul>
    </section>
  )
}
