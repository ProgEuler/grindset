"use client"

import { useState } from "react"
import { useTheme } from "next-themes"
import { toast } from "sonner"
import { useApp, useHydrated } from "@/lib/store"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"

export default function SettingsPage() {
  const hydrated = useHydrated()
  const { settings, updateSettings, resetProgress, user } = useApp()
  const { theme, setTheme } = useTheme()
  const [open, setOpen] = useState(false)

  if (!hydrated) return <main className="mx-auto w-full max-w-2xl px-4 py-10" />

  return (
    <main className="mx-auto w-full max-w-2xl space-y-6 px-4 py-10">
      <h1 className="text-3xl font-bold tracking-tight">Settings</h1>

      <Card>
        <CardHeader>
          <CardTitle>Editor</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Row label="Relative line numbers" hint="Show each line's distance from the cursor (always on in the relative jumps lesson).">
            <Switch checked={settings.relativeNumbers} onCheckedChange={(v) => updateSettings({ relativeNumbers: v })} />
          </Row>
          <Row label="Show solution button" hint="Let challenges reveal an ideal solution (that round earns no XP).">
            <Switch checked={settings.showHints} onCheckedChange={(v) => updateSettings({ showHints: v })} />
          </Row>
          <Row label="Theme">
            <ToggleGroup value={[theme ?? "dark"]} onValueChange={(v) => (v as string[])[0] && setTheme((v as string[])[0])} size="sm">
              <ToggleGroupItem value="light">light</ToggleGroupItem>
              <ToggleGroupItem value="dark">dark</ToggleGroupItem>
              <ToggleGroupItem value="system">system</ToggleGroupItem>
            </ToggleGroup>
          </Row>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Account</CardTitle>
          <CardDescription>{user ? `Signed in as ${user.name}` : "Not signed in"}. Everything on Grindset is free.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Row label="Reset progress" hint="Clears lesson completion, XP and activity for all tracks.">
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger render={<Button variant="destructive" size="sm" />}>Reset</DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Reset all progress?</DialogTitle>
                  <DialogDescription>This can&apos;t be undone.</DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <DialogClose render={<Button variant="ghost" />}>Cancel</DialogClose>
                  <Button
                    variant="destructive"
                    onClick={() => {
                      resetProgress()
                      setOpen(false)
                      toast("Progress reset")
                    }}
                  >
                    Reset progress
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </Row>
        </CardContent>
      </Card>
    </main>
  )
}

function Row({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div>
        <Label>{label}</Label>
        {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
      </div>
      {children}
    </div>
  )
}
