import { notFound } from "next/navigation"
import { getTrack, TRACKS } from "@/lib/tracks"
import { LessonSidebar } from "@/components/lesson/lesson-sidebar"
import { MobileLessonNav } from "@/components/lesson/mobile-lesson-nav"

// Every track/lesson URL is prerendered from generateStaticParams, so reading
// params in the shell is fine. Opt out of the dev-only instant-navigation check.
export const instant = false

export function generateStaticParams() {
  return TRACKS.map((t) => ({ track: t.slug }))
}

export default async function LearnLayout({ children, params }: LayoutProps<"/learn/[track]">) {
  const { track: slug } = await params
  const track = getTrack(slug)
  if (!track) notFound()
  return (
    <div className="mx-auto flex w-full max-w-screen-2xl flex-1">
      <aside className="sticky top-14 hidden h-[calc(100vh-3.5rem)] w-80 shrink-0 overflow-y-auto border-r lg:block">
        <LessonSidebar trackSlug={track.slug} />
      </aside>
      <main className="min-w-0 flex-1">
        <MobileLessonNav trackSlug={track.slug} />
        {children}
      </main>
    </div>
  )
}
