"use client"

import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { LogOut, Menu, Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "./AuthContext";
import ShareButton from "./ShareButton";
import ThemeToggle from "./ThemeToggle";

export function SiteHeader() {
  const { setTheme ,resolvedTheme } = useTheme();
  const { logout } = useAuth();
  const pathname = usePathname();
  const isDark = resolvedTheme === "dark";
  const [shareProject, setShareProject] = useState<{ id: string; name: string } | null>(null);

  // const [showSharePopover, setShowSharePopover] = useState(false);
  
  const setGlobalTheme = (dark: boolean) => setTheme(dark ? "dark" : "light");
  const toggleSidebar = () => {
    window.dispatchEvent(new Event("oork-toggle-sidebar"));
  };

  const sectionTitle = pathname.startsWith("/nocode")
    ? "Website Builder"
    : "Dashboard Section";

  useEffect(() => {
    let cancelled = false;

    const loadProjectMeta = async () => {
      if (!pathname.startsWith("/projects/")) {
        setShareProject(null);
        return;
      }

      const segments = pathname.split("/").filter(Boolean);
      const projectId = segments[1];

      if (!projectId) {
        setShareProject(null);
        return;
      }

      try {
        const res = await fetch("/api/projects", { cache: "no-store" });
        if (!res.ok) {
          if (!cancelled) {
            setShareProject({ id: projectId, name: "Project" });
          }
          return;
        }

        const projects = await res.json();
        const matched = Array.isArray(projects)
          ? projects.find((project: { _id?: string; name?: string }) => project?._id === projectId)
          : null;

        if (!cancelled) {
          setShareProject({
            id: projectId,
            name: matched?.name || "Project",
          });
        }
      } catch {
        if (!cancelled) {
          setShareProject({ id: projectId, name: "Project" });
        }
      }
    };

    void loadProjectMeta();

    return () => {
      cancelled = true;
    };
  }, [pathname]);

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
        <h1 className="text-base font-medium">{sectionTitle}</h1>
      </div>
      <div className="flex items-center gap-4">
          {shareProject ? (
            <ShareButton projectId={shareProject.id} projectName={shareProject.name} />
          ) : null}
          <div>
                     
                        <div className="relative w-full rounded-2xl overflow-hidden bg-linear-to-br "
                          >
                          <div className={`flex w-full rounded-2xl p-1 gap-1 `}>
                            {!isDark && (
                              <button onClick={()=>setGlobalTheme(true)} title="Switch to Dark mode"
                                className={`flex flex-1 px-3 items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all duration-150 active:translate-y-0.5 active:shadow-none select-none bg-linear-to-b from-white to-rose-50 text-amber-600`}>
                                <Sun size={15}/>
                              </button>
                            )}
                            {isDark && (
                              <button onClick={()=>setGlobalTheme(false)} title="Switch to Light mode"
                                className={`flex flex-1 px-3 items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all duration-150 active:translate-y-0.5 active:shadow-none select-none bg-linear-to-b from-[#2e3040] to-[#1e2030] text-indigo-300`}>
                                <Moon size={15}/>
                              </button>
                            )}
                          </div>
                        </div> 
                    </div>
                    {/* <ThemeToggle/> */}
           {/* Logout */}
            {/* <button
             onClick={logout}
             className="relative px-4 py-3 rounded-xl font-semibold text-sm text-white
               bg-linear-to-br from-rose-500 via-pink-500 to-purple-500
               shadow-lg shadow-pink-500/25
               hover:shadow-xl hover:shadow-pink-500/40
               transform hover:-translate-y-0.5 hover:scale-105
               transition-all duration-200
               active:translate-y-0 active:scale-95"
           >
             <span className="relative z-10 flex items-center gap-2">
               <LogOut size={16} />
               Logout
             </span>
           </button>  */}
           
          </div>
    </header>
  )
}
