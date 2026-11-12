import { createState, runKeys, toOffset, fromOffset, type Pos, type VimState } from "./engine"

export type Rng = () => number

export interface Ctx {
  rng: Rng
  /** command ids the learner is assumed to know (used to compute ideal keystrokes) */
  known: Set<string>
}

export interface VimRound {
  kind: "move" | "edit"
  lines: string[]
  cursor: Pos
  target?: Pos
  goal?: string[]
  ideal: number
  solution: string[]
  hint?: string
}

export function makeRng(seed = Math.floor(Math.random() * 2 ** 32)): Rng {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export const pick = <T,>(rng: Rng, arr: readonly T[]): T => arr[Math.floor(rng() * arr.length)]
export const randInt = (rng: Rng, a: number, b: number) => a + Math.floor(rng() * (b - a + 1))
export const samePos = (a: Pos, b: Pos) => a.line === b.line && a.col === b.col
export const toLines = (s: string) => s.replace(/^\n/, "").replace(/\s+$/, "").split("\n")

/* ------------------------------------------------------------------ */
/* Ideal navigation cost (Dijkstra over known motions)                 */
/* ------------------------------------------------------------------ */

const STATIC_MOTIONS: [string, string[]][] = [
  ["h", ["h"]], ["j", ["j"]], ["k", ["k"]], ["l", ["l"]],
  ["w", ["w"]], ["e", ["e"]], ["b", ["b"]],
  ["W", ["W"]], ["E", ["E"]], ["B", ["B"]],
  ["0", ["0"]], ["_", ["_"]], ["$", ["$"]],
  ["{", ["{"]], ["}", ["}"]], ["G", ["G"]], ["gg", ["g", "g"]],
  ["<C-d>", ["<C-d>"]], ["<C-u>", ["<C-u>"]],
]

function edgesFor(lines: string[], p: Pos, known: Set<string>): string[][] {
  const out: string[][] = []
  for (const [id, keys] of STATIC_MOTIONS) if (known.has(id)) out.push(keys)
  if (known.has("count")) {
    for (let n = 2; n <= 9; n++) {
      for (const m of ["j", "k", "w", "b", "e"]) if (known.has(m)) out.push([String(n), m])
    }
  }
  if (known.has("G") && known.has("count")) {
    for (let n = 1; n <= lines.length && n <= 60; n++) out.push([...String(n), "G"])
  }
  const line = lines[p.line]
  const chars = new Set(line.replace(/\s/g, ""))
  for (const c of chars) {
    for (const f of ["f", "F", "t", "T"]) if (known.has(f)) out.push([f, c])
  }
  return out
}

const key = (p: Pos) => p.line * 10000 + p.col

/** Cheapest keystroke count from `start` to any of `targets` using known motions. */
export function navCost(lines: string[], start: Pos, targets: Pos[], known: Set<string>, maxCost = 30, halfPage = 6): number {
  if (targets.length === 0) return Infinity
  const goal = new Set(targets.map(key))
  if (goal.has(key(start))) return 0
  const base: VimState = createState(lines, start, { halfPage })
  const dist = new Map<number, number>([[key(start), 0]])
  // bucket queue (costs are small integers)
  const buckets: Pos[][] = [[start]]
  for (let c = 0; c <= maxCost; c++) {
    const bucket = buckets[c]
    if (!bucket) continue
    for (const p of bucket) {
      if (dist.get(key(p)) !== c) continue
      if (goal.has(key(p))) return c
      const st = { ...base, lines: base.lines, cursor: p, desiredCol: null }
      for (const keys of edgesFor(lines, p, known)) {
        const q = runKeys(st, keys).cursor
        const nc = c + keys.length
        const kq = key(q)
        if (nc > maxCost) continue
        if ((dist.get(kq) ?? Infinity) > nc) {
          dist.set(kq, nc)
          ;(buckets[nc] ??= []).push(q)
        }
      }
    }
  }
  return Infinity
}

/* ------------------------------------------------------------------ */
/* Round builders                                                      */
/* ------------------------------------------------------------------ */

export type MoveGen = (st: VimState, rng: Rng) => string[] | null

export function randomCursor(lines: string[], rng: Rng, avoidLine?: number): Pos {
  const candidates: Pos[] = []
  lines.forEach((l, i) => {
    if (i === avoidLine) return
    for (let c = 0; c < l.length; c++) if (l[c] !== " ") candidates.push({ line: i, col: c })
  })
  return candidates.length ? pick(rng, candidates) : { line: 0, col: 0 }
}

/** Random walk: apply 1..n random moves from the lesson's motion set; final cursor is the target. */
export function moveRound(
  ctx: Ctx,
  snippets: string[][],
  moves: MoveGen[],
  steps: [number, number],
  opts: { halfPage?: number; start?: (lines: string[], rng: Rng) => Pos } = {}
): VimRound | null {
  const { rng } = ctx
  const lines = pick(rng, snippets)
  const start = opts.start ? opts.start(lines, rng) : randomCursor(lines, rng)
  let st = createState(lines, start, { halfPage: opts.halfPage })
  const solution: string[] = []
  const n = randInt(rng, steps[0], steps[1])
  for (let i = 0; i < n; i++) {
    const keys = pick(rng, moves)(st, rng)
    if (!keys) continue
    const next = runKeys(st, keys)
    if (samePos(next.cursor, st.cursor)) continue
    st = next
    solution.push(...keys)
  }
  const target = st.cursor
  if (samePos(target, start) || solution.length === 0) return null
  const known = new Set(ctx.known)
  const nav = navCost(lines, start, [target], known, solution.length, opts.halfPage)
  return { kind: "move", lines, cursor: start, target, ideal: Math.min(nav, solution.length), solution }
}

export interface EditOption {
  /** any of these cursor positions is a valid place to start `keys` */
  at: Pos[]
  keys: string[]
}

/**
 * Build an edit round. The goal is computed by running the first option's
 * keys through the engine, so goals always match real Vim behaviour.
 */
export function editRound(
  ctx: Ctx,
  start: string[],
  options: EditOption[],
  opts: { cursor?: Pos; maxNav?: number; hint?: string; halfPage?: number } = {}
): VimRound | null {
  const { rng } = ctx
  const first = options[0]
  if (!first || first.at.length === 0) return null
  const goalState = runKeys(createState(start, first.at[0], { halfPage: opts.halfPage }), first.keys)
  if (goalState.mode !== "normal") return null
  const goal = goalState.lines
  if (goal.join("\n") === start.join("\n")) return null
  const targetLine = first.at[0].line
  let cursor = opts.cursor
  if (!cursor) {
    // start somewhere nearby, but not on the exact spot
    const near: Pos[] = []
    start.forEach((l, i) => {
      if (Math.abs(i - targetLine) > 4 || l.trim() === "") return
      for (let c = 0; c < l.length; c++) if (l[c] !== " ") near.push({ line: i, col: c })
    })
    const atKeys = new Set(first.at.map(key))
    const pool = near.filter((p) => !atKeys.has(key(p)))
    cursor = pool.length ? pick(rng, pool) : randomCursor(start, rng)
  }
  const maxNav = opts.maxNav ?? 14
  let best = Infinity
  let solution: string[] = []
  for (const o of options) {
    const nav = navCost(start, cursor, o.at, ctx.known, maxNav, opts.halfPage)
    if (nav + o.keys.length < best) {
      best = nav + o.keys.length
      solution = o.keys
    }
  }
  if (!isFinite(best)) return null
  return { kind: "edit", lines: start, cursor, goal, ideal: best, solution, hint: opts.hint }
}

/** Retry a flaky generator until it yields a round. */
export function retry(gen: (ctx: Ctx) => VimRound | null, tries = 60): (ctx: Ctx) => VimRound {
  return (ctx) => {
    for (let i = 0; i < tries; i++) {
      const r = gen(ctx)
      if (r) return r
    }
    throw new Error("could not generate a round")
  }
}

/** Mix several generators uniformly. */
export function mix(...gens: ((ctx: Ctx) => VimRound)[]): (ctx: Ctx) => VimRound {
  return (ctx) => pick(ctx.rng, gens)(ctx)
}

/* ------------------------------------------------------------------ */
/* Common move generators                                              */
/* ------------------------------------------------------------------ */

export const keyMove = (...keys: string[]): MoveGen => () => keys

export const countedMove = (m: string, min = 2, max = 7): MoveGen => (_st, rng) => [String(randInt(rng, min, max)), m]

export const findMove = (kind: "f" | "F" | "t" | "T"): MoveGen => (st, rng) => {
  const line = st.lines[st.cursor.line]
  const c = st.cursor.col
  const fwd = kind === "f" || kind === "t"
  const range = fwd ? line.slice(c + (kind === "t" ? 2 : 1)) : line.slice(0, Math.max(0, c - (kind === "T" ? 1 : 0)))
  const chars = [...new Set(range.replace(/[\s]/g, ""))]
  if (!chars.length) return null
  return [kind, pick(rng, chars)]
}

export const searchMove = (forward: boolean, repeat = false): MoveGen => (st, rng) => {
  const words = new Map<string, number>()
  st.lines.forEach((l) => (l.match(/[A-Za-z_]\w{2,}/g) ?? []).forEach((w) => words.set(w, (words.get(w) ?? 0) + 1)))
  const pool = [...words.entries()].filter(([, n]) => (repeat ? n >= 3 : true)).map(([w]) => w)
  if (!pool.length) return null
  const w = pick(rng, pool)
  const keys = [forward ? "/" : "?", ...w, "Enter"]
  if (repeat) keys.push(...Array(randInt(rng, 1, 2)).fill(pick(rng, ["n", "N"])))
  return keys
}

/* ------------------------------------------------------------------ */
/* Site helpers                                                        */
/* ------------------------------------------------------------------ */

/** All positions where `re` matches (position = start of match). */
export function matchesIn(lines: string[], re: RegExp): { pos: Pos; text: string }[] {
  const out: { pos: Pos; text: string }[] = []
  lines.forEach((l, i) => {
    const r = new RegExp(re.source, re.flags.includes("g") ? re.flags : re.flags + "g")
    let m: RegExpExecArray | null
    while ((m = r.exec(l))) {
      out.push({ pos: { line: i, col: m.index }, text: m[0] })
      if (m[0].length === 0) r.lastIndex++
    }
  })
  return out
}

export function rangePositions(lines: string[], s: number, e: number): Pos[] {
  const out: Pos[] = []
  for (let o = s; o < e; o++) {
    const p = fromOffset(lines, o)
    if (toOffset(lines, p) === o && p.col < lines[p.line].length) out.push(p)
  }
  return out
}

export function linePositions(lines: string[], line: number): Pos[] {
  const l = lines[line]
  if (!l.length) return [{ line, col: 0 }]
  return Array.from({ length: l.length }, (_, col) => ({ line, col }))
}

export const typeKeys = (s: string) => [...s]
