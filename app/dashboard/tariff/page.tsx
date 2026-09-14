import type { Metadata } from "next"
import { requireUserPage } from "@/lib/rbac"
import { PageHeader } from "@/components/shell/page-header"
import { TariffCards } from "@/components/marketing/tariff-cards"

export const metadata: Metadata = { title: "Тариф" }

export default async function TariffPage() {
  const user = await requireUserPage()
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Тариф"
        description="Тариф определяет доступ к урокам и материалам. Для смены тарифа напишите в поддержку — менеджер переключит вас в течение рабочего дня."
      />
      <TariffCards current={user.tariff} ctaHref="/dashboard/support" ctaLabel="Написать в поддержку" />
    </div>
  )
}
