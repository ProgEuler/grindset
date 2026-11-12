import type { Lesson, Track } from "./types"
import { vimTrack } from "./vim"
import { gitTrack } from "./git"

/** Register new learning tracks here. */
export const TRACKS: Track[] = [vimTrack, gitTrack]

export function getTrack(slug: string): Track | undefined {
  return TRACKS.find((t) => t.slug === slug)
}

export function allLessons(track: Track): Lesson[] {
  return track.sections.flatMap((s) => s.lessons)
}

export function findLesson(track: Track, slug: string) {
  const lessons = allLessons(track)
  const index = lessons.findIndex((l) => l.slug === slug)
  if (index < 0) return null
  const section = track.sections.find((s) => s.lessons.some((l) => l.slug === slug))!
  return { lesson: lessons[index], index, section, prev: lessons[index - 1] ?? null, next: lessons[index + 1] ?? null }
}

/** Commands the learner should know by the time they reach `lesson` (inclusive). */
export function knownCommands(track: Track, lessonSlug: string): Set<string> {
  const known = new Set<string>()
  for (const l of allLessons(track)) {
    l.introduces.forEach((c) => known.add(c))
    if (l.slug === lessonSlug) break
  }
  return known
}

export function lessonCount(track: Track) {
  const lessons = allLessons(track)
  return { total: lessons.length, free: lessons.filter((l) => !l.pro).length, pro: lessons.filter((l) => l.pro).length }
}
