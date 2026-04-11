"use client";

import { useCallback, useState } from "react";
import ReactFlow, {
  addEdge,
  Background,
  Controls,
  MiniMap,
  useEdgesState,
  useNodesState,
  Connection,
  Edge,
} from "reactflow";
import "reactflow/dist/style.css";

type Props = {
  initialNodes: any[];
  initialEdges: any[];
  onSave: (graph: { nodes: any[]; edges: any[] }) => Promise<void>;
  onPublish: () => Promise<void>;
};

const TRIGGER_TYPES = [
  { value: "trigger.formSubmit", label: "Form Submit" },
  { value: "trigger.schedule", label: "Schedule" },
  { value: "trigger.webhook", label: "Webhook" },
  { value: "trigger.manual", label: "Manual" },
] as const;

function getTriggerLabel(triggerType: string): string {
  const found = TRIGGER_TYPES.find((item) => item.value === triggerType);
  return found ? found.label : triggerType;
}

export default function WorkflowEditor({ initialNodes, initialEdges, onSave, onPublish }: Props) {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes || []);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges || []);
  const [selectedTriggerType, setSelectedTriggerType] = useState<string>("trigger.formSubmit");
  const [selectedNodeIds, setSelectedNodeIds] = useState<string[]>([]);
  const [selectedEdgeIds, setSelectedEdgeIds] = useState<string[]>([]);

  const onConnect = useCallback(
    (params: Connection | Edge) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  const deleteTriggerNodes = useCallback(() => {
    const triggerIds = new Set(
      nodes
        .filter((node) => String(node?.data?.type || "").startsWith("trigger."))
        .map((node) => String(node.id))
    );

    if (!triggerIds.size) return;

    setNodes((prev) => prev.filter((node) => !triggerIds.has(String(node.id))));
    setEdges((prev) => prev.filter((edge) => !triggerIds.has(String(edge.source)) && !triggerIds.has(String(edge.target))));
  }, [nodes, setEdges, setNodes]);

  const deleteSelected = useCallback(() => {
    if (!selectedNodeIds.length && !selectedEdgeIds.length) return;

    const nodeSet = new Set(selectedNodeIds);
    const edgeSet = new Set(selectedEdgeIds);

    setNodes((prev) => prev.filter((node) => !nodeSet.has(String(node.id))));
    setEdges((prev) => prev.filter((edge) => (
      !edgeSet.has(String(edge.id || ""))
      && !nodeSet.has(String(edge.source))
      && !nodeSet.has(String(edge.target))
    )));
  }, [selectedEdgeIds, selectedNodeIds, setEdges, setNodes]);

  return (
    <div style={{ height: "80vh", border: "1px solid #ddd" }}>
      <div style={{ padding: 8, display: "flex", gap: 8 }} >
        <select value={selectedTriggerType} className="border p-2 rounded-xl" onChange={(e) => setSelectedTriggerType(e.target.value)}>
          {TRIGGER_TYPES.map((item) => (
            <option key={item.value} value={item.value}>{item.label}</option>
          ))}
        </select>

        <button
          onClick={() =>
            setNodes((prev) => [
              ...prev,
              {
                id: String(Date.now()),
                position: { x: 100 + prev.length * 30, y: 100 + prev.length * 20 },
                data: { label: `Trigger: ${getTriggerLabel(selectedTriggerType)}`, type: selectedTriggerType },
                type: "default",
              },
            ])
          }
          className="border p-2 rounded-xl"
        >
          Add Trigger
        </button>

        <button onClick={deleteTriggerNodes} className="border p-2 rounded-xl">Delete Trigger</button>

        <button onClick={deleteSelected} className="border p-2 rounded-xl">Delete Selected</button>

        <button
          onClick={() =>
            setNodes((prev) => [
              ...prev,
              {
                id: String(Date.now()),
                position: { x: 320 + prev.length * 30, y: 260 + prev.length * 20 },
                data: { label: "Action: Webhook", type: "action.webhook" },
                type: "default",
              },
            ])
          }
          className="border p-2 rounded-xl"
        >
          Add Action
        </button>

        <button onClick={() => void onSave({ nodes, edges })} className="border p-2 rounded-xl">Save</button>
        <button onClick={() => void onPublish()} className="border p-2 rounded-xl">Publish</button>
      </div>

      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onSelectionChange={({ nodes: selectedNodes, edges: selectedEdges }) => {
          setSelectedNodeIds((selectedNodes || []).map((node) => String(node.id)));
          setSelectedEdgeIds((selectedEdges || []).map((edge) => String(edge.id || "")));
        }}
        fitView
      >
        <MiniMap />
        <Controls />
        <Background />
      </ReactFlow>
    </div>
  );
}