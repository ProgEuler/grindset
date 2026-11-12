import type { Block, Lesson, Section, VimDemo } from "@/lib/tracks/types"
import type { Ctx, VimRound } from "@/lib/vim/generators"
import * as G from "./challenges"

/** Parse a demo key string: "dw", "ciwfoo<Esc>", "/name<CR>", "<C-d>" */
export function parseKeys(s: string): string[] {
  return (s.match(/<[^>]+>|./g) ?? []).map((k) =>
    k === "<Esc>" ? "Escape" : k === "<CR>" ? "Enter" : k === "<BS>" ? "Backspace" : k
  )
}

const demo = (text: string, at: [number, number], keys: string): VimDemo => ({
  text,
  cursor: { line: at[0], col: at[1] },
  keys: parseKeys(keys),
})
const p = (text: string): Block => ({ type: "p", text })
const h = (text: string): Block => ({ type: "h", text })
const list = (...items: string[]): Block => ({ type: "list", items })
const callout = (text: string, title?: string): Block => ({ type: "callout", text, title })
const keys = (...items: { keys: string[]; desc: string; demo?: VimDemo }[]): Block => ({ type: "keys", items })
const k = (ks: string, desc: string, d?: VimDemo) => ({ keys: ks.split(" "), desc, demo: d })

const vim = (rounds: number, generate: (ctx: Ctx) => VimRound, ...instructions: string[]) =>
  ({ kind: "vim" as const, rounds, generate, instructions })

const SAMPLE = `const total = price * quantity;
if (total > limit) {
  notify("over budget", total);
}`

const WORDY = `user.profile.name = "Ada Lovelace";
items.push({ id: 7, tags: ["a", "b"] });`

/* ================================================================== */

const basics: Section = {
  title: "Getting Started",
  lessons: [
    {
      slug: "intro-to-modes",
      title: "Intro to Modes",
      keys: ["modes"],
      pro: false,
      introduces: [],
      blocks: [
        p("The first idea to get comfortable with is **modes**. The same key does different things depending on which mode you are in."),
        h("Normal mode"),
        p("This is home base. Keys are commands here, not text. You use it to:"),
        list("move the cursor around", "delete, change and copy text", "combine small commands into bigger edits"),
        { type: "demo", demo: demo(SAMPLE, [0, 0], "wwwjj"), caption: "Pressing keys in normal mode moves the cursor; nothing gets typed." },
        h("Insert mode"),
        p("This is the mode you already know from other editors: what you type goes into the file. Press `i` to enter it and `Esc` to go back to normal mode."),
        { type: "demo", demo: demo(SAMPLE, [0, 6], "inew_<Esc>"), caption: "`i` starts inserting, `Esc` returns to normal mode." },
        callout("You'll spend most of your time in normal mode. Think of insert mode as a short trip: go in, type, come straight back out.", "Rule of thumb"),
      ],
      tips: [
        { title: "Why have modes at all?", text: "Because when letters aren't busy typing text, every key on the keyboard can be a command. That's how Vim edits so much with so few keystrokes." },
      ],
      editor: { playground: SAMPLE },
    },
    {
      slug: "basic-movement",
      title: "Basic Movement",
      keys: ["h", "j", "k", "l"],
      pro: false,
      introduces: ["h", "j", "k", "l"],
      blocks: [
        p("In normal mode the four keys under your right hand move the cursor one step at a time."),
        keys(
          k("h", "left", demo(SAMPLE, [0, 8], "hhh")),
          k("j", "down", demo(SAMPLE, [0, 2], "jj")),
          k("k", "up", demo(SAMPLE, [2, 4], "kk")),
          k("l", "right", demo(SAMPLE, [0, 0], "llll"))
        ),
        p("Use your index finger for `h` and `j`, your middle finger for `k`, and your ring finger for `l`."),
      ],
      challenge: vim(10, G.hjkl, "Move the cursor onto the green target.", "Use h j k l, not the arrow keys.", "Each round counts your keystrokes. Match the ideal count to earn XP."),
      tips: [
        { title: "Why not the arrow keys?", text: "Reaching for the arrows means taking your hand off the home row. hjkl keeps your fingers where the rest of Vim lives." },
        { title: "Holding a key", text: "Holding j to scroll down works, but it's slow. Later lessons show much faster ways to jump around." },
      ],
    },
    {
      slug: "word-motions",
      title: "Moving by Words",
      keys: ["w", "e", "b"],
      pro: false,
      introduces: ["w", "e", "b"],
      blocks: [
        p("Moving one character at a time gets tedious. Word motions jump through the text one word at a time."),
        keys(
          k("w", "jump to the start of the next word", demo(SAMPLE, [0, 0], "www")),
          k("e", "jump to the end of the word", demo(SAMPLE, [0, 0], "eee")),
          k("b", "jump back to the start of the word", demo(SAMPLE, [0, 20], "bbb"))
        ),
        callout("A **word** is either a run of letters, digits and underscores, or a run of punctuation. So `total)` is two words: `total` and `)`.", "What counts as a word?"),
      ],
      challenge: vim(10, G.wordMotions, "Reach the green target using w, e and b.", "Combine them with h j k l when you need to."),
    },
    {
      slug: "insert-mode",
      title: "Insert Mode",
      keys: ["i", "a", "Esc"],
      pro: false,
      introduces: ["i", "a", "Escape"],
      blocks: [
        p("There are two everyday ways to start typing. The only difference is where the text goes."),
        keys(
          k("i", "insert before the cursor", demo(SAMPLE, [0, 6], "inew_<Esc>")),
          k("a", "append after the cursor", demo(SAMPLE, [0, 10], "a2<Esc>")),
          k("Esc", "go back to normal mode")
        ),
        p("Pick whichever one puts the cursor in the right spot without moving first."),
      ],
      challenge: vim(8, G.restoreWord, "A word is missing. Put it back so the code matches the goal.", "Finish each round in normal mode (press Esc)."),
      tips: [{ title: "Remapping Esc", text: "Lots of people map Caps Lock to Escape. `Ctrl+[` also works as Escape, here and in real Vim." }],
    },
  ],
}

