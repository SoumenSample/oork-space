"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { SiteHeader } from "@/components/site-header";

const WorkflowEditor = dynamic(() => import("@/components/nocode/workflow/WorkflowEditor"), {
  ssr: false,
});

export default function WorkflowBuilderPage() {
  const params = useParams();
  const router = useRouter();
  const workflowId = useMemo(() => {
    const id = params?.workflowId;
    return Array.isArray(id) ? id[0] : (id as string);
  }, [params]);

  const [loading, setLoading] = useState(true);
  const [workflow, setWorkflow] = useState<any>(null);
  const [isDeleting, setIsDeleting] = useState(false);

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

  if (loading) return <div>Loading workflow...</div>;
  if (!workflow) return <div>Workflow not found</div>;

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

  return (
    <div className="flex min-h-full flex-col">
      <SiteHeader />
      <div style={{ padding: 12 }}>
        <div className="mb-3 flex items-center justify-between gap-3">
          <h1>{workflow.name}</h1>
          <button
            onClick={() => void deleteWorkflow()}
            disabled={isDeleting}
            className="rounded-md border border-red-500/50 bg-red-500/15 px-3 py-1.5 text-sm font-semibold text-red-300 hover:bg-red-500/25 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isDeleting ? "Deleting..." : "Delete Workflow"}
          </button>
        </div>
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
      </div>
    </div>
  );
}