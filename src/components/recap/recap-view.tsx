"use client"

import { useState } from "react"
import Link from "next/link"
import { ArrowRight, Terminal } from "@meteor-icons/react"
import { PRO_MOVES, keyCount, moveKeys, type ProMove } from "@/lib/tracks/vim/recap"
import { parseKeys } from "@/lib/tracks/vim/lessons"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button, buttonVariants } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { KeyList } from "@/components/key-badge"
import { RichText } from "@/components/rich-text"
import { VimDemo } from "@/components/vim/vim-demo"

const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-")

export function RecapView() {
  return (
    <main className="mx-auto w-full max-w-5xl space-y-10 px-4 py-10">
      <header className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Vim pro moves</h1>
        <p className="text-muted-foreground">
          A quick recap of the commands experienced Vim users reach for, and the slower habits they replace. Every pair below produces exactly the
          same result. Hit <span className="font-medium text-foreground">Try it</span> to watch both.
        </p>
        <Link href="/playground" className={cn(buttonVariants({ variant: "outline", size: "sm" }), "mt-2")}>
          <Terminal /> Practice them in the playground
        </Link>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>At a glance</CardTitle>
          <CardDescription>Click any command to jump to its explanation.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-x-6 gap-y-1 sm:grid-cols-2 lg:grid-cols-3">
          {PRO_MOVES.flatMap((g) => g.moves).map((m) => (
            <a key={m.pro} href={`#${slug(m.pro + m.what)}`} className="flex items-center gap-3 rounded-md px-2 py-1.5 text-sm hover:bg-muted">
              <KeyList keys={parseKeys(m.pro)} className="min-w-20 shrink-0 flex-nowrap" />
              <span className="truncate text-muted-foreground">{m.what}</span>
            </a>
          ))}
        </CardContent>
      </Card>

      {PRO_MOVES.map((g) => (
        <section key={g.title} className="space-y-3">
          <div>
            <h2 className="text-xl font-semibold">{g.title}</h2>
            <p className="text-sm text-muted-foreground">{g.blurb}</p>
          </div>
          <div className="divide-y rounded-xl border">
            {g.moves.map((m) => (
              <MoveRow key={m.pro} move={m} />
            ))}
          </div>
        </section>
      ))}
    </main>
  )
}

function MoveRow({ move }: { move: ProMove }) {
  const [open, setOpen] = useState(false)
  const saved = keyCount(move.slow) - keyCount(move.pro)
  return (
    <div id={slug(move.pro + move.what)} className="scroll-mt-20 p-4">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <div className="min-w-0 flex-1 basis-60">
          <div className="font-medium">{move.what}</div>
          {move.why && (
            <p className="text-sm text-muted-foreground">
              <RichText text={move.why} />
            </p>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <span className="text-xs text-muted-foreground">instead of</span>
          <KeyList keys={parseKeys(move.slow)} className="opacity-60" />
          <ArrowRight className="size-4 text-muted-foreground" />
          <KeyList keys={parseKeys(move.pro)} />
          {move.type !== undefined && <span className="text-xs text-muted-foreground">then type &amp; Esc</span>}
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={saved > 0 ? "secondary" : "outline"}>{saved > 0 ? `saves ${saved} key${saved > 1 ? "s" : ""}` : "works anywhere"}</Badge>
          <Button size="xs" variant="outline" onClick={() => setOpen(!open)}>
            {open ? "Hide" : "Try it"}
          </Button>
        </div>
      </div>
      {open && (
        <Tabs defaultValue="pro" className="mt-3">
          <TabsList>
            <TabsTrigger value="pro">Pro way</TabsTrigger>
            <TabsTrigger value="slow">Slow way</TabsTrigger>
          </TabsList>
          <TabsContent value="pro">
            <VimDemo demo={{ text: move.text, cursor: move.cursor, keys: moveKeys(move, "pro") }} compact />
          </TabsContent>
          <TabsContent value="slow">
            <VimDemo demo={{ text: move.text, cursor: move.cursor, keys: moveKeys(move, "slow") }} compact />
          </TabsContent>
        </Tabs>
      )}
    </div>
  )
}
