import { ShieldOff } from "lucide-react"
import { LinkButton } from "@/components/ui/link-button"
import { Logo } from "@/components/brand/logo"

export default function ForbiddenPage() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-6 px-4 text-center">
      <Logo />
      <span className="flex size-14 items-center justify-center rounded-full bg-destructive/15 text-destructive">
        <ShieldOff className="size-6" />
      </span>
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold tracking-tight">Доступ запрещён</h1>
        <p className="max-w-sm text-sm text-muted-foreground text-pretty">
          У вашей роли нет прав для этого раздела. Если вы считаете, что это ошибка, напишите в поддержку.
        </p>
      </div>
      <div className="flex gap-3">
        <LinkButton href="/dashboard" variant="outline" size="lg">
          В кабинет
        </LinkButton>
        <LinkButton href="/dashboard/support" size="lg">
          Поддержка
        </LinkButton>
      </div>
    </main>
  )
}
