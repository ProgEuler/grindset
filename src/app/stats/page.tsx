import { Suspense } from "react"
import type { Metadata } from "next"
import { StatsView } from "@/components/stats/stats-view"

export const metadata: Metadata = { title: "Stats" }

export default function StatsPage() {
  return (
    <Suspense>
      <StatsView />
    </Suspense>
  )
}
