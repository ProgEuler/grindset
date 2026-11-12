import { Suspense } from "react"
import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { getTrack, TRACKS } from "@/lib/tracks"
import { Practice } from "@/components/practice/practice"

export const metadata: Metadata = { title: "Practice" }

export function generateStaticParams() {
  return TRACKS.map((t) => ({ track: t.slug }))
}

async function PracticeForTrack({ params }: { params: PageProps<"/practice/[track]">["params"] }) {
  const { track } = await params
  if (!getTrack(track)) notFound()
  return <Practice trackSlug={track} />
}

export default function PracticePage({ params }: PageProps<"/practice/[track]">) {
  return (
    <Suspense>
      <PracticeForTrack params={params} />
    </Suspense>
  )
}
