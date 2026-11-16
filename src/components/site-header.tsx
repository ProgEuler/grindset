"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useTheme } from "next-themes"
import { TrendingUp, BookOpen, Star, Fire, Power, Moon, Gear, Sun, User, Bolt, Terminal, Sparkles } from "@meteor-icons/react"
import { TRACKS, getTrack } from "@/lib/tracks"
import { SITE } from "@/lib/config"
import { useApp, useHydrated } from "@/lib/store"
import { cn } from "@/lib/utils"
import { Button, buttonVariants } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

/** Track in focus: from the URL, else the default (first) track. */
export function useCurrentTrack() {
  const pathname = usePathname()
  const m = pathname.match(/^\/(learn|practice)\/([^/]+)/)
  return getTrack(m?.[2] ?? "") ?? TRACKS[0]
}

export function SiteHeader() {
  const pathname = usePathname()
  const router = useRouter()
  const track = useCurrentTrack()
  const hydrated = useHydrated()
  const { user, pro, signOut } = useApp()
  const lastLesson = useApp((s) => s.tracks[track.slug]?.lastLesson)
  const { resolvedTheme, setTheme } = useTheme()

  const nav = [
    { href: `/learn/${track.slug}${lastLesson ? `/${lastLesson}` : ""}`, match: "/learn", label: "Lessons", icon: BookOpen },
    { href: `/practice/${track.slug}`, match: "/practice", label: "Practice", icon: Fire },
    { href: `/stats?track=${track.slug}`, match: "/stats", label: "Stats", icon: TrendingUp },
    ...(track.engine === "vim"
      ? [
          { href: "/playground", match: "/playground", label: "Playground", icon: Terminal },
          { href: "/recap", match: "/recap", label: "Pro moves", icon: Sparkles },
        ]
      : []),
  ]

  return (
    <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-screen-2xl items-center gap-4 px-4">
        <Link href="/" className="flex items-center gap-2 font-semibold">
          <Bolt className="size-5 text-primary" />
          <span className="hidden sm:inline">{SITE.name}</span>
        </Link>

        <DropdownMenu>
          <DropdownMenuTrigger render={<Button variant="outline" size="sm" />}>{track.title}</DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            <DropdownMenuGroup>
              <DropdownMenuLabel>Tracks</DropdownMenuLabel>
              {TRACKS.map((t) => (
                <DropdownMenuItem key={t.slug} onClick={() => router.push(`/learn/${t.slug}`)}>
                  {t.title}
                </DropdownMenuItem>
              ))}
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => router.push("/tracks")}>All tracks</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <nav className="flex flex-1 items-center justify-center gap-1">
          {nav.map((n) => (
            <Link
              key={n.label}
              href={n.href}
              className={cn(buttonVariants({ variant: "ghost", size: "sm" }), pathname.startsWith(n.match) && "bg-muted text-foreground")}
            >
              <n.icon />
              <span className="hidden md:inline">{n.label}</span>
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-1">
          {hydrated && !pro && (
            <Link href="/upgrade?source=nav" className={cn(buttonVariants({ size: "sm" }), "bg-amber-500 text-black hover:bg-amber-400")}>
              <Star /> <span className="hidden sm:inline">Upgrade</span>
            </Link>
          )}
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Toggle theme"
            onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
          >
            <Sun className="hidden dark:block" />
            <Moon className="dark:hidden" />
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger render={<Button variant="ghost" size="icon-sm" aria-label="Account" />}>
              <User />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52">
              <DropdownMenuGroup>
                <DropdownMenuLabel>
                  {hydrated && user ? user.name : "Not signed in"}
                  {hydrated && pro && <span className="ml-2 text-amber-500">Pro</span>}
                </DropdownMenuLabel>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              {!user && <DropdownMenuItem onClick={() => router.push("/signin")}>Sign in</DropdownMenuItem>}
              <DropdownMenuItem onClick={() => router.push("/settings")}>
                <Gear /> Settings
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => router.push("/about")}>About</DropdownMenuItem>
              {user && (
                <DropdownMenuItem onClick={signOut}>
                  <Power /> Sign out
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}
