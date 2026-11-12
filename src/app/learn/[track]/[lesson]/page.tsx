import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { allLessons, findLesson, getTrack, TRACKS } from "@/lib/tracks"
import { LessonView } from "@/components/lesson/lesson-view"

export const instant = false

export function generateStaticParams() {
  return TRACKS.flatMap((t) => allLessons(t).map((l) => ({ track: t.slug, lesson: l.slug })))
}

export async function generateMetadata({ params }: PageProps<"/learn/[track]/[lesson]">): Promise<Metadata> {
  const { track: t, lesson: l } = await params
  const track = getTrack(t)
  const found = track && findLesson(track, l)
  if (!track || !found) return {}
  return { title: `${found.lesson.title} · ${track.title}` }
}

export default async function LessonPage({ params }: PageProps<"/learn/[track]/[lesson]">) {
  const { track: t, lesson: l } = await params
  const track = getTrack(t)
  if (!track || !findLesson(track, l)) notFound()
  return <LessonView trackSlug={track.slug} lessonSlug={l} />
}
