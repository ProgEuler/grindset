"use client"

import { useState } from "react"
import { InfoIcon } from "lucide-react"
import type { Block } from "@/lib/tracks/types"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { KeyList } from "@/components/key-badge"
import { RichText } from "@/components/rich-text"
import { VimDemo } from "@/components/vim/vim-demo"

export function LessonBlocks({ blocks }: { blocks: Block[] }) {
  return (
    <div className="space-y-4 leading-7">
      {blocks.map((b, i) => (
        <BlockView key={i} block={b} />
      ))}
    </div>
  )
}

function BlockView({ block }: { block: Block }) {
  switch (block.type) {
    case "p":
      return (
        <p className="text-muted-foreground">
          <RichText text={block.text} />
        </p>
      )
    case "h":
      return <h3 className="pt-2 text-lg font-semibold">{block.text}</h3>
    case "list":
      return (
        <ul className="ml-5 list-disc space-y-1 text-muted-foreground">
          {block.items.map((it, i) => (
            <li key={i}>
              <RichText text={it} />
            </li>
          ))}
        </ul>
      )
    case "code":
      return <pre className="overflow-auto rounded-lg border bg-muted/40 p-4 font-mono text-sm leading-6">{block.text}</pre>
    case "callout":
      return (
        <Alert>
          <InfoIcon />
          {block.title && <AlertTitle>{block.title}</AlertTitle>}
          <AlertDescription>
            <RichText text={block.text} />
          </AlertDescription>
        </Alert>
      )
    case "demo":
      return <VimDemo demo={block.demo} caption={block.caption} />
    case "keys":
      return (
        <div className="divide-y rounded-xl border">
          {block.items.map((it, i) => (
            <KeyRow key={i} item={it} />
          ))}
        </div>
      )
  }
}

function KeyRow({ item }: { item: Extract<Block, { type: "keys" }>["items"][number] }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="p-3">
      <div className="flex flex-wrap items-center gap-3">
        <KeyList keys={item.keys} className="min-w-24" />
        <span className="flex-1 text-sm text-muted-foreground">
          <RichText text={item.desc} />
        </span>
        {item.demo && (
          <Button size="xs" variant="outline" onClick={() => setOpen(!open)}>
            {open ? "hide example" : "show example"}
          </Button>
        )}
      </div>
      {open && item.demo && (
        <div className="mt-3">
          <VimDemo demo={item.demo} compact />
        </div>
      )}
    </div>
  )
}
