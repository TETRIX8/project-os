"use client"

import { useState } from "react"
import Link from "next/link"
import { Bell, Menu, X } from "lucide-react"
import { Logo } from "@/components/brand/logo"
import { NavLinks, type NavItem } from "@/components/shell/nav-links"
import { UserMenu } from "@/components/shell/user-menu"
import { Button } from "@/components/ui/button"
import { TariffBadge } from "@/components/status-badge"
import type { CurrentUser } from "@/lib/rbac"
import { cn } from "@/lib/utils"

type Section = { title?: string; items: NavItem[] }

export function AppShell({
  user,
  sections,
  unreadCount = 0,
  notificationsHref = "/dashboard/notifications",
  footer,
  children,
}: {
  user: CurrentUser
  sections: Section[]
  unreadCount?: number
  notificationsHref?: string
  footer?: React.ReactNode
  children: React.ReactNode
}) {
  const [open, setOpen] = useState(false)

  const nav = (
    <nav aria-label="Основная навигация" className="flex flex-1 flex-col gap-6 overflow-y-auto px-3 py-4">
      {sections.map((s, i) => (
        <div key={i} className="flex flex-col gap-1.5">
          {s.title && (
            <p className="px-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70">{s.title}</p>
          )}
          <NavLinks items={s.items} onNavigate={() => setOpen(false)} />
        </div>
      ))}
    </nav>
  )

  return (
    <div className="flex min-h-dvh">
      <aside className="hidden w-64 shrink-0 flex-col border-r border-sidebar-border bg-sidebar lg:flex">
        <div className="flex h-16 items-center border-b border-sidebar-border px-5">
          <Logo href={sections[0]?.items[0]?.href ?? "/"} />
        </div>
        {nav}
        {footer && <div className="border-t border-sidebar-border p-3">{footer}</div>}
      </aside>

      {open && (
        <div className="fixed inset-0 z-50 flex lg:hidden" role="dialog" aria-modal="true">
          <button aria-label="Закрыть меню" className="absolute inset-0 bg-background/70 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <div className="relative flex w-72 max-w-[85vw] flex-col bg-sidebar border-r border-sidebar-border shadow-2xl">
            <div className="flex h-16 items-center justify-between border-b border-sidebar-border px-4">
              <Logo href={sections[0]?.items[0]?.href ?? "/"} />
              <Button variant="ghost" size="icon" onClick={() => setOpen(false)} aria-label="Закрыть">
                <X />
              </Button>
            </div>
            {nav}
            {footer && <div className="border-t border-sidebar-border p-3">{footer}</div>}
          </div>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-40 flex h-16 items-center gap-3 border-b border-border bg-background/80 px-4 backdrop-blur-md sm:px-6">
          <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setOpen(true)} aria-label="Открыть меню">
            <Menu />
          </Button>
          <div className="lg:hidden">
            <Logo compact href={sections[0]?.items[0]?.href ?? "/"} />
          </div>
          <div className="ml-auto flex items-center gap-2">
            <TariffBadge tariff={user.tariff} className="hidden sm:inline-flex" />
            <Link
              href={notificationsHref}
              className={cn(
                "relative flex size-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
              )}
              aria-label={unreadCount ? `Уведомления: ${unreadCount} непрочитанных` : "Уведомления"}
            >
              <Bell className="size-4" />
              {unreadCount > 0 && (
                <span className="absolute right-1.5 top-1.5 flex size-2 rounded-full bg-primary ring-2 ring-background" />
              )}
            </Link>
            <UserMenu user={user} />
          </div>
        </header>
        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">{children}</main>
      </div>
    </div>
  )
}
