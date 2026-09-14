import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { getCurrentUser, hasPermission } from "@/lib/rbac"
import { AuthShell } from "@/components/auth/auth-shell"
import { AuthForm } from "@/components/auth/auth-form"

export const metadata: Metadata = { title: "Вход" }

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>
}) {
  const user = await getCurrentUser()
  const { next } = await searchParams
  if (user) redirect(hasPermission(user.role, "admin.access") ? "/admin" : "/dashboard")

  return (
    <AuthShell title="Вход в кабинет" description="Продолжите обучение с того места, где остановились.">
      <AuthForm mode="login" redirectTo={next} />
    </AuthShell>
  )
}
