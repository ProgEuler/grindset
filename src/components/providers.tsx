"use client"

import { useEffect } from "react"
import { ThemeProvider } from "next-themes"
import { TooltipProvider } from "@/components/ui/tooltip"
import { Toaster } from "@/components/ui/sonner"
import { useApp } from "@/lib/store"

export function Providers({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    useApp.persist.rehydrate()
  }, [])
  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange>
      <TooltipProvider>
        {children}
        <Toaster position="bottom-right" />
      </TooltipProvider>
    </ThemeProvider>
  )
}
