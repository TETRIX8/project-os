// Demo accounts + activity for the admin panel.
// Users are created through Better Auth's sign-up endpoint so password hashing
// matches production; everything else is inserted directly.
//
//   node --env-file=.env.development.local scripts/seed-demo.mjs
//
// Requires the dev server on http://localhost:3000 (or set SEED_BASE_URL).

import { Pool } from "pg"

const BASE = process.env.SEED_BASE_URL ?? "http://localhost:3000"
const PASSWORD = "Demo12345!"

const USERS = [
  { email: "owner@demo.ru", name: "Владелец платформы", role: "owner", tariff: "vip" },
  { email: "admin@demo.ru", name: "Анна Администратор", role: "admin", tariff: "vip" },
  { email: "curator@demo.ru", name: "Максим Куратор", role: "curator", tariff: "vip" },
  { email: "editor@demo.ru", name: "Ольга Редактор", role: "content_editor", tariff: "pro" },
  { email: "support@demo.ru", name: "Игорь Поддержка", role: "support", tariff: "base" },
  { email: "student@demo.ru", name: "Артём Новиков", role: "student", tariff: "base", daysAgo: 21 },
  { email: "dasha@demo.ru", name: "Даша Кузнецова", role: "student", tariff: "pro", daysAgo: 34 },
  { email: "kirill@demo.ru", name: "Кирилл Соколов", role: "student", tariff: "vip", daysAgo: 60 },
  { email: "lena@demo.ru", name: "Лена Морозова", role: "student", tariff: "base", daysAgo: 3 },
  { email: "timur@demo.ru", name: "Тимур Ахметов", role: "student", tariff: "pro", daysAgo: 12 },
  { email: "sveta@demo.ru", name: "Света Орлова", role: "student", tariff: "base", daysAgo: 45, banned: true },
]

const pool = new Pool({ connectionString: process.env.DATABASE_URL })
const daysAgo = (n, hours = 0) => new Date(Date.now() - n * 86400000 - hours * 3600000)

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

async function signUp(u, attempt = 0) {
  const res = await fetch(`${BASE}/api/auth/sign-up/email`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Origin: BASE },
    body: JSON.stringify({ name: u.name, email: u.email, password: PASSWORD }),
  })
  // Better Auth rate-limits sign-up to a few requests per 10s window.
  if (res.status === 429 && attempt < 5) {
    await sleep(11000)
    return signUp(u, attempt + 1)
  }
  if (!res.ok) {
    const text = await res.text()
    if (/already|exists/i.test(text)) return null
    throw new Error(`sign-up ${u.email}: ${res.status} ${text}`)
  }
  return (await res.json()).user.id
}

async function ensureUser(u) {
  const existing = await pool.query(`select id from "user" where email = $1`, [u.email])
  const id = existing.rows[0]?.id ?? (await signUp(u))
  if (!id) throw new Error(`no id for ${u.email}`)
  await pool.query(
    `update "user" set role = $2, tariff = $3, "emailVerified" = true, banned = $4, "banReason" = $5, "createdAt" = $6 where id = $1`,
    [id, u.role, u.tariff, Boolean(u.banned), u.banned ? "Передача доступа третьим лицам" : null, daysAgo(u.daysAgo ?? 90)],
  )
  // Invalidate any sessions the sign-up created so the seed leaves no live logins behind.
  await pool.query(`delete from session where "userId" = $1`, [id])
  return id
}

async function watched(userId, lessonIds, startDaysAgo) {
  for (const [i, lessonId] of lessonIds.entries()) {
    await pool.query(
      `insert into lesson_progress ("userId","lessonId",watched,"watchedAt") values ($1,$2,true,$3)
       on conflict ("userId","lessonId") do update set watched = true, "watchedAt" = excluded."watchedAt"`,
      [userId, lessonId, daysAgo(startDaysAgo - i * 1.5, 10)],
    )
  }
}

async function submit(userId, lessonId, { status, text, link, fields, version = 1, grade, at }) {
  const res = await pool.query(
    `insert into submissions ("userId","lessonId",status,"contentText","contentLink",fields,version,grade,"submittedAt","createdAt","updatedAt")
     values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$9,$9)
     on conflict ("userId","lessonId") do update set status = excluded.status, "contentText" = excluded."contentText",
       "contentLink" = excluded."contentLink", fields = excluded.fields, version = excluded.version, grade = excluded.grade,
       "submittedAt" = excluded."submittedAt", "updatedAt" = excluded."updatedAt"
     returning id`,
    [userId, lessonId, status, text ?? null, link ?? null, JSON.stringify(fields ?? {}), version, grade ?? null, at],
  )
  return res.rows[0].id
}

async function review(submissionId, curatorId, { action, comment, grade, version = 1, at }) {
  await pool.query(
    `insert into submission_reviews ("submissionId","curatorId",action,comment,grade,version,"createdAt") values ($1,$2,$3,$4,$5,$6,$7)`,
    [submissionId, curatorId, action, comment, grade ?? null, version, at],
  )
}

