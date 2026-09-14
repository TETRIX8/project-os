import type { Metadata } from "next"
import { AuthShell } from "@/components/auth/auth-shell"
import { ResetPasswordForm } from "@/components/auth/reset-password-form"

export const metadata: Metadata = { title: "Новый пароль" }

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string; error?: string }>
}) {
  const { token, error } = await searchParams
  return (
    <AuthShell title="Новый пароль" description="Придумайте новый пароль длиной не менее 8 символов.">
      <ResetPasswordForm token={token ?? null} invalid={Boolean(error) || !token} />
    </AuthShell>
  )
}
