"use client"

import { useState, useTransition } from "react"
import { KeyRound, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { authClient } from "@/lib/auth-client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export function ChangePasswordForm() {
  const [current, setCurrent] = useState("")
  const [next, setNext] = useState("")
  const [pending, start] = useTransition()

  return (
    <form
      className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-6"
      onSubmit={(e) => {
        e.preventDefault()
        if (next.length < 8) return toast.error("Новый пароль — минимум 8 символов")
        start(async () => {
          const { error } = await authClient.changePassword({ currentPassword: current, newPassword: next, revokeOtherSessions: true })
          if (error) toast.error(error.message ?? "Не удалось сменить пароль")
          else {
            toast.success("Пароль обновлён, другие сессии завершены")
            setCurrent("")
            setNext("")
          }
        })
      }}
    >
      <h2 className="flex items-center gap-2 font-semibold">
        <KeyRound className="size-4 text-muted-foreground" /> Смена пароля
      </h2>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="cur">Текущий пароль</Label>
        <Input id="cur" type="password" autoComplete="current-password" value={current} onChange={(e) => setCurrent(e.target.value)} required />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="new">Новый пароль</Label>
        <Input id="new" type="password" autoComplete="new-password" value={next} onChange={(e) => setNext(e.target.value)} required minLength={8} />
      </div>
      <div className="flex justify-end">
        <Button type="submit" disabled={pending || !current || !next}>
          {pending && <Loader2 className="animate-spin" />}
          Обновить пароль
        </Button>
      </div>
    </form>
  )
}
