import type { Metadata } from "next"
import { SITE } from "@/lib/config"

export const metadata: Metadata = { title: "About" }

export default function AboutPage() {
  return (
    <main className="mx-auto w-full max-w-2xl space-y-4 px-4 py-12 leading-7">
      <h1 className="text-3xl font-bold tracking-tight">About {SITE.name}</h1>
      <p className="text-muted-foreground">
        {SITE.name} is built on one idea: you learn a skill by doing it, over and over, with instant feedback. You don&apos;t learn it by reading about it.
      </p>
      <p className="text-muted-foreground">
        Each track is a set of short lessons. Every lesson ends with a challenge that&apos;s generated fresh each time you play it. The platform tracks
        each individual skill (each command), so you can see what you&apos;ve mastered and what still needs practice.
      </p>
      <p className="text-muted-foreground">
        The Vim track runs on a built-in Vim emulator, so challenges are checked against real Vim behaviour. Other tracks plug in their own challenge
        types (the Git track uses recall drills) and share the same lessons, practice, XP and stats.
      </p>
    </main>
  )
}
