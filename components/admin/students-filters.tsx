"use client"

import { useRouter } from "next/navigation"
import { Search, X } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ROLES, ROLE_LABELS, TARIFFS, TARIFF_LABELS } from "@/lib/constants"

export function StudentsFilters({ q, role, tariff, status }: { q: string; role: string; tariff: string; status: string }) {
  const router = useRouter()

  function update(next: Partial<{ q: string; role: string; tariff: string; status: string }>) {
    const merged = { q, role, tariff, status, ...next }
    const sp = new URLSearchParams()
    if (merged.q) sp.set("q", merged.q)
    if (merged.role !== "all") sp.set("role", merged.role)
    if (merged.tariff !== "all") sp.set("tariff", merged.tariff)
    if (merged.status !== "all") sp.set("status", merged.status)
    router.push(`/admin/students${sp.size ? `?${sp}` : ""}`)
  }

  const dirty = q || role !== "all" || tariff !== "all" || status !== "all"

  return (
    <form
      className="flex flex-wrap items-center gap-2"
      onSubmit={(e) => {
        e.preventDefault()
        const fd = new FormData(e.currentTarget)
        update({ q: String(fd.get("q") ?? "") })
      }}
    >
      <div className="relative flex-1 min-w-56">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input name="q" defaultValue={q} placeholder="Имя или email…" className="pl-9" aria-label="Поиск учеников" />
      </div>
      <Select value={role} onValueChange={(v) => update({ role: v })}>
        <SelectTrigger className="w-40" aria-label="Роль">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Все роли</SelectItem>
          {ROLES.map((r) => (
            <SelectItem key={r} value={r}>
              {ROLE_LABELS[r]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select value={tariff} onValueChange={(v) => update({ tariff: v })}>
        <SelectTrigger className="w-36" aria-label="Тариф">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Все тарифы</SelectItem>
          {TARIFFS.map((t) => (
            <SelectItem key={t} value={t}>
              {TARIFF_LABELS[t]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select value={status} onValueChange={(v) => update({ status: v })}>
        <SelectTrigger className="w-40" aria-label="Статус">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Любой статус</SelectItem>
          <SelectItem value="active">Активные</SelectItem>
          <SelectItem value="banned">Заблокированные</SelectItem>
        </SelectContent>
      </Select>
      <Button type="submit" variant="secondary">
        Найти
      </Button>
      {dirty && (
        <Button type="button" variant="ghost" size="icon" onClick={() => router.push("/admin/students")} aria-label="Сбросить фильтры">
          <X />
        </Button>
      )}
    </form>
  )
}
