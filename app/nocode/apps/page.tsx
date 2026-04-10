"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { SiteHeader } from "@/components/site-header";
import { Plus, Sparkles, WandSparkles } from "lucide-react";

export default function NocodeAppsPage() {
  const router = useRouter();
  const [apps, setApps] = useState<any[]>([]);
  const [name, setName] = useState("My App");
  const [pageActionFor, setPageActionFor] = useState<string | null>(null);
  const [workflowActionFor, setWorkflowActionFor] = useState<string | null>(null);

  const load = async () => {
    const res = await fetch("/api/nocode/apps");
    const json = await res.json();
    setApps(json?.data || []);
  };

  useEffect(() => {
    void load();
  }, []);

  const openBuilderPage = async (appId: string, appName: string, forceCreateNew = false) => {
    const actionKey = `${appId}:${forceCreateNew ? "new" : "open"}`;

    try {
      setPageActionFor(actionKey);
      // Re-open the most recently updated page for this app, so users continue editing
      // the same page instead of unintentionally starting from a fresh default page.
      let pageId: string | undefined;

      if (!forceCreateNew) {
        const listRes = await fetch(`/api/nocode/pages?appId=${appId}`, { cache: "no-store" });
        if (listRes.ok) {
          const listJson = await listRes.json();
          pageId = listJson?.data?.[0]?._id;
        }
      }

      if (!pageId) {
        const res = await fetch("/api/nocode/pages", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ appId, name: `${appName} Home` }),
        });

        if (!res.ok) {
          throw new Error(`Failed to create page (${res.status})`);
        }

        const json = await res.json();
        pageId = json?.data?._id;
      }

      if (pageId) {
        router.push(`/nocode/builder/${pageId}`);
      }
    } finally {
      setPageActionFor(null);
    }
  };

  const openWorkflowPage = async (appId: string, appName: string, forceCreateNew = false) => {
    const actionKey = `${appId}:${forceCreateNew ? "new" : "open"}`;

    try {
      setWorkflowActionFor(actionKey);
      let workflowId: string | undefined;

      if (!forceCreateNew) {
        const listRes = await fetch(`/api/nocode/workflows?appId=${appId}`, { cache: "no-store" });
        if (listRes.ok) {
          const listJson = await listRes.json();
          workflowId = listJson?.data?.[0]?._id;
        }
      }

      if (!workflowId) {
        const res = await fetch("/api/nocode/workflows", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ appId, name: `${appName} Workflow` }),
        });

        if (!res.ok) {
          throw new Error(`Failed to create workflow (${res.status})`);
        }

        const json = await res.json();
        workflowId = json?.data?._id;
      }

      if (workflowId) {
        router.push(`/nocode/workflows/${workflowId}`);
      }
    } finally {
      setWorkflowActionFor(null);
    }
  };

  return (
    <main className="flex min-h-full flex-col bg-linear-to-b from-slate-950 via-slate-950 to-slate-900">
      <SiteHeader />

      <section className="mx-auto w-full max-w-6xl px-4 py-6 md:px-6 md:py-8">
        <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-slate-900/70 p-5 shadow-2xl backdrop-blur md:p-6">
          <div className="pointer-events-none absolute -right-16 -top-24 h-56 w-56 rounded-full bg-cyan-500/15 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-20 -left-20 h-56 w-56 rounded-full bg-pink-500/10 blur-3xl" />

          <div className="relative flex flex-col gap-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="mb-2 inline-flex items-center gap-2 rounded-full border border-cyan-300/30 bg-cyan-500/10 px-3 py-1 text-xs font-semibold tracking-wide text-cyan-200">
                  <Sparkles className="h-3.5 w-3.5" />
                  WEBSITE BUILDER
                </p>
                <h1 className="text-2xl font-semibold text-white md:text-3xl">No-code Apps</h1>
                <p className="mt-2 text-sm text-slate-300 md:text-base">
                  Create an app workspace and instantly open its first page in the visual builder.
                </p>
              </div>
            </div>

            <div className="grid gap-3 rounded-xl border border-white/10 bg-slate-950/70 p-3 md:grid-cols-[1fr_auto] md:p-4">
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter app name"
                className="h-11 rounded-lg border border-slate-700 bg-slate-900 px-3 text-sm text-slate-100 outline-none transition focus:border-cyan-400"
              />
              <button
                onClick={async () => {
                  await fetch("/api/nocode/apps", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ name }),
                  });
                  await load();
                }}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-linear-to-r from-cyan-500 to-blue-500 px-4 text-sm font-semibold text-white transition hover:brightness-110"
              >
                <Plus className="h-4 w-4" />
                Create App
              </button>
            </div>
          </div>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {apps.map((a) => (
            <article
              key={a._id}
              className="group rounded-xl border border-white/10 bg-slate-900/70 p-4 transition hover:border-cyan-400/50 hover:bg-slate-900"
            >
              <div className="mb-3">
                <h2 className="line-clamp-1 text-lg font-semibold text-white">{a.name}</h2>
                <p className="mt-1 text-xs text-slate-400">Key: {a.key}</p>
              </div>

              <div className="grid gap-2">
                <button
                  onClick={() => void openBuilderPage(a._id, a.name, false)}
                  disabled={Boolean(pageActionFor && pageActionFor.startsWith(`${a._id}:`))}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-cyan-400/40 bg-cyan-500/10 px-3 py-2.5 text-sm font-medium text-cyan-100 transition hover:bg-cyan-500/20 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <WandSparkles className="h-4 w-4" />
                  {pageActionFor === `${a._id}:open` ? "Opening..." : "Open Existing Page"}
                </button>

                <button
                  onClick={() => void openBuilderPage(a._id, a.name, true)}
                  disabled={Boolean(pageActionFor && pageActionFor.startsWith(`${a._id}:`))}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-slate-600 bg-slate-800/80 px-3 py-2.5 text-sm font-medium text-slate-100 transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <Plus className="h-4 w-4" />
                  {pageActionFor === `${a._id}:new` ? "Creating..." : "Create New Page"}
                </button>

                <button
                  onClick={() => void openWorkflowPage(a._id, a.name, false)}
                  disabled={Boolean(workflowActionFor && workflowActionFor.startsWith(`${a._id}:`))}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-violet-400/40 bg-violet-500/10 px-3 py-2.5 text-sm font-medium text-violet-100 transition hover:bg-violet-500/20 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <WandSparkles className="h-4 w-4" />
                  {workflowActionFor === `${a._id}:open` ? "Opening..." : "Open Existing Workflow"}
                </button>

                <button
                  onClick={() => void openWorkflowPage(a._id, a.name, true)}
                  disabled={Boolean(workflowActionFor && workflowActionFor.startsWith(`${a._id}:`))}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-violet-600 bg-violet-900/40 px-3 py-2.5 text-sm font-medium text-violet-100 transition hover:bg-violet-800/60 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <Plus className="h-4 w-4" />
                  {workflowActionFor === `${a._id}:new` ? "Creating..." : "Create New Workflow"}
                </button>
              </div>
            </article>
          ))}
        </div>

        {!apps.length && (
          <div className="mt-6 rounded-xl border border-dashed border-slate-700 bg-slate-900/60 p-8 text-center">
            <p className="text-slate-300">No apps yet. Create your first app to start building pages.</p>
          </div>
        )}
      </section>
    </main>
  );
}