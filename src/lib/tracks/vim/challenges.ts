import { createState, runKeys, toOffset, fromOffset, type Pos } from "@/lib/vim/engine"
import {
  countedMove,
  editRound,
  findMove,
  keyMove,
  linePositions,
  matchesIn,
  mix,
  moveRound,
  pick,
  randInt,
  randomCursor,
  rangePositions,
  retry,
  searchMove,
  typeKeys,
  type Ctx,
  type MoveGen,
  type VimRound,
} from "@/lib/vim/generators"
import { BRACKETS, CODE, JUNK_LINES, LINES_TO_ADD, LONG, PARAGRAPHS, PUNCTUATED, QUOTES, WORDS } from "./snippets"

type Gen = (ctx: Ctx) => VimRound

const set = (lines: string[], i: number, v: string) => lines.map((l, k) => (k === i ? v : l))
const insertAt = (lines: string[], i: number, ...v: string[]) => [...lines.slice(0, i), ...v, ...lines.slice(i)]
const indentOf = (s: string) => (s.match(/^\s*/) ?? [""])[0]
const ESC = "Escape"

/* --------------------------- movement --------------------------- */

export const hjkl: Gen = retry((ctx) => moveRound(ctx, CODE, ["h", "j", "k", "l"].map((k) => keyMove(k)), [3, 7]))

export const wordMotions: Gen = retry((ctx) => moveRound(ctx, CODE, [keyMove("w"), keyMove("e"), keyMove("b")], [1, 3]))

export const bigWordMotions: Gen = retry((ctx) => moveRound(ctx, PUNCTUATED, [keyMove("W"), keyMove("E"), keyMove("B")], [1, 3]))

export const lineEnds: Gen = retry((ctx) => {
  const lines = pick(ctx.rng, CODE)
  const start = randomCursor(lines, ctx.rng)
  const st = createState(lines, start)
  const m = pick(ctx.rng, ["0", "_", "$"])
  const end = runKeys(st, [m]).cursor
  if (end.col === start.col) return null
  return { kind: "move", lines, cursor: start, target: end, ideal: 1, solution: [m] }
})

const withSemicolon = (gen: MoveGen): MoveGen => (st, rng) => {
  const keys = gen(st, rng)
  if (!keys) return null
  if (rng() < 0.3) {
    const after = runKeys(st, keys)
    const next = runKeys(after, [";"])
    if (next.cursor.col !== after.cursor.col) return [...keys, ";"]
  }
  return keys
}

export const findChar: Gen = retry((ctx) => moveRound(ctx, CODE, [withSemicolon(findMove("f")), withSemicolon(findMove("F"))], [1, 1]))
export const tillChar: Gen = retry((ctx) => moveRound(ctx, CODE, [withSemicolon(findMove("t")), withSemicolon(findMove("T"))], [1, 1]))

export const relativeJumps: Gen = retry((ctx) =>
  moveRound(ctx, LONG, [countedMove("j", 2, 9), countedMove("k", 2, 9)], [1, 1])
)

export const absoluteJumps: Gen = retry((ctx) =>
  moveRound(
    ctx,
    LONG,
    [keyMove("g", "g"), keyMove("G"), (st, rng) => [...String(randInt(rng, 2, st.lines.length - 1)), "G"]],
    [1, 1]
  )
)

export const paragraphJumps: Gen = retry((ctx) => moveRound(ctx, [...PARAGRAPHS, LONG[0]], [keyMove("}"), keyMove("{")], [1, 3]))

export const scrolls: Gen = retry((ctx) =>
  moveRound(ctx, LONG, [keyMove("<C-d>"), keyMove("<C-u>")], [1, 3], { halfPage: 8 })
)

export const searchJumps: Gen = retry((ctx) => moveRound(ctx, [...CODE, ...LONG], [searchMove(true), searchMove(false)], [1, 1]))
export const searchRepeat: Gen = retry((ctx) => moveRound(ctx, [...CODE, ...LONG], [searchMove(true, true)], [1, 1]))

