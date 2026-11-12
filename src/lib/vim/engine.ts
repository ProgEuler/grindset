/**
 * A small, pure, immutable Vim emulator.
 *
 * `handleKey(state, key)` returns the next state plus the list of command ids
 * that completed on that keypress (used for XP / stats tracking).
 *
 * Key names: single printable characters, "Escape", "Enter", "Backspace",
 * "Tab", and ctrl combos as "<C-d>", "<C-u>", "<C-r>".
 */

export type Mode = "normal" | "insert" | "visual" | "visual-line" | "search"

export interface Pos {
  line: number
  col: number
}

export interface Register {
  text: string
  linewise: boolean
}

interface Snapshot {
  lines: string[]
  cursor: Pos
}

export interface SearchState {
  forward: boolean
  input: string
  returnMode: Mode
}

export interface VimState {
  lines: string[]
  cursor: Pos
  mode: Mode
  pending: string[]
  anchor: Pos | null
  register: Register | null
  lastFind: { kind: "f" | "F" | "t" | "T"; char: string } | null
  lastSearch: { pattern: string; forward: boolean; whole: boolean } | null
  search: SearchState | null
  undo: Snapshot[]
  redo: Snapshot[]
  desiredCol: number | null
  halfPage: number
  message: string | null
}

export interface KeyResult {
  state: VimState
  commands: string[]
  /** false when the key was not understood (caller may let it bubble). */
  handled: boolean
}

export function createState(
  text: string | string[],
  cursor: Pos = { line: 0, col: 0 },
  opts: { halfPage?: number } = {}
): VimState {
  const lines = Array.isArray(text) ? [...text] : text.split("\n")
  if (lines.length === 0) lines.push("")
  const st: VimState = {
    lines,
    cursor,
    mode: "normal",
    pending: [],
    anchor: null,
    register: null,
    lastFind: null,
    lastSearch: null,
    search: null,
    undo: [],
    redo: [],
    desiredCol: null,
    halfPage: opts.halfPage ?? 6,
    message: null,
  }
  return { ...st, cursor: clampNormal(lines, cursor) }
}

export function runKeys(state: VimState, keys: string[]): VimState {
  let st = state
  for (const k of keys) st = handleKey(st, k).state
  return st
}

/* ------------------------------------------------------------------ */
/* Text helpers                                                        */
/* ------------------------------------------------------------------ */

const textCache = new WeakMap<string[], string>()
function textOf(lines: string[]): string {
  let t = textCache.get(lines)
  if (t === undefined) {
    t = lines.join("\n")
    textCache.set(lines, t)
  }
  return t
}

export function toOffset(lines: string[], pos: Pos): number {
  let off = 0
  for (let i = 0; i < pos.line; i++) off += lines[i].length + 1
  return off + pos.col
}

export function fromOffset(lines: string[], off: number): Pos {
  let line = 0
  while (line < lines.length - 1 && off > lines[line].length) {
    off -= lines[line].length + 1
    line++
  }
  return { line, col: Math.max(0, Math.min(off, lines[line].length)) }
}

function clampNormal(lines: string[], p: Pos): Pos {
  const line = Math.max(0, Math.min(p.line, lines.length - 1))
  const len = lines[line].length
  return { line, col: Math.max(0, Math.min(p.col, Math.max(0, len - 1))) }
}

function clampInsert(lines: string[], p: Pos): Pos {
  const line = Math.max(0, Math.min(p.line, lines.length - 1))
  return { line, col: Math.max(0, Math.min(p.col, lines[line].length)) }
}

const isWs = (c: string | undefined) => c === " " || c === "\t" || c === "\n"
function isWordChar(c: string) {
  const code = c.charCodeAt(0)
  return (
    (code >= 48 && code <= 57) ||
    (code >= 65 && code <= 90) ||
    (code >= 97 && code <= 122) ||
    code === 95
  )
}
/** 0 = whitespace, 1 = word (or any non-blank for WORDs), 2 = punctuation */
function cls(c: string | undefined, big: boolean): number {
  if (c === undefined) return -1
  if (isWs(c)) return 0
  if (big) return 1
  return isWordChar(c) ? 1 : 2
}

function firstNonBlank(line: string): number {
  const m = line.search(/\S/)
  return m < 0 ? Math.max(0, line.length - 1) : m
}

function isBlankLine(line: string) {
  return line.trim() === ""
}

function emptyLineAt(text: string, i: number) {
  return (i === 0 || text[i - 1] === "\n") && (i === text.length || text[i] === "\n")
}

/* ------------------------------------------------------------------ */
/* Word motions on flat text                                           */
/* ------------------------------------------------------------------ */

function wordForward(text: string, i: number, big: boolean): number {
  const n = text.length
  if (i >= n) return n
  const c = cls(text[i], big)
  if (c !== 0) while (i < n && cls(text[i], big) === c) i++
  while (i < n && cls(text[i], big) === 0) {
    if (text[i] === "\n") {
      i++
      if (emptyLineAt(text, i) && i < n) return i
      continue
    }
    i++
  }
  return i
}

function wordEnd(text: string, i: number, big: boolean): number {
  const n = text.length
  i++
  while (i < n && cls(text[i], big) === 0) i++
  if (i >= n) return n - 1
  const c = cls(text[i], big)
  while (i + 1 < n && cls(text[i + 1], big) === c) i++
  return i
}

function wordBack(text: string, i: number, big: boolean): number {
  if (i <= 0) return 0
  i--
  while (i > 0 && cls(text[i], big) === 0) {
    if (emptyLineAt(text, i)) return i
    i--
  }
  const c = cls(text[i], big)
  while (i > 0 && cls(text[i - 1], big) === c) i--
  return i
}

