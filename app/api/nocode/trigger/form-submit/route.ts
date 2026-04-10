import { NextResponse } from "next/server";
import connectDB from "@/lib/dbConnect";
import NocodeWorkflow from "@/lib/models/NocodeWorkflow";
import NocodeRun from "@/lib/models/NocodeRun";
import { executeWorkflowRun } from "@/lib/nocode/workflowRuntime";

export async function POST(req: Request) {
  try {
    await connectDB();

    const body = await req.json();
    const appId = String(body?.appId || "");
    const workflowKey = String(body?.workflowKey || "");
    const formData = (body?.formData || {}) as Record<string, unknown>;

    if (!appId || !workflowKey) {
      return NextResponse.json({ error: "Missing appId or workflowKey" }, { status: 400 });
    }

    const workflow = await NocodeWorkflow.findOne({ appId, key: workflowKey, status: "published" });
    if (!workflow) {
      return NextResponse.json({ error: "Published workflow not found" }, { status: 404 });
    }

    const run = await NocodeRun.create({
      userId: workflow.userId,
      appId,
      workflowId: workflow._id,
      triggerType: "form.submit",
      triggerPayload: formData,
      status: "queued",
      stepLogs: [],
    });

    // MVP: execute in-process. Later move to queue worker.
    void executeWorkflowRun({
      runId: String(run._id),
      workflowId: String(workflow._id),
      appId,
      triggerPayload: formData,
    });

    return NextResponse.json({ success: true, runId: run._id }, { status: 202 });
  } catch {
    return NextResponse.json({ success: false, error: "Failed to trigger workflow" }, { status: 500 });
  }
}