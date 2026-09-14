import { formatDateTime } from "@/lib/format"
import { cn } from "@/lib/utils"

type AuditRow = {
  id: number
  actor: string | null
  actorEmail: string | null
  action: string
  entity: string | null
  entityId: string | null
  ip: string | null
  metadata: unknown
  createdAt: Date
}

const ACTION_LABELS: Record<string, string> = {
  "auth.sign_in": "Вход",
  "auth.sign_up": "Регистрация",
  "auth.sign_out": "Выход",
  "auth.session_limit": "Лимит сессий: старая завершена",
  "auth.password_reset": "Сброс пароля",
  "submission.submit": "Отправка задания",
  "submission.accept": "Задание принято",
  "submission.revise": "Отправлено на доработку",
  "lesson.watched": "Урок просмотрен",
  "lesson.create": "Урок создан",
  "lesson.update": "Урок изменён",
  "lesson.publish": "Урок опубликован",
  "lesson.unpublish": "Урок скрыт",
  "lesson.archive": "Урок архивирован",
  "lesson.restore": "Урок восстановлен",
  "level.update": "Уровень изменён",
  "material.create": "Материал добавлен",
  "material.update": "Материал изменён",
  "material.delete": "Материал удалён",
  "user.tariff_change": "Смена тарифа",
  "user.role_change": "Смена роли",
  "user.ban": "Блокировка",
  "user.unban": "Разблокировка",
  "session.revoke": "Сессия завершена админом",
  "session.revoke_all": "Все сессии завершены админом",
  "session.revoke_own": "Сессия завершена",
  "session.revoke_others": "Другие сессии завершены",
  "profile.update": "Профиль обновлён",
  "2fa.enable": "2FA включена",
  "2fa.disable": "2FA выключена",
}

function tone(action: string) {
  if (action.includes("ban") && !action.includes("unban")) return "text-destructive"
  if (action.includes("accept") || action.includes("publish") || action.includes("unban")) return "text-success"
  if (action.includes("revise") || action.includes("archive") || action.includes("delete")) return "text-warning"
  if (action.startsWith("auth.")) return "text-accent"
  return "text-foreground"
}

export function AuditList({ rows, compact = false }: { rows: AuditRow[]; compact?: boolean }) {
  if (rows.length === 0) return <p className="px-6 py-10 text-center text-sm text-muted-foreground">Записей нет.</p>

  return (
    <ul className="divide-y divide-border">
      {rows.map((r) => {
        const meta = (r.metadata ?? {}) as Record<string, unknown>
        const metaEntries = Object.entries(meta).filter(([, v]) => v != null && v !== "" && typeof v !== "object")
        return (
          <li key={r.id} className={cn("flex flex-col gap-1 px-6", compact ? "py-2.5" : "py-3")}>
            <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <span className={cn("text-sm font-medium", tone(r.action))}>{ACTION_LABELS[r.action] ?? r.action}</span>
              <code className="font-mono text-[11px] text-muted-foreground">{r.action}</code>
              <span className="ml-auto text-xs text-muted-foreground whitespace-nowrap">{formatDateTime(r.createdAt)}</span>
            </div>
            <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
              {r.actorEmail && <span>{r.actorEmail}</span>}
              {r.entity && (
                <span>
                  {r.entity}
                  {r.entityId && <span className="font-mono"> #{r.entityId.slice(0, 12)}</span>}
                </span>
              )}
              {r.ip && <span className="font-mono">{r.ip}</span>}
              {!compact &&
                metaEntries.map(([k, v]) => (
                  <span key={k} className="font-mono">
                    {k}={String(v)}
                  </span>
                ))}
            </div>
          </li>
        )
      })}
    </ul>
  )
}
