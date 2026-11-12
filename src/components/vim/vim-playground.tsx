"use client"

import { useState } from "react"
import { createState, handleKey } from "@/lib/vim/engine"
import { Button } from "@/components/ui/button"
import { VimEditor } from "./vim-editor"

export function VimPlayground({ text, relativeNumbers, halfPage }: { text: string; relativeNumbers?: boolean; halfPage?: number }) {
  const [state, setState] = useState(() => createState(text, { line: 0, col: 0 }, { halfPage }))
  return (
    <div className="space-y-2">
      <VimEditor
        state={state}
        relativeNumbers={relativeNumbers}
        onKey={(k) => {
          const r = handleKey(state, k)
          setState(r.state)
          return r.handled
        }}
      />
      <div className="flex justify-end">
        <Button size="sm" variant="ghost" onClick={() => setState(createState(text, { line: 0, col: 0 }, { halfPage }))}>
          Reset playground
        </Button>
      </div>
    </div>
  )
}
