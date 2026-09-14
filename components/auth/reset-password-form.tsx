"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"
import { authClient } from "@/lib/auth-client"
import { Button } from "@/components/ui/button"
import { LinkButton } from "@/components/ui/link-button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export function ResetPasswordForm({ token, invalid }: { token: string | null; invalid: boolean }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (invalid || !token) {
    return (
      <div className="flex flex-col gap-4">
        <p role="alert" className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          Ссылка недействительна или устарела. Запросите новую.
        </p>
        <LinkButton href="/forgot-password" variant="outline">
          Запросить новую ссылку
        </LinkButton>
      </div>
    )
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    const fd = new FormData(e.currentTarget)
    const password = String(fd.get("password") ?? "")
    const confirm = String(fd.get("confirm") ?? "")
    if (password.length < 8) return setError("Минимум 8 символов")
    if (password !== confirm) return setError("Пароли не совпадают")
    setLoading(true)
    const res = await authClient.resetPassword({ newPassword: password, token: token! })
    setLoading(false)
    if (res.error) return setError("Не удалось сменить пароль. Запросите новую ссылку.")
    toast.success("Пароль обновлён. Войдите с новым паролем.")
    router.push("/login")
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="password">Новый пароль</Label>
        <Input id="password" name="password" type="password" autoComplete="new-password" required minLength={8} />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="confirm">Повторите пароль</Label>
        <Input id="confirm" name="confirm" type="password" autoComplete="new-password" required minLength={8} />
      </div>
      {error && (
        <p role="alert" className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      )}
      <Button type="submit" size="lg" disabled={loading} className="w-full">
        {loading && <Loader2 className="size-4 animate-spin" />}
        Сохранить пароль
      </Button>
    </form>
  )
}
