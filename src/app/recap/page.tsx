import type { Metadata } from "next"
import { RecapView } from "@/components/recap/recap-view"

export const metadata: Metadata = {
  title: "Vim pro moves",
  description: "A quick recap of the Vim commands pros use, and the slower habits they replace.",
}

export default function RecapPage() {
  return <RecapView />
}