const insertPro: Section = {
  title: "Insert Like a Pro",
  lessons: [
    {
      slug: "uppercase-commands",
      title: "Uppercase Commands",
      keys: ["shift"],
      pro: false,
      introduces: [],
      blocks: [
        p("Vim has a habit: the **uppercase** version of a command is usually a bigger, stronger, or reversed version of the lowercase one."),
        list("`i` inserts at the cursor. `I` inserts at the start of the line.", "`a` appends after the cursor. `A` appends at the end of the line.", "`o` opens a line below. `O` opens a line above.", "`w` moves by word. `W` moves by WORD (more on that soon)."),
        callout("When you learn a new lowercase command, try the uppercase one too. It's usually related.", "Pattern to remember"),
      ],
      editor: { playground: SAMPLE },
    },
    {
      slug: "insert-at-line-ends",
      title: "Insert at Line Ends",
      keys: ["I", "A", "Esc"],
      pro: false,
      introduces: ["I", "A"],
      blocks: [
        p("Two of the most common edits are adding something to the start or the end of a line. These commands do it from anywhere on the line."),
        keys(
          k("I", "insert at the first non-blank character of the line", demo(SAMPLE, [1, 10], "Ielse <Esc>")),
          k("A", "append at the end of the line", demo(SAMPLE, [0, 3], "A // usd<Esc>"))
        ),
      ],
      challenge: vim(8, G.lineEdges, "Something is missing at the start or end of a line. Restore it.", "You don't need to move to the edge first."),
    },
    {
      slug: "open-lines",
      title: "Opening New Lines",
      keys: ["o", "O"],
      pro: false,
      introduces: ["o", "O"],
      blocks: [
        p("To add a new line you don't need to go to the end of a line and press Enter."),
        keys(
          k("o", "open a new line below and start inserting", demo(SAMPLE, [1, 4], "olog(total);<Esc>")),
          k("O", "open a new line above and start inserting", demo(SAMPLE, [1, 4], "O// check budget<Esc>"))
        ),
        p("The new line keeps the indentation of the line you were on."),
      ],
      challenge: vim(8, G.openLines, "Add the missing line shown in the goal."),
    },
    {
      slug: "small-edits",
      title: "Making Small Edits",
      keys: ["s", "x", "r"],
      pro: false,
      introduces: ["x", "r", "s"],
      blocks: [
        p("Three tiny commands for fixing typos."),
        keys(
          k("x", "delete the character under the cursor", demo("consst total = 1;", [0, 3], "x")),
          k("r", "replace one character, then stay in normal mode", demo("const totel = 1;", [0, 10], "ra")),
          k("s", "delete one character and start inserting", demo("const t = 1;", [0, 6], "stotal<Esc>"))
        ),
      ],
      challenge: vim(10, G.smallEdits, "Fix each typo with x, r or s."),
      tips: [{ title: "r or s?", text: "Use r when one character becomes one character; you never leave normal mode. Use s when one character needs to become several." }],
    },
  ],
}

