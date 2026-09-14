import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { getCurrentUser } from "@/lib/rbac"
import { AuthShell } from "@/components/auth/auth-shell"
import { AuthForm } from "@/components/auth/auth-form"

export const metadata: Metadata = { title: "Регистрация" }

export default async function RegisterPage() {
  const user = await getCurrentUser()
  if (user) redirect("/dashboard")

  return (
    <AuthShell
      title="Создать аккаунт"
      description="Доступ к первому уровню открывается сразу после регистрации. Тариф можно изменить позже."
    >
      <AuthForm mode="register" />
    </AuthShell>
  )
}
