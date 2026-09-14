const dateFmt = new Intl.DateTimeFormat("ru-RU", { day: "numeric", month: "short", year: "numeric" })
const dateTimeFmt = new Intl.DateTimeFormat("ru-RU", {
  day: "numeric",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
})
const rtf = new Intl.RelativeTimeFormat("ru-RU", { numeric: "auto" })

export function formatDate(d: Date | string | null | undefined) {
  if (!d) return "—"
  return dateFmt.format(new Date(d))
}

export function formatDateTime(d: Date | string | null | undefined) {
  if (!d) return "—"
  return dateTimeFmt.format(new Date(d))
}

export function timeAgo(d: Date | string | null | undefined) {
  if (!d) return "—"
  const diff = (new Date(d).getTime() - Date.now()) / 1000
  const abs = Math.abs(diff)
  if (abs < 60) return rtf.format(Math.round(diff), "second")
  if (abs < 3600) return rtf.format(Math.round(diff / 60), "minute")
  if (abs < 86400) return rtf.format(Math.round(diff / 3600), "hour")
  if (abs < 86400 * 30) return rtf.format(Math.round(diff / 86400), "day")
  return dateFmt.format(new Date(d))
}

export function pluralize(n: number, forms: [string, string, string]) {
  const mod10 = n % 10
  const mod100 = n % 100
  if (mod10 === 1 && mod100 !== 11) return forms[0]
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return forms[1]
  return forms[2]
}

export function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("")
}

export function parseUserAgent(ua: string | null | undefined) {
  if (!ua) return "Неизвестное устройство"
  const browser = /Edg\//.test(ua)
    ? "Edge"
    : /Chrome\//.test(ua)
      ? "Chrome"
      : /Firefox\//.test(ua)
        ? "Firefox"
        : /Safari\//.test(ua)
          ? "Safari"
          : "Браузер"
  const os = /Windows/.test(ua)
    ? "Windows"
    : /Mac OS X/.test(ua)
      ? "macOS"
      : /Android/.test(ua)
        ? "Android"
        : /iPhone|iPad/.test(ua)
          ? "iOS"
          : /Linux/.test(ua)
            ? "Linux"
            : ""
  return [browser, os].filter(Boolean).join(" · ")
}

/** Turn a YouTube / Vimeo / VK share URL into an embeddable one. Returns null for unknown hosts. */
export function toEmbedUrl(url: string | null | undefined): string | null {
  if (!url) return null
  try {
    const u = new URL(url)
    const host = u.hostname.replace(/^www\./, "")
    if (host === "youtu.be") return `https://www.youtube-nocookie.com/embed/${u.pathname.slice(1)}`
    if (host === "youtube.com" || host === "m.youtube.com") {
      if (u.pathname.startsWith("/embed/")) return url
      const id = u.searchParams.get("v")
      if (id) return `https://www.youtube-nocookie.com/embed/${id}`
      if (u.pathname.startsWith("/shorts/")) return `https://www.youtube-nocookie.com/embed/${u.pathname.split("/")[2]}`
    }
    if (host === "youtube-nocookie.com") return url
    if (host === "vimeo.com") return `https://player.vimeo.com/video/${u.pathname.split("/").filter(Boolean)[0]}`
    if (host === "player.vimeo.com") return url
    if (host === "vk.com" || host === "vkvideo.ru") {
      const m = u.pathname.match(/video(-?\d+)_(\d+)/)
      if (m) return `https://vk.com/video_ext.php?oid=${m[1]}&id=${m[2]}`
    }
    if (host === "rutube.ru") {
      const id = u.pathname.split("/").filter(Boolean)[1]
      if (id) return `https://rutube.ru/play/embed/${id}`
    }
    return null
  } catch {
    return null
  }
}