export const starSearch: Gen = retry((ctx) => {
  const lines = pick(ctx.rng, [...CODE, ...LONG])
  const counts = new Map<string, number>()
  const all = matchesIn(lines, /\b[A-Za-z_]\w{2,}\b/)
  all.forEach((m) => counts.set(m.text, (counts.get(m.text) ?? 0) + 1))
  const starts = all.filter((m) => (counts.get(m.text) ?? 0) >= 2)
  if (!starts.length) return null
  const s = pick(ctx.rng, starts)
  const start = { line: s.pos.line, col: s.pos.col + randInt(ctx.rng, 0, s.text.length - 1) }
  const key = pick(ctx.rng, ["*", "#"])
  const n = randInt(ctx.rng, 1, 2)
  const keys = n === 2 ? [key, "n"] : [key]
  const target = runKeys(createState(lines, start), keys).cursor
  if (target.line === start.line && Math.abs(target.col - start.col) < s.text.length) return null
  return { kind: "move", lines, cursor: start, target, ideal: keys.length, solution: keys }
})

/* --------------------------- insertion --------------------------- */

export const restoreWord: Gen = retry((ctx) => {
  const lines = pick(ctx.rng, CODE)
  const w = pick(ctx.rng, matchesIn(lines, /\b[A-Za-z_]\w{2,}\b/))
  const { line: l, col } = w.pos
  const start = set(lines, l, lines[l].slice(0, col) + lines[l].slice(col + w.text.length))
  const opts = []
  if (col < start[l].length) opts.push({ at: [{ line: l, col }], keys: ["i", ...typeKeys(w.text), ESC] })
  if (col > 0) opts.push({ at: [{ line: l, col: col - 1 }], keys: ["a", ...typeKeys(w.text), ESC] })
  if (ctx.rng() < 0.5) opts.reverse()
  return editRound(ctx, start, opts, { hint: "Type the missing word back in." })
})

export const lineEdges: Gen = retry((ctx) => {
  const lines = pick(ctx.rng, CODE)
  const l = randInt(ctx.rng, 0, lines.length - 1)
  const line = lines[l]
  if (line.trim().length < 6) return null
  if (ctx.rng() < 0.5) {
    const m = line.match(/(\s?\S+)$/)
    if (!m) return null
    const removed = m[1]
    const start = set(lines, l, line.slice(0, line.length - removed.length))
    return editRound(ctx, start, [{ at: linePositions(start, l), keys: ["A", ...typeKeys(removed), ESC] }])
  }
  const m = line.match(/^(\s*)(\S+\s?)/)
  if (!m || m[2].trim().length === 0) return null
  const start = set(lines, l, m[1] + line.slice(m[1].length + m[2].length))
  if (start[l].trim() === "") return null
  return editRound(ctx, start, [{ at: linePositions(start, l), keys: ["I", ...typeKeys(m[2]), ESC] }])
})

export const openLines: Gen = retry((ctx) => {
  const lines = pick(ctx.rng, CODE)
  const l = randInt(ctx.rng, 0, lines.length - 2)
  if (!lines[l].trim()) return null
  const text = pick(ctx.rng, LINES_TO_ADD)
  const opts = [{ at: linePositions(lines, l), keys: ["o", ...typeKeys(text), ESC] }]
  if (lines[l + 1].trim() && indentOf(lines[l + 1]) === indentOf(lines[l]))
    opts.push({ at: linePositions(lines, l + 1), keys: ["O", ...typeKeys(text), ESC] })
  if (ctx.rng() < 0.5) opts.reverse()
  return editRound(ctx, lines, opts)
})

