import { TRACKS, allLessons, knownCommands } from "../src/lib/tracks"
import { createState, runKeys } from "../src/lib/vim/engine"
import { makeRng } from "../src/lib/vim/generators"

let problems = 0
for (const track of TRACKS) {
  for (const lesson of allLessons(track)) {
    const ch = lesson.challenge
    if (!ch || ch.kind !== "vim") continue
    const known = knownCommands(track, lesson.slug)
    const rng = makeRng(42)
    const t0 = performance.now()
    let worst = 0
    for (let i = 0; i < 40; i++) {
      const s = performance.now()
      let r
      try {
        r = ch.generate({ rng, known })
      } catch (e) {
        problems++
        console.log(`THROW ${lesson.slug}: ${(e as Error).message}`)
        break
      }
      worst = Math.max(worst, performance.now() - s)
      if (r.kind === "move") {
        const end = runKeys(createState(r.lines, r.cursor, { halfPage: lesson.editor?.halfPage }), r.solution).cursor
        if (end.line !== r.target!.line || end.col !== r.target!.col) {
          problems++
          console.log(`BAD MOVE ${lesson.slug}`, r.solution.join(""), r.cursor, r.target, end)
        }
      } else if (!r.goal || r.goal.join("\n") === r.lines.join("\n") || !isFinite(r.ideal)) {
        problems++
        console.log(`BAD EDIT ${lesson.slug}`)
      }
      if (r.ideal <= 0) {
        problems++
        console.log(`ZERO IDEAL ${lesson.slug}`)
      }
    }
    const avg = (performance.now() - t0) / 40
    console.log(`${lesson.slug.padEnd(28)} avg ${avg.toFixed(1)}ms worst ${worst.toFixed(1)}ms`)
  }
}
console.log(problems ? `${problems} problems` : "ok")
