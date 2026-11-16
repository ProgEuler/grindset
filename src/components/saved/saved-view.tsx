"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { ArrowRight, Bookmark, Copy, Pencil, Plus, Trash } from "@meteor-icons/react"
import { toast } from "sonner"
import { TRACKS, getTrack } from "@/lib/tracks"
import type { Track } from "@/lib/tracks/types"
import { useApp, useHydrated, useSaved, type SavedItem, type SavedKind } from "@/lib/store"
import { Badge } from "@/components/ui/badge"
import { Button, buttonVariants } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { KeyList } from "@/components/key-badge"

const KIND_LABEL: Record<SavedKind, string> = { lesson: "lesson", command: "command", move: "pro move", note: "learning" }
type Filter = "all" | SavedKind

export function SavedView() {
  const params = useSearchParams()
  const router = useRouter()
  const hydrated = useHydrated()
  const allSaved = useApp((s) => s.saved)
  const track = getTrack(params.get("course") ?? "") ?? TRACKS[0]

  return (
    <main className="mx-auto w-full max-w-4xl space-y-6 px-4 py-10">
      <header className="space-y-1">
        <h1 className="flex items-center gap-2 text-3xl font-bold tracking-tight">
          <Bookmark className="size-7 text-amber-500" /> Saved
        </h1>
        <p className="text-muted-foreground">
          Commands, lessons and pro moves you bookmarked, plus your own learnings, organized by course. Look for the bookmark button on lessons, the
          Pro moves page and the Stats table.
        </p>
      </header>

      <Tabs value={track.slug} onValueChange={(v) => router.replace(`/saved?course=${v}`)}>
        <TabsList>
          {TRACKS.map((t) => (
            <TabsTrigger key={t.slug} value={t.slug}>
              {t.title}
              {hydrated && (allSaved[t.slug]?.length ?? 0) > 0 && (
                <Badge variant="secondary" className="ml-1 h-4 px-1.5 text-[10px]">
                  {allSaved[t.slug].length}
                </Badge>
              )}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {hydrated ? <CourseSaved key={track.slug} track={track} /> : <div className="h-64 animate-pulse rounded-xl bg-muted/40" />}
    </main>
  )
}

function CourseSaved({ track }: { track: Track }) {
  const items = useSaved(track.slug)
  const [filter, setFilter] = useState<Filter>("all")
  const shown = filter === "all" ? items : items.filter((i) => i.kind === filter)
  const counts = items.reduce<Record<string, number>>((a, i) => ({ ...a, [i.kind]: (a[i.kind] ?? 0) + 1 }), {})

  function copyMarkdown() {
    const md = [
      `# ${track.title}: saved`,
      "",
      ...items.map((i) => {
        const keys = i.keys?.length ? `\`${i.keys.join(" ")}\` ` : ""
        const note = i.note ? `\n  ${i.note.replace(/\n/g, "\n  ")}` : ""
        return `- ${keys}**${i.title}** (${KIND_LABEL[i.kind]})${note}`
      }),
    ].join("\n")
    navigator.clipboard.writeText(md).then(
      () => toast.success("Copied as Markdown"),
      () => toast.error("Couldn't access the clipboard")
    )
  }

  return (
    <div className="space-y-6">
      <AddLearning track={track} />

      <div className="flex flex-wrap items-center gap-3">
        <ToggleGroup value={[filter]} onValueChange={(v) => (v as string[])[0] && setFilter((v as string[])[0] as Filter)} size="sm">
          <ToggleGroupItem value="all">all ({items.length})</ToggleGroupItem>
          {(["lesson", "command", "move", "note"] as SavedKind[]).map((k) => (
            <ToggleGroupItem key={k} value={k} disabled={!counts[k]}>
              {KIND_LABEL[k]}s ({counts[k] ?? 0})
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
        {items.length > 0 && (
          <Button size="sm" variant="ghost" className="ml-auto" onClick={copyMarkdown}>
            <Copy /> Copy as Markdown
          </Button>
        )}
      </div>

      {shown.length === 0 ? (
        <Card className="border-dashed">
          <CardHeader>
            <CardTitle className="text-base">Nothing saved in {track.title} yet</CardTitle>
            <CardDescription>
              Tap the bookmark icon next to a lesson title, a command or a pro move, or write a learning above.
            </CardDescription>
          </CardHeader>
          <CardFooter>
            <Link href={`/learn/${track.slug}`} className={buttonVariants({ variant: "outline", size: "sm" })}>
              Browse {track.title} lessons <ArrowRight />
            </Link>
          </CardFooter>
        </Card>
      ) : (
        <div className="space-y-3">
          {shown.map((item) => (
            <SavedCard key={item.id} track={track.slug} item={item} />
          ))}
        </div>
      )}
    </div>
  )
}

function AddLearning({ track }: { track: Track }) {
  const addLearning = useApp((s) => s.addLearning)
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState("")
  const [keys, setKeys] = useState("")
  const [note, setNote] = useState("")

  if (!open)
    return (
      <Button variant="outline" onClick={() => setOpen(true)}>
        <Plus /> Add a learning to {track.title}
      </Button>
    )

  return (
    <Card>
      <form
        onSubmit={(e) => {
          e.preventDefault()
          if (!title.trim()) return
          addLearning(track.slug, { title: title.trim(), note: note.trim(), keys: keys.trim() ? keys.trim().split(/\s+/) : undefined })
          toast.success("Learning saved")
          setTitle("")
          setKeys("")
          setNote("")
          setOpen(false)
        }}
      >
        <CardHeader>
          <CardTitle className="text-base">New learning in {track.title}</CardTitle>
          <CardDescription>A tip, a gotcha or a combo you want to remember.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 py-4">
          <div className="grid gap-3 sm:grid-cols-[1fr_180px]">
            <div className="space-y-1.5">
              <Label htmlFor="l-title">Title</Label>
              <Input id="l-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Rename a variable fast" autoFocus required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="l-keys">Keys (optional)</Label>
              <Input id="l-keys" value={keys} onChange={(e) => setKeys(e.target.value)} placeholder="* c i w" className="font-mono" />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="l-note">Note</Label>
            <Textarea id="l-note" value={note} onChange={(e) => setNote(e.target.value)} placeholder="When and why to use it…" rows={3} />
          </div>
        </CardContent>
        <CardFooter className="gap-2">
          <Button type="submit" disabled={!title.trim()}>
            Save learning
          </Button>
          <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
            Cancel
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
}

function SavedCard({ track, item }: { track: string; item: SavedItem }) {
  const updateSavedNote = useApp((s) => s.updateSavedNote)
  const removeSaved = useApp((s) => s.removeSaved)
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(item.note ?? "")

  return (
    <Card size="sm">
      <CardContent className="space-y-2">
        <div className="flex flex-wrap items-start gap-3">
          {item.keys && item.keys.length > 0 && <KeyList keys={item.keys} className="pt-0.5" />}
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-medium">{item.title}</span>
              <Badge variant="outline" className="text-[10px]">
                {KIND_LABEL[item.kind]}
              </Badge>
            </div>
            {item.detail && <p className="text-xs text-muted-foreground">{item.detail}</p>}
          </div>
          <div className="flex items-center gap-1">
            {item.href && (
              <Link href={item.href} className={buttonVariants({ variant: "ghost", size: "xs" })}>
                Open <ArrowRight />
              </Link>
            )}
            <Button size="icon-xs" variant="ghost" aria-label="Edit note" onClick={() => setEditing(!editing)}>
              <Pencil />
            </Button>
            <Button
              size="icon-xs"
              variant="ghost"
              aria-label="Remove"
              onClick={() => {
                removeSaved(track, item.id)
                toast("Removed from saved", { description: item.title })
              }}
            >
              <Trash />
            </Button>
          </div>
        </div>

        {editing ? (
          <div className="space-y-2">
            <Textarea value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="Add your own note…" rows={3} autoFocus />
            <div className="flex gap-2">
              <Button
                size="xs"
                onClick={() => {
                  updateSavedNote(track, item.id, draft.trim())
                  setEditing(false)
                }}
              >
                Save note
              </Button>
              <Button
                size="xs"
                variant="ghost"
                onClick={() => {
                  setDraft(item.note ?? "")
                  setEditing(false)
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          item.note && <p className="text-sm whitespace-pre-wrap text-muted-foreground">{item.note}</p>
        )}
      </CardContent>
    </Card>
  )
}
