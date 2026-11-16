import { createState, runKeys } from "../src/lib/vim/engine"
import { PRO_MOVES, moveKeys, keyCount } from "../src/lib/tracks/vim/recap"

let fail = 0
for (const g of PRO_MOVES) {
  for (const m of g.moves) {
    const run = (which: "pro" | "slow") => runKeys(createState(m.text, m.cursor), moveKeys(m, which))
    const pro = run("pro")
    const slow = run("slow")
    const problems: string[] = []
    if (pro.lines.join("\n") !== slow.lines.join("\n")) problems.push(`text differs\n    pro:  ${JSON.stringify(pro.lines.join("\n"))}\n    slow: ${JSON.stringify(slow.lines.join("\n"))}`)
    if (pro.lines.join("\n") === m.text && pro.cursor.line === m.cursor.line && pro.cursor.col === m.cursor.col) problems.push("pro move did nothing")
    if (pro.mode !== "normal" || slow.mode !== "normal") problems.push(`ended in ${pro.mode}/${slow.mode} mode`)
    if (keyCount(m.pro) > keyCount(m.slow) || (keyCount(m.pro) === keyCount(m.slow) && !m.why)) problems.push("pro way isn't shorter (or explained)")
    // pure motions must land on the same spot
    if (pro.lines.join("\n") === m.text && (pro.cursor.line !== slow.cursor.line || pro.cursor.col !== slow.cursor.col))
      problems.push(`cursor differs: pro ${JSON.stringify(pro.cursor)} slow ${JSON.stringify(slow.cursor)}`)
    if (problems.length) {
      fail++
      console.log(`FAIL ${m.pro} vs ${m.slow}: ${problems.join("; ")}`)
    }
  }
}
console.log(fail ? `${fail} recap failures` : "recap ok")
if (fail) process.exit(1)
