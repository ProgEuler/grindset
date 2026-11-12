import { Suspense } from "react"
import { notFound, redirect } from "next/navigation"
import { allLessons, getTrack } from "@/lib/tracks"

async function RedirectToFirst({ params }: { params: PageProps<"/learn/[track]">["params"] }) {
  const { track: slug } = await params
  const track = getTrack(slug)
  if (!track) notFound()
  redirect(`/learn/${track.slug}/${allLessons(track)[0].slug}`)
  return null
}

export default function TrackIndex({ params }: PageProps<"/learn/[track]">) {
  return (
    <Suspense>
      <RedirectToFirst params={params} />
    </Suspense>
  )
}
