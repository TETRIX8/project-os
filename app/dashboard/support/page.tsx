import type { Metadata } from "next"
import { Clock, Mail, MessageCircle } from "lucide-react"
import { requireUserPage } from "@/lib/rbac"
import { PageHeader } from "@/components/shell/page-header"

export const metadata: Metadata = { title: "Поддержка" }

const FAQ = [
  {
    q: "Как долго проверяют задание?",
    a: "Обычно 1–2 рабочих дня. На тарифах Pro и VIP — приоритетная очередь, до 24 часов.",
  },
  {
    q: "Почему следующий уровень закрыт?",
    a: "Уровень открывается, когда куратор принял все задания предыдущего. Проверьте «Мои задания» — там видно, что ждёт проверки или доработки.",
  },
  {
    q: "Можно ли переслать задание после принятия?",
    a: "Принятое задание закрыто для правок. Если хотите обсудить улучшения — напишите куратору в комментарий следующего урока.",
  },
  {
    q: "Как сменить тариф?",
    a: "Напишите в поддержку — менеджер переключит тариф после оплаты, доступ откроется сразу.",
  },
  {
    q: "Меня выкинуло из аккаунта на другом устройстве",
    a: "Лимит — 3 активных сессии. При входе с четвёртого устройства самая старая сессия завершается. Управлять сессиями можно в разделе «Безопасность».",
  },
]

export default async function SupportPage() {
  const user = await requireUserPage()
  const subject = encodeURIComponent(`Вопрос по курсу — ${user.email}`)

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Поддержка" description="Ответим в течение рабочего дня. Для вопросов по заданиям используйте комментарии куратора." />

      <div className="grid gap-4 sm:grid-cols-2">
        <a
          href={`mailto:support@300za30.ru?subject=${subject}`}
          className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-6 transition-colors hover:border-primary/40"
        >
          <span className="flex size-10 items-center justify-center rounded-lg bg-primary/15 text-primary">
            <Mail className="size-5" />
          </span>
          <div className="flex flex-col gap-1">
            <p className="font-semibold">Написать на почту</p>
            <p className="text-sm text-muted-foreground">support@300za30.ru</p>
          </div>
        </a>
        <a
          href="https://t.me/300za30_support"
          target="_blank"
          rel="noopener noreferrer"
          className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-6 transition-colors hover:border-primary/40"
        >
          <span className="flex size-10 items-center justify-center rounded-lg bg-accent/15 text-accent">
            <MessageCircle className="size-5" />
          </span>
          <div className="flex flex-col gap-1">
            <p className="font-semibold">Telegram-чат поддержки</p>
            <p className="text-sm text-muted-foreground">@300za30_support</p>
          </div>
        </a>
      </div>

      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Clock className="size-3.5" /> Пн–Пт, 10:00–19:00 по Москве
      </div>

      <section aria-labelledby="faq-heading" className="rounded-2xl border border-border bg-card">
        <h2 id="faq-heading" className="border-b border-border px-6 py-4 font-semibold">
          Частые вопросы
        </h2>
        <dl className="divide-y divide-border">
          {FAQ.map((item) => (
            <div key={item.q} className="flex flex-col gap-1.5 px-6 py-4">
              <dt className="text-sm font-medium">{item.q}</dt>
              <dd className="text-sm leading-relaxed text-muted-foreground text-pretty">{item.a}</dd>
            </div>
          ))}
        </dl>
      </section>
    </div>
  )
}