function wordEndBack(text: string, i: number, big: boolean): number {
  const c = cls(text[i], big)
  if (c !== 0) while (i >= 0 && cls(text[i], big) === c) i--
  while (i >= 0 && cls(text[i], big) === 0) {
    if (emptyLineAt(text, i) && text[i] === "\n" && i > 0) return i
    i--
  }
  return Math.max(0, i)
}

/* ------------------------------------------------------------------ */
/* Search helpers                                                      */
/* ------------------------------------------------------------------ */

function escapeRe(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
}

function searchOffset(
  text: string,
  from: number,
  pattern: string,
  forward: boolean,
  whole: boolean
): number | null {
  if (!pattern) return null
  let re: RegExp
  try {
    re = new RegExp(whole ? `\\b${escapeRe(pattern)}\\b` : escapeRe(pattern), "g")
  } catch {
    return null
  }
  const hits: number[] = []
  let m: RegExpExecArray | null
  while ((m = re.exec(text))) {
    hits.push(m.index)
    if (m[0].length === 0) re.lastIndex++
  }
  if (hits.length === 0) return null
  if (forward) return hits.find((h) => h > from) ?? hits[0]
  for (let k = hits.length - 1; k >= 0; k--) if (hits[k] < from) return hits[k]
  return hits[hits.length - 1]
}

function wordUnderCursor(line: string, col: number): { word: string; start: number } | null {
  let i = col
  while (i < line.length && !isWordChar(line[i])) i++
  if (i >= line.length) return null
  let s = i
  while (s > 0 && isWordChar(line[s - 1])) s--
  let e = i
  while (e < line.length && isWordChar(line[e])) e++
  return { word: line.slice(s, e), start: s }
}

/* ------------------------------------------------------------------ */
/* Parser                                                              */
/* ------------------------------------------------------------------ */

const SIMPLE_MOTIONS = new Set([
  "h", "j", "k", "l", "w", "e", "b", "W", "E", "B", "0", "^", "_", "$",
  "G", "{", "}", ";", ",", "n", "N", "*", "#", "<C-d>", "<C-u>",
])
const FIND_MOTIONS = new Set(["f", "F", "t", "T"])
const OBJ_CHARS = new Set(['w', 'W', 'p', '(', ')', 'b', '[', ']', '{', '}', 'B', '<', '>', '"', "'", '`'])

interface MotionTok {
  name: string
  arg?: string
}

type MotionParse = { kind: "incomplete" } | { kind: "invalid" } | { kind: "ok"; motion: MotionTok; next: number }

function parseMotion(t: string[], i: number): MotionParse {
  const k = t[i]
  if (k === undefined) return { kind: "incomplete" }
  if (SIMPLE_MOTIONS.has(k)) return { kind: "ok", motion: { name: k }, next: i + 1 }
  if (FIND_MOTIONS.has(k)) {
    const a = t[i + 1]
    if (a === undefined) return { kind: "incomplete" }
    if (a.length !== 1) return { kind: "invalid" }
    return { kind: "ok", motion: { name: k, arg: a }, next: i + 2 }
  }
  if (k === "g") {
    const a = t[i + 1]
    if (a === undefined) return { kind: "incomplete" }
    if (a === "g" || a === "e" || a === "E") return { kind: "ok", motion: { name: "g" + a }, next: i + 2 }
    return { kind: "invalid" }
  }
  return { kind: "invalid" }
}

function parseCount(t: string[], i: number): { count: number | null; next: number } {
  let s = ""
  while (i < t.length && /^[0-9]$/.test(t[i]) && !(s === "" && t[i] === "0")) {
    s += t[i]
    i++
  }
  return { count: s ? parseInt(s, 10) : null, next: i }
}

/* ------------------------------------------------------------------ */
/* Motions                                                             */
/* ------------------------------------------------------------------ */

interface MotionOut {
  pos: Pos
  linewise: boolean
  inclusive: boolean
  patch?: Partial<VimState>
  desiredCol?: number | null
}

function findInLine(
  line: string,
  col: number,
  kind: "f" | "F" | "t" | "T",
  ch: string,
  count: number,
  repeat: boolean
): number | null {
  let c = col
  for (let n = 0; n < count; n++) {
    if (kind === "f" || kind === "t") {
      let start = c + 1
      if (kind === "t" && repeat && n === 0 && line[c + 1] === ch) start = c + 2
      const idx = line.indexOf(ch, start + (kind === "t" && n > 0 ? 1 : 0))
      if (idx < 0) return null
      c = idx
    } else {
      let start = c - 1
      if (kind === "T" && repeat && n === 0 && line[c - 1] === ch) start = c - 2
      const idx = start < 0 ? -1 : line.lastIndexOf(ch, start - (kind === "T" && n > 0 ? 1 : 0))
      if (idx < 0) return null
      c = idx
    }
  }
  if (kind === "t") return c - 1
  if (kind === "T") return c + 1
  return c
}

