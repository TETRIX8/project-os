import Link from "next/link"
import type { LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"

type Tone = "default" | "primary" | "accent" | "success" | "warning"

const tones: Record<Tone, string> = {
  default: "text-muted-foreground",
  primary: "text-primary",
  accent: "text-accent",
  success: "text-success",
  warning: "text-warning",
}

export function KpiCard({
  label,
  value,
  icon: Icon,
  tone = "default",
  href,
  hint,
}: {
  label: string
  value: number | string
  icon: LucideIcon
  tone?: Tone
  href?: string
  hint?: string
}) {
  const body = (
    <>
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">{label}</span>
        <Icon className={cn("size-4", tones[tone])} />
      </div>
      <span className={cn("font-mono text-2xl font-semibold tabular-nums", tone !== "default" && tones[tone])}>{value}</span>
      {hint && <span className="text-[11px] text-muted-foreground">{hint}</span>}
    </>
  )
  const cls = "flex flex-col gap-2 rounded-xl border border-border bg-card p-4"
  return href ? (
    <Link href={href} className={cn(cls, "transition-colors hover:border-primary/40")}>
      {body}
    </Link>
  ) : (
    <div className={cls}>{body}</div>
  )
}
