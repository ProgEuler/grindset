"use client"

import Link from "next/link"
import { useParams } from "next/navigation"
import { Check } from "@meteor-icons/react"
import type { Track } from "@/lib/tracks/types"
import { getTrack } from "@/lib/tracks"
import { useHydrated, useTrackProgress } from "@/lib/store"
import { cn } from "@/lib/utils"
import { KeyBadge } from "@/components/key-badge"

export function LessonSidebar({ trackSlug, onNavigate }: { trackSlug: string; onNavigate?: () => void }) {
  const track = getTrack(trackSlug) as Track
  const params = useParams<{ lesson?: string }>()
  const progress = useTrackProgress(track.slug)
  const hydrated = useHydrated()

  return (
    <nav className="space-y-5 py-4 pr-2 pl-4 text-sm">
      {track.sections.map((section) => (
        <div key={section.title}>
          <div className="mb-1.5 px-2 text-xs font-semibold tracking-wide text-primary uppercase">{section.title}</div>
          <ul className="space-y-0.5">
            {section.lessons.map((l) => {
              const active = params.lesson === l.slug
              const done = hydrated && progress.lessons[l.slug]?.completed
              return (
                <li key={l.slug}>
                  <Link
                    href={`/learn/${track.slug}/${l.slug}`}
                    onClick={onNavigate}
                    className={cn(
                      "flex items-center gap-2 rounded-md border-l-2 border-transparent px-2 py-1.5 hover:bg-muted",
                      active && "border-primary bg-muted font-medium"
                    )}
                  >
                    <span className="flex size-4 shrink-0 items-center justify-center">
                      {done && <Check className="size-4 text-emerald-500" />}
                    </span>
                    <span className="flex-1 truncate">{l.title}</span>
                    <span className="flex shrink-0 gap-0.5">
                      {l.keys.map((k, i) => (
                        <KeyBadge key={i} k={k} className="h-5 min-w-5 px-1 text-[10px]" />
                      ))}
                    </span>
                  </Link>
                </li>
              )
            })}
          </ul>
        </div>
      ))}
    </nav>
  )
}