function motion(
  st: VimState,
  m: MotionTok,
  countRaw: number | null,
  forOp: boolean
): MotionOut | null {
  const { lines, cursor } = st
  const count = countRaw ?? 1
  const line = lines[cursor.line]
  const text = textOf(lines)
  const off = toOffset(lines, cursor)
  const lastLine = lines.length - 1
  const at = (o: number) => fromOffset(lines, o)

  switch (m.name) {
    case "h": {
      if (cursor.col === 0) return null
      return { pos: { line: cursor.line, col: Math.max(0, cursor.col - count) }, linewise: false, inclusive: false }
    }
    case "l": {
      const max = forOp ? line.length : Math.max(0, line.length - 1)
      if (cursor.col >= max) return null
      return { pos: { line: cursor.line, col: Math.min(max, cursor.col + count) }, linewise: false, inclusive: false }
    }
    case "j":
    case "k":
    case "<C-d>":
    case "<C-u>": {
      const down = m.name === "j" || m.name === "<C-d>"
      const step = m.name.startsWith("<C") ? st.halfPage * (countRaw ?? 1) : count
      const target = Math.max(0, Math.min(lastLine, cursor.line + (down ? step : -step)))
      if (target === cursor.line) return null
      if (m.name.startsWith("<C")) {
        return { pos: { line: target, col: firstNonBlank(lines[target]) }, linewise: true, inclusive: false }
      }
      const want = st.desiredCol ?? cursor.col
      const len = lines[target].length
      return {
        pos: { line: target, col: Math.min(want, Math.max(0, len - 1)) },
        linewise: true,
        inclusive: false,
        desiredCol: want,
      }
    }
    case "w":
    case "W": {
      let o = off
      for (let n = 0; n < count; n++) o = wordForward(text, o, m.name === "W")
      if (o === off) return null
      if (!forOp && o >= text.length) o = text.length - 1
      return { pos: at(Math.min(o, text.length)), linewise: false, inclusive: false }
    }
    case "e":
    case "E": {
      let o = off
      for (let n = 0; n < count; n++) o = wordEnd(text, o, m.name === "E")
      if (o === off) return null
      return { pos: at(o), linewise: false, inclusive: true }
    }
    case "b":
    case "B": {
      let o = off
      for (let n = 0; n < count; n++) o = wordBack(text, o, m.name === "B")
      if (o === off) return null
      return { pos: at(o), linewise: false, inclusive: false }
    }
    case "ge":
    case "gE": {
      let o = off
      for (let n = 0; n < count; n++) o = wordEndBack(text, o, m.name === "gE")
      if (o === off) return null
      return { pos: at(o), linewise: false, inclusive: true }
    }
    case "0":
      return { pos: { line: cursor.line, col: 0 }, linewise: false, inclusive: false }
    case "^":
      return { pos: { line: cursor.line, col: firstNonBlank(line) }, linewise: false, inclusive: false }
    case "_": {
      const l = Math.min(lastLine, cursor.line + count - 1)
      return { pos: { line: l, col: firstNonBlank(lines[l]) }, linewise: true, inclusive: false }
    }
    case "$": {
      const l = Math.min(lastLine, cursor.line + count - 1)
      const len = lines[l].length
      return {
        pos: { line: l, col: forOp ? Math.max(0, len - 1) : Math.max(0, len - 1) },
        linewise: false,
        inclusive: len > 0,
        desiredCol: Infinity,
      }
    }
    case "gg":
    case "G": {
      const l =
        countRaw !== null
          ? Math.max(0, Math.min(lastLine, countRaw - 1))
          : m.name === "gg"
            ? 0
            : lastLine
      return { pos: { line: l, col: firstNonBlank(lines[l]) }, linewise: true, inclusive: false }
    }
    case "}":
    case "{": {
      let l = cursor.line
      const down = m.name === "}"
      for (let n = 0; n < count; n++) {
        let i = l + (down ? 1 : -1)
        if (isBlankLine(lines[l])) while (i >= 0 && i <= lastLine && isBlankLine(lines[i])) i += down ? 1 : -1
        while (i >= 0 && i <= lastLine && !isBlankLine(lines[i])) i += down ? 1 : -1
        if (i > lastLine) {
          l = lastLine
          if (n === count - 1)
            return {
              pos: { line: lastLine, col: Math.max(0, lines[lastLine].length - (forOp ? 0 : 1)) },
              linewise: false,
              inclusive: false,
            }
          break
        }
        if (i < 0) {
          l = 0
          break
        }
        l = i
      }
      if (l === cursor.line && cursor.col === 0) return null
      return { pos: { line: l, col: 0 }, linewise: false, inclusive: false }
    }
    case "f":
    case "F":
    case "t":
    case "T": {
      const kind = m.name as "f" | "F" | "t" | "T"
      const c = findInLine(line, cursor.col, kind, m.arg!, count, false)
      const patch = { lastFind: { kind, char: m.arg! } }
      if (c === null) return null
      return { pos: { line: cursor.line, col: c }, linewise: false, inclusive: kind === "f" || kind === "t", patch }
    }
    case ";":
    case ",": {
      if (!st.lastFind) return null
      let kind = st.lastFind.kind
      if (m.name === ",") kind = ({ f: "F", F: "f", t: "T", T: "t" } as const)[kind]
      const c = findInLine(line, cursor.col, kind, st.lastFind.char, count, true)
      if (c === null) return null
      return { pos: { line: cursor.line, col: c }, linewise: false, inclusive: kind === "f" || kind === "t" }
    }
    case "n":
    case "N": {
      const ls = st.lastSearch
      if (!ls) return null
      const fwd = m.name === "n" ? ls.forward : !ls.forward
      let o = off
      for (let n = 0; n < count; n++) {
        const r = searchOffset(text, o, ls.pattern, fwd, ls.whole)
        if (r === null) return null
        o = r
      }
      return { pos: at(o), linewise: false, inclusive: false }
    }
    case "*":
    case "#": {
      const w = wordUnderCursor(line, cursor.col)
      if (!w) return null
      const start = toOffset(lines, { line: cursor.line, col: w.start })
      const fwd = m.name === "*"
      let o = start
      for (let n = 0; n < count; n++) {
        const r = searchOffset(text, o, w.word, fwd, true)
        if (r === null) return null
        o = r
      }
      return {
        pos: at(o),
        linewise: false,
        inclusive: false,
        patch: { lastSearch: { pattern: w.word, forward: fwd, whole: true } },
      }
    }
  }
  return null
}

/* ------------------------------------------------------------------ */
/* Text objects                                                        */
/* ------------------------------------------------------------------ */

type Range =
  | { linewise: false; s: number; e: number }
  | { linewise: true; l1: number; l2: number }