async function notify(userId, title, body, type, at, read = false) {
  await pool.query(`insert into notifications ("userId",title,body,type,read,"createdAt") values ($1,$2,$3,$4,$5,$6)`, [userId, title, body, type, read, at])
}

async function audit(actorId, actorEmail, action, entity, entityId, metadata, at) {
  await pool.query(
    `insert into audit_log (actor,"actorEmail",action,entity,"entityId",ip,metadata,"createdAt") values ($1,$2,$3,$4,$5,$6,$7,$8)`,
    [actorId, actorEmail, action, entity, String(entityId), "203.0.113.42", JSON.stringify(metadata), at],
  )
}

async function main() {
  const ids = {}
  for (const u of USERS) {
    ids[u.email] = await ensureUser(u)
    console.log(`user ${u.email} → ${u.role}/${u.tariff}`)
  }

  // Idempotent: wipe previously seeded activity for these users only.
  const studentIds = USERS.filter((u) => u.role === "student").map((u) => ids[u.email])
  await pool.query(`delete from submission_reviews where "submissionId" in (select id from submissions where "userId" = any($1))`, [studentIds])
  await pool.query(`delete from submissions where "userId" = any($1)`, [studentIds])
  await pool.query(`delete from lesson_progress where "userId" = any($1)`, [studentIds])
  await pool.query(`delete from notifications where "userId" = any($1)`, [studentIds])
  await pool.query(`delete from audit_log where "actorEmail" like '%@demo.ru'`)

  const curator = ids["curator@demo.ru"]
  const admin = ids["admin@demo.ru"]

  // --- Артём (base, 21 день): дошёл до урока 6, одна работа на проверке, одна на доработке
  const artem = ids["student@demo.ru"]
  await watched(artem, [1, 2, 3, 4, 5, 6], 20)
  for (const [lesson, text, at] of [
    [1, "Хочу зарабатывать на сайтах для локального бизнеса: кафе, салоны, мастера. Знаю Tilda и немного HTML/CSS.", daysAgo(19)],
    [2, "Первые деньги — сделать 3 сайта знакомым по себестоимости, собрать отзывы и портфолио. Параллельно откликаться на Kwork.", daysAgo(17)],
    [3, "Ценность: не «сайт», а поток заявок. Владелец кофейни платит за то, чтобы в выходные было больше гостей.", daysAgo(15)],
  ]) {
    const sid = await submit(artem, lesson, { status: "accepted", text, grade: 5, at })
    await review(sid, curator, { action: "accept", comment: "Чётко и по делу. Двигаемся дальше.", grade: 5, at: new Date(at.getTime() + 5 * 3600000) })
  }
  const a4 = await submit(artem, 4, {
    status: "needs_revision",
    text: "Проблемы: мало клиентов, нет сайта, не умеют вести соцсети.",
    version: 1,
    at: daysAgo(6),
  })
  await review(a4, curator, {
    action: "revise",
    comment: "Слишком общо. Опиши 3 конкретных проблемы конкретного бизнеса (кто, где, что теряет в деньгах). Например: «Кофейня на Ленина — 40% столов пустые по будням до 12:00».",
    at: daysAgo(5, 20),
  })
  await notify(artem, "Нужно доработать: Поиск проблем", "Куратор оставил комментарий к вашей работе.", "revision", daysAgo(5, 20))
  const a5 = await submit(artem, 5, {
    status: "pending",
    fields: {
      name: "Сайт-визитка + Яндекс.Карты за 3 дня",
      audience: "Кофейни и пекарни в спальных районах",
      problem: "Нет сайта и карточки — теряют гостей, которые ищут «кофе рядом»",
      scope: "Одностраничник, карточка в Картах, 10 фото. Не входит: контент-план, реклама",
      result: "Заявки с карт и сайта через 7 дней после запуска",
    },
    at: daysAgo(1, 4),
  })
  await notify(artem, "Работа отправлена на проверку", "Урок 05 · Превращение проблемы в услугу", "info", daysAgo(1, 4), true)
  void a5

  // --- Даша (pro, 34 дня): прошла 12 уроков, всё принято, 13-й на проверке
  const dasha = ids["dasha@demo.ru"]
  await watched(dasha, [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13], 33)
  for (let lesson = 1; lesson <= 12; lesson++) {
    const at = daysAgo(32 - lesson * 2.3)
    const format = [5, 11].includes(lesson) ? "fields" : [6, 7, 8, 9, 10, 12].includes(lesson) ? "link" : "text"
    const sid = await submit(dasha, lesson, {
      status: "accepted",
      text: format === "text" ? `Ответ Даши к уроку ${lesson}: разобрала на примере своей ниши (Telegram-боты для салонов красоты).` : undefined,
      link: format === "link" ? `https://notion.so/dasha/lesson-${lesson}` : undefined,
      fields: format === "fields" ? { what: "Бот записи для салонов", who: "Салоны 1–3 мастера", price: "9 900 ₽ + 990 ₽/мес", where: "Авито, Telegram-чаты бьюти" } : undefined,
      grade: lesson % 3 === 0 ? 4 : 5,
      at,
    })
    await review(sid, curator, { action: "accept", comment: lesson % 3 === 0 ? "Принято. В следующий раз добавь цифры." : "Отлично.", grade: lesson % 3 === 0 ? 4 : 5, at: new Date(at.getTime() + 8 * 3600000) })
  }
  await submit(dasha, 13, { status: "pending", link: "https://docs.google.com/spreadsheets/d/dasha-leads", at: daysAgo(0, 6) })
  await notify(dasha, "Открыт уровень 3 — «Я умею продавать»", "Вы приняли все задания второго уровня.", "success", daysAgo(3), true)

  // --- Кирилл (vip, 60 дней): прошёл весь курс
  const kirill = ids["kirill@demo.ru"]
  await watched(kirill, Array.from({ length: 25 }, (_, i) => i + 1), 58)
  for (let lesson = 1; lesson <= 25; lesson++) {
    const at = daysAgo(57 - lesson * 2)
    const sid = await submit(kirill, lesson, { status: "accepted", text: `Кирилл, урок ${lesson}: сделал, проверил на реальном клиенте.`, grade: 5, version: lesson === 17 ? 2 : 1, at })
    if (lesson === 17) {
      await review(sid, curator, { action: "revise", comment: "Скрипт возражений слишком агрессивный, смягчи.", version: 1, at: new Date(at.getTime() - 86400000) })
    }
    await review(sid, curator, { action: "accept", comment: "Принято.", grade: 5, version: lesson === 17 ? 2 : 1, at: new Date(at.getTime() + 6 * 3600000) })
  }
  await notify(kirill, "Вы прошли курс полностью", "Все 25 заданий приняты. Сертификат доступен в профиле.", "success", daysAgo(7))

  // --- Лена (base, 3 дня): только начала
  const lena = ids["lena@demo.ru"]
  await watched(lena, [1, 2], 2)
  await submit(lena, 1, { status: "draft", text: "Пока думаю между дизайном и ботами…", at: daysAgo(0, 20) })
  await notify(lena, "Добро пожаловать на курс", "Начните с урока 01 — «Поиск направления».", "info", daysAgo(3))

  // --- Тимур (pro, 12 дней): 7 уроков, 2 на проверке
  const timur = ids["timur@demo.ru"]
  await watched(timur, [1, 2, 3, 4, 5, 6, 7], 11)
  for (let lesson = 1; lesson <= 5; lesson++) {
    const at = daysAgo(10 - lesson * 1.6)
    const sid = await submit(timur, lesson, {
      status: "accepted",
      text: lesson !== 5 ? `Тимур, урок ${lesson}: ниша — автоматизация отчётов для маркетплейс-селлеров.` : undefined,
      fields: lesson === 5 ? { name: "Дэшборд продаж WB/Ozon", audience: "Селлеры 1–5 млн/мес", problem: "Считают юнит-экономику в Excel вручную", scope: "Подключение API, 5 отчётов", result: "Отчёт каждое утро в Telegram" } : undefined,
      grade: 5,
      at,
    })
    await review(sid, curator, { action: "accept", comment: "Хорошая ниша, есть деньги.", grade: 5, at: new Date(at.getTime() + 4 * 3600000) })
  }
  await submit(timur, 6, { status: "pending", link: "https://timur-portfolio.vercel.app", at: daysAgo(2, 3) })
  await submit(timur, 7, { status: "pending", link: "https://github.com/timur/landing-audit", at: daysAgo(0, 2) })

  // --- Света (заблокирована)
  const sveta = ids["sveta@demo.ru"]
  await watched(sveta, [1, 2, 3], 44)
  await submit(sveta, 1, { status: "accepted", text: "Хочу перепродавать курс.", grade: 3, at: daysAgo(43) })
  await audit(admin, "admin@demo.ru", "user.ban", "user", sveta, { reason: "Передача доступа третьим лицам" }, daysAgo(30))

  // Audit trail for realism
  await audit(admin, "admin@demo.ru", "user.tariff", "user", dasha, { from: "base", to: "pro" }, daysAgo(30))
  await audit(admin, "admin@demo.ru", "user.tariff", "user", kirill, { from: "pro", to: "vip" }, daysAgo(50))
  await audit(ids["editor@demo.ru"], "editor@demo.ru", "lesson.update", "lesson", 9, { fields: ["notes", "videoUrl"] }, daysAgo(9))
  await audit(ids["editor@demo.ru"], "editor@demo.ru", "lesson.publish", "lesson", 25, { published: true }, daysAgo(8))
  await audit(curator, "curator@demo.ru", "submission.revise", "submission", a4, { version: 1 }, daysAgo(5, 20))
  await audit(ids["owner@demo.ru"], "owner@demo.ru", "user.role", "user", curator, { from: "student", to: "curator" }, daysAgo(80))

  const stats = await pool.query(
    `select (select count(*) from "user") users, (select count(*) from submissions) subs, (select count(*) from submissions where status='pending') pending,
            (select count(*) from submission_reviews) reviews, (select count(*) from lesson_progress) progress, (select count(*) from audit_log) audit`,
  )
  console.log(stats.rows[0])
  console.log(`\nAll demo accounts use password: ${PASSWORD}`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exitCode = 1
  })
  .finally(() => pool.end())
