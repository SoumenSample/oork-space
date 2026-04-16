import { NextResponse } from "next/server";
import connectDB from "@/lib/dbConnect";
import NocodeWorkflow from "@/lib/models/NocodeWorkflow";
import NocodeRun from "@/lib/models/NocodeRun";
import { executeWorkflowRun } from "@/lib/nocode/workflowRuntime";

function extractSecret(req: Request): string {
  const explicit = req.headers.get("x-workflow-secret") || "";
  if (explicit) return explicit;

  const auth = req.headers.get("authorization") || "";
  const bearerPrefix = "Bearer ";
  if (auth.startsWith(bearerPrefix)) {
    return auth.slice(bearerPrefix.length).trim();
  }

  return "";
}

export async function POST(
  req: Request,
  context: { params: Promise<{ workflowKey: string }> }
) {
  try {
    await connectDB();

    const { workflowKey } = await context.params;
    const url = new URL(req.url);
    const appId = String(url.searchParams.get("appId") || "").trim();

    if (!workflowKey || !appId) {
      return NextResponse.json({ error: "Missing workflowKey or appId" }, { status: 400 });
    }

    const workflow = await NocodeWorkflow.findOne({
      appId,
      key: workflowKey,
      status: "published",
    });

    if (!workflow) {
      return NextResponse.json({ error: "Published workflow not found" }, { status: 404 });
    }

    const nodes = Array.isArray(workflow.publishedGraph?.nodes) ? workflow.publishedGraph.nodes : [];
    const webhookTrigger = nodes.find(
      (node: any) => String(node?.data?.type || "") === "trigger.webhook"
    );

    if (!webhookTrigger) {
      return NextResponse.json(
        { error: "Workflow has no webhook trigger node" },
        { status: 400 }
      );
    }

    const expectedSecret = String(webhookTrigger?.data?.config?.secret || "").trim();
    if (expectedSecret) {
      const providedSecret = extractSecret(req);
      if (providedSecret !== expectedSecret) {
        return NextResponse.json({ error: "Unauthorized webhook secret" }, { status: 401 });
      }
    }

    let payload: Record<string, unknown> = {};
    try {
      payload = (await req.json()) as Record<string, unknown>;
    } catch {
      payload = {};
    }

    const run = await NocodeRun.create({
      userId: workflow.userId,
      appId,
      workflowId: workflow._id,
      triggerType: "webhook",
      triggerPayload: payload,
      status: "queued",
      stepLogs: [],
    });

    void executeWorkflowRun({
      runId: String(run._id),
      workflowId: String(workflow._id),
      appId,
      triggerType: "webhook",
      triggerPayload: payload,
    });

    return NextResponse.json({ success: true, runId: run._id }, { status: 202 });
  } catch {
    return NextResponse.json(
      { success: false, error: "Failed to trigger workflow from webhook" },
      { status: 500 }
    );
  }
}
