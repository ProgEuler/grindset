"use client"

import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { TRACKS, getTrack } from "@/lib/tracks"
import type { Track } from "@/lib/tracks/types"
import { levelFor, proficiency, useApp, useHydrated, useTrackProgress } from "@/lib/store"
import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { KeyBadge } from "@/components/key-badge"
import { SaveButton } from "@/components/save-button"

export function StatsView() {
  const params = useSearchParams()
  const router = useRouter()
  const track = getTrack(params.get("track") ?? "") ?? TRACKS[0]
  const hydrated = useHydrated()
  const user = useApp((s) => s.user)

  return (
    <main className="mx-auto w-full max-w-5xl space-y-8 px-4 py-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <h1 className="text-3xl font-bold tracking-tight">Stats</h1>
        <Tabs value={track.slug} onValueChange={(v) => router.replace(`/stats?track=${v}`)}>
          <TabsList>
            {TRACKS.map((t) => (
              <TabsTrigger key={t.slug} value={t.slug}>
                {t.title}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>

      {hydrated && !user && (
        <Card className="border-dashed">
          <CardContent className="flex flex-wrap items-center justify-between gap-3 text-sm">
            <span className="text-muted-foreground">Progress is saved in this browser. Sign in to put a name on it (cloud sync comes later).</span>
            <Link href="/signin" className={buttonVariants({ size: "sm" })}>
              Sign in
            </Link>
          </CardContent>
        </Card>
      )}

      <Heatmap />
      {hydrated ? <TrackStats track={track} /> : <div className="h-96 animate-pulse rounded-xl bg-muted/40" />}
    </main>
  )
}

function Heatmap() {
  const activity = useApp((s) => s.activity)
  const hydrated = useHydrated()
  if (!hydrated) return <div className="h-28 animate-pulse rounded-xl bg-muted/40" />
  return <HeatmapGrid activity={activity} />
}

function HeatmapGrid({ activity }: { activity: Record<string, number> }) {
  const weeks = 26
  const end = new Date()
  const start = new Date(end)
  start.setDate(end.getDate() - (weeks * 7 - 1) - end.getDay())
  const days: { date: string; n: number }[] = []
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const key = d.toISOString().slice(0, 10)
    days.push({ date: key, n: activity[key] ?? 0 })
  }
  const shade = (n: number) =>
    n === 0 ? "bg-muted" : n < 5 ? "bg-emerald-500/30" : n < 15 ? "bg-emerald-500/55" : n < 30 ? "bg-emerald-500/80" : "bg-emerald-500"
  const cols: (typeof days)[] = []
  for (let i = 0; i < days.length; i += 7) cols.push(days.slice(i, i + 7))
  const total = days.reduce((a, d) => a + d.n, 0)
  return (
    <div className="space-y-2">
      <div className="flex gap-[3px] overflow-x-auto pb-1">
        {cols.map((c, i) => (
          <div key={i} className="flex flex-col gap-[3px]">
            {c.map((d) => (
              <div key={d.date} title={`${d.date}: ${d.n} rounds`} className={cn("size-3 rounded-[3px]", shade(d.n))} />
            ))}
          </div>
        ))}
      </div>
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>{total} rounds in the last 6 months</span>
        <span className="flex items-center gap-1">
          less {["bg-muted", "bg-emerald-500/30", "bg-emerald-500/55", "bg-emerald-500/80", "bg-emerald-500"].map((c) => (
            <span key={c} className={cn("size-3 rounded-[3px]", c)} />
          ))}{" "}
          more
        </span>
      </div>
    </div>
  )
}

function TrackStats({ track }: { track: Track }) {
  const progress = useTrackProgress(track.slug)
  const counts = { started: 0, learning: 0, practiced: 0, fluent: 0 }
  for (const c of track.commands) {
    const p = proficiency(progress.xp[c.id] ?? 0, progress.used[c.id] ?? 0)
    if (p !== "new") counts.started++
    if (p === "learning") counts.learning++
    if (p === "practiced") counts.practiced++
    if (p === "fluent") counts.fluent++
  }
  const groups = [...new Set(track.commands.map((c) => c.group))]
  const lessonsDone = Object.values(progress.lessons).filter((l) => l.completed).length
  const lessonsTotal = track.sections.reduce((a, s) => a + s.lessons.length, 0)

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-2 gap-6 sm:grid-cols-5">
        <Big label="started" value={counts.started} of={track.commands.length} />
        <Big label="learning" value={counts.learning} hint="earned xp, below level 4" />
        <Big label="practiced" value={counts.practiced} hint="levels 4–5" />
        <Big label="fluent" value={counts.fluent} hint="levels 6–10" />
        <Big label="lessons" value={lessonsDone} of={lessonsTotal} />
      </div>
      <p className="text-xs text-muted-foreground">
        Each skill levels up on its own. Finish a round in as few keystrokes as the ideal solution (or answer correctly on the first try) to earn 1 xp
        for every command you used.
      </p>

      {groups.map((g) => {
        const rows = track.commands.filter((c) => c.group === g)
        const started = rows.filter((c) => (progress.used[c.id] ?? 0) > 0 || (progress.xp[c.id] ?? 0) > 0).length
        return (
          <section key={g} className="space-y-2">
            <h2 className="font-semibold">
              {g} <span className="text-sm font-normal text-muted-foreground">· {started} of {rows.length}</span>
            </h2>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-24">command</TableHead>
                  <TableHead>name</TableHead>
                  <TableHead className="hidden sm:table-cell">level</TableHead>
                  <TableHead className="w-14 text-right">lv</TableHead>
                  <TableHead className="w-14 text-right">xp</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((c) => {
                  const xp = progress.xp[c.id] ?? 0
                  const { level, into, span } = levelFor(xp)
                  return (
                    <TableRow key={c.id}>
                      <TableCell>
                        <span className="flex items-center gap-1">
                          <KeyBadge k={c.label} />
                          <SaveButton
                            track={track.slug}
                            item={{ id: `command:${c.id}`, kind: "command", title: c.name, keys: [c.label], detail: c.group }}
                          />
                        </span>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {c.name}
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        <div className="flex gap-0.5">
                          {Array.from({ length: 10 }, (_, i) => (
                            <span
                              key={i}
                              className={cn("h-2.5 w-5 rounded-sm bg-muted", i < level && "bg-emerald-500", i === level && level < 10 && into > 0 && "bg-emerald-500/40")}
                              title={i === level ? `${into}/${span} xp to next level` : undefined}
                            />
                          ))}
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-mono">{level}</TableCell>
                      <TableCell className="text-right font-mono">{xp}</TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </section>
        )
      })}
    </div>
  )
}

function Big({ label, value, of, hint }: { label: string; value: number; of?: number; hint?: string }) {
  return (
    <div title={hint}>
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="font-mono text-4xl font-semibold">
        {value}
        {of !== undefined && <span className="text-lg text-muted-foreground">/{of}</span>}
      </div>
    </div>
  )
}
