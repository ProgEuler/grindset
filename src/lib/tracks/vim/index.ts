import type { CommandInfo, Track } from "@/lib/tracks/types"
import { VIM_SECTIONS } from "./lessons"

const c = (group: string, pro: boolean, rows: [string, string, string?][]): CommandInfo[] =>
  rows.map(([id, name, label]) => ({ id, name, label: label ?? id, group, pro }))

const COMMANDS: CommandInfo[] = [
  ...c("basic vim", false, [["h", "left"], ["j", "down"], ["k", "up"], ["l", "right"], ["i", "insert before cursor"], ["Escape", "return to normal mode", "Esc"], ["w", "next word start"], ["e", "word end"], ["b", "previous word start"], ["a", "append after cursor"]]),
  ...c("insert like a pro", false, [["I", "insert at line start"], ["A", "append at line end"], ["o", "open line below"], ["O", "open line above"], ["x", "delete character"], ["s", "substitute character"], ["r", "replace character"]]),
  ...c("essential motions", false, [["W", "next WORD start"], ["E", "WORD end"], ["B", "previous WORD start"], ["0", "line start"], ["$", "line end"], ["_", "first non-blank (linewise)"], ["f", "find character forward"], ["F", "find character backward"], [";", "repeat find / till"], [",", "repeat find reversed"], ["t", "till character forward"], ["T", "till character backward"]]),
  ...c("basic operators", true, [["d", "delete"], ["c", "change"], ["D", "delete to line end"], ["C", "change to line end"], ["y", "yank"], ["p", "put after"], ["P", "put before"], ["Y", "yank line"]]),
  ...c("advanced vertical movement", true, [["count", "count prefix", "{n}"], ["gg", "first line or line n"], ["G", "last line or line n"], ["}", "next paragraph"], ["{", "previous paragraph"], ["<C-d>", "half page down", "Ctrl+d"], ["<C-u>", "half page up", "Ctrl+u"]]),
  ...c("search", true, [["/", "search forward"], ["?", "search backward"], ["n", "repeat search"], ["N", "repeat search reversed"], ["*", "search word forward"], ["#", "search word backward"]]),
  ...c("text objects", true, [
    ["i(", "inside parentheses"], ["a(", "around parentheses"], ["i[", "inside square brackets"], ["a[", "around square brackets"],
    ["i{", "inside curly braces"], ["a{", "around curly braces"], ["i<", "inside angle brackets"], ["a<", "around angle brackets"],
    ['i"', "inside double quotes"], ['a"', "around double quotes"], ["i'", "inside single quotes"], ["a'", "around single quotes"],
    ["i`", "inside backticks"], ["a`", "around backticks"], ["iw", "inside word"], ["aw", "around word"], ["iW", "inside WORD"], ["aW", "around WORD"],
    ["ip", "inside paragraph"], ["ap", "around paragraph"],
  ]),
  ...c("visual mode", true, [["v", "visual mode"], ["v_o", "switch selection end", "o"], ["V", "visual line mode"]]),
  ...c("extras", false, [["u", "undo"], ["<C-r>", "redo", "Ctrl+r"], ["ge", "previous word end"], ["^", "first non-blank"], ["S", "substitute line"], ["J", "join lines"], ["~", "toggle case"]]),
]

export const vimTrack: Track = {
  slug: "vim",
  title: "Vim",
  tagline: "Learn Vim motions by actually using them.",
  description:
    "Practice Vim motions, operators, text objects and visual mode in a real editor, with challenges that build muscle memory.",
  engine: "vim",
  sections: VIM_SECTIONS,
  commands: COMMANDS,
  practice: [
    { id: "movement", label: "movement", pro: false, lessons: ["basic-movement", "word-motions", "big-word-motions", "line-ends", "find-char", "till-char", "relative-line-jumps", "absolute-line-jumps", "paragraph-jumps", "search", "repeat-search", "quick-word-search"] },
    { id: "insertion", label: "insertion", pro: false, lessons: ["insert-mode", "insert-at-line-ends", "open-lines", "small-edits"] },
    { id: "editing", label: "editing", pro: true, lessons: ["delete-words", "change-words", "delete-lines", "delete-multiple-lines", "copy-paste-lines"] },
    { id: "text-objects", label: "text objects", pro: true, lessons: ["brackets-review", "quotes-review", "words-review", "paragraphs-review"] },
    { id: "visual", label: "visual", pro: true, lessons: ["intro-to-visual-mode", "visual-mode-operators", "visual-line-operators"] },
  ],
}
