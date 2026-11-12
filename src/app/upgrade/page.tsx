import type { Metadata } from "next"
import Link from "next/link"
import { CheckIcon, LockIcon } from "lucide-react"
import { TRACKS, lessonCount } from "@/lib/tracks"
import { PRO_PLAN } from "@/lib/config"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { KeyList } from "@/components/key-badge"
import { Checkout } from "@/components/upgrade/checkout"

export const metadata: Metadata = { title: "Pro: lifetime access" }

const TASTE = [
  { keys: ["c", "i", "w"], text: "Change a whole word" },
  { keys: ["d", "i", "{"], text: "Clear the inside of a block" },
  { keys: ["V", "y", "p"], text: "Select, copy and paste lines" },
  { keys: ["*", "n"], text: "Jump between uses of a word" },
]

export default function UpgradePage() {
  const proLessons = TRACKS.reduce((a, t) => a + lessonCount(t).pro, 0)
  return (
    <main className="mx-auto w-full max-w-5xl space-y-16 px-4 py-12">
      <section className="grid gap-10 lg:grid-cols-[1fr_380px]">
        <div className="space-y-6">
          <h1 className="text-4xl font-bold tracking-tight">
            Make it
            <br />
            second nature.
          </h1>
          <p className="text-lg text-muted-foreground">Go past the basics: edit words, lines and whole blocks of code like a pro.</p>
          <div className="space-y-2">
            <p className="text-sm font-medium">A taste of what you&apos;ll learn</p>
            <div className="grid gap-2 sm:grid-cols-2">
              {TASTE.map((t) => (
                <div key={t.text} className="flex items-center gap-3 rounded-lg border p-3 text-sm">
                  <KeyList keys={t.keys} />
                  <span className="text-muted-foreground">{t.text}</span>
                </div>
              ))}
            </div>
            <p className="text-sm text-muted-foreground">
              And that&apos;s only the start. Pro includes {proLessons} lessons on editing, navigation, search, text objects and visual mode.{" "}
              <a href="#skills" className="text-primary underline">
                See all Pro skills →
              </a>
            </p>
          </div>
        </div>

        <Card className="h-fit border-amber-500/40">
          <CardHeader>
            <Badge className="w-fit bg-amber-500 text-black">PRO</Badge>
            <CardTitle className="text-xl">Lifetime access</CardTitle>
            <CardDescription>
              <span className="font-mono text-4xl font-bold text-foreground">${PRO_PLAN.price}</span> once. Yours for life.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              {PRO_PLAN.features.map((f) => (
                <li key={f} className="flex gap-2">
                  <CheckIcon className="size-4 shrink-0 text-emerald-500" /> {f}
                </li>
              ))}
            </ul>
          </CardContent>
          <CardFooter className="flex-col gap-2">
            <Checkout />
            <p className="text-center text-xs text-muted-foreground">One-time payment. No subscription.</p>
          </CardFooter>
        </Card>
      </section>

      <Separator />

      <section id="skills" className="space-y-6">
        <h2 className="text-2xl font-bold">Everything in Pro</h2>
        {TRACKS.map((t) => (
          <div key={t.slug} className="space-y-3">
            <h3 className="font-semibold">{t.title}</h3>
            <div className="grid gap-x-6 gap-y-1 sm:grid-cols-2">
              {t.sections
                .flatMap((s) => s.lessons)
                .filter((l) => l.pro)
                .map((l) => (
                  <Link key={l.slug} href={`/learn/${t.slug}/${l.slug}`} className="flex items-center gap-2 rounded px-2 py-1.5 text-sm hover:bg-muted">
                    <LockIcon className="size-3 text-muted-foreground" />
                    <span className="flex-1">{l.title}</span>
                    <KeyList keys={l.keys} />
                  </Link>
                ))}
            </div>
          </div>
        ))}
      </section>
    </main>
  )
}
