"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useWorkspaceStore } from "@/app/store/WorkspaceStore";
import ProjectHeader from "@/components/ProjectHeader";
import DatabaseTabs from "@/components/DatabaseTabs";
import { useTheme } from "next-themes";
import { SpinnerFullscreen } from "@/components/ui/spinner";
import { Eye, Edit, Lock } from "lucide-react";

export default function SharedProjectPage() {
  const { resolvedTheme } = useTheme();
  const params = useParams();
  const router = useRouter();

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [projectData, setProjectData] = useState<any>(null);
  const [permission, setPermission] = useState<"view" | "edit">("view");
  const [editLoginRequired, setEditLoginRequired] = useState(false);

  const tokenParam = params.token;
  const token = Array.isArray(tokenParam) ? tokenParam[0] : tokenParam;

  const { fetchDatabases } = useWorkspaceStore();

  const isDark = resolvedTheme === "dark";

  type SharedResponse = {
    error?: string;
    project?: {
      _id: string;
      name: string;
      emoji?: string;
    };
    permission?: "view" | "edit";
  };

  useEffect(() => {
    const loadSharedProject = async () => {
      setIsLoading(true);
      setError(null);

      console.log("🔍 Loading shared project with token:", token);

      try {
        const res = await fetch(`/api/shared/${token}`);
        console.log("📡 API Response status:", res.status);

        const rawBody = await res.text();
        let parsed: SharedResponse | null = null;
        if (rawBody) {
          try {
            parsed = JSON.parse(rawBody) as SharedResponse;
          } catch {
            parsed = null;
          }
        }

        if (!res.ok) {
          const message = parsed?.error || `Failed to load shared project (HTTP ${res.status})`;
          console.error(`❌ API Error: status=${res.status} message=${message} raw=${rawBody || "<empty>"}`);
          setError(message);
          setIsLoading(false);
          return;
        }

        const data = parsed;
        if (!data?.project || !data?.permission) {
          const message = "Shared API returned invalid payload";
          console.error(`❌ API Error: status=${res.status} message=${message} raw=${rawBody || "<empty>"}`);
          setError(message);
          setIsLoading(false);
          return;
        }

        console.log("✅ API Success:", data);
        setProjectData(data.project);
        setPermission(data.permission);

        // Expose shared token to API routes used by nested components.
        document.cookie = `share_token=${encodeURIComponent(String(token))}; path=/; max-age=86400; samesite=lax`;

        if (data.permission === "edit") {
          const meRes = await fetch("/api/auth/me");
          if (!meRes.ok) {
            setPermission("view");
            setEditLoginRequired(true);
          }
        }

        // Load databases for this project
        await fetchDatabases(data.project._id);

      } catch (err) {
        console.error("❌ Error loading shared project:", err);
        setError("Failed to load shared project");
      }

      setIsLoading(false);
    };

    if (token) {
      loadSharedProject();
    } else {
      setIsLoading(false);
      setError("Invalid share link token");
    }

    return () => {
      document.cookie = "share_token=; path=/; max-age=0; samesite=lax";
    };
  }, [token, fetchDatabases]);

  // Block all interactions in view-only mode
  useEffect(() => {
    if (permission !== "view") return;

    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      
      // Allow navigation to home button
      if (target.closest('.home-button')) {
        return;
      }

      // Allow scrolling and link clicks (like email/url opens)
      if (target.tagName === 'A' && target.getAttribute('target') === '_blank') {
        return;
      }

      // Block interaction with editable elements
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.tagName === 'SELECT' ||
        target.tagName === 'BUTTON' ||
        target.getAttribute('contenteditable') === 'true' ||
        target.closest('input, textarea, select, button, [contenteditable="true"]')
      ) {
        e.preventDefault();
        e.stopPropagation();
        alert('⚠️ This is a view-only shared link. You cannot make any changes.');
        return false;
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      
      // Block typing in input fields
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.getAttribute('contenteditable') === 'true'
      ) {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }
    };

    document.addEventListener('click', handleClick, true);
    document.addEventListener('keydown', handleKeyDown, true);

    return () => {
      document.removeEventListener('click', handleClick, true);
      document.removeEventListener('keydown', handleKeyDown, true);
    };
  }, [permission]);

  if (isLoading) {
    return (
      <div className={`min-h-screen ${isDark ? "bg-gray-900 text-white" : "bg-gray-50 text-gray-900"}`}>
        <SpinnerFullscreen text="Loading shared project..." />
      </div>
    );
  }

  if (error || !projectData) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${isDark ? "bg-gray-900 text-white" : "bg-gray-50 text-gray-900"}`}>
        <div className="text-center space-y-4">
          <Lock className={`w-16 h-16 mx-auto ${isDark ? "text-gray-600" : "text-gray-400"}`} />
          <h1 className="text-2xl font-bold">Access Denied</h1>
          <p className={`${isDark ? "text-gray-400" : "text-gray-600"}`}>
            {error || "This share link is invalid or has expired."}
          </p>
          <button
            onClick={() => router.push("/")}
            className={`mt-4 px-6 py-2 rounded-lg home-button ${
              isDark
                ? "bg-blue-600 hover:bg-blue-700 text-white"
                : "bg-blue-500 hover:bg-blue-600 text-white"
            }`}
          >
            Go to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${isDark ? "bg-gray-900 text-white" : "bg-gray-50 text-gray-900"} ${permission === "view" ? "view-only-mode" : ""}`}>
      <style jsx global>{`
        .view-only-mode input,
        .view-only-mode textarea,
        .view-only-mode button:not(.nav-button):not(.home-button),
        .view-only-mode select,
        .view-only-mode [contenteditable="true"],
        .view-only-mode .editable,
        .view-only-mode [role="button"]:not(.nav-button),
        .view-only-mode [type="checkbox"],
        .view-only-mode [type="radio"] {
          cursor: not-allowed !important;
        }
      `}</style>
      {/* Permission Banner */}
      <div
        className={`${
          permission === "edit"
            ? "bg-green-500/10 border-green-500/30"
            : "bg-blue-500/10 border-blue-500/30"
        } border-b px-6 py-3`}
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm">
            {permission === "edit" ? (
              <>
                <Edit className="w-4 h-4 text-green-500" />
                <span className={isDark ? "text-green-400" : "text-green-600"}>
                  You have <strong>edit</strong> access to this shared project
                </span>
              </>
            ) : (
              <>
                <Eye className="w-4 h-4 text-blue-500" />
                <span className={isDark ? "text-blue-400" : "text-blue-600"}>
                  You have <strong>view-only</strong> access to this shared project
                </span>
              </>
            )}
          </div>
          {editLoginRequired && (
            <button
              onClick={() => router.push("/login")}
              className={`text-xs px-3 py-1 rounded-md ${
                isDark
                  ? "bg-blue-600 hover:bg-blue-700 text-white"
                  : "bg-blue-500 hover:bg-blue-600 text-white"
              }`}
            >
              Sign in to edit
            </button>
          )}
        </div>
      </div>

      <div className="w-full max-w-7xl mx-auto px-6 py-10">
        <ProjectHeader project={projectData} isViewOnly={permission === "view"} />

        <div className="mt-8 flex items-center justify-between">
          <h2 className={`text-sm font-semibold ${isDark ? "text-gray-400" : "text-gray-500"}`}>
            Databases
          </h2>
          {permission === "view" && (
            <div className={`text-xs ${isDark ? "text-gray-500" : "text-gray-400"}`}>
              View-only mode
            </div>
          )}
        </div>

        <div className="mt-6">
          <DatabaseTabs projectId={projectData._id} isViewOnly={permission === "view"} />
        </div>
      </div>
    </div>
  );
}
