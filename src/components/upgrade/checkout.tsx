"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { CheckIcon, CrownIcon } from "lucide-react"
import { toast } from "sonner"
import { PRO_PLAN } from "@/lib/config"
import { useApp, useHydrated } from "@/lib/store"
import { cn } from "@/lib/utils"
import { Button, buttonVariants } from "@/components/ui/button"
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"

/**
 * Demo checkout. Replace `unlock()` with a call to your billing provider
 * (e.g. create a Stripe Checkout session in a route handler and redirect),
 * then set `pro` from a verified webhook instead of on the client.
 */
export function Checkout() {
  const hydrated = useHydrated()
  const pro = useApp((s) => s.pro)
  const setPro = useApp((s) => s.setPro)
  const router = useRouter()
  const [open, setOpen] = useState(false)

  if (!hydrated) return <Button disabled className="w-full">Checking access…</Button>
  if (pro)
    return (
      <div className="space-y-2 text-center">
        <p className="flex items-center justify-center gap-2 text-sm text-emerald-600 dark:text-emerald-400">
          <CheckIcon className="size-4" /> You have Pro. Thanks for the support!
        </p>
        <Link href="/learn/vim/delete-words" className={cn(buttonVariants(), "w-full")}>
          Continue to Pro lessons
        </Link>
      </div>
    )

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button className="w-full bg-amber-500 text-black hover:bg-amber-400" size="lg" />}>
        <CrownIcon /> Get lifetime access: ${PRO_PLAN.price}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Demo checkout</DialogTitle>
          <DialogDescription>
            Billing isn&apos;t connected yet, so no payment is taken. Confirming unlocks Pro in this browser so you can try every premium feature.
          </DialogDescription>
        </DialogHeader>
        <div className="rounded-lg border p-4 text-sm">
          <div className="flex justify-between">
            <span>{PRO_PLAN.name}: lifetime</span>
            <span className="font-mono">${PRO_PLAN.price}.00</span>
          </div>
        </div>
        <DialogFooter>
          <DialogClose render={<Button variant="ghost" />}>Cancel</DialogClose>
          <Button
            onClick={() => {
              setPro(true)
              setOpen(false)
              toast.success("Pro unlocked", { description: "Every lesson and practice mode is now available." })
              router.push("/learn/vim/delete-words")
            }}
          >
            Unlock Pro (demo)
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
