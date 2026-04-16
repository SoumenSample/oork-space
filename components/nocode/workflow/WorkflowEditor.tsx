"use client";

import { useCallback, useMemo, useState } from "react";
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

type EventOption = {
  value: string;
  label: string;
};

type EventCategory = {
  key: string;
  label: string;
  events: EventOption[];
};

type ActionOption = {
  value: "action.alert" | "action.log" | "action.webhook";
  label: string;
};

type Props = {
  initialNodes: any[];
  initialEdges: any[];
  onSave: (graph: { nodes: any[]; edges: any[] }) => Promise<void>;
  onPublish: () => Promise<void>;
};

const EVENT_CATEGORIES: EventCategory[] = [
  {
    key: "general",
    label: "General",
    events: [
      { value: "trigger.manual", label: "Page is loaded" },
      { value: "trigger.schedule", label: "Do every 5 minutes" },
    ],
  },
  {
    key: "elements",
    label: "Elements",
    events: [
      { value: "trigger.formSubmit", label: "Form is submitted" },
    ],
  },
  {
    key: "custom",
    label: "Custom",
    events: [
      { value: "trigger.webhook", label: "Incoming webhook" },
    ],
  },
] as const;

const ALL_EVENTS = EVENT_CATEGORIES.flatMap((category) => category.events);
const ACTION_OPTIONS: ActionOption[] = [
  { value: "action.alert", label: "Alert (Test)" },
  { value: "action.log", label: "Log" },
  { value: "action.webhook", label: "Webhook" },
];

function getTriggerLabel(triggerType: string): string {
  const found = ALL_EVENTS.find((item) => item.value === triggerType);
  return found ? found.label : triggerType;
}

function getDefaultConfig(type: string): Record<string, unknown> {
  if (type === "trigger.webhook") return { secret: "" };
  if (type === "trigger.schedule") return { cron: "*/5 * * * *" };
  if (type === "action.webhook") return { url: "" };
  if (type === "action.log") return { message: "Workflow log" };
  if (type === "action.alert") return { message: "Workflow test alert" };
  if (type.startsWith("condition.")) return { key: "always" };
  return {};
}

function getActionLabel(actionType: string): string {
  const found = ACTION_OPTIONS.find((item) => item.value === actionType);
  return found ? found.label : actionType;
}

