"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { Eye, Rotate, ForwardStep, BadgeCheck } from "@meteor-icons/react"
import { createState, handleKey, type VimState } from "@/lib/vim/engine"
import { makeRng, type Ctx, type Rng, type VimRound } from "@/lib/vim/generators"
import { useApp } from "@/lib/store"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { KeyList } from "@/components/key-badge"
import { CodeBlock } from "@/components/code-block"
import { VimEditor } from "./vim-editor"
import { lineDiff } from "./diff"

export type ChallengeGoal = { type: "rounds"; n: number } | { type: "time"; seconds: number } | { type: "endless" }

export interface ChallengeSummary {
  rounds: number
  timeMs: number
  keys: number
  ideal: number
  xp: number
  perfect: number
}

interface Props {
  track: string
  generate: (ctx: Ctx) => VimRound
  known: Set<string>
  goal: ChallengeGoal
  halfPage?: number
  relativeNumbers?: boolean
  autoFocus?: boolean
  onFinish?: (s: ChallengeSummary) => void
  doneActions?: React.ReactNode
}

interface Run {
  status: "ready" | "playing" | "done"
  round: VimRound | null
  vim: VimState | null
  index: number
  keys: number
  commands: string[]
  revealed: boolean
  startedAt: number | null
  endedAt: number | null
  totals: { keys: number; ideal: number; xp: number; perfect: number }
  last: { keys: number; ideal: number; xp: number } | null
}

const initialRun = (): Run => ({
  status: "ready",
  round: null,
  vim: null,
  index: 0,
  keys: 0,
  commands: [],
  revealed: false,
  startedAt: null,
  endedAt: null,
  totals: { keys: 0, ideal: 0, xp: 0, perfect: 0 },
  last: null,
})

export function formatTime(ms: number) {
  const s = Math.floor(ms / 1000)
  return `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`
}

