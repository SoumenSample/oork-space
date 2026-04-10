import NocodeRun from "@/lib/models/NocodeRun";
import NocodeWorkflow from "@/lib/models/NocodeWorkflow";
import { compileWorkflow } from "@/lib/nocode/workflowCompiler";
import { runAction } from "@/lib/nocode/runtimeActions";
import { evaluateCondition } from "@/lib/nocode/runtimeConditions";

export async function executeWorkflowRun(params: {
  runId: string;
  workflowId: string;
  appId: string;
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

    const nodes = workflow.publishedGraph?.nodes || [];
    const edges = workflow.publishedGraph?.edges || [];

    const compiled = compileWorkflow(nodes, edges);

    const executionContext: Record<string, unknown> = {
      trigger: params.triggerPayload,
      steps: {},
    };

    for (const nodeId of compiled.orderedNodeIds) {
      const node = compiled.nodeMap[nodeId];
      const nodeType = String(node?.data?.type || "");
      const config = (node?.data?.config || {}) as Record<string, unknown>;

      const startedAt = new Date();

      try {
        let output: Record<string, unknown> = {};

        if (nodeType.startsWith("trigger.")) {
          output = { accepted: true };
        } else if (nodeType.startsWith("condition.")) {
          const pass = await evaluateCondition(String(config?.key || "always"), {
            ...(params.triggerPayload || {}),
            executionContext,
          });
          output = { pass };
        } else if (nodeType.startsWith("action.")) {
          output = await runAction(nodeType, config, executionContext);
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