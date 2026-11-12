"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { keyFromEvent, selection, toOffset, type Pos, type VimState } from "@/lib/vim/engine"
import { TOKEN_CLASS, tokenize } from "@/lib/syntax"
import { cn } from "@/lib/utils"

interface VimEditorProps {
  state: VimState
  /** return true when the key was consumed. Omit for a read-only editor. */
  onKey?: (key: string) => boolean
  target?: Pos | null
  /** lines that differ from the goal */
  changedLines?: Set<number>
  relativeNumbers?: boolean
  maxLines?: number
  autoFocus?: boolean
  flash?: "success" | null
  className?: string
  statusRight?: React.ReactNode
}

const MODE_LABEL: Record<string, string> = {
  normal: "NORMAL",
  insert: "INSERT",
  visual: "VISUAL",
  "visual-line": "V-LINE",
  search: "SEARCH",
}

export function VimEditor({
  state,
  onKey,
  target,
  changedLines,
  relativeNumbers,
  maxLines = 18,
  autoFocus,
  flash,
  className,
  statusRight,
}: VimEditorProps) {
  const ref = useRef<HTMLDivElement>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const [focused, setFocused] = useState(false)
  const interactive = !!onKey

  useEffect(() => {
    if (autoFocus && ref.current) ref.current.focus({ preventScroll: true })
  }, [autoFocus])

  // keep the cursor line visible
  useEffect(() => {
    const box = scrollRef.current
    const row = box?.querySelector<HTMLElement>(`[data-line="${state.cursor.line}"]`)
    if (!box || !row) return
    const top = row.offsetTop
    const bottom = top + row.offsetHeight
    if (top < box.scrollTop + 8) box.scrollTop = Math.max(0, top - 24)
    else if (bottom > box.scrollTop + box.clientHeight - 8) box.scrollTop = bottom - box.clientHeight + 24
  }, [state.cursor.line, state.lines])

  const tokens = useMemo(() => tokenize(state.lines), [state.lines])
  const sel = selection(state)
  const selStart = sel && !sel.linewise ? sel.s : -1
  const selEnd = sel && !sel.linewise ? sel.e : -1
  const insertLike = state.mode === "insert"
  const gutterWidth = String(state.lines.length).length

  function onKeyDown(e: React.KeyboardEvent) {
    if (!onKey) return
    const key = keyFromEvent(e)
    if (!key) return
    // leave lesson navigation shortcuts alone
    if (key === "<C-j>" || key === "<C-k>") return
    if (onKey(key)) {
      e.preventDefault()
      e.stopPropagation()
    }
  }

  return (
    <div
      ref={ref}
      tabIndex={interactive ? 0 : -1}
      onKeyDown={onKeyDown}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      onMouseDown={(e) => {
        if (interactive) {
          e.preventDefault()
          ref.current?.focus({ preventScroll: true })
        }
      }}
      className={cn(
        "relative overflow-hidden rounded-xl border border-code-line bg-code-bg font-mono text-[13px] leading-6 text-code-fg outline-none transition-shadow",
        interactive && focused && "ring-2 ring-ring/60",
        flash === "success" && "ring-2 ring-emerald-500",
        className
      )}
      aria-label="Vim editor"
      role={interactive ? "textbox" : undefined}
    >
      <div ref={scrollRef} className="relative overflow-auto py-3" style={{ maxHeight: `${maxLines * 1.5 + 1.5}rem` }}>
        {state.lines.map((line, li) => {
          const lineOff = toOffset(state.lines, { line: li, col: 0 })
          const lineSelected = sel?.linewise && li >= sel.l1 && li <= sel.l2
          const isCursorLine = li === state.cursor.line
          const num = relativeNumbers && !isCursorLine ? Math.abs(li - state.cursor.line) : li + 1
          const cells = Math.max(line.length, 1) + (insertLike && isCursorLine && state.cursor.col >= line.length ? 1 : 0)
          return (
            <div
              key={li}
              data-line={li}
              className={cn("flex whitespace-pre pr-4", isCursorLine && interactive && "bg-code-line/40", changedLines?.has(li) && "bg-rose-500/10")}
            >
              <span
                className={cn(
                  "sticky left-0 z-10 shrink-0 select-none bg-code-bg pr-3 pl-3 text-right text-code-gutter",
                  isCursorLine && "text-code-fg",
                  changedLines?.has(li) && "text-rose-400"
                )}
                style={{ width: `${gutterWidth + 2.5}ch` }}
              >
                {num}
              </span>
              <span className="relative">
                {Array.from({ length: cells }, (_, ci) => {
                  const ch = line[ci] ?? " "
                  const off = lineOff + ci
                  const isCursor = isCursorLine && ci === state.cursor.col
                  const isTarget = target && target.line === li && target.col === ci
                  const isSel = lineSelected || (off >= selStart && off < selEnd && ci < Math.max(line.length, 1))
                  return (
                    <span
                      key={ci}
                      className={cn(
                        "relative",
                        TOKEN_CLASS[tokens[li]?.[ci] ?? "plain"],
                        isSel && "bg-code-selection",
                        isTarget && "rounded-[2px] bg-emerald-500/30 outline-2 outline-emerald-500",
                        isCursor && !insertLike && (focused || !interactive) && "bg-code-fg text-code-bg not-italic",
                        isCursor && !insertLike && interactive && !focused && "outline-1 outline-code-fg/70",
                        isCursor && insertLike && "shadow-[inset_2px_0_0_0_var(--code-fg)]"
                      )}
                    >
                      {ch}
                    </span>
                  )
                })}
              </span>
            </div>
          )
        })}
      </div>

      <div className="flex h-7 items-center gap-2 border-t border-code-line bg-code-bar px-2 text-[11px] text-code-gutter">
        <span
          className={cn(
            "rounded px-1.5 py-0.5 font-semibold tracking-wide",
            state.mode === "normal" && "bg-code-number text-code-bg",
            state.mode === "insert" && "bg-code-function text-code-bg",
            (state.mode === "visual" || state.mode === "visual-line") && "bg-code-param text-code-bg",
            state.mode === "search" && "bg-code-string text-code-bg"
          )}
        >
          {MODE_LABEL[state.mode]}
        </span>
        {state.mode === "search" && state.search && (
          <span className="text-code-fg">
            {state.search.forward ? "/" : "?"}
            {state.search.input}
            <span className="ml-px inline-block h-3 w-[2px] translate-y-0.5 animate-pulse bg-code-fg" />
          </span>
        )}
        {state.pending.length > 0 && <span className="text-code-fg">{state.pending.join("")}</span>}
        {state.message && <span className="truncate">{state.message}</span>}
        <span className="ml-auto flex items-center gap-3">
          {statusRight}
          <span>
            {state.cursor.line + 1}:{state.cursor.col + 1}
          </span>
        </span>
      </div>

      {interactive && !focused && (
        <button
          type="button"
          className="absolute inset-0 z-20 flex items-center justify-center bg-code-bg/50 text-sm text-code-fg backdrop-blur-[1px]"
          onMouseDown={(e) => {
            e.preventDefault()
            ref.current?.focus({ preventScroll: true })
          }}
        >
          <span className="rounded-md border border-code-line bg-code-bar px-3 py-1.5 shadow-sm">Click to focus the editor</span>
        </button>
      )}
    </div>
  )
}