export const smallEdits: Gen = retry((ctx) => {
  const lines = pick(ctx.rng, CODE)
  const words = matchesIn(lines, /\b[a-z]{4,}\b/)
  if (!words.length) return null
  const w = pick(ctx.rng, words)
  const l = w.pos.line
  const line = lines[l]
  const kind = pick(ctx.rng, ["x", "r", "s"])
  const c = w.pos.col + randInt(ctx.rng, 1, w.text.length - 2)
  if (kind === "x") {
    const start = set(lines, l, line.slice(0, c) + line[c] + line.slice(c))
    return editRound(ctx, start, [{ at: [{ line: l, col: c }, { line: l, col: c + 1 }], keys: ["x"] }], { hint: "Remove the doubled letter." })
  }
  if (kind === "r") {
    const wrong = pick(ctx.rng, [..."qzvkxj"].filter((ch) => ch !== line[c]))
    const start = set(lines, l, line.slice(0, c) + wrong + line.slice(c + 1))
    return editRound(ctx, start, [{ at: [{ line: l, col: c }], keys: ["r", line[c]] }], { hint: "Fix the typo." })
  }
  const k = Math.min(3, w.pos.col + w.text.length - c)
  if (k < 2) return null
  const start = set(lines, l, line.slice(0, c) + "?" + line.slice(c + k))
  return editRound(ctx, start, [{ at: [{ line: l, col: c }], keys: ["s", ...typeKeys(line.slice(c, c + k)), ESC] }], {
    hint: "Replace the ? with the missing letters.",
  })
})

/* --------------------------- operators --------------------------- */

export const deleteWords: Gen = retry((ctx) => {
  const lines = pick(ctx.rng, CODE)
  const w = pick(ctx.rng, matchesIn(lines, /\b[A-Za-z_]\w{2,}\b/))
  const { line: l, col } = w.pos
  const start = set(lines, l, lines[l].slice(0, col) + w.text + " " + lines[l].slice(col))
  return editRound(ctx, start, [{ at: [{ line: l, col }], keys: ["d", "w"] }], { hint: "Delete the duplicated word." })
})

export const changeWords: Gen = retry((ctx) => {
  const lines = pick(ctx.rng, CODE)
  const w = pick(ctx.rng, matchesIn(lines, /\b[A-Za-z_]\w{2,}\b/))
  const { line: l, col } = w.pos
  const repl = pick(ctx.rng, WORDS.filter((x) => x !== w.text))
  const start = set(lines, l, lines[l].slice(0, col) + repl + lines[l].slice(col + w.text.length))
  return editRound(ctx, start, [{ at: [{ line: l, col }], keys: ["c", "w", ...typeKeys(w.text), ESC] }])
})

export const deleteLines: Gen = retry((ctx) => {
  const lines = pick(ctx.rng, CODE)
  const l = randInt(ctx.rng, 1, lines.length - 1)
  if (ctx.rng() < 0.55) {
    const junk = indentOf(lines[l]) + pick(ctx.rng, JUNK_LINES)
    const start = insertAt(lines, l, junk)
    return editRound(ctx, start, [{ at: linePositions(start, l), keys: ["d", "d"] }])
  }
  if (lines[l].trim().length < 3) return null
  const tail = " // " + pick(ctx.rng, ["remove this", "stale note", "old value: 3"])
  const start = set(lines, l, lines[l] + tail)
  return editRound(ctx, start, [{ at: [{ line: l, col: lines[l].length }], keys: ["D"] }], { hint: "Delete the trailing comment." })
})

export const deleteMultipleLines: Gen = retry((ctx) => {
  const lines = pick(ctx.rng, CODE)
  const l = randInt(ctx.rng, 1, lines.length - 1)
  const n = randInt(ctx.rng, 2, 3)
  const junk = Array.from({ length: n }, () => indentOf(lines[l]) + pick(ctx.rng, JUNK_LINES))
  const start = insertAt(lines, l, ...junk)
  const down = n === 2 ? ["d", "j"] : ["d", "2", "j"]
  const up = n === 2 ? ["d", "k"] : ["d", "2", "k"]
  return editRound(ctx, start, [
    { at: linePositions(start, l), keys: down },
    { at: linePositions(start, l + n - 1), keys: up },
  ])
})

