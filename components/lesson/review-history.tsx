import { CheckCircle2, History, RotateCcw } from "lucide-react"
import { formatDateTime } from "@/lib/format"
import { cn } from "@/lib/utils"

export type ReviewItem = {
  id: number
  action: string
  comment: string | null
  grade: number | null
  version: number
  createdAt: Date
  curatorName: string | null
}

export function ReviewHistory({ reviews, compact = false }: { reviews: ReviewItem[]; compact?: boolean }) {
  if (!reviews.length) return null
  return (
    <section aria-labelledby="history-heading" className={cn("flex flex-col gap-4", !compact && "rounded-2xl border border-border bg-card p-5")}>
      <div className="flex items-center gap-2">
        <History className="size-4 text-muted-foreground" />
        <h2 id="history-heading" className="font-semibold">
          История проверок
        </h2>
      </div>
      <ol className="flex flex-col gap-4">
        {reviews.map((r) => {
          const ok = r.action === "accept"
          return (
            <li key={r.id} className="flex gap-3">
              <span className={cn("mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full", ok ? "bg-success/15 text-success" : "bg-destructive/15 text-destructive")}>
                {ok ? <CheckCircle2 className="size-3.5" /> : <RotateCcw className="size-3.5" />}
              </span>
              <div className="flex min-w-0 flex-1 flex-col gap-1">
                <div className="flex flex-wrap items-center gap-x-2 text-xs text-muted-foreground">
                  <span className={cn("font-medium", ok ? "text-success" : "text-destructive")}>{ok ? "Принято" : "На доработку"}</span>
                  <span aria-hidden>·</span>
                  <span>{r.curatorName ?? "Куратор"}</span>
                  <span aria-hidden>·</span>
                  <span>v{r.version}</span>
                  {r.grade != null && (
                    <>
                      <span aria-hidden>·</span>
                      <span>{r.grade}/10</span>
                    </>
                  )}
                  <span className="ml-auto">{formatDateTime(r.createdAt)}</span>
                </div>
                {r.comment && <p className="text-sm leading-relaxed text-pretty">{r.comment}</p>}
              </div>
            </li>
          )
        })}
      </ol>
    </section>
  )
}
