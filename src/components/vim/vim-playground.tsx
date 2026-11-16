"use client"

import { useRef, useState } from "react"
import { createState, handleKey, type VimState } from "@/lib/vim/engine"
import { Button } from "@/components/ui/button"
import { VimEditor } from "./vim-editor"

export function VimPlayground({
  text,
  relativeNumbers,
  halfPage,
  maxLines,
  autoFocus,
  hideReset,
}: {
  text: string
  relativeNumbers?: boolean
  halfPage?: number
  maxLines?: number
  autoFocus?: boolean
  hideReset?: boolean
}) {
  const [state, setStateRaw] = useState(() => createState(text, { line: 0, col: 0 }, { halfPage }))
  // mirror in a ref so very fast keypresses never read a stale state
  const ref = useRef(state)
  const setState = (s: VimState) => {
    ref.current = s
    setStateRaw(s)
  }
  return (
    <div className="space-y-2">
      <VimEditor
        state={state}
        relativeNumbers={relativeNumbers}
        maxLines={maxLines}
        autoFocus={autoFocus}
        onKey={(k) => {
          const r = handleKey(ref.current, k)
          setState(r.state)
          return r.handled
        }}
      />
      {!hideReset && (
        <div className="flex justify-end">
          <Button size="sm" variant="ghost" onClick={() => setState(createState(text, { line: 0, col: 0 }, { halfPage }))}>
            Reset playground
          </Button>
        </div>
      )}
    </div>
  )
}
