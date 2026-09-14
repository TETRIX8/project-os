"use client"

import { useState } from "react"
import Link from "next/link"
import { Loader2, MailCheck } from "lucide-react"
import { authClient } from "@/lib/auth-client"
import { Button } from "@/components/ui/button"
import { LinkButton } from "@/components/ui/link-button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export function ForgotPasswordForm() {
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const email = String(new FormData(e.currentTarget).get("email") ?? "").trim().toLowerCase()
    if (!email) return
    setLoading(true)
    try {
      await authClient.requestPasswordReset({ email, redirectTo: "/reset-password" })
    } finally {
      // Always show the same result to avoid revealing whether an email exists.
      setSent(true)
      setLoading(false)
    }
  }

  if (sent) {
    return (
      <div className="flex flex-col items-center gap-4 text-center">
        <span className="flex size-12 items-center justify-center rounded-full bg-success/15 text-success">
          <MailCheck className="size-5" />
        </span>
        <p className="text-sm text-muted-foreground text-pretty">
          Если аккаунт с таким email существует, мы отправили на него ссылку для сброса пароля. Проверьте папку «Спам».
        </p>
        <LinkButton href="/login" variant="outline">
          Вернуться ко входу
        </LinkButton>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="email">Email</Label>
        <Input id="email" name="email" type="email" autoComplete="email" placeholder="you@example.com" required />
      </div>
      <Button type="submit" size="lg" disabled={loading} className="w-full">
        {loading && <Loader2 className="size-4 animate-spin" />}
        Отправить ссылку
      </Button>
      <p className="text-center text-sm text-muted-foreground">
        <Link href="/login" className="text-foreground underline underline-offset-4">
          Вернуться ко входу
        </Link>
      </p>
    </form>
  )
}