export default function WorkflowEditor({ initialNodes, initialEdges, onSave, onPublish }: Props) {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes || []);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges || []);
  const [selectedTriggerType, setSelectedTriggerType] = useState<string>("trigger.formSubmit");
  const [selectedActionType, setSelectedActionType] = useState<ActionOption["value"]>("action.alert");
  const [eventSearch, setEventSearch] = useState<string>("");
  const [selectedNodeIds, setSelectedNodeIds] = useState<string[]>([]);
  const [selectedEdgeIds, setSelectedEdgeIds] = useState<string[]>([]);

  const selectedNodeId = selectedNodeIds[0] || "";
  const selectedEdgeId = selectedEdgeIds[0] || "";

  const selectedNode = useMemo(
    () => nodes.find((node) => String(node.id) === selectedNodeId),
    [nodes, selectedNodeId]
  );

  const selectedEdge = useMemo(
    () => edges.find((edge) => String(edge.id || "") === selectedEdgeId),
    [edges, selectedEdgeId]
  );

  const filteredCategories = useMemo(() => {
    const query = eventSearch.trim().toLowerCase();
    if (!query) return EVENT_CATEGORIES;

    return EVENT_CATEGORIES.map((category) => ({
      ...category,
      events: category.events.filter((event) => event.label.toLowerCase().includes(query)),
    })).filter((category) => category.events.length > 0);
  }, [eventSearch]);

  const onConnect = useCallback(
    (params: Connection | Edge) => setEdges((eds) => addEdge({ ...params, label: "always", data: { branch: "always" } }, eds)),
    [setEdges]
  );

  const updateNodeConfig = useCallback((nodeId: string, key: string, value: string) => {
    setNodes((prev) => prev.map((node) => {
      if (String(node.id) !== nodeId) return node;
      const previousConfig = (node.data?.config || {}) as Record<string, unknown>;
      return {
        ...node,
        data: {
          ...(node.data || {}),
          config: {
            ...previousConfig,
            [key]: value,
          },
        },
      };
    }));
  }, [setNodes]);

  const updateEdgeBranch = useCallback((edgeId: string, branch: "always" | "true" | "false") => {
    setEdges((prev) => prev.map((edge) => {
      if (String(edge.id || "") !== edgeId) return edge;
      return {
        ...edge,
        label: branch,
        data: {
          ...((edge.data || {}) as Record<string, unknown>),
          branch,
        },
      };
    }));
  }, [setEdges]);

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
      <div style={{ padding: 8, display: "flex", gap: 8, flexWrap: "wrap" }}>
        <input
          value={eventSearch}
          onChange={(e) => setEventSearch(e.target.value)}
          placeholder="Search for an event"
          className="border p-2 rounded-xl min-w-[220px]"
        />

        <select
          value={selectedTriggerType}
          className="border p-2 rounded-xl bg-white text-black dark:bg-zinc-900 dark:text-zinc-100 dark:border-zinc-700"
          onChange={(e) => setSelectedTriggerType(e.target.value)}
        >
          {filteredCategories.map((category) => (
            <optgroup key={category.key} label={category.label}>
              {category.events.map((item) => (
                <option key={item.value} value={item.value}>{item.label}</option>
              ))}
            </optgroup>
          ))}
        </select>

        <button
          onClick={() =>
            setNodes((prev) => [
              ...prev,
              {
                id: String(Date.now()),
                position: { x: 100 + prev.length * 30, y: 100 + prev.length * 20 },
                data: {
                  label: `Trigger: ${getTriggerLabel(selectedTriggerType)}`,
                  type: selectedTriggerType,
                  config: getDefaultConfig(selectedTriggerType),
                },
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

        <select
          value={selectedActionType}
          className="border p-2 rounded-xl bg-white text-black dark:bg-zinc-900 dark:text-zinc-100 dark:border-zinc-700"
          onChange={(e) => setSelectedActionType(e.target.value as ActionOption["value"])}
        >
          {ACTION_OPTIONS.map((item) => (
            <option key={item.value} value={item.value}>{item.label}</option>
          ))}
        </select>

        <button
          onClick={() =>
            setNodes((prev) => [
              ...prev,
              {
                id: String(Date.now()),
                position: { x: 320 + prev.length * 30, y: 260 + prev.length * 20 },
                data: {
                  label: `Action: ${getActionLabel(selectedActionType)}`,
                  type: selectedActionType,
                  config: getDefaultConfig(selectedActionType),
                },
                type: "default",
              },
            ])
          }
          className="border p-2 rounded-xl"
        >
          Add Action
        </button>

        <button
          onClick={() =>
            setNodes((prev) => [
              ...prev,
              {
                id: String(Date.now()),
                position: { x: 220 + prev.length * 30, y: 200 + prev.length * 20 },
                data: {
                  label: "Condition: If",
                  type: "condition.if",
                  config: getDefaultConfig("condition.if"),
                },
                type: "default",
              },
            ])
          }
          className="border p-2 rounded-xl"
        >
          Add Condition
        </button>

        <button onClick={() => void onSave({ nodes, edges })} className="border p-2 rounded-xl">Save</button>
        <button onClick={() => void onPublish()} className="border p-2 rounded-xl">Publish</button>
      </div>

      <div style={{ display: "flex", gap: 12, padding: 8, borderTop: "1px solid #eee", borderBottom: "1px solid #eee", flexWrap: "wrap" }}>
        <div className="text-sm text-muted-foreground">
          Selected node: {selectedNode ? String(selectedNode.data?.label || selectedNode.id) : "none"}
        </div>

        {selectedNode && String(selectedNode.data?.type || "") === "trigger.webhook" && (
          <>
            <label className="text-sm">Webhook secret</label>
            <input
              value={String(selectedNode.data?.config?.secret || "")}
              onChange={(e) => updateNodeConfig(String(selectedNode.id), "secret", e.target.value)}
              className="border p-1 rounded min-w-[220px]"
              placeholder="x-workflow-secret"
            />
          </>
        )}

        {selectedNode && String(selectedNode.data?.type || "") === "trigger.schedule" && (
          <>
            <label className="text-sm">Cron</label>
            <input
              value={String(selectedNode.data?.config?.cron || "")}
              onChange={(e) => updateNodeConfig(String(selectedNode.id), "cron", e.target.value)}
              className="border p-1 rounded min-w-[220px]"
              placeholder="*/5 * * * *"
            />
          </>
        )}

        {selectedNode && String(selectedNode.data?.type || "") === "action.webhook" && (
          <>
            <label className="text-sm">Webhook URL</label>
            <input
              value={String(selectedNode.data?.config?.url || "")}
              onChange={(e) => updateNodeConfig(String(selectedNode.id), "url", e.target.value)}
              className="border p-1 rounded min-w-[300px]"
              placeholder="https://example.com/webhook"
            />
          </>
        )}

        {selectedNode && ["action.log", "action.alert"].includes(String(selectedNode.data?.type || "")) && (
          <>
            <label className="text-sm">Message</label>
            <input
              value={String(selectedNode.data?.config?.message || "")}
              onChange={(e) => updateNodeConfig(String(selectedNode.id), "message", e.target.value)}
              className="border p-1 rounded min-w-[280px]"
              placeholder="Workflow test alert"
            />
          </>
        )}

        {selectedNode && String(selectedNode.data?.type || "").startsWith("condition.") && (
          <>
            <label className="text-sm">Condition key</label>
            <select
              value={String(selectedNode.data?.config?.key || "always")}
              onChange={(e) => updateNodeConfig(String(selectedNode.id), "key", e.target.value)}
              className="border p-1 rounded bg-white text-black dark:bg-zinc-900 dark:text-zinc-100 dark:border-zinc-700"
            >
              <option value="always">always</option>
              <option value="email">email</option>
              <option value="hasEmail">hasEmail</option>
            </select>
          </>
        )}

        <div className="text-sm text-muted-foreground">
          Selected edge: {selectedEdge ? String(selectedEdge.id || "") : "none"}
        </div>

        {selectedEdge && (
          <>
            <label className="text-sm">Branch</label>
            <select
              value={String(selectedEdge.data?.branch || "always")}
              onChange={(e) => updateEdgeBranch(String(selectedEdge.id || ""), e.target.value as "always" | "true" | "false")}
              className="border p-1 rounded bg-white text-black dark:bg-zinc-900 dark:text-zinc-100 dark:border-zinc-700"
            >
              <option value="always">always</option>
              <option value="true">true</option>
              <option value="false">false</option>
            </select>
          </>
        )}
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