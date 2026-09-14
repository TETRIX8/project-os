import { Ban } from "lucide-react"
import { Logo } from "@/components/brand/logo"
import { SignOutButton } from "@/components/auth/sign-out-button"

export default function BlockedPage() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-6 px-4 text-center">
      <Logo />
      <span className="flex size-14 items-center justify-center rounded-full bg-destructive/15 text-destructive">
        <Ban className="size-6" />
      </span>
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold tracking-tight">Аккаунт заблокирован</h1>
        <p className="max-w-sm text-sm text-muted-foreground text-pretty">
          Доступ к платформе приостановлен администратором. Для уточнения причин напишите на support@example.com.
        </p>
      </div>
      <SignOutButton variant="outline" />
    </main>
  )
}
