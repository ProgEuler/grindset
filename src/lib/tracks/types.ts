import type { Pos } from "@/lib/vim/engine"
import type { Ctx, VimRound } from "@/lib/vim/generators"

/**
 * Generic, subject-agnostic content model.
 * A Track (e.g. "Vim", "Git") has sections -> lessons -> optional challenge.
 * Each challenge kind is rendered by a pluggable runner (see components/challenge).
 */

export interface VimDemo {
  text: string
  cursor: Pos
  keys: string[]
}

export type Block =
  | { type: "p"; text: string }
  | { type: "h"; text: string }
  | { type: "list"; items: string[] }
  | { type: "keys"; items: { keys: string[]; desc: string; demo?: VimDemo }[] }
  | { type: "demo"; demo: VimDemo; caption?: string }
  | { type: "callout"; title?: string; text: string }
  | { type: "code"; text: string }

export interface QuizQuestion {
  prompt: string
  /** multiple choice when present, otherwise free-text answer */
  choices?: string[]
  /** accepted answers (exact match after trimming/space-collapsing) */
  answer: string[]
  explain?: string
  commands: string[]
}

export type ChallengeSpec =
  | {
      kind: "vim"
      rounds: number
      instructions: string[]
      generate: (ctx: Ctx) => VimRound
    }
  | {
      kind: "quiz"
      rounds: number
      instructions: string[]
      questions: QuizQuestion[]
    }

export interface Lesson {
  slug: string
  title: string
  /** short key badges shown in the sidebar, e.g. ["h","j","k","l"] */
  keys: string[]
  /** command ids first taught by this lesson (used for "known" sets and stats) */
  introduces: string[]
  blocks: Block[]
  tips?: { title: string; text: string }[]
  challenge?: ChallengeSpec
  editor?: { relativeNumbers?: boolean; halfPage?: number; playground?: string }
}

export interface Section {
  title: string
  lessons: Lesson[]
}

export interface CommandInfo {
  id: string
  label: string
  name: string
  group: string
}

export interface PracticeCategory {
  id: string
  label: string
  lessons: string[]
}

export interface Track {
  slug: string
  title: string
  tagline: string
  description: string
  engine: "vim" | "quiz"
  sections: Section[]
  commands: CommandInfo[]
  practice: PracticeCategory[]
}
