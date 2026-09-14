import type { Metadata } from "next"
import { AuthShell } from "@/components/auth/auth-shell"
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form"

export const metadata: Metadata = { title: "Восстановление пароля" }

export default function ForgotPasswordPage() {
  return (
    <AuthShell
      title="Восстановление пароля"
      description="Укажите email — мы отправим ссылку для сброса пароля. Ссылка действует 1 час."
    >
      <ForgotPasswordForm />
    </AuthShell>
  )
}
