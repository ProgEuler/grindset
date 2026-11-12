"use client"

import { useCallback, useEffect, useMemo } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowLeftIcon, ArrowRightIcon, CheckIcon } from "lucide-react"
import { toast } from "sonner"
import { findLesson, getTrack, knownCommands } from "@/lib/tracks"
import type { Track } from "@/lib/tracks/types"
import { levelFor, useApp, useHydrated, useTrackProgress } from "@/lib/store"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button, buttonVariants } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { KeyBadge, KeyList } from "@/components/key-badge"
import { RichText } from "@/components/rich-text"
import { VimChallenge, formatTime, type ChallengeSummary } from "@/components/vim/vim-challenge"
import { VimPlayground } from "@/components/vim/vim-playground"
import { QuizChallenge } from "@/components/quiz/quiz-challenge"
import { LessonBlocks } from "./blocks"
import { ProGate } from "./pro-gate"

export function LessonView({ trackSlug, lessonSlug }: { trackSlug: string; lessonSlug: string }) {
  const track = getTrack(trackSlug) as Track
  const found = findLesson(track, lessonSlug)!
  const { lesson, section, prev, next, index } = found
  const router = useRouter()
  const hydrated = useHydrated()
  const pro = useApp((s) => s.pro)
  const settings = useApp((s) => s.settings)
  const visitLesson = useApp((s) => s.visitLesson)
  const completeLesson = useApp((s) => s.completeLesson)
  const markLessonDone = useApp((s) => s.markLessonDone)
  const progress = useTrackProgress(track.slug)
  const lp = progress.lessons[lesson.slug]
  const locked = lesson.pro && !pro
  const known = useMemo(() => knownCommands(track, lesson.slug), [track, lesson.slug])
  const rounds = lesson.challenge?.rounds ?? 0
  const goal = useMemo(() => ({ type: "rounds" as const, n: rounds }), [rounds])

  useEffect(() => {
    if (hydrated) visitLesson(track.slug, lesson.slug)
  }, [hydrated, visitLesson, track.slug, lesson.slug])

  // Ctrl+j / Ctrl+k lesson navigation
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!e.ctrlKey) return
      if (e.key === "j" && next) {
        e.preventDefault()
        router.push(`/learn/${track.slug}/${next.slug}`)
      } else if (e.key === "k" && prev) {
        e.preventDefault()
        router.push(`/learn/${track.slug}/${prev.slug}`)
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [next, prev, router, track.slug])

  const onFinish = useCallback(
    (s: ChallengeSummary) => {
      completeLesson(track.slug, lesson.slug, {
        timeMs: s.timeMs,
        efficiency: s.keys ? Math.min(1, s.ideal / s.keys) : 1,
      })
      toast.success(`${lesson.title} complete`, { description: `+${s.xp} xp` })
    },
    [completeLesson, track.slug, lesson.slug, lesson.title]
  )

  const nextLink = next && (
    <Link href={`/learn/${track.slug}/${next.slug}`} className={buttonVariants()}>
      Next: {next.title} <ArrowRightIcon />
    </Link>
  )

  const ch = lesson.challenge

  return (
    <article className="mx-auto max-w-3xl space-y-8 px-4 py-8 md:px-8">
      <header className="space-y-3">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>{section.title}</span>
          <span>·</span>
          <span>Lesson {index + 1}</span>
          {lesson.pro && (
            <Badge variant="outline" className="border-amber-500/50 text-amber-600 dark:text-amber-400">
              Pro
            </Badge>
          )}
          {hydrated && lp?.completed && (
            <Badge variant="secondary" className="gap-1">
              <CheckIcon className="size-3" /> completed
            </Badge>
          )}
        </div>
        <h1 className="text-3xl font-bold tracking-tight">{lesson.title}</h1>
        <KeyList keys={lesson.keys} />
      </header>

      {!hydrated && lesson.pro ? (
        <div className="h-64 animate-pulse rounded-xl bg-muted/40" />
      ) : locked ? (
        <div className="space-y-6">
          <div className="relative max-h-56 overflow-hidden">
            <LessonBlocks blocks={lesson.blocks.slice(0, 2)} />
            <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-background" />
          </div>
          <ProGate />
        </div>
      ) : (
        <>
          <LessonBlocks blocks={lesson.blocks} />

          <section className="space-y-4">
            <h2 className="text-xl font-semibold">{ch ? "Now it's your turn" : "Try it out"}</h2>
            {ch && (
              <ol className="ml-5 list-decimal space-y-1 text-sm text-muted-foreground">
                {ch.instructions.map((s, i) => (
                  <li key={i}>
                    <RichText text={s} />
                  </li>
                ))}
              </ol>
            )}
            <Tabs defaultValue="challenge">
              <TabsList>
                <TabsTrigger value="challenge">{ch ? "Challenge" : "Playground"}</TabsTrigger>
                <TabsTrigger value="stats">Stats</TabsTrigger>
              </TabsList>
              <TabsContent value="challenge" className="pt-2">
                {ch?.kind === "vim" && (
                  <VimChallenge
                    key={lesson.slug}
                    track={track.slug}
                    generate={ch.generate}
                    known={known}
                    goal={goal}
                    halfPage={lesson.editor?.halfPage}
                    relativeNumbers={lesson.editor?.relativeNumbers ?? settings.relativeNumbers}
                    onFinish={onFinish}
                    doneActions={nextLink}
                  />
                )}
                {ch?.kind === "quiz" && (
                  <QuizChallenge key={lesson.slug} track={track.slug} questions={ch.questions} rounds={ch.rounds} onFinish={onFinish} doneActions={nextLink} />
                )}
                {!ch && (
                  <div className="space-y-3">
                    {track.engine === "vim" && lesson.editor?.playground && (
                      <VimPlayground key={lesson.slug} text={lesson.editor.playground} relativeNumbers={settings.relativeNumbers} />
                    )}
                    <div className="flex gap-2">
                      <Button
                        variant="secondary"
                        disabled={!!lp?.completed}
                        onClick={() => {
                          markLessonDone(track.slug, lesson.slug)
                          toast.success("Marked as complete")
                        }}
                      >
                        <CheckIcon /> {lp?.completed ? "Completed" : "Mark as complete"}
                      </Button>
                      {nextLink}
                    </div>
                  </div>
                )}
              </TabsContent>
              <TabsContent value="stats" className="pt-2">
                <LessonStats track={track} lessonSlug={lesson.slug} />
              </TabsContent>
            </Tabs>
          </section>

          {lesson.tips && lesson.tips.length > 0 && (
            <section className="space-y-4">
              {lesson.tips.map((t) => (
                <div key={t.title}>
                  <h3 className="font-semibold"># {t.title}</h3>
                  <p className="mt-1 text-muted-foreground">
                    <RichText text={t.text} />
                  </p>
                </div>
              ))}
            </section>
          )}
        </>
      )}

      <Separator />
      <nav className="grid grid-cols-2 gap-3">
        {prev ? (
          <Link href={`/learn/${track.slug}/${prev.slug}`} className="rounded-lg border p-3 hover:bg-muted">
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <ArrowLeftIcon className="size-3" /> Back <KeyBadge k="Ctrl+k" className="ml-1 h-5 text-[10px]" />
            </div>
            <div className="mt-1 font-medium">{prev.title}</div>
          </Link>
        ) : (
          <span />
        )}
        {next && (
          <Link href={`/learn/${track.slug}/${next.slug}`} className="rounded-lg border p-3 text-right hover:bg-muted">
            <div className="flex items-center justify-end gap-1 text-xs text-muted-foreground">
              <KeyBadge k="Ctrl+j" className="mr-1 h-5 text-[10px]" /> Next <ArrowRightIcon className="size-3" />
            </div>
            <div className="mt-1 font-medium">{next.title}</div>
          </Link>
        )}
      </nav>
    </article>
  )
}

