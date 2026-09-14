export const ROLES = ["owner", "admin", "curator", "content_editor", "support", "student"] as const
export type Role = (typeof ROLES)[number]

export const TARIFFS = ["base", "pro", "vip"] as const
export type Tariff = (typeof TARIFFS)[number]

export const TARIFF_RANK: Record<Tariff, number> = { base: 0, pro: 1, vip: 2 }

export const TARIFF_LABELS: Record<Tariff, string> = {
  base: "Base",
  pro: "Pro",
  vip: "VIP",
}

export const ROLE_LABELS: Record<Role, string> = {
  owner: "Владелец",
  admin: "Администратор",
  curator: "Куратор",
  content_editor: "Редактор контента",
  support: "Поддержка",
  student: "Ученик",
}

// Which roles a given role may assign to others. Owner can hand out everything;
// admin cannot promote to owner. Lives here (not in rbac.ts) so client
// components can import it without pulling in next/headers.
export const ASSIGNABLE_ROLES: Partial<Record<Role, Role[]>> = {
  owner: [...ROLES],
  admin: ["admin", "curator", "content_editor", "support", "student"],
}

export function assignableRoles(actorRole: Role): Role[] {
  return ASSIGNABLE_ROLES[actorRole] ?? []
}

export const SUBMISSION_STATUSES = [
  "not_submitted",
  "draft",
  "pending",
  "needs_revision",
  "accepted",
] as const
export type SubmissionStatus = (typeof SUBMISSION_STATUSES)[number]

export const STATUS_LABELS: Record<SubmissionStatus, string> = {
  not_submitted: "Не отправлено",
  draft: "Черновик",
  pending: "На проверке",
  needs_revision: "Нужно доработать",
  accepted: "Принято",
}

export const ASSIGNMENT_FORMATS = ["text", "link", "file", "fields"] as const
export type AssignmentFormat = (typeof ASSIGNMENT_FORMATS)[number]

export const FORMAT_LABELS: Record<AssignmentFormat, string> = {
  text: "Текстовый ответ",
  link: "Ссылка",
  file: "Файл",
  fields: "Несколько полей по шаблону",
}

export const FIELD_TEMPLATES: Record<number, { key: string; label: string }[]> = {
  5: [
    { key: "name", label: "Название услуги" },
    { key: "audience", label: "Для кого" },
    { key: "problem", label: "Какую проблему решает" },
    { key: "scope", label: "Что входит / не входит" },
    { key: "result", label: "Результат и срок" },
  ],
  11: [
    { key: "what", label: "Что это за продукт" },
    { key: "who", label: "Для кого" },
    { key: "price", label: "Цена" },
    { key: "where", label: "Где продаёте" },
  ],
  16: [
    { key: "service1", label: "Услуга 1 — цена и обоснование" },
    { key: "service2", label: "Услуга 2 — цена и обоснование" },
    { key: "service3", label: "Услуга 3 — цена и обоснование" },
    { key: "how", label: "Как объявляете цену" },
  ],
  19: [
    { key: "goal", label: "Цель проекта" },
    { key: "scope", label: "Объём работ" },
    { key: "criteria", label: "Критерии приёмки" },
    { key: "excluded", label: "Что не входит" },
  ],
  22: [
    { key: "base", label: "Пакет Base" },
    { key: "pro", label: "Пакет Pro" },
    { key: "vip", label: "Пакет VIP" },
  ],
  23: [
    { key: "problem", label: "Проблема" },
    { key: "payer", label: "Кто платит" },
    { key: "diff", label: "Чем отличается" },
    { key: "validate", label: "Как проверите спрос" },
  ],
  25: [
    { key: "money", label: "Цель по деньгам" },
    { key: "week1", label: "Неделя 1" },
    { key: "week2", label: "Неделя 2" },
    { key: "week3", label: "Неделя 3" },
    { key: "week4", label: "Неделя 4" },
    { key: "metrics", label: "Метрики" },
  ],
}

export const DEFAULT_FIELDS = [
  { key: "answer", label: "Ответ" },
  { key: "details", label: "Детали" },
]

export const SESSION_LIMIT = 3
