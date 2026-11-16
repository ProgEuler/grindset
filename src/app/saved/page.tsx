import { Suspense } from "react"
import type { Metadata } from "next"
import { SavedView } from "@/components/saved/saved-view"

export const metadata: Metadata = { title: "Saved" }

export default function SavedPage() {
  return (
    <Suspense>
      <SavedView />
    </Suspense>
  )
}
