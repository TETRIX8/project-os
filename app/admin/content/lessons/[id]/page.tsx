import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { asc, eq } from "drizzle-orm"
import { ArrowLeft } from "lucide-react"
import { db } from "@/lib/db"
import { lessons, levels } from "@/lib/db/schema"
import { requirePermissionPage } from "@/lib/rbac"
import { LessonEditor } from "@/components/admin/lesson-editor"

export const metadata: Metadata = { title: "Редактор урока" }

export default async function LessonEditorPage({ params }: { params: Promise<{ id: string }> }) {
  await requirePermissionPage("content.edit")
  const { id } = await params
  const isNew = id === "new"
  const numId = Number(id)
  if (!isNew && !Number.isInteger(numId)) notFound()

  const [lvls, lesson] = await Promise.all([
    db.select().from(levels).orderBy(asc(levels.order)),
    isNew ? Promise.resolve(null) : db.select().from(lessons).where(eq(lessons.id, numId)).limit(1).then((r) => r[0] ?? null),
  ])
  if (!isNew && !lesson) notFound()

  return (
    <div className="flex flex-col gap-6">
      <Link href="/admin/content" className="inline-flex w-fit items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" /> К контенту
      </Link>
      <LessonEditor levels={lvls} lesson={lesson} />
    </div>
  )
}
