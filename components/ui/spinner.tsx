// import { Loader2Icon } from "lucide-react"

// import { cn } from "@/lib/utils"

// function Spinner({ className, ...props }: React.ComponentProps<"svg">) {
//   return (
//     <Loader2Icon
//       role="status"
//       aria-label="Loading"
//       className={cn("size-4 animate-spin", className)}
//       {...props}
//     />
//   )
// }

// export { Spinner }

import { LoaderIcon } from "lucide-react"

import { cn } from "@/lib/utils"

function Spinner({ className, ...props }: React.ComponentProps<"svg">) {
  return (
    <LoaderIcon
      role="status"
      aria-label="Loading"
      className={cn("size-4 animate-spin", className)}
      {...props}
    />
  )
}

export function SpinnerFullscreen({ text = "Loading..." }: { text?: string }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] w-full py-20 gap-4">
      <Spinner className="size-8 text-teal-500" />
      <p className="text-sm text-gray-500 dark:text-gray-400">{text}</p>
    </div>
  )
}

export { Spinner }
