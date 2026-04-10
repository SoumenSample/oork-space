export type FlowNode = {
  id: string;
  data?: { type?: string; config?: Record<string, unknown> };
};

export type FlowEdge = {
  id?: string;
  source: string;
  target: string;
};

export type CompiledWorkflow = {
  orderedNodeIds: string[];
  nodeMap: Record<string, FlowNode>;
  outgoing: Record<string, string[]>;
};

export function compileWorkflow(nodes: FlowNode[], edges: FlowEdge[]): CompiledWorkflow {
  const nodeMap: Record<string, FlowNode> = {};
  const indegree: Record<string, number> = {};
  const outgoing: Record<string, string[]> = {};

  for (const n of nodes) {
    nodeMap[n.id] = n;
    indegree[n.id] = 0;
    outgoing[n.id] = [];
  }

  for (const e of edges) {
    if (!nodeMap[e.source] || !nodeMap[e.target]) continue;
    outgoing[e.source].push(e.target);
    indegree[e.target] += 1;
  }

  const queue: string[] = Object.keys(indegree).filter((k) => indegree[k] === 0);
  const ordered: string[] = [];

  while (queue.length > 0) {
    const id = queue.shift() as string;
    ordered.push(id);

    for (const nxt of outgoing[id]) {
      indegree[nxt] -= 1;
      if (indegree[nxt] === 0) queue.push(nxt);
    }
  }

  if (ordered.length !== nodes.length) {
    throw new Error("Workflow graph has a cycle or disconnected invalid state");
  }

  return {
    orderedNodeIds: ordered,
    nodeMap,
    outgoing,
  };
}