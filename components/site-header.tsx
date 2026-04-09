"use client"

import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Menu } from "lucide-react"

export function SiteHeader() {
  const toggleSidebar = () => {
    window.dispatchEvent(new Event("oork-toggle-sidebar"));
  };

  return (
    <header className="flex h-(--header-height) shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)">
      <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
        <Button type="button" variant="ghost" size="icon" className="-ml-1" onClick={toggleSidebar}>
          <Menu />
          <span className="sr-only">Toggle sidebar</span>
        </Button>
        <Separator
          orientation="vertical"
          className="mx-2 data-[orientation=vertical]:h-4"
        />
        <h1 className="text-base font-medium">Dashboard Section</h1>
      </div>
    </header>
  )
}
