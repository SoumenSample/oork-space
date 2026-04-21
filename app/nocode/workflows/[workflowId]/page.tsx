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
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showRenameDialog, setShowRenameDialog] = useState(false);
  const [renameValue, setRenameValue] = useState("");
  const [actionMessage, setActionMessage] = useState("");
  const isEmbed = useMemo(() => {
    const embed = searchParams.get("embed");
    return embed === "1" || embed === "true";
  }, [searchParams]);
  const useExternalSidebar = useMemo(() => {
    const externalSidebar = searchParams.get("externalSidebar");
    return externalSidebar === "1" || externalSidebar === "true";
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
    try {
      setIsDeleting(true);
      const res = await fetch(`/api/nocode/workflows/${workflowId}`, { method: "DELETE" });
      if (!res.ok) {
        throw new Error(`Delete failed (${res.status})`);
      }
      router.push("/nocode/apps");
    } catch (error) {
      setActionMessage(error instanceof Error ? error.message : "Failed to delete workflow");
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  const renameWorkflow = async () => {
    const currentName = String(workflow?.name || "");
    const nextName = renameValue.trim();
    if (!nextName) {
      setActionMessage("Workflow name cannot be empty");
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
      setActionMessage(`Workflow renamed to ${nextName}`);
      setShowRenameDialog(false);
    } catch (error) {
      setActionMessage(error instanceof Error ? error.message : "Failed to rename workflow");
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
                  onClick={() => {
                    setRenameValue(String(workflow?.name || ""));
                    setShowRenameDialog(true);
                  }}
                  disabled={isRenaming || isDeleting}
                  className="shrink-0"
                >
                  {isRenaming ? "Renaming..." : "Rename Workflow"}
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => setShowDeleteConfirm(true)}
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
          appId={String(workflow?.appId || "")}
          externalSettingsSidebar={isEmbed && useExternalSidebar}
          onSave={async (draftGraph) => {
            const response = await fetch(`/api/nocode/workflows/${workflowId}`, {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ draftGraph }),
            });

            if (!response.ok) {
              throw new Error(`Failed to save workflow (${response.status})`);
            }
          }}
          onPublish={async () => {
            const response = await fetch(`/api/nocode/workflows/${workflowId}/publish`, { method: "POST" });
            if (!response.ok) {
              throw new Error(`Failed to publish workflow (${response.status})`);
            }
          }}
        />

        {actionMessage ? (
          <p className="mt-3 rounded border border-border/70 bg-muted/40 px-3 py-2 text-sm text-muted-foreground">
            {actionMessage}
          </p>
        ) : null}

        {showRenameDialog ? (
          <Card className="mt-3 border-border/70 py-0">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Rename Workflow</CardTitle>
              <CardDescription>Give this workflow a clear business-friendly name.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <input
                value={renameValue}
                onChange={(event) => setRenameValue(event.target.value)}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                placeholder="Workflow name"
              />
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setShowRenameDialog(false)} disabled={isRenaming}>
                  Cancel
                </Button>
                <Button onClick={() => void renameWorkflow()} disabled={isRenaming}>
                  {isRenaming ? "Renaming..." : "Save Name"}
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : null}

        {showDeleteConfirm ? (
          <Card className="mt-3 border-destructive/40 py-0">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Delete Workflow?</CardTitle>
              <CardDescription>This action cannot be undone.</CardDescription>
            </CardHeader>
            <CardContent className="flex gap-2">
              <Button variant="outline" onClick={() => setShowDeleteConfirm(false)} disabled={isDeleting}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={() => void deleteWorkflow()} disabled={isDeleting}>
                {isDeleting ? "Deleting..." : "Delete"}
              </Button>
            </CardContent>
          </Card>
        ) : null}
      </section>
    </div>
  );
}