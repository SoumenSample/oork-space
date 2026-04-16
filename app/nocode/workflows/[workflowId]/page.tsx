"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import dynamic from "next/dynamic";
import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const WorkflowEditor = dynamic(() => import("@/components/nocode/workflow/WorkflowEditor"), {
  ssr: false,
});

export default function WorkflowBuilderPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const workflowId = useMemo(() => {
    const id = params?.workflowId;
    return Array.isArray(id) ? id[0] : (id as string);
  }, [params]);

  const [loading, setLoading] = useState(true);
  const [workflow, setWorkflow] = useState<any>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isRenaming, setIsRenaming] = useState(false);
  const isEmbed = useMemo(() => {
    const embed = searchParams.get("embed");
    return embed === "1" || embed === "true";
  }, [searchParams]);

  useEffect(() => {
    if (!workflowId) return;

    const load = async () => {
      try {
        const res = await fetch(`/api/nocode/workflows/${workflowId}`);
        const json = await res.json();
        setWorkflow(json?.data || null);
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, [workflowId]);

  if (loading) {
    return (
      <div className="flex min-h-full flex-col bg-background text-foreground">
        {isEmbed ? null : <SiteHeader />}
        <section className={isEmbed ? "w-full p-3" : "mx-auto w-full max-w-6xl px-4 py-6 md:px-6 md:py-8"}>
          <Card>
            <CardContent className="p-8 text-center text-muted-foreground">Loading workflow...</CardContent>
          </Card>
        </section>
      </div>
    );
  }

  if (!workflow) {
    return (
      <div className="flex min-h-full flex-col bg-background text-foreground">
        {isEmbed ? null : <SiteHeader />}
        <section className={isEmbed ? "w-full p-3" : "mx-auto w-full max-w-6xl px-4 py-6 md:px-6 md:py-8"}>
          <Card>
            <CardContent className="p-8 text-center text-muted-foreground">Workflow not found</CardContent>
          </Card>
        </section>
      </div>
    );
  }

  const deleteWorkflow = async () => {
    const ok = window.confirm("Delete this workflow? This action cannot be undone.");
    if (!ok) return;

    try {
      setIsDeleting(true);
      const res = await fetch(`/api/nocode/workflows/${workflowId}`, { method: "DELETE" });
      if (!res.ok) {
        throw new Error(`Delete failed (${res.status})`);
      }
      router.push("/nocode/apps");
    } catch {
      alert("Failed to delete workflow");
    } finally {
      setIsDeleting(false);
    }
  };

  const renameWorkflow = async () => {
    const currentName = String(workflow?.name || "");
    const nextNameInput = window.prompt("Enter new workflow name", currentName);
    if (nextNameInput === null) return;

    const nextName = nextNameInput.trim();
    if (!nextName) {
      window.alert("Workflow name cannot be empty.");
      return;
    }

    if (nextName === currentName) return;

    try {
      setIsRenaming(true);
      const res = await fetch(`/api/nocode/workflows/${workflowId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: nextName }),
      });

      if (!res.ok) {
        throw new Error(`Rename failed (${res.status})`);
      }

      const json = await res.json();
      setWorkflow((prev: any) => ({
        ...(prev || {}),
        ...(json?.data || {}),
      }));
    } catch {
      window.alert("Failed to rename workflow");
    } finally {
      setIsRenaming(false);
    }
  };

  return (
    <div className="flex min-h-full flex-col bg-background text-foreground">
      {isEmbed ? null : <SiteHeader />}
      <section className={isEmbed ? "w-full p-2" : "mx-auto w-full max-w-[1400px] px-3 py-3 md:px-4 md:py-4"}>
        {isEmbed ? null : (
          <Card className="mb-3 py-0">
            <CardHeader className="flex flex-row items-center justify-between gap-3 border-b border-border/60 pb-4">
              <div>
                <CardTitle className="text-xl md:text-2xl">{workflow.name}</CardTitle>
                <CardDescription>Edit nodes, connections, and publish your workflow.</CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  onClick={() => void renameWorkflow()}
                  disabled={isRenaming || isDeleting}
                  className="shrink-0"
                >
                  {isRenaming ? "Renaming..." : "Rename Workflow"}
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => void deleteWorkflow()}
                  disabled={isDeleting || isRenaming}
                  className="shrink-0"
                >
                  {isDeleting ? "Deleting..." : "Delete Workflow"}
                </Button>
              </div>
            </CardHeader>
          </Card>
        )}
        <WorkflowEditor
          initialNodes={workflow?.draftGraph?.nodes || []}
          initialEdges={workflow?.draftGraph?.edges || []}
          onSave={async (draftGraph) => {
            await fetch(`/api/nocode/workflows/${workflowId}`, {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ draftGraph }),
            });
          }}
          onPublish={async () => {
            await fetch(`/api/nocode/workflows/${workflowId}/publish`, { method: "POST" });
            alert("Workflow published");
          }}
        />
      </section>
    </div>
  );
}