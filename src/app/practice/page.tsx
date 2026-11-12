import { redirect } from "next/navigation"
import { TRACKS } from "@/lib/tracks"

export default function PracticeIndex() {
  redirect(`/practice/${TRACKS[0].slug}`)
}
