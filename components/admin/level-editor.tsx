"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Loader2, Pencil } from "lucide-react"
import { toast } from "sonner"
import { saveLevel } from "@/app/actions/admin"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

type Level = { id: number; order: number; title: string; subtitle: string | null; description: string | null }

export function LevelEditor({ level }: { level: Level }) {
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState(level.title)
  const [subtitle, setSubtitle] = useState(level.subtitle ?? "")
  const [description, setDescription] = useState(level.description ?? "")
  const [pending, start] = useTransition()
  const router = useRouter()

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon-sm" aria-label="Редактировать уровень">
          <Pencil />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <form
          className="flex flex-col gap-5"
          onSubmit={(e) => {
            e.preventDefault()
            start(async () => {
              const res = await saveLevel({ id: level.id, title, subtitle, description })
              if (res.ok) {
                toast.success("Уровень сохранён")
                setOpen(false)
                router.refresh()
              } else toast.error(res.error)
            })
          }}
        >
          <DialogHeader>
            <DialogTitle>Уровень {level.order}</DialogTitle>
            <DialogDescription>Название и подзаголовок видны ученикам на карте курса.</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="lvl-title">Название</Label>
            <Input id="lvl-title" value={title} onChange={(e) => setTitle(e.target.value)} required minLength={2} maxLength={120} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="lvl-subtitle">Подзаголовок</Label>
            <Input id="lvl-subtitle" value={subtitle} onChange={(e) => setSubtitle(e.target.value)} maxLength={120} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="lvl-desc">Описание</Label>
            <Textarea id="lvl-desc" rows={3} value={description} onChange={(e) => setDescription(e.target.value)} maxLength={1000} />
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
              Отмена
            </Button>
            <Button type="submit" disabled={pending}>
              {pending && <Loader2 className="animate-spin" />}
              Сохранить
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
