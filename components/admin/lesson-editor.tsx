"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Loader2, Save } from "lucide-react"
import { toast } from "sonner"
import { saveLesson } from "@/app/actions/admin"
import { PageHeader } from "@/components/shell/page-header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ASSIGNMENT_FORMATS, ASSIGNMENT_FORMAT_LABELS, TARIFFS, TARIFF_LABELS, type AssignmentFormat, type Tariff } from "@/lib/constants"

type Level = { id: number; order: number; title: string }
type Lesson = {
  id: number
  levelId: number
  order: number
  title: string
  description: string | null
  goal: string | null
  notes: string | null
  videoUrl: string | null
  coverUrl: string | null
  durationMin: number
  assignment: string | null
  assignmentFormat: string
  minTariff: string
  published: boolean
}

export function LessonEditor({ levels, lesson }: { levels: Level[]; lesson: Lesson | null }) {
  const router = useRouter()
  const [pending, start] = useTransition()
  const [form, setForm] = useState({
    levelId: lesson?.levelId ?? levels[0]?.id ?? 1,
    order: lesson?.order ?? 1,
    title: lesson?.title ?? "",
    description: lesson?.description ?? "",
    goal: lesson?.goal ?? "",
    notes: lesson?.notes ?? "",
    videoUrl: lesson?.videoUrl ?? "",
    coverUrl: lesson?.coverUrl ?? "",
    durationMin: lesson?.durationMin ?? 15,
    assignment: lesson?.assignment ?? "",
    assignmentFormat: (lesson?.assignmentFormat ?? "text") as AssignmentFormat,
    minTariff: (lesson?.minTariff ?? "base") as Tariff,
    published: lesson?.published ?? false,
  })

  const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) => setForm((f) => ({ ...f, [k]: v }))

  return (
    <form
      className="flex flex-col gap-6"
      onSubmit={(e) => {
        e.preventDefault()
        start(async () => {
          const res = await saveLesson({ id: lesson?.id, ...form })
          if (res.ok) {
            toast.success(lesson ? "Урок сохранён" : "Урок создан")
            if (!lesson && res.data?.id) router.replace(`/admin/content/lessons/${res.data.id}`)
            router.refresh()
          } else toast.error(res.error)
        })
      }}
    >
      <PageHeader
        eyebrow={lesson ? `Урок #${lesson.id}` : "Новый урок"}
        title={form.title || "Без названия"}
        actions={
          <Button type="submit" disabled={pending}>
            {pending ? <Loader2 className="animate-spin" /> : <Save />}
            Сохранить
          </Button>
        }
      />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="flex flex-col gap-6">
          <Card title="Основное">
            <div className="grid gap-4 sm:grid-cols-[1fr_120px]">
              <Field id="title" label="Название">
                <Input id="title" value={form.title} onChange={(e) => set("title", e.target.value)} required minLength={3} maxLength={200} />
              </Field>
              <Field id="order" label="Порядок">
                <Input id="order" type="number" min={1} max={999} value={form.order} onChange={(e) => set("order", Number(e.target.value))} required />
              </Field>
            </div>
            <Field id="description" label="Короткое описание" hint="1–2 предложения для карты курса">
              <Textarea id="description" rows={2} value={form.description} onChange={(e) => set("description", e.target.value)} maxLength={2000} />
            </Field>
            <Field id="goal" label="Цель урока" hint="Что ученик сможет после просмотра">
              <Textarea id="goal" rows={2} value={form.goal} onChange={(e) => set("goal", e.target.value)} maxLength={1000} />
            </Field>
          </Card>

          <Card title="Видео и обложка">
            <Field id="videoUrl" label="Ссылка на видео" hint="YouTube, Vimeo, Kinescope или прямой .mp4">
              <Input id="videoUrl" type="url" value={form.videoUrl} onChange={(e) => set("videoUrl", e.target.value)} placeholder="https://" />
            </Field>
            <div className="grid gap-4 sm:grid-cols-[1fr_140px]">
              <Field id="coverUrl" label="Обложка (URL)">
                <Input id="coverUrl" type="url" value={form.coverUrl} onChange={(e) => set("coverUrl", e.target.value)} placeholder="https://" />
              </Field>
              <Field id="durationMin" label="Длительность, мин">
                <Input id="durationMin" type="number" min={0} max={600} value={form.durationMin} onChange={(e) => set("durationMin", Number(e.target.value))} />
              </Field>
            </div>
          </Card>

          <Card title="Конспект">
            <Field id="notes" label="Текст конспекта" hint="Поддерживаются абзацы и списки через дефис">
              <Textarea id="notes" rows={12} value={form.notes} onChange={(e) => set("notes", e.target.value)} maxLength={50000} className="font-mono text-sm" />
            </Field>
          </Card>

          <Card title="Задание">
            <Field id="assignment" label="Условие задания">
              <Textarea id="assignment" rows={6} value={form.assignment} onChange={(e) => set("assignment", e.target.value)} maxLength={5000} />
            </Field>
            <Field id="assignmentFormat" label="Формат ответа">
              <Select value={form.assignmentFormat} onValueChange={(v) => set("assignmentFormat", v as AssignmentFormat)}>
                <SelectTrigger id="assignmentFormat">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ASSIGNMENT_FORMATS.map((f) => (
                    <SelectItem key={f} value={f}>
                      {ASSIGNMENT_FORMAT_LABELS[f]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          </Card>
        </div>

        <aside className="flex flex-col gap-6">
          <Card title="Публикация">
            <div className="flex items-center justify-between gap-4">
              <Label htmlFor="published" className="flex flex-col gap-0.5">
                <span>Опубликован</span>
                <span className="text-xs font-normal text-muted-foreground">Виден ученикам</span>
              </Label>
              <Switch id="published" checked={form.published} onCheckedChange={(v) => set("published", Boolean(v))} />
            </div>
          </Card>
          <Card title="Доступ">
            <Field id="levelId" label="Уровень">
              <Select value={String(form.levelId)} onValueChange={(v) => set("levelId", Number(v))}>
                <SelectTrigger id="levelId">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {levels.map((l) => (
                    <SelectItem key={l.id} value={String(l.id)}>
                      {l.order}. {l.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field id="minTariff" label="Минимальный тариф">
              <Select value={form.minTariff} onValueChange={(v) => set("minTariff", v as Tariff)}>
                <SelectTrigger id="minTariff">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TARIFFS.map((t) => (
                    <SelectItem key={t} value={t}>
                      {TARIFF_LABELS[t]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          </Card>
        </aside>
      </div>
    </form>
  )
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-6">
      <h2 className="font-semibold">{title}</h2>
      {children}
    </section>
  )
}

function Field({ id, label, hint, children }: { id: string; label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={id}>{label}</Label>
      {children}
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  )
}
