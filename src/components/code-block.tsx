import { useMemo } from "react"
import { TOKEN_CLASS, tokenize } from "@/lib/syntax"
import { cn } from "@/lib/utils"

/** Read-only Dracula code block. `highlightLines` get a green "added" tint. */
export function CodeBlock({
  lines,
  lineNumbers = true,
  highlightLines,
  className,
}: {
  lines: string[]
  lineNumbers?: boolean
  highlightLines?: Set<number>
  className?: string
}) {
  const tokens = useMemo(() => tokenize(lines), [lines])
  return (
    <pre className={cn("overflow-auto rounded-xl bg-code-bg py-3 font-mono text-[13px] leading-6 text-code-fg", className)}>
      {lines.map((line, i) => (
        <div key={i} className={cn("flex pr-4", !lineNumbers && "pl-4", highlightLines?.has(i) && "bg-code-function/15")}>
          {lineNumbers && <span className="w-10 shrink-0 pr-3 text-right text-code-gutter select-none">{i + 1}</span>}
          <span className="whitespace-pre">
            {line.length === 0
              ? " "
              : segments(line, tokens[i]).map((s, k) => (
                  <span key={k} className={TOKEN_CLASS[s.tok]}>
                    {s.text}
                  </span>
                ))}
          </span>
        </div>
      ))}
    </pre>
  )
}

function segments(line: string, toks: string[] = []) {
  const out: { text: string; tok: keyof typeof TOKEN_CLASS }[] = []
  for (let i = 0; i < line.length; i++) {
    const tok = (toks[i] ?? "plain") as keyof typeof TOKEN_CLASS
    const last = out[out.length - 1]
    if (last && last.tok === tok) last.text += line[i]
    else out.push({ text: line[i], tok })
  }
  return out
}
