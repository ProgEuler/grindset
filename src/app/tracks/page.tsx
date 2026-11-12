import type { Metadata } from "next"
import Link from "next/link"
import { ArrowRight } from "@meteor-icons/react"
import { TRACKS, lessonCount } from "@/lib/tracks"
import { Badge } from "@/components/ui/badge"
import { buttonVariants } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"

export const metadata: Metadata = { title: "Tracks" }

export default function TracksPage() {
  return (
    <main className="mx-auto w-full max-w-5xl space-y-6 px-4 py-10">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Tracks</h1>
        <p className="text-muted-foreground">Every track uses the same lessons, challenges, practice and stats system.</p>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {TRACKS.map((t) => {
          const c = lessonCount(t)
          return (
            <Card key={t.slug}>
              <CardHeader>
                <CardTitle>{t.title}</CardTitle>
                <CardDescription>{t.tagline}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-muted-foreground">
                <p>{t.description}</p>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary">{c.total} lessons</Badge>
                  <Badge variant="outline">{t.sections.length} sections</Badge>
                  <Badge variant="outline">{t.commands.length} skills tracked</Badge>
                </div>
              </CardContent>
              <CardFooter className="gap-2">
                <Link href={`/learn/${t.slug}`} className={buttonVariants()}>
                  Lessons <ArrowRight />
                </Link>
                <Link href={`/practice/${t.slug}`} className={buttonVariants({ variant: "outline" })}>
                  Practice
                </Link>
              </CardFooter>
            </Card>
          )
        })}
      </div>
    </main>
  )
}
