"use client";

import { useCallback } from "react";
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

export default function WorkflowEditor({ initialNodes, initialEdges, onSave, onPublish }: Props) {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes || []);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges || []);

  const onConnect = useCallback(
    (params: Connection | Edge) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  return (
    <div style={{ height: "80vh", border: "1px solid #ddd" }}>
      <div style={{ padding: 8, display: "flex", gap: 8 }}>
        <button
          onClick={() =>
            setNodes((prev) => [
              ...prev,
              {
                id: String(Date.now()),
                position: { x: 100 + prev.length * 30, y: 100 + prev.length * 20 },
                data: { label: "Trigger: Form Submit", type: "trigger.formSubmit" },
                type: "default",
              },
            ])
          }
        >
          Add Trigger
        </button>

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
        >
          Add Action
        </button>

        <button onClick={() => void onSave({ nodes, edges })}>Save</button>
        <button onClick={() => void onPublish()}>Publish</button>
      </div>

      <ReactFlow nodes={nodes} edges={edges} onNodesChange={onNodesChange} onEdgesChange={onEdgesChange} onConnect={onConnect} fitView>
        <MiniMap />
        <Controls />
        <Background />
      </ReactFlow>
    </div>
  );
}