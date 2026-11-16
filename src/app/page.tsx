import Link from "next/link"
import { ArrowRight, Microchip, Command, Layers, Refresh } from "@meteor-icons/react"
import { TRACKS, lessonCount } from "@/lib/tracks"
import { SITE } from "@/lib/config"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { buttonVariants } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { KeyBadge } from "@/components/key-badge"
import { TryIt } from "@/components/home/try-it"

const STEPS = [
  {
    icon: Command,
    title: "Learn by doing",
    text: "Every lesson drops you into a real, working editor. You start pressing keys right away.",
  },
  {
    icon: Refresh,
    title: "Build muscle memory",
    text: "Challenges are generated fresh every time, so you can repeat them until the moves feel automatic. Each command levels up as you go.",
  },
  {
    icon: Layers,
    title: "Structured from zero",
    text: "A curriculum that builds step by step, from the first keystroke to advanced techniques. You don't need any setup or prior experience.",
  },
]

export default function Home() {
  const vim = lessonCount(TRACKS[0])
  return (
    <main className="mx-auto w-full max-w-6xl space-y-24 px-4 py-16">
      <section className="grid items-center gap-10 lg:grid-cols-2 [&>*]:min-w-0">
        <div className="space-y-6">
          <Badge variant="secondary">Interactive · in your browser · 100% free</Badge>
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
            Learn Vim. <span className="text-primary">Finally make it stick.</span>
          </h1>
          <p className="text-lg text-muted-foreground">
            {SITE.name} teaches through hands-on drills that build real muscle memory. Master motions, operators and text objects with{" "}
            {vim.total} interactive lessons, then take the same approach to other skills.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link href="/learn/vim" className={buttonVariants({ size: "lg" })}>
              Start learning Vim <ArrowRight />
            </Link>
            <Link href="/tracks" className={buttonVariants({ size: "lg", variant: "outline" })}>
              Browse tracks
            </Link>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            Try it now: use <KeyBadge k="w" /> <KeyBadge k="e" /> <KeyBadge k="b" /> <KeyBadge k="h" /> <KeyBadge k="j" /> <KeyBadge k="k" />{" "}
            <KeyBadge k="l" /> to reach the green target →
          </div>
        </div>
        <div className="min-w-0">
          <TryIt />
        </div>
      </section>

      <section className="space-y-8">
        <h2 className="text-center text-sm font-semibold tracking-widest text-muted-foreground uppercase">How it works</h2>
        <div className="grid gap-4 md:grid-cols-3">
          {STEPS.map((s, i) => (
            <Card key={s.title}>
              <CardHeader>
                <div className="font-mono text-xs text-muted-foreground">0{i + 1}</div>
                <CardTitle className="flex items-center gap-2">
                  <s.icon className="size-5 text-primary" /> {s.title}
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">{s.text}</CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="space-y-8">
        <div className="text-center">
          <h2 className="text-2xl font-bold">Tracks</h2>
          <p className="text-muted-foreground">One engine, many skills. New tracks plug into the same lessons, practice and stats.</p>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {TRACKS.map((t) => {
            const c = lessonCount(t)
            return (
              <Card key={t.slug}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Microchip className="size-5 text-primary" /> {t.title}
                  </CardTitle>
                  <CardDescription>{t.description}</CardDescription>
                </CardHeader>
                <CardContent className="flex gap-2 text-xs">
                  <Badge variant="secondary">{c.total} lessons</Badge>
                  <Badge variant="outline">free</Badge>
                  <Badge variant="outline">{t.engine === "vim" ? "live editor" : "recall drills"}</Badge>
                </CardContent>
                <CardFooter>
                  <Link href={`/learn/${t.slug}`} className={buttonVariants({ variant: "secondary" })}>
                    Start {t.title} <ArrowRight />
                  </Link>
                </CardFooter>
              </Card>
            )
          })}
        </div>
      </section>

      <section className="rounded-2xl border bg-muted/30 p-10 text-center">
        <p className="text-xs font-semibold tracking-widest text-muted-foreground uppercase">Free forever</p>
        <h2 className="mt-2 text-3xl font-bold">No setup. No config files.</h2>
        <p className="mt-2 text-muted-foreground">
          Just open your browser and start moving. Every lesson, drill and tool is free. No account, no subscription.
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <Link href="/learn/vim" className={buttonVariants({ size: "lg" })}>
            Start learning
          </Link>
          <Link href="/playground" className={cn(buttonVariants({ size: "lg", variant: "outline" }))}>
            Open the playground
          </Link>
        </div>
      </section>

      <footer className="flex justify-between border-t pt-6 text-xs text-muted-foreground">
        <span>
          © {SITE.name}
        </span>
        <span className="flex gap-4">
          <Link href="/about">About</Link>
          <Link href="/tracks">Tracks</Link>
        </span>
      </footer>
    </main>
  )
}