const motions: Section = {
  title: "Essential Motions",
  lessons: [
    {
      slug: "big-word-motions",
      title: "Moving by WORDs",
      keys: ["W", "E", "B"],
      pro: false,
      introduces: ["W", "E", "B"],
      blocks: [
        p("A **WORD** (uppercase) is anything between spaces. Punctuation doesn't split it. That makes WORD motions much faster on code full of dots, brackets and quotes."),
        keys(
          k("W", "start of the next WORD", demo(WORDY, [0, 0], "WWW")),
          k("E", "end of the WORD", demo(WORDY, [1, 0], "EE")),
          k("B", "back to the start of the WORD", demo(WORDY, [0, 30], "BB"))
        ),
        callout("`user.profile.name` is 5 words but only 1 WORD.", "word vs WORD"),
      ],
      challenge: vim(10, G.bigWordMotions, "Reach the target with W, E and B."),
    },
    {
      slug: "line-ends",
      title: "Moving to Line Ends",
      keys: ["0", "_", "$"],
      pro: false,
      introduces: ["0", "_", "$"],
      blocks: [
        keys(
          k("0", "go to the very first column", demo(SAMPLE, [2, 12], "0")),
          k("_", "go to the first non-blank character", demo(SAMPLE, [2, 12], "_")),
          k("$", "go to the end of the line", demo(SAMPLE, [2, 2], "$"))
        ),
        p("In indented code, `_` is usually what you want, since it skips the leading spaces. (`^` does the same thing.)"),
      ],
      challenge: vim(10, G.lineEnds, "Jump to the start or end of the line in one keystroke."),
    },
    {
      slug: "find-char",
      title: "Find Character",
      keys: ["f", "F", ";"],
      pro: false,
      introduces: ["f", "F", ";", ","],
      blocks: [
        p("To get to a specific character on the line, find it."),
        keys(
          k("f", "jump forward onto the next {char}", demo(SAMPLE, [0, 0], "f*")),
          k("F", "jump backward onto the previous {char}", demo(SAMPLE, [0, 28], "Ft")),
          k(";", "repeat the last find (and `,` goes the other way)", demo("a, b, c, d, e", [0, 0], "f,;;"))
        ),
      ],
      challenge: vim(10, G.findChar, "Use f, F and ; to land on the target."),
    },
    {
      slug: "till-char",
      title: "Till Character",
      keys: ["t", "T", ";"],
      pro: false,
      introduces: ["t", "T"],
      blocks: [
        p("`t` (till) works like `f` but stops one character **before** the match. It really pays off with operators later, for example `dt)` deletes up to a closing paren."),
        keys(
          k("t", "jump to just before the next {char}", demo(SAMPLE, [0, 0], "t=")),
          k("T", "jump to just after the previous {char}", demo(SAMPLE, [0, 28], "T="))
        ),
      ],
      challenge: vim(10, G.tillChar, "Use t, T and ; to land on the target."),
    },
  ],
}

