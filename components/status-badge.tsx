import { cn } from "@/lib/utils"
import { STATUS_LABELS, TARIFF_LABELS, ROLE_LABELS, type SubmissionStatus, type Tariff, type Role } from "@/lib/constants"

const statusStyles: Record<SubmissionStatus, string> = {
  not_submitted: "bg-muted text-muted-foreground border-border",
  draft: "bg-secondary text-secondary-foreground border-border",
  pending: "bg-warning/15 text-warning border-warning/30",
  needs_revision: "bg-destructive/15 text-destructive border-destructive/30",
  accepted: "bg-success/15 text-success border-success/30",
}

export function StatusBadge({ status, className }: { status: SubmissionStatus; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium whitespace-nowrap",
        statusStyles[status],
        className,
      )}
    >
      <span className="size-1.5 rounded-full bg-current" aria-hidden />
      {STATUS_LABELS[status]}
    </span>
  )
}

const tariffStyles: Record<Tariff, string> = {
  base: "bg-secondary text-secondary-foreground border-border",
  pro: "bg-accent/15 text-accent border-accent/30",
  vip: "bg-primary/15 text-primary border-primary/30",
}

export function TariffBadge({ tariff, className }: { tariff: Tariff; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-semibold uppercase tracking-wide",
        tariffStyles[tariff],
        className,
      )}
    >
      {TARIFF_LABELS[tariff]}
    </span>
  )
}

export function RoleBadge({ role, className }: { role: Role; className?: string }) {
  const isStaff = role !== "student"
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium",
        isStaff ? "bg-accent/15 text-accent border-accent/30" : "bg-muted text-muted-foreground border-border",
        className,
      )}
    >
      {ROLE_LABELS[role]}
    </span>
  )
}
