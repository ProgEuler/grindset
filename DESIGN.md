# Grindset Design System

The rules below are the source of truth for how Grindset looks and is built.
**Every design instruction from the product owner is recorded here as a numbered rule.** New rules go at the
bottom of the Rules log, and a rule that changes an older one says which rule it replaces.

---

## Foundations (current state)

| Area | Choice |
| --- | --- |
| Framework | Next.js (App Router) + Tailwind CSS v4 |
| Components | shadcn/ui, `base-nova` style (built on Base UI, not Radix). Use the `render` prop, not `asChild` |
| Colors | shadcn `neutral` base color, CSS variables in `src/app/globals.css` (`--background`, `--primary`, …) |
| Theme | Dark by default, light + system supported via `next-themes` |
| Fonts | Geist Sans for UI (`font-sans`), Geist Mono for code, keys and numbers (`font-mono`) |
| Icons | Meteor Icons (`@meteor-icons/react`). See R1 |
| Radius | shadcn `--radius` tokens (`rounded-lg`, `rounded-xl` for cards and editors) |

### Semantic colors in use

| Meaning | Classes |
| --- | --- |
| Success, target, XP earned | `emerald-500` |
| Pro, upgrade, premium | `amber-500` (button: `bg-amber-500 text-black hover:bg-amber-400`) |
| Visual-mode selection | `sky-500/30` |
| Lines that differ from the goal | `rose-500` |

---

## Rules log

### R1: Icons come from Meteor Icons only
- Import every icon from `@meteor-icons/react` with named imports: `import { Check, Star } from "@meteor-icons/react"`.
- Never use `lucide-react` or any other icon set. It has been uninstalled.
- `npx shadcn add …` generates components that import `lucide-react`. Replace those imports with Meteor equivalents
  before committing.
- Size icons with Tailwind classes (`size-4`, `size-5`), not the `size` prop. Inside shadcn `Button`s, leave the size
  off: the button sets `size-4` automatically.
- Color comes from `currentColor`, so set it with text classes (`text-primary`, `text-amber-500`).
- Keep the default `strokeWidth` (2) unless a rule says otherwise.

Icon vocabulary (use the same icon for the same meaning everywhere):

| Meaning | Meteor icon |
| --- | --- |
| Brand / logo | `Bolt` |
| Lessons | `BookOpen` |
| Practice | `Fire` |
| Stats | `TrendingUp` |
| Pro / upgrade | `Star` |
| Completed / correct | `Check`, `CircleCheck` |
| Challenge complete | `BadgeCheck` |
| Wrong / error | `CircleXmark` |
| Locked (Pro) | `Lock` |
| Info callout | `CircleInfo` |
| Warning | `TriangleExclamation` |
| Play example | `Play` |
| Restart / replay / loading spinner | `Rotate` (spinner: add `animate-spin`) |
| Repeat / regenerate | `Refresh` |
| Skip | `ForwardStep` |
| Reveal solution | `Eye` |
| Next / back | `ArrowRight`, `ArrowLeft` |
| Close | `Xmark` |
| Lesson list (mobile) | `List` |
| Settings | `Gear` |
| Account | `User` |
| Sign out | `Power` |
| Theme toggle | `Sun`, `Moon` |
| Keyboard / hands-on | `Command` |
| Structured curriculum | `Layers` |
| Track card | `Microchip` |

### R2: Use standard shadcn components for now
- Build UI from the stock shadcn/ui components in `src/components/ui` with minimal custom styling.
- A full visual redesign comes later, so don't add custom visual flourishes yet. Keep layouts simple and token-based.

### R3: Code blocks use a Dracula theme, never plain text
- Every code surface uses Dracula colors with syntax highlighting: the Vim editor, example players, the goal panel and
  lesson code blocks.
- Code surfaces stay dark (`bg-code-bg`) in both light and dark app themes.
- Use the `code-*` tokens from `globals.css` (`bg-code-bg`, `bg-code-bar`, `text-code-keyword`, …). Never hard-code hex
  values in components.
- For read-only code, use `<CodeBlock>` (`src/components/code-block.tsx`). Highlighting comes from `src/lib/syntax.ts`
  (no dependency; it works per character so the editor can still draw the cursor, selection and targets).

| Token | Dracula color | Used for |
| --- | --- | --- |
| `code-bg` | `#282a36` | editor / block background |
| `code-bar` | `#21222c` | status bar, panel headers |
| `code-line` | `#44475a` | current line, borders |
| `code-selection` | `#44475a` | visual-mode selection |
| `code-fg` | `#f8f8f2` | plain text, punctuation, block cursor |
| `code-comment` / `code-gutter` | `#6272a4` | comments (italic), line numbers |
| `code-keyword` | `#ff79c6` | keywords, operators |
| `code-string` | `#f1fa8c` | strings, SEARCH mode badge |
| `code-number` | `#bd93f9` | numbers, `true`/`null`/`this`, NORMAL mode badge |
| `code-function` | `#50fa7b` | function calls, INSERT mode badge, added goal lines |
| `code-type` | `#8be9fd` | types / capitalized names (italic) |
| `code-param` | `#ffb86c` | VISUAL mode badge |
