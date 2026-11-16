"use client"

import { useState } from "react"
import Link from "next/link"
import { ArrowRight, File, Rotate } from "@meteor-icons/react"
import { PLAYGROUND_FILES } from "@/lib/tracks/vim/playground"
import { PRO_MOVES } from "@/lib/tracks/vim/recap"
import { parseKeys } from "@/lib/tracks/vim/lessons"
import { useApp } from "@/lib/store"
import { Button, buttonVariants } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { KeyList } from "@/components/key-badge"
import { VimPlayground } from "@/components/vim/vim-playground"

const CUSTOM = "custom"

export function PlaygroundView() {
  const defaultRelative = useApp((s) => s.settings.relativeNumbers)
  const [fileId, setFileId] = useState(PLAYGROUND_FILES[0].id)
  const [custom, setCustom] = useState("")
  const [draft, setDraft] = useState("")
  const [relative, setRelative] = useState<boolean | null>(null)
  const [version, setVersion] = useState(0)
  const [open, setOpen] = useState(false)

  const text = fileId === CUSTOM ? custom : PLAYGROUND_FILES.find((f) => f.id === fileId)!.text
  const relativeNumbers = relative ?? defaultRelative

  return (
    <main className="mx-auto w-full max-w-7xl space-y-6 px-4 py-10">
      <header className="space-y-1">
        <h1 className="text-3xl font-bold tracking-tight">Vim playground</h1>
        <p className="text-muted-foreground">
          A free editor with no goals, no timer and no XP. Pick a file and practice any motion you like. Changes reset when you switch files.
        </p>
      </header>

      <div className="flex flex-wrap items-center gap-3">
        <ToggleGroup
          value={[fileId]}
          onValueChange={(v) => {
            const next = (v as string[])[0]
            if (next) setFileId(next)
          }}
          size="sm"
          className="flex-wrap"
        >
          {PLAYGROUND_FILES.map((f) => (
            <ToggleGroupItem key={f.id} value={f.id} className="font-mono text-xs">
              {f.name}
            </ToggleGroupItem>
          ))}
          {custom && (
            <ToggleGroupItem value={CUSTOM} className="font-mono text-xs">
              my-code
            </ToggleGroupItem>
          )}
        </ToggleGroup>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger render={<Button size="sm" variant="outline" />}>
            <File /> Use my own code
          </DialogTrigger>
          <DialogContent className="sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle>Paste your own code</DialogTitle>
              <DialogDescription>It stays in this tab only and is never uploaded.</DialogDescription>
            </DialogHeader>
            <Textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Paste a file you know well…"
              className="h-72 font-mono text-xs"
              spellCheck={false}
            />
            <DialogFooter>
              <DialogClose render={<Button variant="ghost" />}>Cancel</DialogClose>
              <Button
                disabled={!draft.trim()}
                onClick={() => {
                  setCustom(draft.replace(/\t/g, "  ").replace(/\s+$/, ""))
                  setFileId(CUSTOM)
                  setVersion((n) => n + 1)
                  setOpen(false)
                }}
              >
                Load into editor
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <div className="ml-auto flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Switch id="rel" checked={relativeNumbers} onCheckedChange={(v) => setRelative(v)} />
            <Label htmlFor="rel" className="text-sm">
              Relative numbers
            </Label>
          </div>
          <Button size="sm" variant="ghost" onClick={() => setVersion((n) => n + 1)}>
            <Rotate /> Reset
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
        <div className="min-w-0">
          <VimPlayground
            key={`${fileId}-${version}`}
            text={text}
            relativeNumbers={relativeNumbers}
            maxLines={26}
            halfPage={10}
            autoFocus
            hideReset
          />
        </div>

        <Card className="h-fit">
          <CardHeader>
            <CardTitle className="text-base">Pro moves to try</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[30rem] px-4">
              {PRO_MOVES.map((g) => (
                <div key={g.title} className="pb-4">
                  <div className="pb-1 text-xs font-semibold tracking-wide text-muted-foreground uppercase">{g.title}</div>
                  {g.moves.map((m) => (
                    <div key={m.pro} className="flex items-center gap-3 py-1 text-sm">
                      <KeyList keys={parseKeys(m.pro)} className="min-w-20 shrink-0 flex-nowrap" />
                      <span className="text-muted-foreground">{m.what}</span>
                    </div>
                  ))}
                </div>
              ))}
            </ScrollArea>
            <div className="border-t p-3">
              <Link href="/recap" className={buttonVariants({ variant: "ghost", size: "sm" })}>
                Full recap with examples <ArrowRight />
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
