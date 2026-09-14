"use client"

import Link from "next/link"
import { usePathname, useSearchParams } from "next/navigation"
import { cn } from "@/lib/utils"

export function FilterTabs({
  param,
  value,
  options,
}: {
  param: string
  value: string
  options: { value: string; label: string; count?: number }[]
}) {
  const pathname = usePathname()
  const sp = useSearchParams()

  return (
    <div role="tablist" className="flex flex-wrap gap-1 rounded-xl border border-border bg-surface p-1 w-fit">
      {options.map((o) => {
        const next = new URLSearchParams(sp.toString())
        next.set(param, o.value)
        const active = o.value === value
        return (
          <Link
            key={o.value}
            role="tab"
            aria-selected={active}
            href={`${pathname}?${next.toString()}`}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm transition-colors",
              active ? "bg-card text-foreground font-medium shadow-sm" : "text-muted-foreground hover:text-foreground",
            )}
          >
            {o.label}
            {o.count != null && <span className="font-mono text-xs text-muted-foreground tabular-nums">{o.count}</span>}
          </Link>
        )
      })}
    </div>
  )
}