const operators: Section = {
  title: "Basic Operators",
  lessons: [
    {
      slug: "intro-to-operators",
      title: "Intro to Operators",
      keys: ["operators"],
      pro: false,
      introduces: [],
      blocks: [
        p("Here's the idea that makes Vim click. An **operator** says *what* to do and a **motion** says *how far*:"),
        { type: "code", text: "{operator}{motion}\n\nd  w   →  delete a word\nc  $   →  change to the end of the line\ny  t)  →  copy up to the next )" },
        list("`d` delete", "`c` change (delete, then start inserting)", "`y` yank (copy)"),
        p("Every motion you've learned works with every operator. Learn one new motion and you get three new edits."),
        p("Typing an operator twice applies it to the whole line: `dd`, `cc`, `yy`."),
        callout("The rest of the curriculum (operators, search, text objects, visual mode) is part of Pro.", "Heads up"),
      ],
      editor: { playground: SAMPLE },
    },
    {
      slug: "delete-words",
      title: "Delete Words",
      keys: ["d", "w"],
      pro: true,
      introduces: ["d"],
      blocks: [
        keys(k("d w", "delete from the cursor to the start of the next word", demo(SAMPLE, [0, 6], "dw"))),
        p("Try other motions too: `de`, `db`, `d$`, `dt;`."),
      ],
      challenge: vim(10, G.deleteWords, "Delete the duplicated word."),
    },
    {
      slug: "change-words",
      title: "Change Words",
      keys: ["c", "w"],
      pro: true,
      introduces: ["c"],
      blocks: [
        keys(k("c w", "change from the cursor to the end of the word", demo(SAMPLE, [0, 6], "cwsum<Esc>"))),
        p("`c` deletes, then drops you into insert mode. (`cw` acts like `ce`: it keeps the space after the word.)"),
      ],
      challenge: vim(10, G.changeWords, "Change the wrong word back to what the goal shows."),
    },
    {
      slug: "delete-lines",
      title: "Delete Lines",
      keys: ["d", "d", "D"],
      pro: true,
      introduces: ["D", "C"],
      blocks: [
        keys(
          k("d d", "delete the whole line", demo(SAMPLE, [1, 3], "dd")),
          k("D", "delete from the cursor to the end of the line (same as d$)", demo(SAMPLE, [0, 13], "D"))
        ),
        p("`C` is the change version of `D`: it clears the rest of the line and starts inserting."),
      ],
      challenge: vim(10, G.deleteLines, "Delete the junk line or the trailing comment."),
    },
    {
      slug: "delete-multiple-lines",
      title: "Delete Multiple Lines",
      keys: ["d", "j", "k"],
      pro: true,
      introduces: [],
      blocks: [
        p("`j` and `k` are **linewise** motions, so an operator combined with them works on whole lines."),
        keys(
          k("d j", "delete this line and the one below", demo(SAMPLE, [0, 0], "dj")),
          k("d k", "delete this line and the one above", demo(SAMPLE, [2, 0], "dk"))
        ),
        p("Add a count to go further: `d2j` deletes three lines."),
      ],
      challenge: vim(10, G.deleteMultipleLines, "Delete the block of junk lines."),
    },
    {
      slug: "copy-paste-lines",
      title: "Copy/Paste Lines",
      keys: ["y", "p", "P"],
      pro: true,
      introduces: ["y", "p", "P", "Y"],
      blocks: [
        keys(
          k("y y", "yank (copy) the current line", demo(SAMPLE, [0, 0], "yyjp")),
          k("p", "put (paste) after the cursor or below the line"),
          k("P", "put before the cursor or above the line")
        ),
        p("Deleting also fills the register, so `ddp` swaps two lines."),
      ],
      challenge: vim(10, G.copyPasteLines, "Duplicate lines or swap them back into order."),
    },
  ],
}

