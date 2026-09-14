"use client"

import { useTransition } from "react"
import { useRouter } from "next/navigation"
import { Archive, ArchiveRestore, Eye, EyeOff, Loader2, MoreHorizontal } from "lucide-react"
import { toast } from "sonner"
import { archiveLesson, setLessonPublished } from "@/app/actions/admin"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

export function LessonRowActions({
  lessonId,
  published,
  archived,
  canPublish,
  canDelete,
}: {
  lessonId: number
  published: boolean
  archived: boolean
  canPublish: boolean
  canDelete: boolean
}) {
  const [pending, start] = useTransition()
  const router = useRouter()

  if (!canPublish && !canDelete) return null

  function run(p: Promise<{ ok: boolean; error?: string }>, msg: string) {
    start(async () => {
      const res = await p
      if (res.ok) {
        toast.success(msg)
        router.refresh()
      } else toast.error(res.error ?? "Ошибка")
    })
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={<Button variant="ghost" size="icon-sm" disabled={pending} aria-label="Действия с уроком" />}>
        {pending ? <Loader2 className="animate-spin" /> : <MoreHorizontal />}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {canPublish && !archived && (
          <DropdownMenuItem onClick={() => run(setLessonPublished(lessonId, !published), published ? "Урок скрыт" : "Урок опубликован")}>
            {published ? <EyeOff /> : <Eye />}
            {published ? "Скрыть от учеников" : "Опубликовать"}
          </DropdownMenuItem>
        )}
        {canPublish && canDelete && !archived && <DropdownMenuSeparator />}
        {canDelete && (
          <DropdownMenuItem
            variant={archived ? "default" : "destructive"}
            onClick={() => run(archiveLesson(lessonId, !archived), archived ? "Урок восстановлен" : "Урок архивирован")}
          >
            {archived ? <ArchiveRestore /> : <Archive />}
            {archived ? "Восстановить из архива" : "В архив"}
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
