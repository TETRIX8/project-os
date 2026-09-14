"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  BarChart3,
  BookOpen,
  ClipboardCheck,
  ClipboardList,
  CreditCard,
  FolderOpen,
  Home,
  LayoutDashboard,
  LifeBuoy,
  ScrollText,
  Shield,
  UserRound,
  Users,
  type LucideIcon,
} from "lucide-react"
import { cn } from "@/lib/utils"

// Icons are referenced by key so server layouts can pass nav config to this
// client component as plain serializable data.
const ICONS = {
  home: Home,
  book: BookOpen,
  clipboardList: ClipboardList,
  clipboardCheck: ClipboardCheck,
  folder: FolderOpen,
  user: UserRound,
  shield: Shield,
  card: CreditCard,
  lifeBuoy: LifeBuoy,
  dashboard: LayoutDashboard,
  users: Users,
  chart: BarChart3,
  scroll: ScrollText,
} satisfies Record<string, LucideIcon>

export type NavIcon = keyof typeof ICONS

export type NavItem = {
  href: string
  label: string
  icon: NavIcon
  badge?: number
  exact?: boolean
}

export function NavLinks({ items, onNavigate }: { items: NavItem[]; onNavigate?: () => void }) {
  const pathname = usePathname()
  return (
    <ul className="flex flex-col gap-0.5">
      {items.map((item) => {
        const Icon = ICONS[item.icon]
        const active = item.exact ? pathname === item.href : pathname === item.href || pathname.startsWith(item.href + "/")
        return (
          <li key={item.href}>
            <Link
              href={item.href}
              onClick={onNavigate}
              aria-current={active ? "page" : undefined}
              className={cn(
                "group flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                active
                  ? "bg-sidebar-accent text-sidebar-foreground font-medium"
                  : "text-muted-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-foreground",
              )}
            >
              <Icon className={cn("size-4 shrink-0", active ? "text-primary" : "text-muted-foreground group-hover:text-foreground")} />
              <span className="flex-1 truncate">{item.label}</span>
              {item.badge ? (
                <span className="rounded-full bg-primary px-1.5 py-0.5 text-[10px] font-semibold leading-none text-primary-foreground tabular-nums">
                  {item.badge > 99 ? "99+" : item.badge}
                </span>
              ) : null}
            </Link>
          </li>
        )
      })}
    </ul>
  )
}
