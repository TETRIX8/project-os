"use client"

import { useEffect, useRef, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { CheckCircle2, ClipboardList, Loader2, Save, Send } from "lucide-react"
import { saveDraft, submitAssignment } from "@/app/actions/student"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { StatusBadge } from "@/components/status-badge"
import { DEFAULT_FIELDS, FIELD_TEMPLATES, type AssignmentFormat, type SubmissionStatus } from "@/lib/constants"
import { formatDateTime } from "@/lib/format"

type Submission = {
  status: SubmissionStatus
  contentText: string | null
  contentLink: string | null
  fields: Record<string, string>
  version: number
  grade: number | null
  submittedAt: Date | null
}

export function AssignmentForm({
  lessonId,
  format,
  assignment,
  submission,
  watched,
}: {
  lessonId: number
  format: AssignmentFormat
  assignment: string | null
  submission: Submission | null
  watched: boolean
}) {
  const router = useRouter()
  const [pending, start] = useTransition()
  const [text, setText] = useState(submission?.contentText ?? "")
  const [link, setLink] = useState(submission?.contentLink ?? "")
  const [fields, setFields] = useState<Record<string, string>>(submission?.fields ?? {})
  const [dirty, setDirty] = useState(false)
  const [savedAt, setSavedAt] = useState<Date | null>(null)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const status = submission?.status ?? "not_submitted"
  const locked = status === "pending" || status === "accepted"
  const template = FIELD_TEMPLATES[lessonId] ?? DEFAULT_FIELDS

  // Debounced autosave of drafts while the student types.
  useEffect(() => {
    if (!dirty || locked) return
    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(async () => {
      const res = await saveDraft({ lessonId, contentText: text, contentLink: link, fields })
      if (res.ok) {
        setSavedAt(new Date())
        setDirty(false)
      }
    }, 1500)
    return () => {
      if (timer.current) clearTimeout(timer.current)
    }
  }, [text, link, fields, dirty, locked, lessonId])

  function submit() {
    start(async () => {
      const res = await submitAssignment({ lessonId, contentText: text, contentLink: link, fields })
      if (res.ok) {
        toast.success("Задание отправлено на проверку")
        router.refresh()
      } else toast.error(res.error)
    })
  }

  function saveNow() {
    start(async () => {
      const res = await saveDraft({ lessonId, contentText: text, contentLink: link, fields })
      if (res.ok) {
        setSavedAt(new Date())
        setDirty(false)
        toast.success("Черновик сохранён")
      } else toast.error(res.error)
    })
  }

  return (
    <section aria-labelledby="assignment-heading" className="flex flex-col gap-5 rounded-2xl border border-border bg-card p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <ClipboardList className="size-4 text-primary" />
          <h2 id="assignment-heading" className="font-semibold">
            Задание
          </h2>
        </div>
        <StatusBadge status={status} />
      </div>

      {assignment && <p className="text-sm leading-relaxed text-pretty">{assignment}</p>}

      {status === "accepted" ? (
        <div className="flex flex-col gap-2 rounded-xl border border-success/30 bg-success/10 p-4">
          <div className="flex items-center gap-2 text-success">
            <CheckCircle2 className="size-4" />
            <p className="text-sm font-medium">Задание принято</p>
          </div>
          {submission?.grade != null && <p className="text-sm">Оценка: {submission.grade}/10</p>}
          <p className="text-xs text-muted-foreground">Отправлено {formatDateTime(submission?.submittedAt)}</p>
        </div>
      ) : status === "pending" ? (
        <div className="flex flex-col gap-1 rounded-xl border border-warning/30 bg-warning/10 p-4">
          <p className="text-sm font-medium text-warning">На проверке</p>
          <p className="text-xs text-muted-foreground">
            Куратор проверит работу в течение 1–2 рабочих дней. Отправлено {formatDateTime(submission?.submittedAt)}
            {submission && submission.version > 1 ? ` · версия ${submission.version}` : ""}.
          </p>
        </div>
      ) : null}

      {!locked && (
        <div className="flex flex-col gap-4">
          {status === "needs_revision" && (
            <p className="rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
              Куратор запросил доработку. Внесите правки и отправьте версию {submission ? submission.version + 1 : 2}.
            </p>
          )}

          {!watched && status === "not_submitted" && (
            <p className="text-xs text-muted-foreground">Совет: сначала посмотрите урок — так задание будет проще.</p>
          )}

          {format === "text" && (
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="answer">Ваш ответ</Label>
              <Textarea
                id="answer"
                rows={8}
                value={text}
                onChange={(e) => {
                  setText(e.target.value)
                  setDirty(true)
                }}
                placeholder="Опишите результат подробно: что сделали, какие выводы, что не получилось."
                className="min-h-40 resize-y"
              />
              <p className="text-right text-[11px] text-muted-foreground tabular-nums">{text.length} симв.</p>
            </div>
          )}

          {(format === "link" || format === "file") && (
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="link">{format === "file" ? "Ссылка на файл (Google Drive, Figma, GitHub…)" : "Ссылка на результат"}</Label>
              <Input
                id="link"
                type="url"
                inputMode="url"
                value={link}
                onChange={(e) => {
                  setLink(e.target.value)
                  setDirty(true)
                }}
                placeholder="https://"
              />
              <Label htmlFor="comment" className="mt-2">
                Комментарий (необязательно)
              </Label>
              <Textarea
                id="comment"
                rows={3}
                value={text}
                onChange={(e) => {
                  setText(e.target.value)
                  setDirty(true)
                }}
                placeholder="Что важно знать куратору"
              />
            </div>
          )}

          {format === "fields" && (
            <div className="flex flex-col gap-3">
              {template.map((f) => (
                <div key={f.key} className="flex flex-col gap-1.5">
                  <Label htmlFor={`f-${f.key}`}>{f.label}</Label>
                  <Textarea
                    id={`f-${f.key}`}
                    rows={2}
                    value={fields[f.key] ?? ""}
                    onChange={(e) => {
                      setFields((prev) => ({ ...prev, [f.key]: e.target.value }))
                      setDirty(true)
                    }}
                    className="min-h-16"
                  />
                </div>
              ))}
            </div>
          )}

          <div className="flex flex-col gap-2 border-t border-border pt-4">
            <div className="flex flex-wrap items-center gap-2">
              <Button onClick={submit} disabled={pending} className="flex-1">
                {pending ? <Loader2 className="animate-spin" /> : <Send />}
                Отправить на проверку
              </Button>
              <Button onClick={saveNow} disabled={pending} variant="outline" aria-label="Сохранить черновик">
                <Save />
              </Button>
            </div>
            <p className="text-[11px] text-muted-foreground">
              {dirty ? "Есть несохранённые изменения…" : savedAt ? `Черновик сохранён ${formatDateTime(savedAt)}` : "Черновик сохраняется автоматически"}
            </p>
          </div>
        </div>
      )}
    </section>
  )
}
