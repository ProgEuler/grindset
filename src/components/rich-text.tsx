import { Fragment } from "react"

/** Tiny inline formatter: **bold** and `code`. */
export function RichText({ text }: { text: string }) {
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g)
  return (
    <>
      {parts.map((part, i) => {
        if (part.startsWith("**") && part.endsWith("**")) return <strong key={i}>{part.slice(2, -2)}</strong>
        if (part.startsWith("`") && part.endsWith("`"))
          return (
            <code key={i} className="rounded bg-muted px-1.5 py-0.5 font-mono text-[0.85em]">
              {part.slice(1, -1)}
            </code>
          )
        return <Fragment key={i}>{part}</Fragment>
      })}
    </>
  )
}
