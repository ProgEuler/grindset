"use client"

import { useEffect, useMemo, useState } from "react"
import { Play, Rotate } from "@meteor-icons/react"
import { createState, handleKey, type VimState } from "@/lib/vim/engine"
import type { VimDemo as Demo } from "@/lib/tracks/types"
import { Button } from "@/components/ui/button"
import { KeyBadge } from "@/components/key-badge"
import { VimEditor } from "./vim-editor"

/** Plays a key sequence through the engine so learners can watch a command work. */
export function VimDemo({ demo, caption, compact }: { demo: Demo; caption?: string; compact?: boolean }) {
  const frames = useMemo(() => {
    const out: { state: VimState; key: string | null }[] = [{ state: createState(demo.text, demo.cursor), key: null }]
    for (const k of demo.keys) out.push({ state: handleKey(out[out.length - 1].state, k).state, key: k })
    return out
  }, [demo])
  const [i, setI] = useState(0)
  const [playing, setPlaying] = useState(false)

  useEffect(() => {
    if (!playing) return
    if (i >= frames.length - 1) {
      const t = setTimeout(() => setPlaying(false), 400)
      return () => clearTimeout(t)
    }
    const t = setTimeout(() => setI((x) => x + 1), i === 0 ? 500 : 450)
    return () => clearTimeout(t)
  }, [playing, i, frames.length])

  const play = () => {
    setI(0)
    setPlaying(true)
  }
  const pressed = frames.slice(1, i + 1).map((f) => f.key!)

  return (
    <div className="space-y-2">
      <VimEditor state={frames[i].state} maxLines={compact ? 6 : 10} />
      <div className="flex min-h-8 flex-wrap items-center gap-2">
        <Button size="sm" variant="secondary" onClick={play}>
          {i > 0 && !playing ? <Rotate /> : <Play />}
          {i > 0 && !playing ? "Replay" : "Play example"}
        </Button>
        <span className="flex flex-wrap gap-1">
          {pressed.map((k, n) => (
            <KeyBadge key={n} k={k} className={n === pressed.length - 1 && playing ? "border-primary text-primary" : ""} />
          ))}
        </span>
      </div>
      {caption && <p className="text-xs text-muted-foreground">{caption}</p>}
    </div>
  )
}
