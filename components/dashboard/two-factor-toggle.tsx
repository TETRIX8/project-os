"use client"

import { useState, useTransition } from "react"
import { ShieldCheck } from "lucide-react"
import { toast } from "sonner"
import { toggleTwoFactor } from "@/app/actions/student"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"

export function TwoFactorToggle({ enabled }: { enabled: boolean }) {
  const [on, setOn] = useState(enabled)
  const [pending, start] = useTransition()

  return (
    <section aria-labelledby="2fa-heading" className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-6">
      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h2 id="2fa-heading" className="flex items-center gap-2 font-semibold">
            <ShieldCheck className="size-4 text-muted-foreground" /> Двухфакторная защита
          </h2>
          <p className="text-xs text-muted-foreground text-pretty">
            Дополнительный код при входе с нового устройства. Рекомендуем включить для тарифов Pro и VIP.
          </p>
        </div>
        <Label className="flex items-center gap-2">
          <span className="sr-only">Включить двухфакторную защиту</span>
          <Switch
            checked={on}
            disabled={pending}
            onCheckedChange={(v) => {
              const next = Boolean(v)
              setOn(next)
              start(async () => {
                const res = await toggleTwoFactor(next)
                if (res.ok) toast.success(next ? "2FA включена" : "2FA выключена")
                else {
                  setOn(!next)
                  toast.error(res.error)
                }
              })
            }}
          />
        </Label>
      </div>
    </section>
  )
}
