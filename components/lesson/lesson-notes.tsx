import { Fragment } from "react"

type Block =
  | { type: "h2"; text: string }
  | { type: "h3"; text: string }
  | { type: "p"; text: string }
  | { type: "ul"; items: string[] }
  | { type: "ol"; items: string[] }
  | { type: "quote"; text: string }
  | { type: "code"; text: string }

/** Minimal, dependency-free markdown subset: headings, lists, quotes, fenced code, bold/inline code. */
function parse(md: string): Block[] {
  const lines = md.replace(/\r\n/g, "\n").split("\n")
  const blocks: Block[] = []
  let i = 0
  while (i < lines.length) {
    const line = lines[i]
    if (!line.trim()) {
      i++
      continue
    }
    if (line.startsWith("```")) {
      const buf: string[] = []
      i++
      while (i < lines.length && !lines[i].startsWith("```")) buf.push(lines[i++])
      i++
      blocks.push({ type: "code", text: buf.join("\n") })
      continue
    }
    if (line.startsWith("## ")) {
      blocks.push({ type: "h2", text: line.slice(3) })
      i++
      continue
    }
    if (line.startsWith("### ") || line.startsWith("# ")) {
      blocks.push({ type: "h3", text: line.replace(/^#+\s/, "") })
      i++
      continue
    }
    if (line.startsWith("> ")) {
      const buf: string[] = []
      while (i < lines.length && lines[i].startsWith("> ")) buf.push(lines[i++].slice(2))
      blocks.push({ type: "quote", text: buf.join(" ") })
      continue
    }
    if (/^[-*] /.test(line)) {
      const items: string[] = []
      while (i < lines.length && /^[-*] /.test(lines[i])) items.push(lines[i++].slice(2))
      blocks.push({ type: "ul", items })
      continue
    }
    if (/^\d+[.)] /.test(line)) {
      const items: string[] = []
      while (i < lines.length && /^\d+[.)] /.test(lines[i])) items.push(lines[i++].replace(/^\d+[.)] /, ""))
      blocks.push({ type: "ol", items })
      continue
    }
    const buf: string[] = []
    while (i < lines.length && lines[i].trim() && !/^(#|>|[-*] |\d+[.)] |```)/.test(lines[i])) buf.push(lines[i++])
    blocks.push({ type: "p", text: buf.join(" ") })
  }
  return blocks
}

function Inline({ text }: { text: string }) {
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g)
  return (
    <>
      {parts.map((p, i) => {
        if (p.startsWith("**") && p.endsWith("**")) return <strong key={i}>{p.slice(2, -2)}</strong>
        if (p.startsWith("`") && p.endsWith("`"))
          return (
            <code key={i} className="rounded bg-muted px-1.5 py-0.5 font-mono text-[0.85em]">
              {p.slice(1, -1)}
            </code>
          )
        return <Fragment key={i}>{p}</Fragment>
      })}
    </>
  )
}

export function LessonNotes({ markdown }: { markdown: string }) {
  const blocks = parse(markdown)
  return (
    <div className="flex flex-col gap-4 text-sm leading-relaxed text-pretty">
      {blocks.map((b, i) => {
        switch (b.type) {
          case "h2":
            return (
              <h3 key={i} className="mt-2 text-lg font-semibold tracking-tight">
                <Inline text={b.text} />
              </h3>
            )
          case "h3":
            return (
              <h4 key={i} className="mt-1 font-semibold">
                <Inline text={b.text} />
              </h4>
            )
          case "p":
            return (
              <p key={i}>
                <Inline text={b.text} />
              </p>
            )
          case "ul":
            return (
              <ul key={i} className="flex flex-col gap-1.5 pl-5 marker:text-primary list-disc">
                {b.items.map((it, j) => (
                  <li key={j}>
                    <Inline text={it} />
                  </li>
                ))}
              </ul>
            )
          case "ol":
            return (
              <ol key={i} className="flex flex-col gap-1.5 pl-5 marker:font-mono marker:text-primary list-decimal">
                {b.items.map((it, j) => (
                  <li key={j}>
                    <Inline text={it} />
                  </li>
                ))}
              </ol>
            )
          case "quote":
            return (
              <blockquote key={i} className="border-l-2 border-accent/60 pl-4 text-muted-foreground italic">
                <Inline text={b.text} />
              </blockquote>
            )
          case "code":
            return (
              <pre key={i} className="overflow-x-auto rounded-lg border border-border bg-surface p-4 font-mono text-xs leading-relaxed">
                {b.text}
              </pre>
            )
        }
      })}
    </div>
  )
}
