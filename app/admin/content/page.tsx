import type { Metadata } from "next"
import Link from "next/link"
import { Archive, Clock, Eye, EyeOff, Pencil, Plus } from "lucide-react"
import { hasPermission, requirePermissionPage } from "@/lib/rbac"
import { getContentTree } from "@/lib/queries/admin"
import { PageHeader } from "@/components/shell/page-header"
import { TariffBadge } from "@/components/status-badge"
import { LinkButton } from "@/components/ui/link-button"
import { LevelEditor } from "@/components/admin/level-editor"
import { LessonRowActions } from "@/components/admin/lesson-row-actions"
import { FORMAT_LABELS, type AssignmentFormat, type Tariff } from "@/lib/constants"
import { cn } from "@/lib/utils"

export const metadata: Metadata = { title: "Контент курса" }

export default async function ContentPage() {
  const user = await requirePermissionPage("content.view")
  const tree = await getContentTree()
  const canEdit = hasPermission(user.role, "content.edit")
  const canPublish = hasPermission(user.role, "content.publish")
  const canDelete = hasPermission(user.role, "content.delete")
  const total = tree.reduce((s, l) => s + l.lessons.filter((x) => !x.archived).length, 0)
  const published = tree.reduce((s, l) => s + l.lessons.filter((x) => x.published && !x.archived).length, 0)

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Контент курса"
        description={`${published} из ${total} уроков опубликовано. Уроки не удаляются — только архивируются.`}
        actions={
          canEdit ? (
            <LinkButton href="/admin/content/lessons/new">
              <Plus /> Новый урок
            </LinkButton>
          ) : undefined
        }
      />

      <div className="flex flex-col gap-6">
        {tree.map((lvl) => (
          <section key={lvl.id} aria-labelledby={`lvl-${lvl.id}`} className="overflow-hidden rounded-2xl border border-border bg-card">
            <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border bg-muted/30 px-5 py-4">
              <div className="flex items-start gap-3">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/15 font-mono text-sm font-semibold text-primary">
                  {lvl.order}
                </span>
                <div className="flex flex-col gap-0.5">
                  <h2 id={`lvl-${lvl.id}`} className="font-semibold">
                    {lvl.title}
                  </h2>
                  {lvl.subtitle && <p className="text-sm text-muted-foreground">{lvl.subtitle}</p>}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs text-muted-foreground tabular-nums">{lvl.lessons.filter((l) => !l.archived).length} уроков</span>
                {canEdit && <LevelEditor level={lvl} />}
              </div>
            </div>

            {lvl.lessons.length === 0 ? (
              <p className="px-5 py-8 text-center text-sm text-muted-foreground">В этом уровне пока нет уроков.</p>
            ) : (
              <ul className="divide-y divide-border">
                {lvl.lessons.map((l) => (
                  <li key={l.id} className={cn("flex items-center gap-4 px-5 py-3", l.archived && "opacity-50")}>
                    <span className="font-mono text-xs text-muted-foreground tabular-nums">{String(l.order).padStart(2, "0")}</span>
                    <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                      <div className="flex items-center gap-2">
                        <Link href={`/admin/content/lessons/${l.id}`} className="truncate text-sm font-medium hover:underline underline-offset-4">
                          {l.title}
                        </Link>
                        {l.archived && (
                          <span className="inline-flex items-center gap-1 rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                            <Archive className="size-3" /> Архив
                          </span>
                        )}
                        {!l.archived && !l.published && (
                          <span className="inline-flex items-center gap-1 rounded bg-warning/15 px-1.5 py-0.5 text-[10px] font-medium text-warning">
                            <EyeOff className="size-3" /> Скрыт
                          </span>
                        )}
                      </div>
                      <p className="flex flex-wrap items-center gap-x-3 text-xs text-muted-foreground">
                        <span className="inline-flex items-center gap-1">
                          <Clock className="size-3" /> {l.durationMin} мин
                        </span>
                        <span>{FORMAT_LABELS[l.assignmentFormat as AssignmentFormat]}</span>
                        {!l.videoUrl && <span className="text-warning">нет видео</span>}
                      </p>
                    </div>
                    <TariffBadge tariff={l.minTariff as Tariff} className="hidden sm:inline-flex" />
                    {l.published && !l.archived && <Eye className="hidden size-4 text-success sm:block" aria-label="Опубликован" />}
                    <div className="flex items-center gap-1">
                      {canEdit && (
                        <LinkButton href={`/admin/content/lessons/${l.id}`} variant="ghost" size="icon-sm" aria-label="Редактировать">
                          <Pencil />
                        </LinkButton>
                      )}
                      <LessonRowActions lessonId={l.id} published={l.published} archived={l.archived} canPublish={canPublish} canDelete={canDelete} />
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        ))}
      </div>
    </div>
  )
}