const vertical: Section = {
  title: "Advanced Vertical Movement",
  lessons: [
    {
      slug: "relative-line-jumps",
      title: "Relative Line Jumps",
      keys: ["{n}", "j", "k"],
      pro: true,
      introduces: ["count"],
      editor: { relativeNumbers: true },
      blocks: [
        p("Put a number before a motion to repeat it. With **relative line numbers** turned on, every line shows how far away it is, so you can jump straight to it."),
        keys(k("5 j", "move down five lines", demo("a\nb\nc\nd\ne\nf\ng", [0, 0], "5j")), k("3 k", "move up three lines")),
        p("Counts work with nearly everything: `3w`, `2dd`, `d4j`."),
      ],
      challenge: vim(10, G.relativeJumps, "Read the relative number next to the target and jump there in one go."),
    },
    {
      slug: "absolute-line-jumps",
      title: "Absolute Line Jumps",
      keys: ["g", "g", "G"],
      pro: true,
      introduces: ["gg", "G"],
      blocks: [
        keys(
          k("g g", "go to the first line"),
          k("G", "go to the last line"),
          k("{n} G", "go to line n (great when an error message gives you a line number)")
        ),
      ],
      challenge: vim(10, G.absoluteJumps, "Jump to the target line."),
    },
    {
      slug: "paragraph-jumps",
      title: "Paragraph Jumps",
      keys: ["}", "{"],
      pro: true,
      introduces: ["}", "{"],
      blocks: [
        p("Blank lines split text into **paragraphs**. In code, those are usually logical blocks."),
        keys(k("}", "jump to the next blank line"), k("{", "jump to the previous blank line")),
      ],
      challenge: vim(10, G.paragraphJumps, "Jump between blocks with { and }."),
    },
    {
      slug: "window-scrolls",
      title: "Window Scrolls",
      keys: ["Ctrl+u", "Ctrl+d"],
      pro: true,
      introduces: ["<C-d>", "<C-u>"],
      editor: { halfPage: 8 },
      blocks: [
        keys(k("Ctrl+d", "move down half a screen"), k("Ctrl+u", "move up half a screen")),
        p("Here, half a screen is 8 lines."),
      ],
      challenge: vim(8, G.scrolls, "Scroll to the target, then fine-tune with other motions."),
    },
  ],
}

const search: Section = {
  title: "Search",
  lessons: [
    {
      slug: "search",
      title: "Search",
      keys: ["/", "?"],
      pro: true,
      introduces: ["/", "?"],
      blocks: [
        keys(k("/ {text} Enter", "search forward", demo(SAMPLE, [0, 0], "/notify<CR>")), k("? {text} Enter", "search backward")),
        p("Search is often the quickest way to any spot that's visible on screen."),
      ],
      challenge: vim(10, G.searchJumps, "Search your way to the target."),
    },
    {
      slug: "repeat-search",
      title: "Repeat Search",
      keys: ["n", "N"],
      pro: true,
      introduces: ["n", "N"],
      blocks: [keys(k("n", "next match, same direction"), k("N", "previous match, opposite direction"))],
      challenge: vim(10, G.searchRepeat, "Search, then use n / N to reach the right match."),
    },
    {
      slug: "quick-word-search",
      title: "Quick Word Search",
      keys: ["*", "#"],
      pro: true,
      introduces: ["*", "#"],
      blocks: [keys(k("*", "search forward for the word under the cursor"), k("#", "search backward for the word under the cursor"))],
      challenge: vim(10, G.starSearch, "Jump to another use of the word under the cursor."),
    },
    {
      slug: "search-review",
      title: "Search Review",
      keys: ["Review"],
      pro: true,
      introduces: [],
      blocks: [p("A mix of every search technique. Pick the quickest one each round.")],
      challenge: vim(12, G.searchReview, "Reach every target as efficiently as you can."),
    },
  ],
}

function objLesson(slug: string, title: string, ks: string[], intro: string, gen: Parameters<typeof vim>[1], d?: VimDemo, introduces: string[] = []): Lesson {
  return {
    slug,
    title,
    keys: ks,
    pro: true,
    introduces,
    blocks: [keys({ keys: ks, desc: intro, demo: d })],
    challenge: vim(10, gen, "Make the code match the goal."),
  }
}

const BR_DEMO = `if (ready(user, opts)) {
  start({ fast: true });
}`
const Q_DEMO = `greet("Hello world", 'en');`