function LessonStats({ track, lessonSlug }: { track: Track; lessonSlug: string }) {
  const progress = useTrackProgress(track.slug)
  const found = findLesson(track, lessonSlug)!
  const lp = progress.lessons[lessonSlug]
  const cmds = track.commands.filter((c) => found.lesson.introduces.includes(c.id))
  return (
    <div className="space-y-4 rounded-xl border p-4">
      <div className="grid grid-cols-3 gap-4 text-sm">
        <div>
          <div className="font-mono text-xl">{lp?.attempts ?? 0}</div>
          <div className="text-xs text-muted-foreground">completions</div>
        </div>
        <div>
          <div className="font-mono text-xl">{lp?.bestTimeMs !== undefined ? formatTime(lp.bestTimeMs) : "–"}</div>
          <div className="text-xs text-muted-foreground">best time</div>
        </div>
        <div>
          <div className="font-mono text-xl">{lp?.bestEfficiency !== undefined ? `${Math.round(lp.bestEfficiency * 100)}%` : "–"}</div>
          <div className="text-xs text-muted-foreground">best efficiency</div>
        </div>
      </div>
      {cmds.length > 0 && (
        <div className="space-y-2">
          {cmds.map((c) => {
            const xp = progress.xp[c.id] ?? 0
            const { level } = levelFor(xp)
            return (
              <div key={c.id} className="flex items-center gap-3 text-sm">
                <KeyBadge k={c.label} />
                <span className="flex-1 text-muted-foreground">{c.name}</span>
                <span className="font-mono text-xs">
                  lv {level} · {xp} xp
                </span>
                <div className="flex gap-0.5">
                  {Array.from({ length: 10 }, (_, i) => (
                    <span key={i} className={cn("h-2 w-2 rounded-sm bg-muted", i < level && "bg-emerald-500")} />
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
