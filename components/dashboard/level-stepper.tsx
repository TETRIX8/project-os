import Link from "next/link"
import { Check, Lock } from "lucide-react"
import type { LevelWithLessons } from "@/lib/queries/course"
import { cn } from "@/lib/utils"

export function LevelStepper({ levels }: { levels: LevelWithLessons[] }) {
  return (
    <ol className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
      {levels.map((lvl) => {
        const state = lvl.completed ? "done" : lvl.unlocked ? "active" : "locked"
        const inner = (
          <>
            <div className="flex items-center justify-between">
              <span
                className={cn(
                  "flex size-7 items-center justify-center rounded-full font-mono text-xs font-semibold",
                  state === "done" && "bg-success text-success-foreground",
                  state === "active" && "bg-primary text-primary-foreground",
                  state === "locked" && "bg-muted text-muted-foreground",
                )}
              >
                {state === "done" ? <Check className="size-3.5" /> : state === "locked" ? <Lock className="size-3" /> : lvl.order}
              </span>
              <span className="font-mono text-xs text-muted-foreground tabular-nums">
                {lvl.acceptedCount}/{lvl.lessons.length}
              </span>
            </div>
            <div className="flex flex-col gap-0.5">
              <p className="text-sm font-medium leading-tight">{lvl.title}</p>
              {lvl.subtitle && <p className="text-xs text-muted-foreground line-clamp-2">{lvl.subtitle}</p>}
            </div>
            <div className="mt-auto flex gap-1" aria-hidden>
              {lvl.lessons.map((l) => (
                <span
                  key={l.id}
                  className={cn(
                    "h-1 flex-1 rounded-full",
                    l.status === "accepted"
                      ? "bg-success"
                      : l.status === "pending"
                        ? "bg-warning"
                        : l.status === "needs_revision"
                          ? "bg-destructive"
                          : "bg-muted",
                  )}
                />
              ))}
            </div>
          </>
        )
        const cls = cn(
          "flex h-full flex-col gap-3 rounded-xl border p-4 transition-colors",
          state === "active" && "border-primary/40 bg-primary/5 hover:bg-primary/10",
          state === "done" && "border-success/30 bg-success/5 hover:bg-success/10",
          state === "locked" && "border-border bg-surface/50 opacity-70",
        )
        return (
          <li key={lvl.id} className="min-h-36">
            {state === "locked" ? (
              <div className={cls} aria-label={`${lvl.title}: закрыт`}>
                {inner}
              </div>
            ) : (
              <Link href={`/dashboard/program#level-${lvl.id}`} className={cls}>
                {inner}
              </Link>
            )}
          </li>
        )
      })}
    </ol>
  )
}
