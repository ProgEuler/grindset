import type { Pos } from "@/lib/vim/engine"
import { parseKeys } from "./lessons"

/**
 * "Pro moves": the habits that separate fluent Vim users from beginners.
 * Each move has a slow way and a pro way. Both run on the same `text` from the
 * same `cursor` (then type `type` and press Esc, when set), and
 * `scripts/recap-test.ts` checks they produce the same buffer. That way the
 * recap can never teach something wrong.
 */

export interface ProMove {
  pro: string
  slow: string
  what: string
  why?: string
  /** text typed in insert mode after the command (followed by Esc) */
  type?: string
  text: string
  cursor: Pos
}

export interface ProMoveGroup {
  title: string
  blurb: string
  moves: ProMove[]
}

const at = (line: number, col: number): Pos => ({ line, col })

export const PRO_MOVES: ProMoveGroup[] = [
  {
    title: "Start typing in the right place",
    blurb: "Most edits begin by entering insert mode. Pick the command that drops you exactly where you want to type.",
    moves: [
      { pro: "I", slow: "0i", type: "new ", what: "Insert at the start of the line", why: "`I` also skips indentation, which `0i` doesn't.", text: "return sum;", cursor: at(0, 7) },
      { pro: "A", slow: "$a", type: ";", what: "Append at the end of the line", text: "const sum = 0", cursor: at(0, 3) },
      { pro: "o", slow: "A<CR>", type: "x();", what: "Open a new line below", text: "if (ok) {\n}", cursor: at(0, 2) },
      { pro: "O", slow: "kA<CR>", type: "x();", what: "Open a new line above", text: "if (ok) {\n}", cursor: at(1, 0) },
      { pro: "s", slow: "xi", type: "count", what: "Replace one character with new text", text: "let x = 1;", cursor: at(0, 4) },
      { pro: "S", slow: "_Da", type: "fresh();", what: "Rewrite the whole line (indentation kept)", why: "`cc` does the same thing.", text: "  old code();", cursor: at(0, 6) },
      { pro: "C", slow: "Da", type: "'new';", what: "Change from the cursor to the end of the line", text: "const name = 'old';", cursor: at(0, 13) },
    ],
  },
  {
    title: "Change and delete without aiming",
    blurb: "Text objects work from anywhere inside the thing you want to change, so you don't have to line the cursor up first.",
    moves: [
      { pro: "ciw", slow: "bcw", type: "count", what: "Change the word under the cursor", why: "Same key count, but `ciw` works from any letter. If you're already on the first letter, `bcw` jumps back to the previous word.", text: "const userName = 1;", cursor: at(0, 9) },
      { pro: 'ci"', slow: 'F"lct"', type: "hi", what: "Change the contents of a string", text: 'greet("hello world");', cursor: at(0, 10) },
      { pro: "di(", slow: "F(ldt)", what: "Empty the parentheses", text: "sum(a, b, c);", cursor: at(0, 7) },
      { pro: "da(", slow: "F(df)", what: "Delete the parentheses and their contents", text: "call(arg).then();", cursor: at(0, 6) },
      { pro: "ci{", slow: "F{lct}", type: " b: 2 ", what: "Change the inside of braces", text: "const o = { a: 1 };", cursor: at(0, 13) },
      { pro: "daw", slow: "bdw", what: "Delete a word and its space", why: "Works from any letter in the word. `bdw` breaks when you're already at the start.", text: "const very long = 1;", cursor: at(0, 8) },
      { pro: "dip", slow: "kd}", what: "Delete a whole block of lines", why: "Works from any line in the block. The slow way depends on exactly where you are.", text: "a\nb\nc\n\nd", cursor: at(1, 0) },
    ],
  },
  {
    title: "Jump instead of crawl",
    blurb: "Pressing h j k l over and over is the most common beginner habit. Jump straight to where you want to be.",
    moves: [
      { pro: "f(", slow: "lllllllll", what: "Jump to a character on the line", text: "const total = sum(a);", cursor: at(0, 8) },
      { pro: "dt;", slow: "xxxxxxxxxx", what: "Delete up to (not including) a character", text: "x = compute(a);", cursor: at(0, 4) },
      { pro: "w", slow: "llllll", what: "Move by word, not by letter", text: "const result = 1;", cursor: at(0, 0) },
      { pro: "5j", slow: "jjjjj", what: "Use a count instead of repeating a key", text: "1\n2\n3\n4\n5\n6\n7", cursor: at(0, 0) },
      { pro: "G", slow: "jjjjjj", what: "Go to the last line (`gg` goes to the first)", text: "1\n2\n3\n4\n5\n6\n7", cursor: at(0, 0) },
      { pro: "}", slow: "jjj", what: "Jump to the next blank line (paragraph)", text: "a\nb\nc\n\nd", cursor: at(0, 0) },
      { pro: "*", slow: "/total<CR>", what: "Find the next use of the word under the cursor", text: "function total(items) {\n  return total;\n}", cursor: at(0, 10) },
      { pro: "_", slow: "0w", what: "Go to the first non-blank character", text: "    return sum;", cursor: at(0, 12) },
    ],
  },
  {
    title: "Small fixes in a few keystrokes",
    blurb: "These are the little edits you make dozens of times a day.",
    moves: [
      { pro: "ru", slow: "xiu<Esc>", what: "Fix a one-letter typo without leaving normal mode", text: "retirn x;", cursor: at(0, 3) },
      { pro: "xp", slow: "xlie<Esc>", what: "Swap two characters (teh → the)", text: "teh end", cursor: at(0, 1) },
      { pro: "~", slow: "sC<Esc>", what: "Flip the case of a character", text: "const c = 1;", cursor: at(0, 6) },
      { pro: "D", slow: "d$", what: "Delete to the end of the line", text: "x = 1; // old note", cursor: at(0, 6) },
      { pro: "J", slow: "jI<BS><BS><BS> <Esc>", what: "Join the next line onto this one", text: "const a =\n  1;", cursor: at(0, 0) },
    ],
  },
  {
    title: "Move and copy lines",
    blurb: "Deleting and yanking both fill the register, so you can move lines around without a mouse.",
    moves: [
      { pro: "yyp", slow: "yyjP", what: "Duplicate a line", text: "item();\nend();", cursor: at(0, 0) },
      { pro: "ddp", slow: "ddjP", what: "Swap a line with the one below", text: "second();\nfirst();\nlast();", cursor: at(0, 0) },
      { pro: "Vjd", slow: "dddd", what: "Delete several lines you can see selected", text: "a\nb\nc", cursor: at(0, 0) },
    ],
  },
]

/** Full key sequence for one side of a move, including typed text + Esc. */
export function moveKeys(move: ProMove, which: "pro" | "slow"): string[] {
  const keys = parseKeys(which === "pro" ? move.pro : move.slow)
  return move.type !== undefined ? [...keys, ...move.type, "Escape"] : keys
}

/** Command keystrokes only (typed text is the same on both sides, so it isn't counted). */
export const keyCount = (s: string) => parseKeys(s).length
