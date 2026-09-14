"use client"

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts"
import { ChartContainer, ChartLegend, ChartLegendContent, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart"

const config = {
  watched: { label: "Смотрели", color: "var(--chart-3)" },
  submitted: { label: "Отправили", color: "var(--chart-2)" },
  accepted: { label: "Приняли", color: "var(--chart-1)" },
} satisfies ChartConfig

type Row = { lessonId: number; order: number; title: string; watched: number; submitted: number; accepted: number }

export function FunnelChart({ data }: { data: Row[] }) {
  const rows = data.map((d) => ({ ...d, label: String(d.order).padStart(2, "0") }))
  return (
    <ChartContainer config={config} className="h-72 w-full">
      <BarChart data={rows} margin={{ left: -20, right: 8, top: 8 }} barCategoryGap="20%">
        <CartesianGrid vertical={false} strokeDasharray="3 3" />
        <XAxis dataKey="label" tickLine={false} axisLine={false} tickMargin={8} interval={0} fontSize={11} />
        <YAxis tickLine={false} axisLine={false} allowDecimals={false} />
        <ChartTooltip
          cursor={{ fill: "var(--muted)", opacity: 0.4 }}
          content={<ChartTooltipContent labelFormatter={(_, payload) => (payload?.[0]?.payload as Row | undefined)?.title ?? ""} />}
        />
        <Bar dataKey="watched" fill="var(--color-watched)" radius={[3, 3, 0, 0]} />
        <Bar dataKey="submitted" fill="var(--color-submitted)" radius={[3, 3, 0, 0]} />
        <Bar dataKey="accepted" fill="var(--color-accepted)" radius={[3, 3, 0, 0]} />
        <ChartLegend content={<ChartLegendContent />} />
      </BarChart>
    </ChartContainer>
  )
}