export function VimChallenge({ track, generate, known, goal, halfPage, relativeNumbers, autoFocus, onFinish, doneActions }: Props) {
  const recordRound = useApp((s) => s.recordRound)
  const showHints = useApp((s) => s.settings.showHints)
  // created lazily (client-only) so prerendering stays deterministic
  const rngRef = useRef<Rng | null>(null)
  const [run, setRunState] = useState<Run>(initialRun)
  const [now, setNow] = useState(0)
  const [flash, setFlash] = useState<"success" | null>(null)
  const runRef = useRef(run)
  // keep the ref in lock-step so rapid keypresses never read stale state
  const setRun = useCallback((next: Run) => {
    runRef.current = next
    setRunState(next)
  }, [])

  const fresh = useCallback((): Pick<Run, "round" | "vim" | "keys" | "commands" | "revealed"> => {
    rngRef.current ??= makeRng()
    const round = generate({ rng: rngRef.current, known })
    return { round, vim: createState(round.lines, round.cursor, { halfPage }), keys: 0, commands: [], revealed: false }
  }, [generate, known, halfPage])

  const restart = useCallback(() => setRun({ ...initialRun(), ...fresh() }), [fresh, setRun])

  // Rounds are random, so they must be generated after mount (client-only);
  // generating during render would break prerendering and hydration.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    restart()
  }, [restart])

  const finish = useCallback(
    (r: Run): Run => {
      const done: Run = { ...r, status: "done", endedAt: Date.now() }
      const summary: ChallengeSummary = {
        rounds: done.index,
        timeMs: (done.endedAt ?? 0) - (done.startedAt ?? done.endedAt ?? 0),
        ...done.totals,
      }
      queueMicrotask(() => onFinish?.(summary))
      return done
    },
    [onFinish]
  )

  // ticking clock + time-limit
  useEffect(() => {
    if (run.status !== "playing") return
    const id = setInterval(() => {
      const t = Date.now()
      setNow(t)
      const r = runRef.current
      if (goal.type === "time" && r.startedAt && t - r.startedAt >= goal.seconds * 1000 && r.status === "playing") {
        setRun(finish(r))
      }
    }, 100)
    return () => clearInterval(id)
  }, [run.status, goal, finish, setRun])

  const onKey = useCallback(
    (key: string): boolean => {
      const r = runRef.current
      if (r.status === "done" || !r.vim || !r.round) return false
      const res = handleKey(r.vim, key)
      if (!res.handled) return false
      const startedAt = r.startedAt ?? Date.now()
      const keys = r.keys + 1
      const commands = [...r.commands, ...res.commands]
      const v = res.state
      const round = r.round
      const solved =
        v.mode === "normal" &&
        (round.kind === "move"
          ? v.cursor.line === round.target!.line && v.cursor.col === round.target!.col
          : v.lines.join("\n") === round.goal!.join("\n"))

      if (!solved) {
        setRun({ ...r, status: "playing", startedAt, vim: v, keys, commands })
        return true
      }

      const xp = recordRound(track, { commands, keys: r.revealed ? Infinity : keys, ideal: round.ideal })
      const perfect = !r.revealed && keys <= round.ideal
      const totals = {
        keys: r.totals.keys + keys,
        ideal: r.totals.ideal + round.ideal,
        xp: r.totals.xp + xp,
        perfect: r.totals.perfect + (perfect ? 1 : 0),
      }
      const index = r.index + 1
      setFlash("success")
      setTimeout(() => setFlash(null), 250)
      const base: Run = { ...r, status: "playing", startedAt, index, totals, last: { keys, ideal: round.ideal, xp }, vim: v }
      if (goal.type === "rounds" && index >= goal.n) {
        setRun(finish(base))
      } else {
        setRun({ ...base, ...fresh() })
      }
      return true
    },
    [recordRound, track, goal, finish, fresh, setRun]
  )

  const skip = () => {
    const r = runRef.current
    if (r.status === "done") return
    setRun({ ...r, ...fresh() })
  }

  const elapsed = run.startedAt ? Math.max(0, (run.endedAt ?? now) - run.startedAt) : 0
  const diff = useMemo(
    () => (run.round?.kind === "edit" && run.vim ? lineDiff(run.vim.lines, run.round.goal!) : null),
    [run.round, run.vim]
  )

  if (run.status === "done") {
    const eff = run.totals.keys ? Math.round((run.totals.ideal / run.totals.keys) * 100) : 0
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BadgeCheck className="size-5 text-amber-500" /> Challenge complete
          </CardTitle>
          <CardDescription>
            {run.index} rounds in {formatTime(elapsed)}
          </CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <Stat label="time" value={formatTime(elapsed)} />
          <Stat label="efficiency" value={`${Math.min(100, eff)}%`} />
          <Stat label="perfect rounds" value={`${run.totals.perfect}/${run.index}`} />
          <Stat label="xp earned" value={`+${run.totals.xp}`} />
        </CardContent>
        <CardFooter className="gap-2">
          <Button onClick={restart} variant="secondary">
            <Rotate /> Try again
          </Button>
          {doneActions}
        </CardFooter>
      </Card>
    )
  }

  const round = run.round
  const total = goal.type === "rounds" ? goal.n : null
  const timeLeft = goal.type === "time" ? Math.max(0, goal.seconds * 1000 - elapsed) : null

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <Badge variant="secondary">
          {round?.kind === "edit" ? "edit" : "move"} · round {run.index + 1}
          {total ? `/${total}` : ""}
        </Badge>
        <Badge variant="outline" className="font-mono">
          {timeLeft !== null ? `${formatTime(timeLeft)} left` : formatTime(elapsed)}
        </Badge>
        <Badge variant="outline">
          keys {run.keys} · ideal {round?.ideal ?? "–"}
        </Badge>
        {run.last && (
          <Badge variant={run.last.xp > 0 ? "default" : "outline"} className={cn(run.last.xp > 0 && "bg-emerald-600 text-white")}>
            last: {run.last.keys}/{run.last.ideal} keys {run.last.xp > 0 ? `· +${run.last.xp} xp` : ""}
          </Badge>
        )}
        <span className="ml-auto flex gap-1">
          {showHints && round && (
            <Button size="xs" variant="ghost" onClick={() => setRun({ ...run, revealed: true })} disabled={run.revealed}>
              <Eye /> Solution
            </Button>
          )}
          <Button size="xs" variant="ghost" onClick={skip}>
            <ForwardStep /> Skip
          </Button>
          <Button size="xs" variant="ghost" onClick={restart}>
            <Rotate /> Restart
          </Button>
        </span>
      </div>
      {total && <Progress value={(run.index / total) * 100} />}

      {run.vim ? (
        <VimEditor
          state={run.vim}
          onKey={onKey}
          target={round?.kind === "move" ? round.target : null}
          changedLines={diff?.aOnly}
          relativeNumbers={relativeNumbers}
          autoFocus={autoFocus}
          flash={flash}
        />
      ) : (
        <div className="h-64 animate-pulse rounded-xl border bg-muted/40" />
      )}

      {run.revealed && round && (
        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          One ideal solution{round.kind === "edit" ? " (once you're in position)" : ""}: <KeyList keys={round.solution} />
          <span>(no XP for this round)</span>
        </div>
      )}

      {round?.kind === "edit" && round.goal && (
        <div className="overflow-hidden rounded-xl border border-dashed border-code-line bg-code-bg">
          <div className="flex items-center justify-between border-b border-dashed border-code-line bg-code-bar px-3 py-1.5 text-xs text-code-gutter">
            <span>Goal: make the buffer look like this{run.vim?.mode === "insert" ? ", then press Esc" : ""}</span>
            {round.hint && <span className="hidden sm:inline">{round.hint}</span>}
          </div>
          <CodeBlock lines={round.goal} highlightLines={diff?.bOnly} className="rounded-none" />
        </div>
      )}
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="font-mono text-2xl font-semibold">{value}</div>
      <div className="text-xs text-muted-foreground">{label}</div>
    </div>
  )
}
