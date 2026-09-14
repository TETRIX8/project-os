"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"
import { authClient } from "@/lib/auth-client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

type Mode = "login" | "register"

export function AuthForm({ mode, redirectTo }: { mode: Mode; redirectTo?: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    const fd = new FormData(e.currentTarget)
    const email = String(fd.get("email") ?? "").trim().toLowerCase()
    const password = String(fd.get("password") ?? "")
    const name = String(fd.get("name") ?? "").trim()

    if (mode === "register") {
      if (name.length < 2) return setError("Введите имя (минимум 2 символа)")
      if (password.length < 8) return setError("Пароль должен быть не короче 8 символов")
      if (!fd.get("agree")) return setError("Необходимо принять пользовательское соглашение")
    }

    setLoading(true)
    try {
      const result =
        mode === "register"
          ? await authClient.signUp.email({ email, password, name })
          : await authClient.signIn.email({ email, password })

      if (result.error) {
        setError(
          mode === "register"
            ? "Не удалось создать аккаунт. Возможно, email уже занят."
            : "Неверный email или пароль.",
        )
        return
      }
      toast.success(mode === "register" ? "Аккаунт создан. Добро пожаловать!" : "С возвращением!")
      router.push(redirectTo ?? "/dashboard")
      router.refresh()
    } catch {
      setError("Что-то пошло не так. Попробуйте ещё раз.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
      {mode === "register" && (
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="name">Имя</Label>
          <Input id="name" name="name" autoComplete="name" placeholder="Как к вам обращаться" required />
        </div>
      )}
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="email">Email</Label>
        <Input id="email" name="email" type="email" autoComplete="email" placeholder="you@example.com" required />
      </div>
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between">
          <Label htmlFor="password">Пароль</Label>
          {mode === "login" && (
            <Link href="/forgot-password" className="text-xs text-muted-foreground hover:text-foreground">
              Забыли пароль?
            </Link>
          )}
        </div>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete={mode === "register" ? "new-password" : "current-password"}
          placeholder={mode === "register" ? "Минимум 8 символов" : "••••••••"}
          required
          minLength={8}
        />
      </div>

      {mode === "register" && (
        <label className="flex items-start gap-2.5 text-sm text-muted-foreground leading-relaxed">
          <input type="checkbox" name="agree" className="mt-1 accent-primary" />
          <span>
            Принимаю{" "}
            <Link href="/terms" className="text-foreground underline underline-offset-4">
              пользовательское соглашение
            </Link>{" "}
            и{" "}
            <Link href="/privacy" className="text-foreground underline underline-offset-4">
              политику конфиденциальности
            </Link>
          </span>
        </label>
      )}

      {error && (
        <p role="alert" className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      )}

      <Button type="submit" size="lg" disabled={loading} className="mt-1 w-full">
        {loading && <Loader2 className="size-4 animate-spin" />}
        {mode === "register" ? "Создать аккаунт" : "Войти"}
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        {mode === "register" ? (
          <>
            Уже есть аккаунт?{" "}
            <Link href="/login" className="text-foreground underline underline-offset-4">
              Войти
            </Link>
          </>
        ) : (
          <>
            Нет аккаунта?{" "}
            <Link href="/register" className="text-foreground underline underline-offset-4">
              Зарегистрироваться
            </Link>
          </>
        )}
      </p>
    </form>
  )
}
