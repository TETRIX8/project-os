import type { Metadata } from "next"
import { FolderOpen } from "lucide-react"
import { hasPermission, requirePermissionPage } from "@/lib/rbac"
import { getAllMaterials } from "@/lib/queries/admin"
import { PageHeader } from "@/components/shell/page-header"
import { TariffBadge } from "@/components/status-badge"
import { EmptyState } from "@/components/empty-state"
import { MaterialDialog } from "@/components/admin/material-dialog"
import { MaterialDelete } from "@/components/admin/material-delete"
import { MATERIAL_CATEGORY_LABELS, type MaterialCategory, type Tariff } from "@/lib/constants"

export const metadata: Metadata = { title: "Материалы" }

export default async function MaterialsAdminPage() {
  const user = await requirePermissionPage("content.view")
  const rows = await getAllMaterials()
  const canEdit = hasPermission(user.role, "content.edit")
  const canDelete = hasPermission(user.role, "content.delete")

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Материалы"
        description="Шаблоны, гайды и чек-листы. Доступ ограничивается минимальным тарифом."
        actions={canEdit ? <MaterialDialog /> : undefined}
      />

      {rows.length === 0 ? (
        <EmptyState icon={FolderOpen} title="Материалов пока нет" description="Добавьте первый шаблон или гайд." />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-border bg-card">
          <table className="w-full text-sm">
            <thead className="border-b border-border bg-muted/40 text-left text-xs text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-medium">Название</th>
                <th className="hidden px-4 py-3 font-medium sm:table-cell">Категория</th>
                <th className="hidden px-4 py-3 font-medium md:table-cell">Тариф</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {rows.map((m) => (
                <tr key={m.id} className="transition-colors hover:bg-muted/30">
                  <td className="px-4 py-3">
                    <div className="flex flex-col">
                      <span className="font-medium">{m.title}</span>
                      {m.description && <span className="line-clamp-1 text-xs text-muted-foreground">{m.description}</span>}
                    </div>
                  </td>
                  <td className="hidden px-4 py-3 text-muted-foreground sm:table-cell">{MATERIAL_CATEGORY_LABELS[m.category as MaterialCategory] ?? m.category}</td>
                  <td className="hidden px-4 py-3 md:table-cell">
                    <TariffBadge tariff={m.minTariff as Tariff} />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      {canEdit && <MaterialDialog material={m} />}
                      {canDelete && <MaterialDelete id={m.id} title={m.title} />}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