const bracketObjects: Section = {
  title: "Text Objects: Brackets",
  lessons: [
    {
      slug: "intro-to-text-objects",
      title: "Intro to Text Objects",
      keys: ["text objects"],
      pro: true,
      introduces: [],
      blocks: [
        p("A **text object** picks out a chunk of text based on structure (a word, a pair of brackets, a string) instead of on cursor movement. It goes where a motion would:"),
        { type: "code", text: "{operator}{i|a}{object}\n\nd i (   →  delete inside parens\nc a \"   →  change a whole string, quotes too\ny i w   →  yank the word under the cursor" },
        list("`i` means **inside**: just the contents", "`a` means **around**: the contents plus the delimiters (or the surrounding space)"),
        p("Best of all, the cursor can be anywhere inside the object. No need to line it up first."),
      ],
      editor: { playground: BR_DEMO },
    },
    objLesson("delete-inside-brackets", "Delete Inside Brackets", ["d", "i", "{"], "delete everything inside the nearest ( [ or { pair", G.deleteInsideBrackets, demo(BR_DEMO, [0, 8], "di("), ["i(", "i[", "i{"]),
    objLesson("delete-around-brackets", "Delete Around Brackets", ["d", "a", "{"], "delete the brackets and everything inside them", G.deleteAroundBrackets, demo(BR_DEMO, [1, 10], "da{"), ["a(", "a[", "a{"]),
    objLesson("change-inside-brackets", "Change Inside Brackets", ["c", "i", "{"], "replace what's inside the brackets", G.changeInsideBrackets, demo(BR_DEMO, [0, 8], "ci(ok<Esc>")),
    objLesson("change-around-brackets", "Change Around Brackets", ["c", "a", "{"], "replace the brackets and their contents", G.changeAroundBrackets, demo(BR_DEMO, [1, 10], "ca{opts<Esc>")),
    { slug: "brackets-review", title: "Brackets Review", keys: ["Review"], pro: true, introduces: [], blocks: [p("Every bracket text object, mixed together.")], challenge: vim(12, G.bracketsReview, "Make the code match the goal.") },
  ],
}

const quoteObjects: Section = {
  title: "Text Objects: Quotes",
  lessons: [
    objLesson("delete-inside-quotes", "Delete Inside Quotes", ["d", "i", '"'], "empty the string under (or after) the cursor", G.deleteInsideQuotes, demo(Q_DEMO, [0, 9], 'di"'), ['i"', "i'", "i`"]),
    objLesson("delete-around-quotes", "Delete Around Quotes", ["d", "a", '"'], "delete the string, quotes included", G.deleteAroundQuotes, demo(Q_DEMO, [0, 9], 'da"'), ['a"', "a'", "a`"]),
    objLesson("change-inside-quotes", "Change Inside Quotes", ["c", "i", '"'], "rewrite the string's contents", G.changeInsideQuotes, demo(Q_DEMO, [0, 9], 'ci"Hi<Esc>')),
    objLesson("change-around-quotes", "Change Around Quotes", ["c", "a", '"'], "swap the whole string for something else", G.changeAroundQuotes, demo(Q_DEMO, [0, 9], 'ca"msg<Esc>')),
    { slug: "quotes-review", title: "Quotes Review", keys: ["Review"], pro: true, introduces: [], blocks: [p("Every quote text object, mixed together.")], challenge: vim(12, G.quotesReview, "Make the code match the goal.") },
  ],
}

const wordObjects: Section = {
  title: "Text Objects: Words",
  lessons: [
    objLesson("delete-inside-word", "Delete Inside Word", ["d", "i", "w"], "delete the word under the cursor (not the spaces around it)", G.deleteInsideWord, demo(SAMPLE, [0, 9], "diw"), ["iw", "iW"]),
    objLesson("delete-around-word", "Delete Around Word", ["d", "a", "w"], "delete the word and the space after it", G.deleteAroundWord, demo(SAMPLE, [0, 9], "daw"), ["aw", "aW"]),
    objLesson("change-inside-word", "Change Inside Word", ["c", "i", "w"], "rename the word under the cursor, from anywhere inside it", G.changeInsideWord, demo(SAMPLE, [0, 9], "ciwsum<Esc>")),
    { slug: "words-review", title: "Words Review", keys: ["Review"], pro: true, introduces: [], blocks: [p("Word text objects, mixed together.")], challenge: vim(12, G.wordsReview, "Make the code match the goal.") },
  ],
}

const PARA_DEMO = `const a = 1;
const b = 2;

log(a + b);`

