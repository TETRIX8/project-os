import Link from "next/link"
import { cn } from "@/lib/utils"

export function Logo({ className, href = "/", compact = false }: { className?: string; href?: string; compact?: boolean }) {
  return (
    <Link href={href} className={cn("flex items-center gap-2.5 font-semibold tracking-tight", className)}>
      <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground font-mono text-sm font-bold glow-primary">
        $
      </span>
      {!compact && (
        <span className="leading-none">
          <span className="block text-sm">300 за 30 дней</span>
          <span className="block text-[11px] font-normal text-muted-foreground">первые деньги в коде</span>
        </span>
      )}
    </Link>
  )
}
