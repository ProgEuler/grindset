import Link from "next/link"
import { CrownIcon, LockIcon } from "lucide-react"
import { PRO_PLAN } from "@/lib/config"
import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export function ProGate({ title = "This lesson is part of Pro" }: { title?: string }) {
  return (
    <Card className="border-amber-500/40 bg-amber-500/5">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <LockIcon className="size-4 text-amber-500" /> {title}
        </CardTitle>
        <CardDescription>
          Unlock interactive challenges for every lesson, all practice categories and future tracks. ${PRO_PLAN.price}, paid {PRO_PLAN.period}.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Link href="/upgrade?source=lesson" className={cn(buttonVariants(), "bg-amber-500 text-black hover:bg-amber-400")}>
          <CrownIcon /> Upgrade to Pro
        </Link>
      </CardContent>
    </Card>
  )
}
