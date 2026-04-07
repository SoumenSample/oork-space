import * as React from "react";
import { cn } from "@/lib/utils";

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "secondary" | "outline" | "success" | "destructive";
}

export function Badge({
  className,
  variant = "default",
  ...props
}: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium",
        "bg-[color-mix(in_oklab,var(--background),black_12%)] border-border/40 text-foreground/80",
        variant === "secondary" &&
          "bg-[color-mix(in_oklab,var(--background),black_12%)] border-border/40 text-foreground/80",
        variant === "outline" &&
          "bg-transparent border-border/50 text-foreground/80",
        variant === "success" &&
          "border-emerald-500/40 bg-emerald-500/10 text-emerald-300",
        variant === "destructive" &&
          "border-rose-500/40 bg-rose-500/10 text-rose-300",
        className
      )}
      {...props}
    />
  );
}


