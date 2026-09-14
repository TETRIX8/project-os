"use client"

import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts"
import { ChartContainer, ChartLegend, ChartLegendContent, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart"

const config = {
  submissions: { label: "Отправлено заданий", color: "var(--chart-1)" },
  reviews: { label: "Проверок", color: "var(--chart-2)" },
  registrations: { label: "Регистраций", color: "var(--chart-3)" },
} satisfies ChartConfig

const fmt = new Intl.DateTimeFormat("ru-RU", { day: "numeric", month: "short" })

export function ActivityChart({ data }: { data: { day: string; submissions: number; registrations: number; reviews: number }[] }) {
  return (
    <ChartContainer config={config} className="h-64 w-full">
      <AreaChart data={data} margin={{ left: -20, right: 8, top: 8 }}>
        <defs>
          {(["submissions", "reviews", "registrations"] as const).map((k) => (
            <linearGradient key={k} id={`fill-${k}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={`var(--color-${k})`} stopOpacity={0.4} />
              <stop offset="95%" stopColor={`var(--color-${k})`} stopOpacity={0} />
            </linearGradient>
          ))}
        </defs>
        <CartesianGrid vertical={false} strokeDasharray="3 3" />
        <XAxis dataKey="day" tickLine={false} axisLine={false} tickMargin={8} minTickGap={24} tickFormatter={(v) => fmt.format(new Date(v))} />
        <YAxis tickLine={false} axisLine={false} allowDecimals={false} />
        <ChartTooltip content={<ChartTooltipContent labelFormatter={(v) => fmt.format(new Date(v as string))} />} />
        <Area dataKey="submissions" type="monotone" stroke="var(--color-submissions)" fill="url(#fill-submissions)" strokeWidth={2} />
        <Area dataKey="reviews" type="monotone" stroke="var(--color-reviews)" fill="url(#fill-reviews)" strokeWidth={2} />
        <Area dataKey="registrations" type="monotone" stroke="var(--color-registrations)" fill="url(#fill-registrations)" strokeWidth={2} />
        <ChartLegend content={<ChartLegendContent />} />
      </AreaChart>
    </ChartContainer>
  )
}
