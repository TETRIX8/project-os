"use client"

import { Cell, Pie, PieChart } from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart"
import { TARIFF_LABELS, TARIFFS } from "@/lib/constants"

const config = {
  base: { label: "Base", color: "var(--chart-3)" },
  pro: { label: "Pro", color: "var(--chart-2)" },
  vip: { label: "VIP", color: "var(--chart-1)" },
} satisfies ChartConfig

export function TariffDonut({ data }: { data: Record<string, number> }) {
  const rows = TARIFFS.map((t) => ({ key: t, name: TARIFF_LABELS[t], value: data[t] ?? 0 }))
  const total = rows.reduce((s, r) => s + r.value, 0)

  return (
    <div className="flex flex-col items-center gap-4">
      <ChartContainer config={config} className="aspect-square h-44">
        <PieChart>
          <ChartTooltip content={<ChartTooltipContent nameKey="key" hideLabel />} />
          <Pie data={rows} dataKey="value" nameKey="key" innerRadius={52} outerRadius={78} strokeWidth={2} stroke="var(--card)">
            {rows.map((r) => (
              <Cell key={r.key} fill={`var(--color-${r.key})`} />
            ))}
          </Pie>
        </PieChart>
      </ChartContainer>
      <ul className="flex w-full flex-col gap-2">
        {rows.map((r) => (
          <li key={r.key} className="flex items-center gap-3 text-sm">
            <span className="size-2.5 rounded-full" style={{ background: config[r.key].color }} aria-hidden />
            <span className="flex-1">{r.name}</span>
            <span className="font-mono tabular-nums">{r.value}</span>
            <span className="w-10 text-right font-mono text-xs text-muted-foreground tabular-nums">
              {total ? Math.round((r.value / total) * 100) : 0}%
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}
