"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { useApp } from "@/lib/store"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

/** Demo sign-in: stores a profile locally. Swap for Auth.js / Clerk / Supabase later. */
export default function SignInPage() {
  const signIn = useApp((s) => s.signIn)
  const router = useRouter()
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 items-center px-4 py-16">
      <Card className="w-full">
        <form
          onSubmit={(e) => {
            e.preventDefault()
            if (!name.trim()) return
            signIn({ name: name.trim(), email: email.trim() })
            toast.success(`Welcome, ${name.trim()}!`)
            router.push("/stats")
          }}
        >
          <CardHeader>
            <CardTitle>Sign in</CardTitle>
            <CardDescription>Track your progress and level up every command. (Demo: your profile is saved in this browser only.)</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required autoFocus />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" className="w-full">
              Continue
            </Button>
          </CardFooter>
        </form>
      </Card>
    </main>
  )
}