const PAIRS: Record<string, [string, string]> = {
  "(": ["(", ")"], ")": ["(", ")"], b: ["(", ")"],
  "[": ["[", "]"], "]": ["[", "]"],
  "{": ["{", "}"], "}": ["{", "}"], B: ["{", "}"],
  "<": ["<", ">"], ">": ["<", ">"],
}

export function textObjectId(kind: string, ch: string): string {
  const norm: Record<string, string> = { ")": "(", b: "(", "]": "[", "}": "{", B: "{", ">": "<" }
  return kind + (norm[ch] ?? ch)
}

function textObject(st: VimState, kind: "i" | "a", ch: string): Range | null {
  const { lines, cursor } = st
  const text = textOf(lines)
  const off = toOffset(lines, cursor)
  const line = lines[cursor.line]
  const lineStart = off - cursor.col

  if (ch === "w" || ch === "W") {
    if (line.length === 0) return null
    const big = ch === "W"
    const c = cls(line[cursor.col], big)
    let s = cursor.col
    while (s > 0 && cls(line[s - 1], big) === c) s--
    let e = cursor.col + 1
    while (e < line.length && cls(line[e], big) === c) e++
    if (kind === "a") {
      if (c !== 0) {
        if (isWs(line[e])) {
          while (e < line.length && isWs(line[e])) e++
        } else {
          while (s > 0 && isWs(line[s - 1])) s--
        }
      } else if (e < line.length) {
        const c2 = cls(line[e], big)
        while (e < line.length && cls(line[e], big) === c2) e++
      }
    }
    return { linewise: false, s: lineStart + s, e: lineStart + e }
  }

  if (ch === "p") {
    const blank = isBlankLine(line)
    let l1 = cursor.line
    let l2 = cursor.line
    while (l1 > 0 && isBlankLine(lines[l1 - 1]) === blank) l1--
    while (l2 < lines.length - 1 && isBlankLine(lines[l2 + 1]) === blank) l2++
    if (kind === "a") {
      if (l2 < lines.length - 1) {
        const b2 = isBlankLine(lines[l2 + 1])
        while (l2 < lines.length - 1 && isBlankLine(lines[l2 + 1]) === b2) l2++
      } else {
        while (l1 > 0 && isBlankLine(lines[l1 - 1]) !== blank) l1--
      }
    }
    return { linewise: true, l1, l2 }
  }

  if (ch === '"' || ch === "'" || ch === "`") {
    const idx: number[] = []
    for (let i = 0; i < line.length; i++) if (line[i] === ch && line[i - 1] !== "\\") idx.push(i)
    let pair: [number, number] | null = null
    for (let k = 0; k + 1 < idx.length; k += 2) {
      if (cursor.col >= idx[k] && cursor.col <= idx[k + 1]) {
        pair = [idx[k], idx[k + 1]]
        break
      }
    }
    if (!pair) {
      for (let k = 0; k + 1 < idx.length; k += 2) {
        if (idx[k] > cursor.col) {
          pair = [idx[k], idx[k + 1]]
          break
        }
      }
    }
    if (!pair) return null
    let [a, b] = pair
    if (kind === "i") return { linewise: false, s: lineStart + a + 1, e: lineStart + b }
    b = b + 1
    if (isWs(line[b])) {
      while (b < line.length && isWs(line[b])) b++
    } else {
      while (a > 0 && isWs(line[a - 1])) a--
    }
    return { linewise: false, s: lineStart + a, e: lineStart + b }
  }

  const pairDef = PAIRS[ch]
  if (pairDef) {
    const [open, close] = pairDef
    let o = -1
    if (text[off] === open) o = off
    else {
      let d = 0
      for (let i = off - 1; i >= 0; i--) {
        if (text[i] === close) d++
        else if (text[i] === open) {
          if (d === 0) {
            o = i
            break
          }
          d--
        }
      }
    }
    if (o < 0) return null
    let c = -1
    let d = 0
    for (let i = o + 1; i < text.length; i++) {
      if (text[i] === open) d++
      else if (text[i] === close) {
        if (d === 0) {
          c = i
          break
        }
        d--
      }
    }
    if (c < 0) return null
    if (kind === "a") return { linewise: false, s: o, e: c + 1 }
    const inner = text.slice(o + 1, c)
    if (inner.includes("\n")) {
      const oPos = fromOffset(lines, o)
      const cPos = fromOffset(lines, c)
      const afterOpen = lines[oPos.line].slice(oPos.col + 1)
      const beforeClose = lines[cPos.line].slice(0, cPos.col)
      if (afterOpen.trim() === "" && beforeClose.trim() === "") {
        if (cPos.line - oPos.line < 2) return null
        return { linewise: true, l1: oPos.line + 1, l2: cPos.line - 1 }
      }
    }
    return { linewise: false, s: o + 1, e: c }
  }
  return null
}

/* ------------------------------------------------------------------ */
/* Edits                                                               */
/* ------------------------------------------------------------------ */

function withUndo(st: VimState): VimState {
  const undo = [...st.undo, { lines: st.lines, cursor: st.cursor }]
  if (undo.length > 200) undo.shift()
  return { ...st, undo, redo: [] }
}

function setText(st: VimState, text: string): VimState {
  return { ...st, lines: text.split("\n") }
}

