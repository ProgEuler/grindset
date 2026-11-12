import { notFound, redirect } from "next/navigation"
import { allLessons, getTrack } from "@/lib/tracks"

export const instant = false

export default async function TrackIndex({ params }: PageProps<"/learn/[track]">) {
  const { track: slug } = await params
  const track = getTrack(slug)
  if (!track) notFound()
  redirect(`/learn/${track.slug}/${allLessons(track)[0].slug}`)
}
