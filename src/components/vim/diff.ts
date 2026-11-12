/** Line-level LCS diff: which lines of `a` are not in `b`, and vice versa. */
export function lineDiff(a: string[], b: string[]): { aOnly: Set<number>; bOnly: Set<number> } {
  const n = a.length
  const m = b.length
  const dp: number[][] = Array.from({ length: n + 1 }, () => new Array(m + 1).fill(0))
  for (let i = n - 1; i >= 0; i--)
    for (let j = m - 1; j >= 0; j--) dp[i][j] = a[i] === b[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1])
  const aOnly = new Set<number>()
  const bOnly = new Set<number>()
  let i = 0
  let j = 0
  while (i < n && j < m) {
    if (a[i] === b[j]) {
      i++
      j++
    } else if (dp[i + 1][j] >= dp[i][j + 1]) aOnly.add(i++)
    else bOnly.add(j++)
  }
  while (i < n) aOnly.add(i++)
  while (j < m) bOnly.add(j++)
  return { aOnly, bOnly }
}
