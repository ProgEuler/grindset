/**
 * Tiny dependency-free syntax highlighter for the snippets used in lessons
 * (JS/TS, Python, Go). Returns one token type per character so the Vim editor
 * can keep rendering character cells (cursor, selection, targets).
 */

export type Tok = "plain" | "comment" | "string" | "number" | "keyword" | "function" | "type" | "constant" | "operator" | "punct"

const KEYWORDS = new Set([
  // js / ts
  "const", "let", "var", "function", "return", "if", "else", "for", "while", "do", "switch", "case", "break", "continue",
  "new", "delete", "typeof", "instanceof", "in", "of", "import", "from", "export", "default", "class", "extends",
  "async", "await", "try", "catch", "finally", "throw", "type", "interface", "enum", "private", "public", "protected",
  "readonly", "static", "as", "yield", "void",
  // python
  "def", "with", "lambda", "pass", "elif", "not", "and", "or", "is", "raise", "except",
  // go
  "func", "range", "package", "struct", "map", "go", "defer", "chan",
])
const CONSTANTS = new Set(["true", "false", "null", "undefined", "this", "self", "None", "True", "False", "nil", "NaN", "Infinity"])
const OPERATORS = new Set([..."=+-*/%!<>&|?:^~"])

export interface LexState {
  block: boolean
  template: boolean
}

export function tokenizeLine(line: string, state: LexState = { block: false, template: false }): { types: Tok[]; state: LexState } {
  const types: Tok[] = new Array(line.length).fill("plain")
  const st = { ...state }
  const n = line.length
  let i = 0
  const fill = (from: number, to: number, t: Tok) => {
    for (let k = from; k < to && k < n; k++) types[k] = t
  }

  while (i < n) {
    if (st.block) {
      const end = line.indexOf("*/", i)
      if (end < 0) {
        fill(i, n, "comment")
        return { types, state: st }
      }
      fill(i, end + 2, "comment")
      i = end + 2
      st.block = false
      continue
    }
    if (st.template) {
      let k = i
      while (k < n && !(line[k] === "`" && line[k - 1] !== "\\")) k++
      fill(i, k + 1, "string")
      if (k < n) st.template = false
      i = k + 1
      continue
    }
    const c = line[i]
    const next = line[i + 1]

    if (c === "/" && next === "/") {
      fill(i, n, "comment")
      break
    }
    if (c === "#" && (line.slice(0, i).trim() === "" || line[i - 1] === " ") && (next === " " || next === undefined)) {
      fill(i, n, "comment")
      break
    }
    if (c === "/" && next === "*") {
      st.block = true
      continue
    }
    if (c === '"' || c === "'") {
      let k = i + 1
      while (k < n && !(line[k] === c && line[k - 1] !== "\\")) k++
      fill(i, k + 1, "string")
      i = k + 1
      continue
    }
    if (c === "`") {
      types[i] = "string"
      st.template = true
      i++
      continue
    }
    if (/[0-9]/.test(c) && !/[\w$]/.test(line[i - 1] ?? "")) {
      let k = i
      while (k < n && /[\w.]/.test(line[k])) k++
      fill(i, k, "number")
      i = k
      continue
    }
    if (/[A-Za-z_$]/.test(c)) {
      let k = i
      while (k < n && /[\w$]/.test(line[k])) k++
      const word = line.slice(i, k)
      let rest = k
      while (rest < n && line[rest] === " ") rest++
      let prev = i - 1
      while (prev >= 0 && line[prev] === " ") prev--
      const t: Tok = KEYWORDS.has(word)
        ? "keyword"
        : CONSTANTS.has(word)
          ? "constant"
          : line[rest] === "("
            ? "function"
            : /^[A-Z]/.test(word) && line[prev] !== "."
              ? "type"
              : "plain"
      fill(i, k, t)
      i = k
      continue
    }
    if (OPERATORS.has(c)) {
      types[i] = "operator"
      i++
      continue
    }
    if (c !== " " && c !== "\t") types[i] = "punct"
    i++
  }
  return { types, state: st }
}

/** Highlight a whole buffer. Prose (no code punctuation at all) stays plain. */
export function tokenize(lines: string[]): Tok[][] {
  if (!/[;{}()=[\]]/.test(lines.join(""))) return lines.map((l) => new Array(l.length).fill("plain"))
  let state: LexState = { block: false, template: false }
  return lines.map((l) => {
    const r = tokenizeLine(l, state)
    state = r.state
    return r.types
  })
}

/** Tailwind text classes per token (colors are the Dracula tokens in globals.css). */
export const TOKEN_CLASS: Record<Tok, string> = {
  plain: "text-code-fg",
  comment: "text-code-comment italic",
  string: "text-code-string",
  number: "text-code-number",
  constant: "text-code-number",
  keyword: "text-code-keyword",
  operator: "text-code-keyword",
  function: "text-code-function",
  type: "text-code-type italic",
  punct: "text-code-fg",
}
