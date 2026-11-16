import { cn } from "@/lib/utils"

export function KeyBadge({ k, className }: { k: string; className?: string }) {
  return (
    <kbd
      className={cn(
        "inline-flex h-6 min-w-6 items-center justify-center rounded-md border border-b-2 bg-muted px-1.5 font-mono text-xs font-medium text-foreground",
        className
      )}
    >
      {k === "Escape" ? "Esc" : k === "Enter" ? "↵" : k === "Backspace" ? "⌫" : k === " " ? "␣" : k}
    </kbd>
  )
}

export function KeyList({ keys, className }: { keys: string[]; className?: string }) {
  return (
    <span className={cn("inline-flex flex-wrap gap-1", className)}>
      {keys.map((k, i) => (
        <KeyBadge key={i} k={k} />
      ))}
    </span>
  )
}
