import { Suspense } from "react"
import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { allLessons, findLesson, getTrack, TRACKS } from "@/lib/tracks"
import { LessonView } from "@/components/lesson/lesson-view"

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

async function Lesson({ params }: { params: PageProps<"/learn/[track]/[lesson]">["params"] }) {
  const { track: t, lesson: l } = await params
  const track = getTrack(t)
  if (!track || !findLesson(track, l)) notFound()
  return <LessonView trackSlug={track.slug} lessonSlug={l} />
}

export default function LessonPage({ params }: PageProps<"/learn/[track]/[lesson]">) {
  return (
    <Suspense fallback={<div className="mx-auto h-96 max-w-3xl animate-pulse px-8 py-8" />}>
      <Lesson params={params} />
    </Suspense>
  )
}
