"use client"

import { useState, useTransition } from "react"
import { Check, Loader2, PlayCircle } from "lucide-react"
import { toast } from "sonner"
import { markLessonWatched } from "@/app/actions/student"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export function VideoPlayer({
  embedUrl,
  coverUrl,
  lessonId,
  watched,
  title,
}: {
  embedUrl: string | null
  coverUrl: string | null
  lessonId: number
  watched: boolean
  title: string
}) {
  const [pending, start] = useTransition()
  const [done, setDone] = useState(watched)

  function mark() {
    start(async () => {
      const res = await markLessonWatched(lessonId)
      if (res.ok) {
        setDone(true)
        toast.success("Урок отмечен как просмотренный")
      } else toast.error(res.error)
    })
  }

  return (
    <section aria-label="Видео урока" className="flex flex-col gap-3">
      <div className="relative aspect-video overflow-hidden rounded-2xl border border-border bg-surface">
        {embedUrl ? (
          <iframe
            src={embedUrl}
            title={title}
            className="absolute inset-0 size-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            referrerPolicy="strict-origin-when-cross-origin"
          />
        ) : (
          <div
            className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-cover bg-center"
            style={coverUrl ? { backgroundImage: `url(${coverUrl})` } : undefined}
          >
            <div className="absolute inset-0 bg-background/60" aria-hidden />
            <PlayCircle className="relative size-14 text-muted-foreground" />
            <p className="relative text-sm text-muted-foreground">Видео появится здесь, когда его загрузит редактор</p>
          </div>
        )}
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs text-muted-foreground">
          {done ? "Вы отметили урок как просмотренный." : "Посмотрите видео и отметьте просмотр, чтобы перейти к заданию."}
        </p>
        <Button
          onClick={mark}
          disabled={pending || done}
          variant={done ? "outline" : "default"}
          size="sm"
          className={cn(done && "text-success border-success/30")}
        >
          {pending ? <Loader2 className="animate-spin" /> : <Check />}
          {done ? "Просмотрено" : "Отметить просмотренным"}
        </Button>
      </div>
    </section>
  )
}
