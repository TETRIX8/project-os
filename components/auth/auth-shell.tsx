import { Logo } from "@/components/brand/logo"

export function AuthShell({
  title,
  description,
  children,
}: {
  title: string
  description?: string
  children: React.ReactNode
}) {
  return (
    <main className="relative flex min-h-dvh flex-col items-center justify-center px-4 py-12">
      <div className="grid-fade pointer-events-none absolute inset-0" aria-hidden />
      <div className="relative z-10 flex w-full max-w-md flex-col gap-8">
        <Logo className="self-center" />
        <div className="rounded-2xl border border-border bg-card p-6 sm:p-8">
          <div className="mb-6 flex flex-col gap-1.5">
            <h1 className="text-xl font-semibold tracking-tight">{title}</h1>
            {description && <p className="text-sm text-muted-foreground text-pretty">{description}</p>}
          </div>
          {children}
        </div>
      </div>
    </main>
  )
}