export const copyPasteLines: Gen = retry((ctx) => {
  const lines = pick(ctx.rng, CODE)
  const l = randInt(ctx.rng, 0, lines.length - 2)
  if (!lines[l].trim()) return null
  if (ctx.rng() < 0.6) {
    return editRound(ctx, lines, [
      { at: linePositions(lines, l), keys: ["y", "y", "p"] },
      { at: linePositions(lines, l), keys: ["y", "y", "P"] },
    ], { hint: "Duplicate the highlighted line." })
  }
  if (!lines[l + 1].trim()) return null
  const swapped = [...lines]
  ;[swapped[l], swapped[l + 1]] = [swapped[l + 1], swapped[l]]
  return editRound(ctx, swapped, [{ at: linePositions(swapped, l), keys: ["d", "d", "p"] }], { hint: "Swap the two lines back." })
})

/* --------------------------- text objects --------------------------- */

function pairsIn(lines: string[], open: string, close: string): [number, number][] {
  const text = lines.join("\n")
  const out: [number, number][] = []
  const stack: number[] = []
  for (let i = 0; i < text.length; i++) {
    if (text[i] === open) stack.push(i)
    else if (text[i] === close && stack.length) out.push([stack.pop()!, i])
  }
  return out
}

function quotePairs(lines: string[], q: string): [number, number][] {
  const out: [number, number][] = []
  lines.forEach((l, i) => {
    const base = toOffset(lines, { line: i, col: 0 })
    const idx: number[] = []
    for (let c = 0; c < l.length; c++) if (l[c] === q && l[c - 1] !== "\\") idx.push(c)
    for (let k = 0; k + 1 < idx.length; k += 2) out.push([base + idx[k], base + idx[k + 1]])
  })
  return out
}

function objectEdit(
  ctx: Ctx,
  snippets: string[][],
  op: "d" | "c",
  kind: "i" | "a",
  chars: string[],
  finder: (lines: string[], ch: string) => [number, number][]
): VimRound | null {
  const lines = pick(ctx.rng, snippets)
  const ch = pick(ctx.rng, chars)
  const close = ({ "(": ")", "[": "]", "{": "}" } as Record<string, string>)[ch] ?? ch
  const pairs = finder(lines, ch).filter(([o, c]) => c - o > 1)
  if (!pairs.length) return null
  const [o, c] = pick(ctx.rng, pairs)
  void close
  const at = rangePositions(lines, o, c + 1)
  const repl = kind === "i" ? pick(ctx.rng, WORDS) : pick(ctx.rng, WORDS)
  const keys = [op, kind, ch, ...(op === "c" ? [...typeKeys(repl), ESC] : [])]
  return editRound(ctx, lines, [{ at: verifyAt(lines, at, keys, o), keys }])
}

/** Keep only cursor positions where `keys` produce the same result as from offset `canonical`. */
function verifyAt(lines: string[], at: Pos[], keys: string[], canonical: number): Pos[] {
  const p0 = fromOffset(lines, canonical)
  const goal = runKeys(createState(lines, p0), keys).lines.join("\n")
  const ok = at.filter((p) => runKeys(createState(lines, p), keys).lines.join("\n") === goal)
  // put canonical first so the goal is computed from it
  return [p0, ...ok.filter((p) => p.line !== p0.line || p.col !== p0.col)]
}

const BR = ["(", "[", "{"]
const QS = ['"', "'", "`"]
const bracketPairs = (lines: string[], ch: string) =>
  pairsIn(lines, ch, ({ "(": ")", "[": "]", "{": "}" } as Record<string, string>)[ch])

export const deleteInsideBrackets: Gen = retry((ctx) => objectEdit(ctx, BRACKETS, "d", "i", BR, bracketPairs))
export const deleteAroundBrackets: Gen = retry((ctx) => objectEdit(ctx, BRACKETS, "d", "a", BR, bracketPairs))
export const changeInsideBrackets: Gen = retry((ctx) => objectEdit(ctx, BRACKETS, "c", "i", BR, bracketPairs))
export const changeAroundBrackets: Gen = retry((ctx) => objectEdit(ctx, BRACKETS, "c", "a", BR, bracketPairs))

