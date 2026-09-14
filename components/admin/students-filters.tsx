"use client"

import { useRouter } from "next/navigation"
import { Search, X } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { NativeSelect } from "@/components/ui/native-select"
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
      <div className="relative min-w-56 flex-1">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input name="q" defaultValue={q} placeholder="Имя или email…" className="pl-9" aria-label="Поиск учеников" />
      </div>
      <NativeSelect className="w-40" value={role} onChange={(e) => update({ role: e.target.value })} aria-label="Роль">
        <option value="all">Все роли</option>
        {ROLES.map((r) => (
          <option key={r} value={r}>
            {ROLE_LABELS[r]}
          </option>
        ))}
      </NativeSelect>
      <NativeSelect className="w-36" value={tariff} onChange={(e) => update({ tariff: e.target.value })} aria-label="Тариф">
        <option value="all">Все тарифы</option>
        {TARIFFS.map((t) => (
          <option key={t} value={t}>
            {TARIFF_LABELS[t]}
          </option>
        ))}
      </NativeSelect>
      <NativeSelect className="w-40" value={status} onChange={(e) => update({ status: e.target.value })} aria-label="Статус">
        <option value="all">Любой статус</option>
        <option value="active">Активные</option>
        <option value="banned">Заблокированные</option>
      </NativeSelect>
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
