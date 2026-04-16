import NocodeRun from "@/lib/models/NocodeRun";
import NocodeWorkflow from "@/lib/models/NocodeWorkflow";
import { compileWorkflow } from "@/lib/nocode/workflowCompiler";
import { runAction } from "@/lib/nocode/runtimeActions";
import { evaluateCondition } from "@/lib/nocode/runtimeConditions";

const DEFAULT_WORKFLOW_TIMEOUT_MS = 2 * 60 * 1000;
const DEFAULT_NODE_TIMEOUT_MS = 15 * 1000;
const DEFAULT_RETRY_COUNT = 0;
const DEFAULT_RETRY_DELAY_MS = 0;
const MAX_TIMEOUT_MS = 10 * 60 * 1000;
const MAX_RETRY_COUNT = 5;

type EdgeBranch = "always" | "true" | "false";

function toBoundedInt(value: unknown, fallback: number, min: number, max: number): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(max, Math.max(min, Math.floor(parsed)));
}

function asObject(input: unknown): Record<string, unknown> {
  if (input && typeof input === "object" && !Array.isArray(input)) {
    return input as Record<string, unknown>;
  }

  return {};
}

function getRequiredStringList(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.map((entry) => String(entry || "").trim()).filter(Boolean);
}

function validateRequiredFields(payload: Record<string, unknown>, requiredFields: string[]): string[] {
  return requiredFields.filter((field) => {
    if (!(field in payload)) return true;

    const value = payload[field];
    if (value === null || value === undefined) return true;
    if (typeof value === "string" && value.trim().length === 0) return true;
    return false;
  });
}