export const deleteInsideQuotes: Gen = retry((ctx) => objectEdit(ctx, QUOTES, "d", "i", QS, quotePairs))
export const deleteAroundQuotes: Gen = retry((ctx) => objectEdit(ctx, QUOTES, "d", "a", QS, quotePairs))
export const changeInsideQuotes: Gen = retry((ctx) => objectEdit(ctx, QUOTES, "c", "i", QS, quotePairs))
export const changeAroundQuotes: Gen = retry((ctx) => objectEdit(ctx, QUOTES, "c", "a", QS, quotePairs))

export const deleteInsideWord: Gen = retry((ctx) => {
  const lines = pick(ctx.rng, [...CODE, ...BRACKETS])
  // words wrapped in punctuation so diw leaves clean code: (name) .name. "name"
  const cands = matchesIn(lines, /[("'.[]([A-Za-z_]\w{2,})[)"'.\]]/)
  if (!cands.length) return null
  const m = pick(ctx.rng, cands)
  const p = { line: m.pos.line, col: m.pos.col + 1 }
  const len = m.text.length - 2
  const at = Array.from({ length: len }, (_, i) => ({ line: p.line, col: p.col + i }))
  return editRound(ctx, lines, [{ at, keys: ["d", "i", "w"] }])
})

export const deleteAroundWord: Gen = retry((ctx) => {
  const lines = pick(ctx.rng, CODE)
  const w = pick(ctx.rng, matchesIn(lines, /\b[A-Za-z_]\w{2,}\b(?= )/))
  if (!w) return null
  const extra = pick(ctx.rng, WORDS)
  const { line: l, col } = w.pos
  const start = set(lines, l, lines[l].slice(0, col) + extra + " " + lines[l].slice(col))
  const at = Array.from({ length: extra.length }, (_, i) => ({ line: l, col: col + i }))
  return editRound(ctx, start, [{ at, keys: ["d", "a", "w"] }], { hint: "Remove the extra word." })
})

export const changeInsideWord: Gen = retry((ctx) => {
  const lines = pick(ctx.rng, CODE)
  const w = pick(ctx.rng, matchesIn(lines, /\b[A-Za-z_]\w{2,}\b/))
  const repl = pick(ctx.rng, WORDS.filter((x) => x !== w.text))
  const { line: l, col } = w.pos
  const start = set(lines, l, lines[l].slice(0, col) + repl + lines[l].slice(col + w.text.length))
  const at = Array.from({ length: repl.length }, (_, i) => ({ line: l, col: col + i }))
  return editRound(ctx, start, [{ at, keys: ["c", "i", "w", ...typeKeys(w.text), ESC] }])
})

function paragraphEdit(ctx: Ctx, keysFor: (rng: Ctx["rng"]) => string[], junk: boolean): VimRound | null {
  let lines = pick(ctx.rng, PARAGRAPHS)
  const blanks = lines.map((l, i) => (l.trim() ? -1 : i)).filter((i) => i >= 0)
  let target: number
  if (junk) {
    const b = pick(ctx.rng, blanks)
    const n = randInt(ctx.rng, 2, 3)
    const ind = indentOf(lines[b + 1] ?? "")
    lines = insertAt(lines, b + 1, ...Array.from({ length: n }, () => ind + pick(ctx.rng, JUNK_LINES)), "")
    target = b + 1
  } else {
    const starts = [0, ...blanks.map((b) => b + 1)].filter((i) => i < lines.length && lines[i].trim())
    target = pick(ctx.rng, starts)
  }
  let end = target
  while (end + 1 < lines.length && lines[end + 1].trim()) end++
  const at: Pos[] = []
  for (let i = target; i <= end; i++) at.push(...linePositions(lines, i))
  const keys = keysFor(ctx.rng)
  return editRound(ctx, lines, [{ at, keys }], { hint: junk ? "Delete the junk paragraph." : undefined })
}

export const deleteInsideParagraph: Gen = retry((ctx) => paragraphEdit(ctx, () => ["d", "i", "p"], false))
export const deleteAroundParagraph: Gen = retry((ctx) => paragraphEdit(ctx, () => ["d", "a", "p"], true))
export const changeInsideParagraph: Gen = retry((ctx) =>
  paragraphEdit(ctx, (rng) => ["c", "i", "p", ...typeKeys(pick(rng, ["// TODO: rewrite", "todo()", "pass"])), ESC], false)
)

/* --------------------------- visual mode --------------------------- */

function visualSpan(ctx: Ctx, op: "d" | "c" | "y"): VimRound | null {
  const lines = pick(ctx.rng, CODE)
  const w = pick(ctx.rng, matchesIn(lines, /\b[A-Za-z_]\w*\b/))
  const p = w.pos
  const st = createState(lines, p)
  const motions = pick(ctx.rng, [["e", "e"], ["e", "e", "e"], ["t", ")"], ["t", ";"], ["t", ","], ["$"], ["f", "("]])
  const after = runKeys(runKeys(st, ["v"]), motions)
  if (after.mode !== "visual" || (after.cursor.line === p.line && after.cursor.col - p.col < 3)) return null
  const tail = op === "c" ? [...typeKeys(pick(ctx.rng, WORDS)), ESC] : op === "y" ? ["$", "p"] : []
  const keys = ["v", ...motions, op, ...tail]
  return editRound(ctx, lines, [{ at: [p], keys }])
}

export const visualIntro: Gen = retry((ctx) => visualSpan(ctx, "d"))
export const visualOperators: Gen = retry((ctx) => visualSpan(ctx, pick(ctx.rng, ["d", "c", "y"] as const)))

export const visualSwitchEnds: Gen = retry((ctx) => {
  // the span starts *before* the cursor, so selecting forward then pressing `o` helps
  const r = visualSpan(ctx, "d")
  if (!r) return null
  return { ...r, hint: "Tip: start the selection anywhere, then press o to adjust the other end." }
})

function visualLines(ctx: Ctx, kind: "delete" | "dup"): VimRound | null {
  const lines = pick(ctx.rng, CODE)
  const l = randInt(ctx.rng, 1, lines.length - 2)
  if (kind === "delete") {
    const n = randInt(ctx.rng, 2, 3)
    const start = insertAt(lines, l, ...Array.from({ length: n }, () => indentOf(lines[l]) + pick(ctx.rng, JUNK_LINES)))
    const keys = ["V", ...Array(n - 1).fill("j"), "d"]
    return editRound(ctx, start, [
      { at: linePositions(start, l), keys },
      { at: linePositions(start, l + n - 1), keys: ["V", ...Array(n - 1).fill("k"), "d"] },
    ])
  }
  if (!lines[l].trim() || !lines[l + 1].trim()) return null
  return editRound(ctx, lines, [{ at: linePositions(lines, l), keys: ["V", "j", "y", "P"] }], { hint: "Duplicate the two highlighted lines." })
}

export const visualLineIntro: Gen = retry((ctx) => visualLines(ctx, "delete"))
export const visualLineOperators: Gen = retry((ctx) => visualLines(ctx, pick(ctx.rng, ["delete", "dup"] as const)))

/* --------------------------- reviews --------------------------- */

export const searchReview = mix(searchJumps, searchRepeat, starSearch)
export const bracketsReview = mix(deleteInsideBrackets, deleteAroundBrackets, changeInsideBrackets, changeAroundBrackets)
export const quotesReview = mix(deleteInsideQuotes, deleteAroundQuotes, changeInsideQuotes, changeAroundQuotes)
export const wordsReview = mix(deleteInsideWord, deleteAroundWord, changeInsideWord)
export const paragraphsReview = mix(deleteInsideParagraph, deleteAroundParagraph, changeInsideParagraph)
export const textObjectsMega = mix(bracketsReview, quotesReview, wordsReview, paragraphsReview)
