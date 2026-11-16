import type { Metadata } from "next"
import { PlaygroundView } from "@/components/playground/playground-view"

export const metadata: Metadata = {
  title: "Vim playground",
  description: "A free Vim editor with sample code to practice on.",
}

export default function PlaygroundPage() {
  return <PlaygroundView />
}
