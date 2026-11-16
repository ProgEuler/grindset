"use client"

import { useState } from "react"
import { CircleInfo } from "@meteor-icons/react"
import type { Block } from "@/lib/tracks/types"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { CodeBlock } from "@/components/code-block"
import { KeyList } from "@/components/key-badge"
import { RichText } from "@/components/rich-text"
import { VimDemo } from "@/components/vim/vim-demo"
import { SaveButton } from "@/components/save-button"

/** Where a block lives, so key rows can be saved under the right course. */
export interface BlockSource {
  track: string
  lessonTitle: string
  href: string
}

export function LessonBlocks({ blocks, source }: { blocks: Block[]; source?: BlockSource }) {
  return (
    <div className="space-y-4 leading-7">
      {blocks.map((b, i) => (
        <BlockView key={i} block={b} source={source} />
      ))}
    </div>
  )
}

function BlockView({ block, source }: { block: Block; source?: BlockSource }) {
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
      return <CodeBlock lines={block.text.split("\n")} lineNumbers={false} />

    case "callout":
      return (
        <Alert>
          <CircleInfo />
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
            <KeyRow key={i} item={it} source={source} />
          ))}
        </div>
      )
  }
}

function KeyRow({ item, source }: { item: Extract<Block, { type: "keys" }>["items"][number]; source?: BlockSource }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="p-3">
      <div className="flex flex-wrap items-center gap-3">
        <KeyList keys={item.keys} className="min-w-24" />
        <span className="flex-1 text-sm text-muted-foreground">
          <RichText text={item.desc} />
        </span>
        {source && (
          <SaveButton
            track={source.track}
            item={{
              id: `command:${item.keys.join(" ")}`,
              kind: "command",
              title: item.desc.replace(/[`*]/g, ""),
              keys: item.keys,
              detail: `From "${source.lessonTitle}"`,
              href: source.href,
            }}
          />
        )}
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