const paragraphObjects: Section = {
  title: "Text Objects: Paragraphs",
  lessons: [
    objLesson("delete-inside-paragraph", "Delete Inside Paragraph", ["d", "i", "p"], "delete the block of lines the cursor is in", G.deleteInsideParagraph, demo(PARA_DEMO, [0, 0], "dip"), ["ip"]),
    objLesson("delete-around-paragraph", "Delete Around Paragraph", ["d", "a", "p"], "delete the block and the blank lines after it", G.deleteAroundParagraph, demo(PARA_DEMO, [0, 0], "dap"), ["ap"]),
    objLesson("change-inside-paragraph", "Change Inside Paragraph", ["c", "i", "p"], "replace the whole block", G.changeInsideParagraph, demo(PARA_DEMO, [0, 0], "cip// todo<Esc>")),
    { slug: "paragraphs-review", title: "Paragraphs Review", keys: ["Review"], pro: true, introduces: [], blocks: [p("Paragraph text objects, mixed together.")], challenge: vim(10, G.paragraphsReview, "Make the text match the goal.") },
  ],
}

const megaReview: Section = {
  title: "Text Objects: Mega Review",
  lessons: [
    { slug: "text-objects-mega-review", title: "Text Objects Mega Review", keys: ["Mega Review"], pro: true, introduces: [], blocks: [p("Brackets, quotes, words and paragraphs, all mixed together. Pick the right object every time.")], challenge: vim(20, G.textObjectsMega, "Make the code match the goal.") },
  ],
}

const visual: Section = {
  title: "Visual Mode",
  lessons: [
    {
      slug: "intro-to-visual-mode",
      title: "Intro to Visual Mode",
      keys: ["v", "Esc"],
      pro: true,
      introduces: ["v"],
      blocks: [
        p("Visual mode lets you **see** what you're about to operate on. Press `v`, move with any motion to grow the selection, then press an operator."),
        keys(k("v", "start a selection (press again to cancel)", demo(SAMPLE, [0, 6], "veed")), k("Esc", "leave visual mode")),
        p("Notice that the order flips: in visual mode you pick the text first and the operator second."),
      ],
      challenge: vim(8, G.visualIntro, "Select the text with v and a motion, then delete it with d."),
    },
    {
      slug: "visual-mode-operators",
      title: "Visual Mode Operators",
      keys: ["d", "c", "y"],
      pro: true,
      introduces: [],
      blocks: [keys(k("d", "delete the selection"), k("c", "change the selection"), k("y", "yank the selection"))],
      challenge: vim(10, G.visualOperators, "Select, then delete, change or yank and paste."),
    },
    {
      slug: "visual-switch-ends",
      title: "Switch Selection Ends",
      keys: ["v", "o"],
      pro: true,
      introduces: ["v_o"],
      blocks: [p("Inside visual mode, `o` moves the cursor to the **other** end of the selection, so you can grow or shrink either side."), keys(k("o", "jump to the other end of the selection", demo(SAMPLE, [0, 14], "veohhd")))],
      challenge: vim(8, G.visualSwitchEnds, "Select and delete. Use o if you started in the wrong place."),
    },
    {
      slug: "visual-line-mode",
      title: "Visual Line Mode",
      keys: ["V", "Esc"],
      pro: true,
      introduces: ["V"],
      blocks: [keys(k("V", "select whole lines", demo(SAMPLE, [1, 0], "Vjd")))],
      challenge: vim(8, G.visualLineIntro, "Select the junk lines with V and delete them."),
    },
    {
      slug: "visual-line-switch-ends",
      title: "Switch Visual Line Ends",
      keys: ["V", "o"],
      pro: true,
      introduces: [],
      blocks: [p("`o` works in visual line mode too, letting you extend the selection upward or downward.")],
      challenge: vim(8, G.visualLineIntro, "Delete the junk block, from whichever end is closest."),
    },
    {
      slug: "visual-line-operators",
      title: "Visual Line Operators",
      keys: ["V", "d", "y"],
      pro: true,
      introduces: [],
      blocks: [p("Combine `V` with `d`, `y` and `p` to delete, duplicate and move blocks of code.")],
      challenge: vim(10, G.visualLineOperators, "Delete or duplicate whole blocks of lines."),
    },
  ],
}

export const VIM_SECTIONS: Section[] = [
  basics,
  insertPro,
  motions,
  operators,
  vertical,
  search,
  bracketObjects,
  quoteObjects,
  wordObjects,
  paragraphObjects,
  megaReview,
  visual,
]