function applyOp(
  st0: VimState,
  op: "d" | "c" | "y",
  range: Range,
  cursorAfterYank?: Pos
): VimState {
  let st = op === "y" ? st0 : withUndo(st0)
  const { lines } = st
  if (range.linewise) {
    const { l1, l2 } = range
    const removed = lines.slice(l1, l2 + 1).join("\n")
    const register = { text: removed, linewise: true }
    if (op === "y") {
      return {
        ...st,
        register,
        cursor: cursorAfterYank ?? { line: l1, col: st.cursor.line === l1 ? st.cursor.col : firstNonBlank(lines[l1]) },
        mode: "normal",
        anchor: null,
        message: l2 > l1 ? `${l2 - l1 + 1} lines yanked` : null,
      }
    }
    if (op === "d") {
      const next = [...lines.slice(0, l1), ...lines.slice(l2 + 1)]
      if (next.length === 0) next.push("")
      const line = Math.min(l1, next.length - 1)
      return {
        ...st,
        lines: next,
        register,
        cursor: { line, col: firstNonBlank(next[line]) },
        mode: "normal",
        anchor: null,
        desiredCol: null,
      }
    }
    const indent = (lines[l1].match(/^\s*/) ?? [""])[0]
    const next = [...lines.slice(0, l1), indent, ...lines.slice(l2 + 1)]
    return {
      ...st,
      lines: next,
      register,
      cursor: { line: l1, col: indent.length },
      mode: "insert",
      anchor: null,
    }
  }

  const text = textOf(lines)
  const s = Math.max(0, Math.min(range.s, text.length))
  const e = Math.max(s, Math.min(range.e, text.length))
  const removed = text.slice(s, e)
  const register = { text: removed, linewise: false }
  if (op === "y") {
    return { ...st, register, cursor: cursorAfterYank ?? fromOffset(lines, s), mode: "normal", anchor: null }
  }
  st = setText(st, text.slice(0, s) + text.slice(e))
  const pos = fromOffset(st.lines, s)
  if (op === "c") return { ...st, register, cursor: pos, mode: "insert", anchor: null }
  return { ...st, register, cursor: clampNormal(st.lines, pos), mode: "normal", anchor: null, desiredCol: null }
}

function put(st0: VimState, before: boolean, count: number): VimState {
  const reg = st0.register
  if (!reg) return st0
  const st = withUndo(st0)
  const { lines, cursor } = st
  if (reg.linewise) {
    const chunk = reg.text.split("\n")
    let ins: string[] = []
    for (let n = 0; n < count; n++) ins = ins.concat(chunk)
    const at = before ? cursor.line : cursor.line + 1
    const next = [...lines.slice(0, at), ...ins, ...lines.slice(at)]
    return { ...st, lines: next, cursor: { line: at, col: firstNonBlank(next[at]) } }
  }
  const text = textOf(lines)
  const off = toOffset(lines, cursor)
  const insAt = before || lines[cursor.line].length === 0 ? off : off + 1
  const ins = reg.text.repeat(count)
  const next = text.slice(0, insAt) + ins + text.slice(insAt)
  const st2 = setText(st, next)
  const endOff = ins.includes("\n") ? insAt : insAt + ins.length - 1
  return { ...st2, cursor: clampNormal(st2.lines, fromOffset(st2.lines, endOff)) }
}

function enterInsert(st: VimState, cursor: Pos, lines = st.lines): VimState {
  return { ...st, lines, cursor: clampInsert(lines, cursor), mode: "insert", pending: [], desiredCol: null }
}

/* ------------------------------------------------------------------ */
/* Key handling                                                        */
/* ------------------------------------------------------------------ */

export function handleKey(state: VimState, key: string): KeyResult {
  const st = { ...state, message: null }
  switch (st.mode) {
    case "insert":
      return insertKey(st, key)
    case "search":
      return searchKey(st, key)
    case "visual":
    case "visual-line":
      return visualKey(st, key)
    default:
      return normalKey(st, key)
  }
}

function insertKey(st: VimState, key: string): KeyResult {
  const { lines, cursor } = st
  const line = lines[cursor.line]
  if (key === "Escape" || key === "<C-[>" || key === "<C-c>") {
    return {
      state: { ...st, mode: "normal", cursor: clampNormal(lines, { line: cursor.line, col: cursor.col - 1 }) },
      commands: ["Escape"],
      handled: true,
    }
  }
  if (key === "Enter") {
    const indent = (line.match(/^\s*/) ?? [""])[0]
    const before = line.slice(0, cursor.col)
    const after = line.slice(cursor.col)
    const next = [...lines.slice(0, cursor.line), before, indent + after.trimStart(), ...lines.slice(cursor.line + 1)]
    return { state: { ...st, lines: next, cursor: { line: cursor.line + 1, col: indent.length } }, commands: [], handled: true }
  }
  if (key === "Backspace") {
    if (cursor.col > 0) {
      const next = [...lines]
      next[cursor.line] = line.slice(0, cursor.col - 1) + line.slice(cursor.col)
      return { state: { ...st, lines: next, cursor: { ...cursor, col: cursor.col - 1 } }, commands: [], handled: true }
    }
    if (cursor.line > 0) {
      const prev = lines[cursor.line - 1]
      const next = [...lines.slice(0, cursor.line - 1), prev + line, ...lines.slice(cursor.line + 1)]
      return { state: { ...st, lines: next, cursor: { line: cursor.line - 1, col: prev.length } }, commands: [], handled: true }
    }
    return { state: st, commands: [], handled: true }
  }
  let ch = key
  if (key === "Tab") ch = "  "
  if (ch.length < 1 || (ch.length > 1 && key !== "Tab")) return { state: st, commands: [], handled: false }
  const next = [...lines]
  next[cursor.line] = line.slice(0, cursor.col) + ch + line.slice(cursor.col)
  return { state: { ...st, lines: next, cursor: { ...cursor, col: cursor.col + ch.length } }, commands: [], handled: true }
}

