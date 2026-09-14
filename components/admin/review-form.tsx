"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Check, Loader2, RotateCcw } from "lucide-react"
import { toast } from "sonner"
import { reviewSubmission } from "@/app/actions/admin"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"

const QUICK = [
  "Отличная работа — всё по чек-листу, можно двигаться дальше.",
  "Не хватает конкретики: добавьте цифры и примеры из вашей ниши.",
  "Пересмотрите структуру: сначала боль клиента, потом решение, потом цена.",
]

export function ReviewForm({ submissionId }: { submissionId: number }) {
  const [comment, setComment] = useState("")
  const [grade, setGrade] = useState<number | null>(null)
  const [pending, start] = useTransition()
  const router = useRouter()

  function submit(action: "accept" | "revise") {
    start(async () => {
      const res = await reviewSubmission({ submissionId, action, comment, grade })
      if (res.ok) {
        toast.success(action === "accept" ? "Работа принята" : "Отправлено на доработку")
        router.push("/admin/reviews")
        router.refresh()
      } else toast.error(res.error)
    })
  }

  return (
    <section aria-labelledby="review-heading" className="flex flex-col gap-4 rounded-2xl border border-primary/30 bg-card p-5 glow-primary">
      <h2 id="review-heading" className="font-semibold">
        Решение куратора
      </h2>

      <div className="flex flex-col gap-2">
        <Label>Оценка</Label>
        <div className="grid grid-cols-10 gap-1" role="radiogroup" aria-label="Оценка от 1 до 10">
          {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
            <button
              key={n}
              type="button"
              role="radio"
              aria-checked={grade === n}
              onClick={() => setGrade(grade === n ? null : n)}
              className={cn(
                "h-8 rounded-md border text-xs font-mono tabular-nums transition-colors",
                grade === n ? "border-primary bg-primary text-primary-foreground" : "border-border bg-surface text-muted-foreground hover:border-primary/40",
              )}
            >
              {n}
            </button>
          ))}
        </div>
        <p className="text-[11px] text-muted-foreground">Необязательно. Оценка видна ученику.</p>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="comment">Комментарий</Label>
        <Textarea
          id="comment"
          rows={6}
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Что получилось, что доработать, куда смотреть дальше…"
          className="resize-y"
        />
        <div className="flex flex-wrap gap-1.5">
          {QUICK.map((q) => (
            <button
              key={q}
              type="button"
              onClick={() => setComment((c) => (c ? `${c}\n${q}` : q))}
              className="rounded-md border border-border bg-surface px-2 py-1 text-left text-[11px] text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
            >
              {q}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-2 border-t border-border pt-4">
        <Button onClick={() => submit("accept")} disabled={pending} className="w-full">
          {pending ? <Loader2 className="animate-spin" /> : <Check />}
          Принять работу
        </Button>
        <Button onClick={() => submit("revise")} disabled={pending || comment.trim().length < 10} variant="outline" className="w-full">
          <RotateCcw /> На доработку
        </Button>
        {comment.trim().length < 10 && <p className="text-center text-[11px] text-muted-foreground">Для доработки нужен комментарий от 10 символов</p>}
      </div>
    </section>
  )
}
