"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { SiteHeader } from "@/components/site-header";
import { Plus, Sparkles, WandSparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";

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
    <main className="flex min-h-full flex-col bg-background text-foreground">
      <SiteHeader />

      <section className="mx-auto w-full max-w-6xl px-4 py-6 md:px-6 md:py-8">
        <Card className="border-border/80 bg-card py-0 shadow-sm">
          <CardHeader className="gap-3 border-b border-border/70 pb-5 md:pb-6">
            <Badge variant="outline" className="w-fit">
              <Sparkles className="h-3.5 w-3.5" />
              WEBSITE BUILDER
            </Badge>
            <div>
              <CardTitle className="text-2xl md:text-3xl">No-code Apps</CardTitle>
              <CardDescription className="mt-2 text-sm md:text-base">
                Create an app workspace and instantly open its first page in the visual builder.
              </CardDescription>
            </div>
          </CardHeader>

          <CardContent className="p-4 md:p-6">
            <div className="grid gap-3 rounded-xl border border-border/80 bg-muted/20 p-3 md:grid-cols-[1fr_auto] md:p-4">
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter app name"
                className="h-11 bg-background"
              />
              <Button
                onClick={async () => {
                  await fetch("/api/nocode/apps", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ name }),
                  });
                  await load();
                }}
                className="h-11 gap-2"
              >
                <Plus className="h-4 w-4" />
                Create App
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {apps.map((a) => (
            <Card key={a._id} className="border-border/80 bg-card py-0 shadow-sm">
              <CardHeader className="border-b border-border/60 pb-4">
                <CardTitle className="line-clamp-1 text-lg">{a.name}</CardTitle>
                <CardDescription>Key: {a.key}</CardDescription>
              </CardHeader>

              <CardContent className="grid gap-2 p-4">
                <Button
                  onClick={() => void openBuilderPage(a._id, a.name, false)}
                  disabled={Boolean(pageActionFor && pageActionFor.startsWith(`${a._id}:`))}
                  className="w-full justify-center gap-2"
                >
                  <WandSparkles className="h-4 w-4" />
                  {pageActionFor === `${a._id}:open` ? "Opening..." : "Open Existing Page"}
                </Button>

                <Button
                  onClick={() => void openBuilderPage(a._id, a.name, true)}
                  disabled={Boolean(pageActionFor && pageActionFor.startsWith(`${a._id}:`))}
                  variant="outline"
                  className="w-full justify-center gap-2"
                >
                  <Plus className="h-4 w-4" />
                  {pageActionFor === `${a._id}:new` ? "Creating..." : "Create New Page"}
                </Button>

                <Button
                  onClick={() => void openWorkflowPage(a._id, a.name, false)}
                  disabled={Boolean(workflowActionFor && workflowActionFor.startsWith(`${a._id}:`))}
                  variant="secondary"
                  className="w-full justify-center gap-2"
                >
                  <WandSparkles className="h-4 w-4" />
                  {workflowActionFor === `${a._id}:open` ? "Opening..." : "Open Existing Workflow"}
                </Button>

                <Button
                  onClick={() => void openWorkflowPage(a._id, a.name, true)}
                  disabled={Boolean(workflowActionFor && workflowActionFor.startsWith(`${a._id}:`))}
                  variant="outline"
                  className="w-full justify-center gap-2"
                >
                  <Plus className="h-4 w-4" />
                  {workflowActionFor === `${a._id}:new` ? "Creating..." : "Create New Workflow"}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {!apps.length && (
          <Card className="mt-6 border-dashed py-0">
            <CardContent className="p-8 text-center text-muted-foreground">
              No apps yet. Create your first app to start building pages.
            </CardContent>
          </Card>
        )}
      </section>
    </main>
  );
}