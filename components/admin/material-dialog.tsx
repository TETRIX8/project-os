"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Loader2, Pencil, Plus } from "lucide-react"
import { toast } from "sonner"
import { saveMaterial } from "@/app/actions/admin"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { NativeSelect } from "@/components/ui/native-select"
import { MATERIAL_CATEGORIES, MATERIAL_CATEGORY_LABELS, TARIFFS, TARIFF_LABELS, type MaterialCategory, type Tariff } from "@/lib/constants"

type Material = { id: number; title: string; description: string | null; category: string; minTariff: string }

export function MaterialDialog({ material }: { material?: Material }) {
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState(material?.title ?? "")
  const [description, setDescription] = useState(material?.description ?? "")
  const [category, setCategory] = useState<MaterialCategory>((material?.category as MaterialCategory) ?? "template")
  const [minTariff, setMinTariff] = useState<Tariff>((material?.minTariff as Tariff) ?? "base")
  const [pending, start] = useTransition()
  const router = useRouter()

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {material ? (
        <DialogTrigger render={<Button variant="ghost" size="icon-sm" aria-label="Редактировать материал" />}>
          <Pencil />
        </DialogTrigger>
      ) : (
        <DialogTrigger render={<Button />}>
          <Plus /> Добавить материал
        </DialogTrigger>
      )}
      <DialogContent>
        <form
          className="flex flex-col gap-5"
          onSubmit={(e) => {
            e.preventDefault()
            start(async () => {
              const res = await saveMaterial({ id: material?.id, title, description, category, minTariff })
              if (res.ok) {
                toast.success(material ? "Материал сохранён" : "Материал добавлен")
                setOpen(false)
                if (!material) {
                  setTitle("")
                  setDescription("")
                }
                router.refresh()
              } else toast.error(res.error)
            })
          }}
        >
          <DialogHeader>
            <DialogTitle>{material ? "Редактировать материал" : "Новый материал"}</DialogTitle>
            <DialogDescription>Файл прикрепляется позже через хранилище — здесь только карточка.</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="m-title">Название</Label>
            <Input id="m-title" value={title} onChange={(e) => setTitle(e.target.value)} required minLength={2} maxLength={200} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="m-desc">Описание</Label>
            <Textarea id="m-desc" rows={3} value={description} onChange={(e) => setDescription(e.target.value)} maxLength={1000} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="m-cat">Категория</Label>
              <NativeSelect id="m-cat" value={category} onChange={(e) => setCategory(e.target.value as MaterialCategory)}>
                {MATERIAL_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {MATERIAL_CATEGORY_LABELS[c]}
                  </option>
                ))}
              </NativeSelect>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="m-tariff">Минимальный тариф</Label>
              <NativeSelect id="m-tariff" value={minTariff} onChange={(e) => setMinTariff(e.target.value as Tariff)}>
                {TARIFFS.map((t) => (
                  <option key={t} value={t}>
                    {TARIFF_LABELS[t]}
                  </option>
                ))}
              </NativeSelect>
            </div>
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
