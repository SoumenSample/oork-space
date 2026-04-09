import { cn } from "@/lib/utils"
import { Loader2Icon } from "lucide-react"

function Spinner({ className, ...props }: React.ComponentProps<"svg">) {
  return (
    <Loader2Icon role="status" aria-label="Loading" className={cn("size-4 animate-spin", className)} {...props} />
  )
}

function SpinnerFullscreen({
  className,
  text = "Loading...",
  ...props
}: React.ComponentProps<"div"> & { text?: string }) {
  return (
    <div
      role="status"
      aria-label={text}
      className={cn("flex min-h-[240px] w-full items-center justify-center", className)}
      {...props}
    >
      <div className="flex flex-col items-center gap-3 text-sm text-muted-foreground">
        <Spinner className="size-7" />
        <span>{text}</span>
      </div>
    </div>
  )
}

export { Spinner, SpinnerFullscreen }

