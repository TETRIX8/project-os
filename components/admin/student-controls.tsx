"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Ban, Loader2, ShieldCheck } from "lucide-react"
import { toast } from "sonner"
import { setUserBanned, setUserRole, setUserTariff } from "@/app/actions/admin"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { assignableRoles, ROLE_LABELS, TARIFFS, TARIFF_LABELS, type Role, type Tariff } from "@/lib/constants"

export function StudentControls({
  userId,
  role,
  tariff,
  banned,
  isSelf,
  actorRole,
  perms,
}: {
  userId: string
  role: Role
  tariff: Tariff
  banned: boolean
  isSelf: boolean
  actorRole: Role
  perms: { manage: boolean; ban: boolean; roles: boolean }
}) {
  const [pending, start] = useTransition()
  const [reason, setReason] = useState("")
  const [showBan, setShowBan] = useState(false)
  const router = useRouter()
  const roles = assignableRoles(actorRole)

  function run(p: Promise<{ ok: boolean; error?: string }>, okMsg: string) {
    start(async () => {
      const res = await p
      if (res.ok) {
        toast.success(okMsg)
        router.refresh()
      } else toast.error(res.error ?? "Ошибка")
    })
  }

  if (!perms.manage && !perms.ban && !perms.roles) return null

  return (
    <section aria-labelledby="controls-heading" className="flex flex-col gap-5 rounded-2xl border border-border bg-card p-5">
      <h2 id="controls-heading" className="flex items-center gap-2 font-semibold">
        <ShieldCheck className="size-4 text-muted-foreground" /> Управление
      </h2>

      {perms.manage && (
        <div className="flex flex-col gap-1.5">
          <Label>Тариф</Label>
          <Select value={tariff} disabled={pending} onValueChange={(v) => run(setUserTariff(userId, v), "Тариф обновлён")}>
            <SelectTrigger aria-label="Тариф">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TARIFFS.map((t) => (
                <SelectItem key={t} value={t}>
                  {TARIFF_LABELS[t]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {perms.roles && (
        <div className="flex flex-col gap-1.5">
          <Label>Роль</Label>
          <Select value={role} disabled={pending || isSelf || (role === "owner" && actorRole !== "owner")} onValueChange={(v) => run(setUserRole(userId, v), "Роль обновлена")}>
            <SelectTrigger aria-label="Роль">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(roles.includes(role) ? roles : [role, ...roles]).map((r) => (
                <SelectItem key={r} value={r}>
                  {ROLE_LABELS[r]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {isSelf && <p className="text-[11px] text-muted-foreground">Собственную роль менять нельзя.</p>}
        </div>
      )}

      {perms.ban && !isSelf && role !== "owner" && (
        <div className="flex flex-col gap-2 border-t border-border pt-4">
          {banned ? (
            <Button variant="outline" disabled={pending} onClick={() => run(setUserBanned(userId, false), "Доступ восстановлен")}>
              {pending && <Loader2 className="animate-spin" />}
              Разблокировать
            </Button>
          ) : showBan ? (
            <>
              <Label htmlFor="ban-reason">Причина блокировки</Label>
              <Textarea id="ban-reason" rows={3} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Например: передача доступа третьим лицам" />
              <div className="flex gap-2">
                <Button variant="destructive" disabled={pending} onClick={() => run(setUserBanned(userId, true, reason), "Пользователь заблокирован")} className="flex-1">
                  {pending ? <Loader2 className="animate-spin" /> : <Ban />}
                  Заблокировать
                </Button>
                <Button variant="ghost" onClick={() => setShowBan(false)}>
                  Отмена
                </Button>
              </div>
            </>
          ) : (
            <Button variant="outline" className="text-destructive hover:text-destructive" onClick={() => setShowBan(true)}>
              <Ban /> Заблокировать доступ
            </Button>
          )}
          <p className="text-[11px] text-muted-foreground">Блокировка завершает все активные сессии.</p>
        </div>
      )}
    </section>
  )
}