function searchKey(st: VimState, key: string): KeyResult {
  const s = st.search!
  if (key === "Escape") {
    return { state: { ...st, mode: s.returnMode, search: null }, commands: [], handled: true }
  }
  if (key === "Backspace") {
    if (s.input.length === 0) return { state: { ...st, mode: s.returnMode, search: null }, commands: [], handled: true }
    return { state: { ...st, search: { ...s, input: s.input.slice(0, -1) } }, commands: [], handled: true }
  }
  if (key === "Enter") {
    const pattern = s.input || st.lastSearch?.pattern || ""
    const text = textOf(st.lines)
    const r = searchOffset(text, toOffset(st.lines, st.cursor), pattern, s.forward, false)
    const base: VimState = {
      ...st,
      mode: s.returnMode,
      search: null,
      lastSearch: pattern ? { pattern, forward: s.forward, whole: false } : st.lastSearch,
    }
    if (r === null) return { state: { ...base, message: `Pattern not found: ${pattern}` }, commands: [], handled: true }
    return { state: { ...base, cursor: fromOffset(st.lines, r), desiredCol: null }, commands: [s.forward ? "/" : "?"], handled: true }
  }
  if (key.length !== 1) return { state: st, commands: [], handled: false }
  return { state: { ...st, search: { ...s, input: s.input + key } }, commands: [], handled: true }
}

function motionCommands(m: MotionTok, count: number | null): string[] {
  const cmds = [m.name]
  if (count !== null && count > 1 && !["gg", "G"].includes(m.name)) cmds.push("count")
  return cmds
}

function normalKey(st: VimState, key: string): KeyResult {
  if (key === "Escape" || key === "<C-[>") return { state: { ...st, pending: [] }, commands: [], handled: true }
  if (key.startsWith("<C-") && !["<C-d>", "<C-u>", "<C-r>"].includes(key)) {
    return { state: st, commands: [], handled: false }
  }
  const t = [...st.pending, key]
  const res = execNormal(st, t)
  if (res === "incomplete") return { state: { ...st, pending: t }, commands: [], handled: true }
  if (res === "invalid") return { state: { ...st, pending: [] }, commands: [], handled: true }
  return { state: { ...res.state, pending: [] }, commands: res.commands, handled: true }
}

type ExecResult = "incomplete" | "invalid" | { state: VimState; commands: string[] }

