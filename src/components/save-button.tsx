"use client"

import { Bookmark } from "@meteor-icons/react"
import { toast } from "sonner"
import { useApp, useHydrated, type SaveInput } from "@/lib/store"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

/** Bookmark toggle. Saved items are filed under their course on the /saved page. */
export function SaveButton({
  track,
  item,
  label,
  className,
}: {
  track: string
  item: SaveInput
  /** show a text label next to the icon */
  label?: boolean
  className?: string
}) {
  const hydrated = useHydrated()
  const saved = useApp((s) => (s.saved[track] ?? []).some((x) => x.id === item.id))
  const toggleSaved = useApp((s) => s.toggleSaved)
  const isSaved = hydrated && saved

  return (
    <Button
      type="button"
      size={label ? "xs" : "icon-xs"}
      variant={isSaved ? "secondary" : "ghost"}
      aria-pressed={isSaved}
      aria-label={isSaved ? `Remove "${item.title}" from saved` : `Save "${item.title}"`}
      title={isSaved ? "Saved: click to remove" : "Save for later"}
      className={cn(isSaved && "text-amber-500", className)}
      onClick={(e) => {
        e.preventDefault()
        e.stopPropagation()
        const now = toggleSaved(track, item)
        toast(now ? "Saved" : "Removed from saved", { description: item.title })
      }}
    >
      <Bookmark />
      {label && (isSaved ? "Saved" : "Save")}
    </Button>
  )
}
