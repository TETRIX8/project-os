import { Check } from "lucide-react"
import { LinkButton } from "@/components/ui/link-button"
import { TARIFF_LABELS, type Tariff } from "@/lib/constants"
import { cn } from "@/lib/utils"

const PLANS: { id: Tariff; price: string; tagline: string; features: string[]; highlight?: boolean }[] = [
  {
    id: "base",
    price: "9 900 ₽",
    tagline: "Пройти программу и получить первый заказ",
    features: ["Уровни 1–3 (13 уроков)", "Проверка заданий куратором", "Базовые шаблоны", "Доступ 6 месяцев"],
  },
  {
    id: "pro",
    price: "19 900 ₽",
    tagline: "Полная программа + шаблоны на всё",
    features: ["Все 6 уровней (25 уроков)", "Приоритетная проверка — до 24 часов", "Все шаблоны и чек-листы", "Разбор кейсов", "Доступ 12 месяцев"],
    highlight: true,
  },
  {
    id: "vip",
    price: "49 900 ₽",
    tagline: "Индивидуальная работа до первых денег",
    features: ["Всё из Pro", "Личный куратор", "3 созвона 1:1", "Разбор вашего портфолио", "Бонус: продажи на 6 месяцев вперёд", "Бессрочный доступ"],
  },
]

export function TariffCards({ current, ctaHref, ctaLabel }: { current?: Tariff; ctaHref: string; ctaLabel: string }) {
  return (
    <div className="grid gap-4 lg:grid-cols-3">
      {PLANS.map((p) => {
        const isCurrent = current === p.id
        return (
          <article
            key={p.id}
            className={cn(
              "relative flex flex-col gap-6 rounded-2xl border bg-card p-6",
              p.highlight ? "border-primary/50 glow-primary" : "border-border",
            )}
          >
            {p.highlight && (
              <span className="absolute -top-3 left-6 rounded-full bg-primary px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-primary-foreground">
                Популярный
              </span>
            )}
            <header className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">{TARIFF_LABELS[p.id]}</h3>
                {isCurrent && <span className="rounded-md bg-success/15 px-2 py-0.5 text-xs font-medium text-success">Ваш тариф</span>}
              </div>
              <p className="font-mono text-3xl font-semibold tracking-tight">{p.price}</p>
              <p className="text-sm text-muted-foreground text-pretty">{p.tagline}</p>
            </header>
            <ul className="flex flex-1 flex-col gap-2.5">
              {p.features.map((f) => (
                <li key={f} className="flex items-start gap-2.5 text-sm">
                  <Check className="mt-0.5 size-4 shrink-0 text-primary" />
                  <span>{f}</span>
                </li>
              ))}
            </ul>
            <LinkButton href={ctaHref} variant={p.highlight ? "default" : "outline"} size="lg" className="w-full" aria-disabled={isCurrent}>
              {isCurrent ? "Активен" : ctaLabel}
            </LinkButton>
          </article>
        )
      })}
    </div>
  )
}
