"use client"

import { useMemo } from "react"
import { vimTrack } from "@/lib/tracks/vim"
import { knownCommands } from "@/lib/tracks"
import * as G from "@/lib/tracks/vim/challenges"
import { VimChallenge } from "@/components/vim/vim-challenge"

const ENDLESS = { type: "endless" } as const

/** A live, endless mini-challenge on the landing page. */
export function TryIt() {
  const known = useMemo(() => knownCommands(vimTrack, "word-motions"), [])
  return <VimChallenge track="vim" generate={G.wordMotions} known={known} goal={ENDLESS} />
}