function execNormal(st: VimState, t: string[]): ExecResult {
  const { count, next: i } = parseCount(t, 0)
  const k = t[i]
  if (k === undefined) return "incomplete"
  const { lines, cursor } = st
  const line = lines[cursor.line]
  const n = count ?? 1

  // operators
  if (k === "d" || k === "c" || k === "y") {
    const op = k
    const c2 = parseCount(t, i + 1)
    const j = c2.next
    const k2 = t[j]
    if (k2 === undefined) return "incomplete"
    const total = count === null && c2.count === null ? null : (count ?? 1) * (c2.count ?? 1)
    const cmds = [op]
    if (total !== null && total > 1) cmds.push("count")
    if (k2 === op) {
      const l2 = Math.min(lines.length - 1, cursor.line + (total ?? 1) - 1)
      return { state: applyOp(st, op, { linewise: true, l1: cursor.line, l2 }), commands: cmds }
    }
    if (k2 === "i" || k2 === "a") {
      const ch = t[j + 1]
      if (ch === undefined) return "incomplete"
      if (!OBJ_CHARS.has(ch)) return "invalid"
      const r = textObject(st, k2, ch)
      if (!r) return { state: st, commands: [] }
      if (!r.linewise && r.s === r.e) {
        if (op === "c") return { state: enterInsert(withUndo(st), fromOffset(lines, r.s)), commands: [...cmds, textObjectId(k2, ch)] }
        return { state: st, commands: [] }
      }
      return { state: applyOp(st, op, r), commands: [...cmds, textObjectId(k2, ch)] }
    }
    let mp = parseMotion(t, j)
    if (mp.kind === "incomplete") return "incomplete"
    if (mp.kind === "invalid") return "invalid"
    let m = mp.motion
    // cw behaves like ce when on a non-blank
    if (op === "c" && (m.name === "w" || m.name === "W") && !isWs(line[cursor.col]) && line.length > 0) {
      const big = m.name === "W"
      const atEnd = cls(line[cursor.col + 1], big) !== cls(line[cursor.col], big)
      const off = toOffset(lines, cursor)
      if (atEnd && (total ?? 1) === 1) {
        return { state: applyOp(st, "c", { linewise: false, s: off, e: off + 1 }), commands: [...cmds, m.name] }
      }
      mp = { kind: "ok", motion: { name: big ? "E" : "e" }, next: mp.next }
      m = { name: big ? "E" : "e" }
      const out = motion(st, m, total, true)
      if (!out) return { state: st, commands: [] }
      const e = toOffset(lines, out.pos) + 1
      return { state: applyOp(st, "c", { linewise: false, s: off, e }), commands: [...cmds, big ? "W" : "w"] }
    }
    const out = motion(st, m, total, true)
    if (!out) return { state: st, commands: [] }
    const base = out.patch ? { ...st, ...out.patch } : st
    if (out.linewise) {
      const l1 = Math.min(cursor.line, out.pos.line)
      const l2 = Math.max(cursor.line, out.pos.line)
      return { state: applyOp(base, op, { linewise: true, l1, l2 }), commands: [...cmds, m.name] }
    }
    const a = toOffset(lines, cursor)
    let b = toOffset(lines, out.pos)
    if ((m.name === "w" || m.name === "W") && out.pos.line > cursor.line) {
      const lead = lines[out.pos.line].slice(0, out.pos.col)
      if (lead.trim() === "") b = toOffset(lines, { line: out.pos.line - 1, col: lines[out.pos.line - 1].length })
    }
    let s = Math.min(a, b)
    let e = Math.max(a, b)
    if (out.inclusive) e += 1
    if (s === e) return { state: st, commands: [] }
    return { state: applyOp(base, op, { linewise: false, s, e }, op === "y" ? fromOffset(lines, s) : undefined), commands: [...cmds, m.name] }
  }

  switch (k) {
    case "i":
      return { state: enterInsert(withUndo(st), cursor), commands: ["i"] }
    case "a":
      return { state: enterInsert(withUndo(st), { line: cursor.line, col: line.length ? cursor.col + 1 : 0 }), commands: ["a"] }
    case "I":
      return { state: enterInsert(withUndo(st), { line: cursor.line, col: line.search(/\S/) < 0 ? line.length : line.search(/\S/) }), commands: ["I"] }
    case "A":
      return { state: enterInsert(withUndo(st), { line: cursor.line, col: line.length }), commands: ["A"] }
    case "o":
    case "O": {
      const indent = (line.match(/^\s*/) ?? [""])[0]
      const at = k === "o" ? cursor.line + 1 : cursor.line
      const next = [...lines.slice(0, at), indent, ...lines.slice(at)]
      return { state: enterInsert(withUndo(st), { line: at, col: indent.length }, next), commands: [k] }
    }
    case "x":
    case "X":
    case "s": {
      if (line.length === 0) {
        if (k === "s") return { state: enterInsert(withUndo(st), cursor), commands: ["s"] }
        return { state: st, commands: [] }
      }
      const off = toOffset(lines, cursor)
      if (k === "X") {
        if (cursor.col === 0) return { state: st, commands: [] }
        const s = off - Math.min(n, cursor.col)
        return { state: applyOp(st, "d", { linewise: false, s, e: off }), commands: ["X"] }
      }
      const e = off + Math.min(n, line.length - cursor.col)
      return { state: applyOp(st, k === "s" ? "c" : "d", { linewise: false, s: off, e }), commands: [k] }
    }
    case "S":
      return { state: applyOp(st, "c", { linewise: true, l1: cursor.line, l2: Math.min(lines.length - 1, cursor.line + n - 1) }), commands: ["S"] }
    case "C":
    case "D": {
      const m = motion(st, { name: "$" }, count, true)
      const off = toOffset(lines, cursor)
      const e = m ? toOffset(lines, m.pos) + (lines[m.pos.line].length ? 1 : 0) : off
      if (k === "D" && e <= off) return { state: st, commands: [] }
      return { state: applyOp(st, k === "C" ? "c" : "d", { linewise: false, s: off, e: Math.max(off, e) }), commands: [k] }
    }
    case "Y":
      return { state: applyOp(st, "y", { linewise: true, l1: cursor.line, l2: Math.min(lines.length - 1, cursor.line + n - 1) }), commands: ["Y"] }
    case "p":
    case "P":
      if (!st.register) return { state: st, commands: [] }
      return { state: put(st, k === "P", n), commands: [k] }
    case "r": {
      const ch = t[i + 1]
      if (ch === undefined) return "incomplete"
      if (ch.length !== 1) return "invalid"
      if (cursor.col + n > line.length) return { state: st, commands: [] }
      const s2 = withUndo(st)
      const next = [...lines]
      next[cursor.line] = line.slice(0, cursor.col) + ch.repeat(n) + line.slice(cursor.col + n)
      return { state: { ...s2, lines: next, cursor: { ...cursor, col: cursor.col + n - 1 } }, commands: ["r"] }
    }
    case "~": {
      if (!line.length) return { state: st, commands: [] }
      const s2 = withUndo(st)
      const end = Math.min(line.length, cursor.col + n)
      const seg = line.slice(cursor.col, end).replace(/./g, (c) => (c === c.toUpperCase() ? c.toLowerCase() : c.toUpperCase()))
      const next = [...lines]
      next[cursor.line] = line.slice(0, cursor.col) + seg + line.slice(end)
      return { state: { ...s2, lines: next, cursor: clampNormal(next, { line: cursor.line, col: end }) }, commands: ["~"] }
    }
    case "J": {
      const times = Math.max(1, n - 1)
      if (cursor.line >= lines.length - 1) return { state: st, commands: [] }
      let s2 = withUndo(st)
      let joinCol = 0
      for (let r = 0; r < times && s2.cursor.line < s2.lines.length - 1; r++) {
        const a = s2.lines[s2.cursor.line].replace(/\s+$/, "")
        const b = s2.lines[s2.cursor.line + 1].trimStart()
        const sep = a.length && b.length && !b.startsWith(")") ? " " : ""
        joinCol = a.length
        const next = [...s2.lines.slice(0, s2.cursor.line), a + sep + b, ...s2.lines.slice(s2.cursor.line + 2)]
        s2 = { ...s2, lines: next }
      }
      return { state: { ...s2, cursor: clampNormal(s2.lines, { line: cursor.line, col: joinCol }) }, commands: ["J"] }
    }
    case "u": {
      if (!st.undo.length) return { state: { ...st, message: "Already at oldest change" }, commands: [] }
      const snap = st.undo[st.undo.length - 1]
      return {
        state: {
          ...st,
          lines: snap.lines,
          cursor: clampNormal(snap.lines, snap.cursor),
          undo: st.undo.slice(0, -1),
          redo: [...st.redo, { lines: st.lines, cursor: st.cursor }],
        },
        commands: ["u"],
      }
    }
    case "<C-r>": {
      if (!st.redo.length) return { state: { ...st, message: "Already at newest change" }, commands: [] }
      const snap = st.redo[st.redo.length - 1]
      return {
        state: {
          ...st,
          lines: snap.lines,
          cursor: clampNormal(snap.lines, snap.cursor),
          redo: st.redo.slice(0, -1),
          undo: [...st.undo, { lines: st.lines, cursor: st.cursor }],
        },
        commands: ["<C-r>"],
      }
    }
    case "v":
    case "V":
      return { state: { ...st, mode: k === "v" ? "visual" : "visual-line", anchor: cursor }, commands: [k] }
    case "/":
    case "?":
      return { state: { ...st, mode: "search", search: { forward: k === "/", input: "", returnMode: "normal" } }, commands: [] }
  }

  const mp = parseMotion(t, i)
  if (mp.kind === "incomplete") return "incomplete"
  if (mp.kind === "invalid") return "invalid"
  const out = motion(st, mp.motion, count, false)
  if (!out) return { state: st, commands: [] }
  return {
    state: {
      ...st,
      ...(out.patch ?? {}),
      cursor: clampNormal(lines, out.pos),
      desiredCol: out.desiredCol === undefined ? null : out.desiredCol,
    },
    commands: motionCommands(mp.motion, count),
  }
}

