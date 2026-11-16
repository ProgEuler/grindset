# Grindset

An interactive "learn by doing" platform, modeled on the mechanics of VimHero but generalized so the same
lessons / challenges / practice / XP system can teach any skill. Ships with two tracks:

- **Vim**: 52 lessons in 12 sections, running on a built-in Vim emulator
- **Git**: recall quiz drills (shows how a non-editor track plugs in)

## Run

```bash
npm install
npm run dev        # http://localhost:3000
npm test           # engine + challenge-generator checks
```

## Features

**Everything is free.** There are no paid plans, subscriptions or locked content.

- **Lessons** with a live editor, animated examples and tips
- **Challenges** generated fresh every time, with a timer, keystrokes vs. the ideal count, and XP
- **Practice** in every category, with goal, timed and endless modes
- **Stats**: an activity heatmap and a level/XP for every command
- **Vim playground** (`/playground`): a free editor with sample files, or paste your own code.
- **Pro moves** (`/recap`): slow habits next to pro commands (`0i` → `I`, `bcw` → `ciw`, …). `scripts/recap-test.ts`
  checks that every pair produces the same result.
- **Saved** (`/saved`): bookmark lessons, commands and pro moves, and write your own learnings, organized by course.
  Includes a filter by type, per-item notes, and copy as Markdown.

Lesson navigation with `Ctrl+j` / `Ctrl+k`, a per-lesson stats tab, a sidebar with completion checkmarks, light/dark theme,
settings (relative numbers, solution hints, reset), and demo sign-in.

## Architecture

```
src/lib/vim/engine.ts         pure, immutable Vim emulator (modes, motions, operators, text objects, visual, search, undo)
src/lib/vim/generators.ts     round builders + "ideal keystrokes" (Dijkstra over the motions learned so far)
src/lib/tracks/types.ts       generic Track > Section > Lesson > Challenge model
src/lib/tracks/vim/*          Vim curriculum, snippets and per-lesson challenge generators
src/lib/tracks/git/index.ts   quiz-based track
src/lib/tracks/index.ts       track registry
src/lib/store.ts              zustand + localStorage: user, progress, XP, activity, saved items
src/components/vim/*          editor, example player, challenge runner, playground
src/components/quiz/*         quiz challenge runner
```

**XP rule:** finish a round in no more keystrokes than the ideal and every command you used gets +1 XP.
Each command levels up on its own (levels 0–10: learning <4, practiced 4–5, fluent 6+).

### Adding a new track

1. Create `src/lib/tracks/<name>/index.ts` that exports a `Track` (sections, lessons, commands, practice categories).
2. Use an existing challenge kind (`vim` or `quiz`), or add a new one to `ChallengeSpec` along with a runner component,
   and render it in `lesson-view.tsx` and `practice.tsx`.
3. Register it in `src/lib/tracks/index.ts`. Routes, sidebar, practice, stats and saving all pick it up automatically.

## What to wire up for production

- **Auth:** `/signin` is a local demo. Swap in Auth.js, Clerk, or Supabase.
- **Persistence:** progress is in localStorage (`src/lib/store.ts`). Sync it to a database per user.
