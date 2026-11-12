# SkillForge

An interactive "learn by doing" platform, modeled on the mechanics of VimHero but generalized so the same
lessons / challenges / practice / XP system can teach any skill. Ships with two tracks:

- **Vim**: 52 lessons in 12 sections, running on a built-in Vim emulator (first 4 sections free, the rest Pro)
- **Git**: recall quiz drills (shows how a non-editor track plugs in)

## Run

```bash
npm install
npm run dev        # http://localhost:3000
npm test           # engine + challenge-generator checks
```

## Features

| Free | Pro ($20 lifetime, demo checkout) |
| --- | --- |
| Free lessons with a live editor, animated examples, tips | Every lesson in every track |
| Generated challenges with timer, keystrokes vs ideal, XP | Practice categories: editing, text objects, visual |
| Practice: movement + insertion, goal mode | Timed and endless practice modes |
| Stats: activity heatmap, per-command level/XP | |

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
src/lib/store.ts              zustand + localStorage: user, pro, progress, XP, activity
src/components/vim/*          editor, example player, challenge runner, playground
src/components/quiz/*         quiz challenge runner
```

**XP rule:** finish a round in no more keystrokes than the ideal and every command you used gets +1 XP.
Each command levels up on its own (levels 0–10: learning <4, practiced 4–5, fluent 6+).

### Adding a new track

1. Create `src/lib/tracks/<name>/index.ts` that exports a `Track` (sections, lessons, commands, practice categories).
2. Use an existing challenge kind (`vim` or `quiz`), or add a new one to `ChallengeSpec` along with a runner component,
   and render it in `lesson-view.tsx` and `practice.tsx`.
3. Register it in `src/lib/tracks/index.ts`. Routes, sidebar, Pro gating, practice and stats all pick it up automatically.

## What to wire up for production

- **Auth:** `/signin` is a local demo. Swap in Auth.js, Clerk, or Supabase.
- **Billing:** `src/components/upgrade/checkout.tsx` flips `pro` on the client. Replace it with Stripe Checkout and set
  Pro from a verified webhook.
- **Persistence:** progress is in localStorage (`src/lib/store.ts`). Sync it to a database per user.