function visualRange(st: VimState): Range {
  const a = st.anchor ?? st.cursor
  const c = st.cursor
  if (st.mode === "visual-line") {
    return { linewise: true, l1: Math.min(a.line, c.line), l2: Math.max(a.line, c.line) }
  }
  const oa = toOffset(st.lines, a)
  const oc = toOffset(st.lines, c)
  const len = textOf(st.lines).length
  return { linewise: false, s: Math.min(oa, oc), e: Math.min(len, Math.max(oa, oc) + 1) }
}

/** Range currently highlighted in visual mode (for rendering). */
export function selection(st: VimState): Range | null {
  if (st.mode !== "visual" && st.mode !== "visual-line" && !(st.mode === "search" && st.search?.returnMode.startsWith("visual"))) return null
  const mode = st.mode === "search" ? st.search!.returnMode : st.mode
  return visualRange({ ...st, mode })
}

function visualKey(st: VimState, key: string): KeyResult {
  if (key === "Escape" || key === "<C-[>") {
    return { state: { ...st, mode: "normal", anchor: null, pending: [], cursor: clampNormal(st.lines, st.cursor) }, commands: ["Escape"], handled: true }
  }
  if (key.startsWith("<C-") && !["<C-d>", "<C-u>"].includes(key)) return { state: st, commands: [], handled: false }
  const t = [...st.pending, key]
  const { count, next: i } = parseCount(t, 0)
  const k = t[i]
  if (k === undefined) return { state: { ...st, pending: t }, commands: [], handled: true }
  const done = (state: VimState, commands: string[]): KeyResult => ({ state: { ...state, pending: [] }, commands, handled: true })

  switch (k) {
    case "v":
    case "V": {
      const target = k === "v" ? "visual" : "visual-line"
      if (st.mode === target) return done({ ...st, mode: "normal", anchor: null }, [k])
      return done({ ...st, mode: target }, [k])
    }
    case "o":
    case "O":
      return done({ ...st, anchor: st.cursor, cursor: st.anchor ?? st.cursor }, ["v_o"])
    case "d":
    case "x":
    case "c":
    case "s":
    case "y": {
      const op = k === "x" ? "d" : k === "s" ? "c" : (k as "d" | "c" | "y")
      return done(applyOp(st, op, visualRange(st)), [op])
    }
    case "~":
    case "u":
    case "U": {
      const r = visualRange(st)
      const text = textOf(st.lines)
      const [s, e] = r.linewise
        ? [toOffset(st.lines, { line: r.l1, col: 0 }), toOffset(st.lines, { line: r.l2, col: st.lines[r.l2].length })]
        : [r.s, r.e]
      const seg = text.slice(s, e)
      const conv =
        k === "u" ? seg.toLowerCase() : k === "U" ? seg.toUpperCase() : seg.replace(/./g, (c) => (c === c.toUpperCase() ? c.toLowerCase() : c.toUpperCase()))
      const s2 = setText(withUndo(st), text.slice(0, s) + conv + text.slice(e))
      return done({ ...s2, mode: "normal", anchor: null, cursor: clampNormal(s2.lines, fromOffset(s2.lines, s)) }, [k])
    }
    case "/":
    case "?":
      return done({ ...st, mode: "search", search: { forward: k === "/", input: "", returnMode: st.mode } }, [])
    case "i":
    case "a": {
      const ch = t[i + 1]
      if (ch === undefined) return { state: { ...st, pending: t }, commands: [], handled: true }
      if (!OBJ_CHARS.has(ch)) return done(st, [])
      const r = textObject(st, k, ch)
      if (!r) return done(st, [])
      if (r.linewise) {
        return done({ ...st, mode: "visual-line", anchor: { line: r.l1, col: 0 }, cursor: { line: r.l2, col: 0 } }, [textObjectId(k, ch)])
      }
      if (r.e <= r.s) return done(st, [])
      return done({ ...st, anchor: fromOffset(st.lines, r.s), cursor: fromOffset(st.lines, r.e - 1) }, [textObjectId(k, ch)])
    }
  }

  const mp = parseMotion(t, i)
  if (mp.kind === "incomplete") return { state: { ...st, pending: t }, commands: [], handled: true }
  if (mp.kind === "invalid") return done(st, [])
  const out = motion(st, mp.motion, count, false)
  if (!out) return done(st, [])
  return done(
    {
      ...st,
      ...(out.patch ?? {}),
      cursor: clampNormal(st.lines, out.pos),
      desiredCol: out.desiredCol === undefined ? null : out.desiredCol,
    },
    motionCommands(mp.motion, count)
  )
}

/** Map a browser KeyboardEvent to an engine key name (or null to ignore). */
export function keyFromEvent(e: { key: string; ctrlKey: boolean; metaKey: boolean; altKey: boolean }): string | null {
  if (e.metaKey || e.altKey) return null
  if (e.ctrlKey) {
    if (e.key === "[") return "Escape"
    if (e.key.length === 1) return `<C-${e.key.toLowerCase()}>`
    return null
  }
  if (["Escape", "Enter", "Backspace", "Tab"].includes(e.key)) return e.key
  if (e.key.length === 1) re