function sleep(ms: number): Promise<void> {
  if (ms <= 0) return Promise.resolve();
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

async function withTimeout<T>(operation: Promise<T>, timeoutMs: number, label: string): Promise<T> {
  if (timeoutMs <= 0) return operation;

  let timeoutHandle: ReturnType<typeof setTimeout> | undefined;

  try {
    return await Promise.race([
      operation,
      new Promise<T>((_, reject) => {
        timeoutHandle = setTimeout(() => {
          reject(new Error(`${label} timed out after ${timeoutMs}ms`));
        }, timeoutMs);
      }),
    ]);
  } finally {
    if (timeoutHandle) clearTimeout(timeoutHandle);
  }
}

function getNodeExecutionPolicy(config: Record<string, unknown>) {
  const timeoutMs = toBoundedInt(config.timeoutMs, DEFAULT_NODE_TIMEOUT_MS, 0, MAX_TIMEOUT_MS);
  const retryCount = toBoundedInt(config.retryCount, DEFAULT_RETRY_COUNT, 0, MAX_RETRY_COUNT);
  const retryDelayMs = toBoundedInt(config.retryDelayMs, DEFAULT_RETRY_DELAY_MS, 0, MAX_TIMEOUT_MS);

  return { timeoutMs, retryCount, retryDelayMs };
}

function resolveWorkflowTriggerType(triggerType: string): string {
  const normalized = triggerType.trim().toLowerCase();

  if (normalized === "form.submit" || normalized === "trigger.formsubmit") return "trigger.formSubmit";
  if (normalized === "webhook" || normalized === "trigger.webhook") return "trigger.webhook";
  if (normalized === "schedule" || normalized === "trigger.schedule") return "trigger.schedule";
  if (normalized === "manual" || normalized === "trigger.manual") return "trigger.manual";

  return triggerType;
}

function resolveEdgeBranch(edge: Record<string, unknown>): EdgeBranch {
  const data = asObject(edge.data);
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
  const run = await NocodeRun.findOneAndUpdate(
    {
      _id: params.runId,
      status: "queued",
    },
    {
      $set: {
        status: "running",
        startedAt: new Date(),
        finishedAt: null,
        error: "",
      },
    },
    { new: true }
  );

  if (!run) {
    const existingRun = await NocodeRun.findById(params.runId);
    if (!existingRun) throw new Error("Run not found");

    if (
      existingRun.status === "running" ||
      existingRun.status === "success" ||
      existingRun.status === "failed"
    ) {
      return;
    }

    throw new Error(`Run is not executable from status: ${existingRun.status}`);
  }

  const triggerPayload = asObject(params.triggerPayload);
  if (Object.keys(triggerPayload).length === 0 && Object.keys(params.triggerPayload || {}).length > 0) {
    run.status = "failed";
    run.error = "Trigger payload must be a JSON object";
    run.finishedAt = new Date();
    await run.save();
    return;
  }

  if (String(run.workflowId) !== String(params.workflowId) || String(run.appId) !== String(params.appId)) {
    run.status = "failed";
    run.error = "Run metadata does not match execution request";
    run.finishedAt = new Date();
    await run.save();
    return;
  }

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

    const triggerNode = Object.values(compiled.nodeMap).find(
      (node) => String(node?.data?.type || "") === expectedTriggerNodeType
    );

    if (!triggerNode) {
      throw new Error(`No matching trigger node for trigger type: ${params.triggerType}`);
    }

    const triggerConfig = asObject(triggerNode.data?.config);
    const requiredFields = getRequiredStringList(triggerConfig.requiredFields);
    const missingRequiredFields = validateRequiredFields(triggerPayload, requiredFields);

    if (missingRequiredFields.length > 0) {
      throw new Error(`Missing required trigger fields: ${missingRequiredFields.join(", ")}`);
    }

    const workflowTimeoutMs = toBoundedInt(
      triggerConfig.timeoutMs,
      DEFAULT_WORKFLOW_TIMEOUT_MS,
      1,
      MAX_TIMEOUT_MS
    );
    const workflowDeadline = Date.now() + workflowTimeoutMs;

    const outgoingByNode = edges.reduce(
      (
        acc: Record<string, Array<{ target: string; branch: EdgeBranch }>>,
        edge: { source: string; target: string; label?: unknown; data?: Record<string, unknown> }
      ) => {
        const source = String(edge?.source || "");
        const target = String(edge?.target || "");
        if (!source || !target) return acc;

        acc[source] ||= [];
        acc[source].push({ target, branch: resolveEdgeBranch(edge as Record<string, unknown>) });
        return acc;
      },
      {} as Record<string, Array<{ target: string; branch: EdgeBranch }>>
    );

    const executionContext: Record<string, unknown> = {
      runId: String(run._id),
      workflowId: params.workflowId,
      appId: params.appId,
      triggerType: params.triggerType,
      trigger: triggerPayload,
      steps: {},
      progress: {
        executed: 0,
        total: nodes.length,
      },
    };

    const queue: string[] = [String(triggerNode.id)];
    const executed = new Set<string>();

    while (queue.length > 0) {
      if (Date.now() > workflowDeadline) {
        throw new Error(`Workflow timed out after ${workflowTimeoutMs}ms`);
      }

      const nodeId = queue.shift() as string;
      if (executed.has(nodeId)) continue;

      const node = compiled.nodeMap[nodeId];
      if (!node) continue;

      const nodeType = String(node?.data?.type || "");
      const config = asObject(node?.data?.config);
      const policy = getNodeExecutionPolicy(config);
      const startedAt = new Date();

      try {
        let output: Record<string, unknown> = {};
        let nextTargets: string[] = [];
        let attempts = 0;

        while (attempts <= policy.retryCount) {
          attempts += 1;

          try {
            if (nodeType.startsWith("trigger.")) {
              output = { accepted: true };
              nextTargets = (outgoingByNode[nodeId] || []).map((item: { target: string }) => item.target);
            } else if (nodeType.startsWith("condition.")) {
              const pass = await withTimeout(
                evaluateCondition(String(config?.key || "always"), {
                  ...triggerPayload,
                  executionContext,
                }),
                policy.timeoutMs,
                `Condition node ${nodeId}`
              );
              output = { pass };

              const branch: EdgeBranch = pass ? "true" : "false";
              const outgoing = outgoingByNode[nodeId] || [];
              nextTargets = outgoing
                .filter((item: { target: string; branch: EdgeBranch }) => item.branch === "always" || item.branch === branch)
                .map((item: { target: string }) => item.target);
            } else if (nodeType.startsWith("action.")) {
              output = await withTimeout(
                runAction(nodeType, config, executionContext),
                policy.timeoutMs,
                `Action node ${nodeId}`
              );
              nextTargets = (outgoingByNode[nodeId] || []).map((item: { target: string }) => item.target);
            } else {
              throw new Error(`Unknown node type: ${nodeType}`);
            }

            output = {
              ...output,
              _meta: {
                attempts,
                timeoutMs: policy.timeoutMs,
                retryCount: policy.retryCount,
                retryDelayMs: policy.retryDelayMs,
              },
            };

            break;
          } catch (attemptError) {
            if (attempts > policy.retryCount) {
              throw attemptError;
            }
            await sleep(policy.retryDelayMs);
          }
        }

        (executionContext.steps as Record<string, unknown>)[nodeId] = output;
        const progress = executionContext.progress as { executed: number; total: number };
        progress.executed = executed.size + 1;

        run.stepLogs.push({
          nodeId,
          nodeType,
          status: "success",
          input: { config, policy },
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
          input: { config, policy },
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
