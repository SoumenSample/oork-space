import NocodeRun from "@/lib/models/NocodeRun";
import NocodeWorkflow from "@/lib/models/NocodeWorkflow";
import { compileWorkflow } from "@/lib/nocode/workflowCompiler";
import { runAction } from "@/lib/nocode/runtimeActions";
import { evaluateCondition } from "@/lib/nocode/runtimeConditions";

function resolveWorkflowTriggerType(triggerType: string): string {
  const normalized = triggerType.trim().toLowerCase();

  if (normalized === "form.submit" || normalized === "trigger.formsubmit") return "trigger.formSubmit";
  if (normalized === "webhook" || normalized === "trigger.webhook") return "trigger.webhook";
  if (normalized === "schedule" || normalized === "trigger.schedule") return "trigger.schedule";
  if (normalized === "manual" || normalized === "trigger.manual") return "trigger.manual";

  return triggerType;
}

function resolveNodeTriggerType(nodeType: string): string {
  const normalized = nodeType.trim().toLowerCase();

  if (normalized === "form.submit" || normalized === "trigger.formsubmit") return "trigger.formSubmit";
  if (normalized === "webhook" || normalized === "trigger.webhook") return "trigger.webhook";
  if (normalized === "schedule" || normalized === "trigger.schedule") return "trigger.schedule";
  if (normalized === "manual" || normalized === "trigger.manual") return "trigger.manual";

  return nodeType;
}

function resolveEdgeBranch(edge: Record<string, unknown>): "always" | "true" | "false" {
  const data = (edge.data || {}) as Record<string, unknown>;
  const branch = String(data.branch || edge.label || "always").trim().toLowerCase();
  if (branch === "true" || branch === "yes") return "true";
  if (branch === "false" || branch === "no") return "false";
  return "always";
}

export async function executeWorkflowRun(params: {
  runId: string;
  workflowId: string;
  appId: string;
  triggerType: string;
  triggerPayload: Record<string, unknown>;
}) {
  const run = await NocodeRun.findById(params.runId);
  if (!run) throw new Error("Run not found");

  run.status = "running";
  run.startedAt = new Date();
  await run.save();

  try {
    const workflow = await NocodeWorkflow.findById(params.workflowId);
    if (!workflow || workflow.status !== "published") {
      throw new Error("Published workflow not found");
    }

    const nodes = (workflow.publishedGraph?.nodes || []) as Array<{
      id: string;
      data?: { type?: string; config?: Record<string, unknown> };
    }>;
    const edges = (workflow.publishedGraph?.edges || []) as Array<{
      source: string;
      target: string;
      label?: unknown;
      data?: Record<string, unknown>;
    }>;

    const compiled = compileWorkflow(nodes, edges);
    const expectedTriggerNodeType = resolveWorkflowTriggerType(params.triggerType);

    const triggerNode = Object.values(compiled.nodeMap).find((node) => {
      const nodeType = String(node?.data?.type || "");
      return resolveNodeTriggerType(nodeType) === expectedTriggerNodeType;
    });

    if (!triggerNode) {
      const availableTriggerTypes = Array.from(
        new Set(
          Object.values(compiled.nodeMap)
            .map((node) => String(node?.data?.type || ""))
            .filter((type) => type.startsWith("trigger."))
        )
      );

      throw new Error(
        `No matching trigger node for trigger type: ${params.triggerType}. ` +
        `Published trigger nodes: ${availableTriggerTypes.join(", ") || "none"}. ` +
        "Publish workflow after editing triggers."
      );
    }

    const outgoingByNode = edges.reduce(
      (
        acc: Record<string, Array<{ target: string; branch: "always" | "true" | "false" }>>,
        edge: { source: string; target: string; label?: unknown; data?: Record<string, unknown> }
      ) => {
        const source = String(edge?.source || "");
        const target = String(edge?.target || "");
        if (!source || !target) return acc;

        acc[source] ||= [];
        acc[source].push({ target, branch: resolveEdgeBranch(edge as Record<string, unknown>) });
        return acc;
      },
      {} as Record<string, Array<{ target: string; branch: "always" | "true" | "false" }>>
    );

    const executionContext: Record<string, unknown> = {
      runId: params.runId,
      appId: params.appId,
      workflowId: params.workflowId,
      userId: String(workflow.userId || run.userId || ""),
      triggerType: params.triggerType,
      trigger: params.triggerPayload,
      steps: {},
    };

    const queue: string[] = [String(triggerNode.id)];
    const executed = new Set<string>();

    while (queue.length > 0) {
      const nodeId = queue.shift() as string;
      if (executed.has(nodeId)) continue;

      const node = compiled.nodeMap[nodeId];
      if (!node) continue;

      const nodeType = String(node?.data?.type || "");
      const config = (node?.data?.config || {}) as Record<string, unknown>;

      const startedAt = new Date();

      try {
        let output: Record<string, unknown> = {};
        let nextTargets: string[] = [];

        if (nodeType.startsWith("trigger.")) {
          output = { accepted: true };
          nextTargets = (outgoingByNode[nodeId] || []).map((item: { target: string }) => item.target);
        } else if (nodeType.startsWith("condition.")) {
          const pass = await evaluateCondition(String(config?.key || "always"), {
            ...(params.triggerPayload || {}),
            executionContext,
          });
          output = { pass };

          const branch = pass ? "true" : "false";
          const outgoing = outgoingByNode[nodeId] || [];
          nextTargets = outgoing
            .filter((item: { target: string; branch: "always" | "true" | "false" }) => item.branch === "always" || item.branch === branch)
            .map((item: { target: string }) => item.target);
        } else if (nodeType.startsWith("action.")) {
          output = await runAction(nodeType, config, executionContext);
          nextTargets = (outgoingByNode[nodeId] || []).map((item: { target: string }) => item.target);
        } else {
          throw new Error(`Unknown node type: ${nodeType}`);
        }

        (executionContext.steps as Record<string, unknown>)[nodeId] = output;

        run.stepLogs.push({
          nodeId,
          nodeType,
          status: "success",
          input: { config },
          output,
          error: "",
          startedAt,
          endedAt: new Date(),
        });

        executed.add(nodeId);
        queue.push(...nextTargets);
      } catch (nodeError) {
        run.stepLogs.push({
          nodeId,
          nodeType,
          status: "failed",
          input: { config },
          output: {},
          error: nodeError instanceof Error ? nodeError.message : "Unknown node error",
          startedAt,
          endedAt: new Date(),
        });

        throw nodeError;
      }
    }

    run.status = "success";
    run.finishedAt = new Date();
    await run.save();
  } catch (error) {
    run.status = "failed";
    run.error = error instanceof Error ? error.message : "Workflow execution failed";
    run.finishedAt = new Date();
    await run.save();
  }
}