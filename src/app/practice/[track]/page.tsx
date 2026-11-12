import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { getTrack, TRACKS } from "@/lib/tracks"
import { Practice } from "@/components/practice/practice"

export const metadata: Metadata = { title: "Practice" }
export const instant = false

export function generateStaticParams() {
  return TRACKS.map((t) => ({ track: t.slug }))
}

export default async function PracticePage({ params }: PageProps<"/practice/[track]">) {
  const { track } = await params
  if (!getTrack(track)) notFound()
  return <Practice trackSlug={track} />
}
