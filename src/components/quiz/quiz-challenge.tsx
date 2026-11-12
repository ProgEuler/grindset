"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { CheckCircle2Icon, RotateCcwIcon, TrophyIcon, XCircleIcon } from "lucide-react"
import type { QuizQuestion } from "@/lib/tracks/types"
import { makeRng, type Rng } from "@/lib/vim/generators"
import { useApp } from "@/lib/store"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { RichText } from "@/components/rich-text"
import { formatTime, type ChallengeSummary } from "@/components/vim/vim-challenge"

const norm = (s: string) => s.trim().replace(/\s+/g, " ").replace(/[“”]/g, '"').replace(/[‘’]/g, "'")

function shuffle<T>(arr: T[], rng: () => number) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

interface Props {
  track: string
  questions: QuizQuestion[]
  rounds: number | null
  onFinish?: (s: ChallengeSummary) => void
  doneActions?: React.ReactNode
}

/** Generic recall quiz: free-text or multiple choice. Plugs into the same XP/stats system. */
export function QuizChallenge({ track, questions, rounds, onFinish, doneActions }: Props) {
  const recordRound = useApp((s) => s.recordRound)
  const rngRef = useRef<Rng | null>(null)
  const [order, setOrder] = useState<QuizQuestion[]>([])
  const [i, setI] = useState(0)
  const [value, setValue] = useState("")
  const [result, setResult] = useState<null | "right" | "wrong">(null)
  const [tries, setTries] = useState(0)
  const [score, setScore] = useState({ right: 0, xp: 0 })
  const [startedAt, setStartedAt] = useState<number | null>(null)
  const [done, setDone] = useState<null | number>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const total = Math.min(rounds ?? questions.length, questions.length)

  const restart = useCallback(() => {
    rngRef.current ??= makeRng()
    setOrder(shuffle(questions, rngRef.current).slice(0, total))
    setI(0)
    setValue("")
    setResult(null)
    setTries(0)
    setScore({ right: 0, xp: 0 })
    setStartedAt(null)
    setDone(null)
  }, [questions, total])

  useEffect(() => {
    restart()
  }, [restart])

  const q = order[i]

  function check() {
    if (!q || !value.trim()) return
    const ok = q.answer.some((a) => norm(a) === norm(value))
    setStartedAt((s) => s ?? Date.now())
    if (ok) {
      const xp = recordRound(track, { commands: q.commands, keys: tries === 0 ? 1 : 2, ideal: 1 })
      setScore((s) => ({ right: s.right + (tries === 0 ? 1 : 0), xp: s.xp + xp }))
      setResult("right")
    } else {
      setTries((t) => t + 1)
      setResult("wrong")
    }
  }

  function next() {
    if (i + 1 >= order.length) {
      const ms = Date.now() - (startedAt ?? Date.now())
      setDone(ms)
      onFinish?.({ rounds: order.length, timeMs: ms, keys: order.length, ideal: score.right, xp: score.xp, perfect: score.right })
      return
    }
    setI(i + 1)
    setValue("")
    setResult(null)
    setTries(0)
    setTimeout(() => inputRef.current?.focus(), 0)
  }

  if (done !== null) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrophyIcon className="size-5 text-amber-500" /> Quiz complete
          </CardTitle>
          <CardDescription>
            {score.right}/{order.length} right on the first try, in {formatTime(done)}. +{score.xp} xp
          </CardDescription>
        </CardHeader>
        <CardFooter className="gap-2">
          <Button variant="secondary" onClick={restart}>
            <RotateCcwIcon /> Try again
          </Button>
          {doneActions}
        </CardFooter>
      </Card>
    )
  }

  if (!q) return <div className="h-40 animate-pulse rounded-xl border bg-muted/40" />

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Badge variant="secondary">
            question {i + 1}/{order.length}
          </Badge>
          <Badge variant="outline">+{score.xp} xp</Badge>
        </div>
        <Progress value={(i / order.length) * 100} className="mt-2" />
        <CardTitle className="pt-2 text-base">
          <RichText text={q.prompt} />
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form
          onSubmit={(e) => {
            e.preventDefault()
            if (result === "right") next()
            else check()
          }}
          className="space-y-3"
        >
          {q.choices ? (
            <RadioGroup value={value} onValueChange={(v) => setValue(String(v))} className="gap-2">
              {q.choices.map((c) => (
                <Label key={c} className="flex cursor-pointer items-center gap-3 rounded-lg border p-3 font-normal has-data-checked:border-primary">
                  <RadioGroupItem value={c} />
                  {c}
                </Label>
              ))}
            </RadioGroup>
          ) : (
            <Input
              ref={inputRef}
              autoFocus
              value={value}
              onChange={(e) => {
                setValue(e.target.value)
                if (result === "wrong") setResult(null)
              }}
              placeholder="type the command…"
              className="font-mono"
              spellCheck={false}
              autoComplete="off"
            />
          )}
          {result === "right" && (
            <p className="flex items-center gap-2 text-sm text-emerald-600 dark:text-emerald-400">
              <CheckCircle2Icon className="size-4" /> Correct! {q.explain}
            </p>
          )}
          {result === "wrong" && (
            <p className="flex items-center gap-2 text-sm text-rose-600 dark:text-rose-400">
              <XCircleIcon className="size-4" /> Not quite.
              {tries >= 2 && (
                <span>
                  {" "}
                  Answer: <code className="rounded bg-muted px-1 font-mono">{q.answer[0]}</code>
                </span>
              )}
            </p>
          )}
          <div className="flex gap-2">
            <Button type="submit">{result === "right" ? "Next" : "Check"}</Button>
            {result !== "right" && (
              <Button type="button" variant="ghost" onClick={next}>
                Skip
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
