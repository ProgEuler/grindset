"use client"

import { useState } from "react"
import { List } from "@meteor-icons/react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { LessonSidebar } from "./lesson-sidebar"

export function MobileLessonNav({ trackSlug }: { trackSlug: string }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="border-b px-4 py-2 lg:hidden">
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger render={<Button variant="outline" size="sm" />}>
          <List /> Lessons
        </SheetTrigger>
        <SheetContent side="left" className="w-80 overflow-y-auto p-0">
          <SheetHeader>
            <SheetTitle>Lessons</SheetTitle>
          </SheetHeader>
          <LessonSidebar trackSlug={trackSlug} onNavigate={() => setOpen(false)} />
        </SheetContent>
      </Sheet>
    </div>
  )
}
