"use client"

import { useSyncExternalStore } from "react"
import { create } from "zustand"
import { persist } from "zustand/middleware"

/**
 * All learner state lives here and is persisted to localStorage.
 * Swap `persist` for an API-backed sync when you add a real backend;
 * the shape is already per-user/per-track.
 */

export interface LessonProgress {
  completed: boolean
  attempts: number
  bestTimeMs?: number
  bestEfficiency?: number
  completedAt?: string
}

export interface TrackProgress {
  lessons: Record<string, LessonProgress>
  xp: Record<string, number>
  used: Record<string, number>
  lastLesson?: string
}

export interface Settings {
  relativeNumbers: boolean
  showHints: boolean
}

export interface RoundRecord {
  commands: string[]
  keys: number
  ideal: number
}

export type SavedKind = "lesson" | "command" | "move" | "note"

/** A bookmarked command/lesson/pro move, or a learning the user wrote, filed under a course (track). */
export interface SavedItem {
  id: string
  kind: SavedKind
  title: string
  keys?: string[]
  detail?: string
  href?: string
  note?: string
  createdAt: string
}

export type SaveInput = Omit<SavedItem, "createdAt" | "note">

interface AppState {
  user: { name: string; email: string } | null
  settings: Settings
  tracks: Record<string, TrackProgress>
  /** YYYY-MM-DD -> rounds completed that day */
  activity: Record<string, number>
  /** course (track slug) -> saved items, newest first */
  saved: Record<string, SavedItem[]>

  toggleSaved: (track: string, item: SaveInput) => boolean
  addLearning: (track: string, l: { title: string; note: string; keys?: string[] }) => void
  updateSavedNote: (track: string, id: string, note: string) => void
  removeSaved: (track: string, id: string) => void

  signIn: (user: { name: string; email: string }) => void
  signOut: () => void
  updateSettings: (s: Partial<Settings>) => void
  visitLesson: (track: string, lesson: string) => void
  /** Returns the XP earned for this round. */
  recordRound: (track: string, r: RoundRecord) => number
  completeLesson: (track: string, lesson: string, r: { timeMs: number; efficiency: number }) => void
  markLessonDone: (track: string, lesson: string) => void
  resetProgress: () => void
}

const emptyTrack = (): TrackProgress => ({ lessons: {}, xp: {}, used: {} })
export const today = () => new Date().toISOString().slice(0, 10)

export const useApp = create<AppState>()(
  persist(
    (set, get) => ({
      user: null,
      settings: { relativeNumbers: false, showHints: true },
      saved: {},

      toggleSaved: (track, item) => {
        const list = get().saved[track] ?? []
        const exists = list.some((s) => s.id === item.id)
        const next = exists ? list.filter((s) => s.id !== item.id) : [{ ...item, createdAt: new Date().toISOString() }, ...list]
        set({ saved: { ...get().saved, [track]: next } })
        return !exists
      },
      addLearning: (track, l) => {
        const list = get().saved[track] ?? []
        const item: SavedItem = {
          id: `note:${Date.now()}`,
          kind: "note",
          title: l.title,
          note: l.note,
          keys: l.keys?.length ? l.keys : undefined,
          createdAt: new Date().toISOString(),
        }
        set({ saved: { ...get().saved, [track]: [item, ...list] } })
      },
      updateSavedNote: (track, id, note) => {
        const list = get().saved[track] ?? []
        set({ saved: { ...get().saved, [track]: list.map((s) => (s.id === id ? { ...s, note } : s)) } })
      },
      removeSaved: (track, id) => {
        const list = get().saved[track] ?? []
        set({ saved: { ...get().saved, [track]: list.filter((s) => s.id !== id) } })
      },
      tracks: {},
      activity: {},

      signIn: (user) => set({ user }),
      signOut: () => set({ user: null }),
      updateSettings: (s) => set({ settings: { ...get().settings, ...s } }),

      visitLesson: (track, lesson) => {
        const t = get().tracks[track] ?? emptyTrack()
        if (t.lastLesson === lesson) return
        set({ tracks: { ...get().tracks, [track]: { ...t, lastLesson: lesson } } })
      },

      recordRound: (track, r) => {
        const t = get().tracks[track] ?? emptyTrack()
        const efficient = r.keys <= r.ideal
        const uniq = [...new Set(r.commands)]
        const xp = { ...t.xp }
        const used = { ...t.used }
        for (const c of uniq) {
          used[c] = (used[c] ?? 0) + 1
          if (efficient) xp[c] = (xp[c] ?? 0) + 1
        }
        const d = today()
        set({
          tracks: { ...get().tracks, [track]: { ...t, xp, used } },
          activity: { ...get().activity, [d]: (get().activity[d] ?? 0) + 1 },
        })
        return efficient ? uniq.length : 0
      },

      completeLesson: (track, lesson, r) => {
        const t = get().tracks[track] ?? emptyTrack()
        const prev = t.lessons[lesson] ?? { completed: false, attempts: 0 }
        const next: LessonProgress = {
          completed: true,
          attempts: prev.attempts + 1,
          bestTimeMs: prev.bestTimeMs === undefined ? r.timeMs : Math.min(prev.bestTimeMs, r.timeMs),
          bestEfficiency: Math.max(prev.bestEfficiency ?? 0, r.efficiency),
          completedAt: prev.completedAt ?? new Date().toISOString(),
        }
        set({ tracks: { ...get().tracks, [track]: { ...t, lessons: { ...t.lessons, [lesson]: next } } } })
      },

      markLessonDone: (track, lesson) => {
        const t = get().tracks[track] ?? emptyTrack()
        const prev = t.lessons[lesson] ?? { completed: false, attempts: 0 }
        if (prev.completed) return
        set({
          tracks: {
            ...get().tracks,
            [track]: { ...t, lessons: { ...t.lessons, [lesson]: { ...prev, completed: true, completedAt: new Date().toISOString() } } },
          },
        })
      },

      resetProgress: () => set({ tracks: {}, activity: {} }),
    }),
    { name: "grindset", version: 1, skipHydration: true }
  )
)

const subscribeHydration = (cb: () => void) => useApp.persist.onFinishHydration(cb)
/** true once localStorage state has been loaded on the client */
export function useHydrated() {
  return useSyncExternalStore(subscribeHydration, () => useApp.persist.hasHydrated(), () => false)
}

const NO_SAVED: SavedItem[] = []
export function useSaved(track: string): SavedItem[] {
  return useApp((s) => s.saved[track]) ?? NO_SAVED
}

export function useTrackProgress(track: string): TrackProgress {
  return useApp((s) => s.tracks[track]) ?? EMPTY
}
const EMPTY: TrackProgress = emptyTrack()

/* --------------------------- levels --------------------------- */

const LEVELS = [0, 1, 3, 6, 10, 16, 24, 34, 46, 60, 76]
export const MAX_LEVEL = LEVELS.length - 1

export function levelFor(xp: number): { level: number; into: number; span: number } {
  let level = 0
  while (level < MAX_LEVEL && xp >= LEVELS[level + 1]) level++
  const span = level < MAX_LEVEL ? LEVELS[level + 1] - LEVELS[level] : 1
  return { level, into: xp - LEVELS[level], span }
}

export type Proficiency = "new" | "learning" | "practiced" | "fluent"
export function proficiency(xp: number, used: number): Proficiency {
  const { level } = levelFor(xp)
  if (level >= 6) return "fluent"
  if (level >= 4) return "practiced"
  if (xp > 0 || used > 0) return "learning"
  return "new"
}
