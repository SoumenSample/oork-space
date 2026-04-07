"use client";

import * as AccordionPrimitive from "@radix-ui/react-accordion";
import React from "react";

export const Accordion = AccordionPrimitive.Root;
export const AccordionItem = AccordionPrimitive.Item;

export const AccordionTrigger = React.forwardRef<HTMLButtonElement, React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Trigger>>(
  ({ className, children, ...props }, ref) => (
    <AccordionPrimitive.Header>
      <AccordionPrimitive.Trigger
        ref={ref}
        className={cn(
          "flex w-full items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors",
          "bg-[color-mix(in_oklab,var(--background),black 8%)] text-foreground",
          "hover:bg-[color-mix(in_oklab,var(--background),black 16%)]",
          "border-l-2 border-transparent data-[state=open]:border-secondary data-[state=open]:bg-secondary/10 data-[state=open]:text-secondary",
          className
        )}
        {...props}
      >
        {children}
      </AccordionPrimitive.Trigger>
    </AccordionPrimitive.Header>
  )
);
AccordionTrigger.displayName = "AccordionTrigger";

export const AccordionContent = React.forwardRef<HTMLDivElement, React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Content>>(
  ({ className, children, ...props }, ref) => (
    <AccordionPrimitive.Content
      ref={ref}
      className={cn(
        "overflow-hidden",
        "data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:slide-in-from-top-2",
        "data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:slide-out-to-top-2",
        className
      )}
      {...props}
    >
      {children}
    </AccordionPrimitive.Content>
  )
);
AccordionContent.displayName = "AccordionContent";

function cn(...args: Array<string | undefined | false>) {
  return args.filter(Boolean).join(" ");
}

export function SubItem({ children }: { children: React.ReactNode }) {
  return (
    <div className={cn("ml-4 mt-1 space-y-1")}>{children}</div>
  );
}
