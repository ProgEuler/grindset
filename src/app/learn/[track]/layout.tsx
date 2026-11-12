import { Suspense } from "react"
import { notFound } from "next/navigation"
import { getTrack, TRACKS } from "@/lib/tracks"
import { LessonSidebar } from "@/components/lesson/lesson-sidebar"
import { MobileLessonNav } from "@/components/lesson/mobile-lesson-nav"

export function generateStaticParams() {
  return TRACKS.map((t) => ({ track: t.slug }))
}

async function Sidebar({ params, mobile }: { params: LayoutProps<"/learn/[track]">["params"]; mobile?: boolean }) {
  const { track: slug } = await params
  const track = getTrack(slug)
  if (!track) notFound()
  return mobile ? <MobileLessonNav trackSlug={track.slug} /> : <LessonSidebar trackSlug={track.slug} />
}

export default function LearnLayout({ children, params }: LayoutProps<"/learn/[track]">) {
  return (
    <div className="mx-auto flex w-full max-w-screen-2xl flex-1">
      <aside className="sticky top-14 hidden h-[calc(100vh-3.5rem)] w-80 shrink-0 overflow-y-auto border-r lg:block">
        <Suspense>
          <Sidebar params={params} />
        </Suspense>
      </aside>
      <main className="min-w-0 flex-1">
        <Suspense>
          <Sidebar params={params} mobile />
        </Suspense>
        {children}
      </main>
    </div>
  )
}
