"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import dynamic from "next/dynamic";
import { SiteHeader } from "@/components/site-header";

const WorkflowEditor = dynamic(() => import("@/components/nocode/workflow/WorkflowEditor"), {
  ssr: false,
});

export default function WorkflowBuilderPage() {
  const params = useParams();
  const workflowId = useMemo(() => {
    const id = params?.workflowId;
    return Array.isArray(id) ? id[0] : (id as string);
  }, [params]);

  const [loading, setLoading] = useState(true);
  const [workflow, setWorkflow] = useState<any>(null);

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

  return (
    <div className="flex min-h-full flex-col">
      <SiteHeader />
      <div style={{ padding: 12 }}>
        <h1>{workflow.name}</h1>
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