"use client"

import { useMemo, useState } from "react"
import { getTrack, allLessons } from "@/lib/tracks"
import type { QuizQuestion, Track } from "@/lib/tracks/types"
import { mix, type Ctx, type VimRound } from "@/lib/vim/generators"
import { useApp } from "@/lib/store"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { Separator } from "@/components/ui/separator"
import { VimChallenge, type ChallengeGoal } from "@/components/vim/vim-challenge"
import { QuizChallenge } from "@/components/quiz/quiz-challenge"

type Mode = "goals" | "time" | "endless"
const AMOUNTS: Record<Mode, number[]> = { goals: [5, 15, 30, 50], time: [15, 30, 60, 120], endless: [] }

export function Practice({ trackSlug }: { trackSlug: string }) {
  const track = getTrack(trackSlug) as Track
  const relativeNumbers = useApp((s) => s.settings.relativeNumbers)
  const [cats, setCats] = useState<string[]>([track.practice[0].id])
  const [mode, setMode] = useState<Mode>("goals")
  const [amount, setAmount] = useState(15)

  const allowed = (id: string) => {
    const c = track.practice.find((p) => p.id === id)
    return !!c
  }
  const active = cats.filter(allowed)
  const activeKey = active.join(",")
  const lessons = useMemo(() => {
    const ids = activeKey.split(",")
    const slugs = new Set(track.practice.filter((p) => ids.includes(p.id)).flatMap((p) => p.lessons))
    return allLessons(track).filter((l) => slugs.has(l.slug))
  }, [track, activeKey])

  const known = useMemo(() => new Set(track.commands.map((c) => c.id)), [track])
  const vimGen = useMemo(() => {
    const gens = lessons.flatMap((l) => (l.challenge?.kind === "vim" ? [l.challenge.generate] : []))
    return gens.length ? mix(...gens) : null
  }, [lessons]) as ((ctx: Ctx) => VimRound) | null
  const questions = useMemo(
    () => lessons.flatMap((l) => (l.challenge?.kind === "quiz" ? l.challenge.questions : [])) as QuizQuestion[],
    [lessons]
  )

  const goal: ChallengeGoal = useMemo(
    () => (mode === "goals" ? { type: "rounds", n: amount } : mode === "time" ? { type: "time", seconds: amount } : { type: "endless" }),
    [mode, amount]
  )
  const runKey = `${activeKey}|${mode}|${amount}`

  return (
    <main className="mx-auto w-full max-w-4xl space-y-6 px-4 py-10">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{track.title} practice</h1>
        <p className="text-muted-foreground">Drill until it sticks. Every round is generated fresh.</p>
      </div>

      <div className="flex flex-wrap items-center gap-3 rounded-xl border bg-muted/30 p-2 text-sm">
        <ToggleGroup
          multiple
          value={active}
          onValueChange={(v) => {
            const next = (v as string[]).filter(allowed)
            if (next.length) setCats(next)
          }}
          size="sm"
        >
          {track.practice.map((c) => {
            return (
              <ToggleGroupItem key={c.id} value={c.id} aria-label={c.label}>
                {c.label}
              </ToggleGroupItem>
            )
          })}
        </ToggleGroup>
        <Separator orientation="vertical" className="h-6" />
        <ToggleGroup
          value={[mode]}
          onValueChange={(v) => {
            const m = (v as string[])[0] as Mode | undefined
            if (!m) return
            setMode(m)
            if (AMOUNTS[m].length) setAmount(AMOUNTS[m][1])
          }}
          size="sm"
        >
          {(["goals", "time", "endless"] as Mode[]).map((m) => (
            <ToggleGroupItem key={m} value={m}>
              {m}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
        {AMOUNTS[mode].length > 0 && (
          <>
            <Separator orientation="vertical" className="h-6" />
            <ToggleGroup value={[String(amount)]} onValueChange={(v) => (v as string[])[0] && setAmount(Number((v as string[])[0]))} size="sm">
              {AMOUNTS[mode].map((a) => (
                <ToggleGroupItem key={a} value={String(a)}>
                  {a}
                  {mode === "time" ? "s" : ""}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
          </>
        )}
      </div>


      {track.engine === "vim" && vimGen && (
        <VimChallenge key={runKey} track={track.slug} generate={vimGen} known={known} goal={goal} relativeNumbers={relativeNumbers} autoFocus />
      )}
      {track.engine === "quiz" && questions.length > 0 && (
        <QuizChallenge key={runKey} track={track.slug} questions={questions} rounds={mode === "goals" ? amount : null} />
      )}
    </main>
  )
}
