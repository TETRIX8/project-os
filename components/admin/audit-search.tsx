"use client"

import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { Search } from "lucide-react"
import { Input } from "@/components/ui/input"

export function AuditSearch({ q }: { q: string }) {
  const router = useRouter()
  const pathname = usePathname()
  const sp = useSearchParams()

  return (
    <form
      className="relative min-w-64 flex-1 sm:max-w-sm"
      onSubmit={(e) => {
        e.preventDefault()
        const next = new URLSearchParams(sp.toString())
        const value = String(new FormData(e.currentTarget).get("q") ?? "").trim()
        if (value) next.set("q", value)
        else next.delete("q")
        router.push(`${pathname}${next.size ? `?${next}` : ""}`)
      }}
    >
      <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
      <Input name="q" defaultValue={q} placeholder="Email, действие или ID…" className="pl-9" aria-label="Поиск по журналу" />
    </form>
  )
}
