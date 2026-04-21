"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ReactFlow,
  addEdge,
  Background,
  Controls,
  MiniMap,
  useEdgesState,
  useNodesState,
  type Connection,
  type Edge,
  type Node,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

type BranchValue = "always" | "true" | "false";

type WorkflowNodeData = {
  label?: string;
  type?: string;
  config?: Record<string, unknown>;
};

type WorkflowEdgeData = {
  branch?: BranchValue;
};

type WorkflowNode = Node<WorkflowNodeData>;
type WorkflowEdge = Edge<WorkflowEdgeData>;

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
  value: "action.alert" | "action.log" | "action.webhook" | "action.dbInsert";
  label: string;
};

type Props = {
  initialNodes: WorkflowNode[];
  initialEdges: WorkflowEdge[];
  appId?: string;
  externalSettingsSidebar?: boolean;
  onSave: (graph: { nodes: WorkflowNode[]; edges: WorkflowEdge[] }) => Promise<void>;
  onPublish: () => Promise<void>;
};

type DatabaseOption = {
  _id: string;
  name: string;
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
  { value: "action.dbInsert", label: "Connect to DB" },
];

function getTriggerLabel(triggerType: string): string {
  const found = ALL_EVENTS.find((item) => item.value === triggerType);
  return found ? found.label : triggerType;
}

function getDefaultConfig(type: string): Record<string, unknown> {
  if (type === "trigger.webhook") return { secret: "" };
  if (type === "trigger.schedule") return { cron: "*/5 * * * *" };
  if (type === "trigger.formSubmit") return { secret: "", allowedOrigins: "" };
  if (type === "action.webhook") return { url: "" };
  if (type === "action.dbInsert") {
    return {
      databaseId: "",
      titleField: "title",
      descriptionField: "description",
      emailField: "email",
      fromDateField: "fromDate",
      toDateField: "toDate",
      milestonesField: "milestones",
      statusValue: "To Do",
    };
  }
  if (type === "action.log") return { message: "Workflow log" };
  if (type === "action.alert") return { message: "Workflow test alert" };
  if (type.startsWith("condition.")) return { key: "always" };
  return {};
}

function getActionLabel(actionType: string): string {
  const found = ACTION_OPTIONS.find((item) => item.value === actionType);
  return found ? found.label : actionType;
}

function areStringArraysEqual(left: string[], right: string[]): boolean {
  if (left.length !== right.length) return false;
  for (let i = 0; i < left.length; i += 1) {
    if (left[i] !== right[i]) return false;
  }
  return true;
}

function hasLegacyDbInsertLabel(label: string): boolean {
  return /create\s*db\s*row/i.test(label);
}

export default function WorkflowEditor({
  initialNodes,
  initialEdges,
  appId,
  externalSettingsSidebar = false,
  onSave,
  onPublish,
}: Props) {
  const [nodes, setNodes, onNodesChange] = useNodesState<WorkflowNode>(initialNodes || []);
  const [edges, setEdges, onEdgesChange] = useEdgesState<WorkflowEdge>(initialEdges || []);
  const [selectedTriggerType, setSelectedTriggerType] = useState<string>("trigger.formSubmit");
  const [selectedActionType, setSelectedActionType] = useState<ActionOption["value"]>("action.alert");
  const [eventSearch, setEventSearch] = useState<string>("");
  const [selectedNodeIds, setSelectedNodeIds] = useState<string[]>([]);
  const [selectedEdgeIds, setSelectedEdgeIds] = useState<string[]>([]);
  const [databaseOptions, setDatabaseOptions] = useState<DatabaseOption[]>([]);
  const [appDefaultDatabaseId, setAppDefaultDatabaseId] = useState("");
  const [isDatabaseOptionsLoading, setIsDatabaseOptionsLoading] = useState(false);
  const [isSettingsPanelCollapsed, setIsSettingsPanelCollapsed] = useState(externalSettingsSidebar);
  const [isSaving, setIsSaving] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");

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

  const selectedNodeType = String(selectedNode?.data?.type || "");

  useEffect(() => {
    if (externalSettingsSidebar) {
      setIsSettingsPanelCollapsed(true);
    }
  }, [externalSettingsSidebar]);

  useEffect(() => {
    let active = true;

    const loadDatabaseOptions = async () => {
      if (!appId) {
        if (active) {
          setDatabaseOptions([]);
          setAppDefaultDatabaseId("");
        }
        return;
      }

      setIsDatabaseOptionsLoading(true);
      try {
        const appsRes = await fetch("/api/nocode/apps", { cache: "no-store" });
        const appsJson = await appsRes.json().catch(() => ({}));
        const apps = Array.isArray((appsJson as any)?.data) ? (appsJson as any).data : [];
        const currentApp = apps.find((app: any) => String(app?._id || "") === String(appId));
        const projectId = String(currentApp?.projectId || "");
        const defaultDatabaseId = String(currentApp?.defaultDatabaseId || "");

        if (!projectId) {
          if (active) {
            setDatabaseOptions([]);
            setAppDefaultDatabaseId(defaultDatabaseId);
          }
          return;
        }

        const dbRes = await fetch(`/api/databases?projectId=${encodeURIComponent(projectId)}`, {
          cache: "no-store",
        });
        const dbJson = await dbRes.json().catch(() => []);
        const dbList = Array.isArray(dbJson) ? dbJson : [];

        if (!active) return;

        const normalized: DatabaseOption[] = dbList.map((db: any) => ({
          _id: String(db?._id || ""),
          name: String(db?.name || "Untitled table"),
        })).filter((db) => db._id);

        setDatabaseOptions(normalized);
        setAppDefaultDatabaseId(defaultDatabaseId);
      } catch {
        if (active) {
          setDatabaseOptions([]);
          setAppDefaultDatabaseId("");
        }
      } finally {
        if (active) setIsDatabaseOptionsLoading(false);
      }
    };

    void loadDatabaseOptions();

    return () => {
      active = false;
    };
  }, [appId]);

  const filteredCategories = useMemo(() => {
    const query = eventSearch.trim().toLowerCase();
    if (!query) return EVENT_CATEGORIES;

    return EVENT_CATEGORIES.map((category) => ({
      ...category,
      events: category.events.filter((event) => event.label.toLowerCase().includes(query)),
    })).filter((category) => category.events.length > 0);
  }, [eventSearch]);

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge({ ...params, label: "always", data: { branch: "always" as BranchValue } }, eds)),
    [setEdges]
  );

  const handleSelectionChange = useCallback(({ nodes: selectedNodes, edges: selectedEdges }: { nodes: WorkflowNode[]; edges: WorkflowEdge[] }) => {
    const nextNodeIds = (selectedNodes || []).map((node) => String(node.id));
    const nextEdgeIds = (selectedEdges || []).map((edge) => String(edge.id || ""));

    setSelectedNodeIds((prev) => (areStringArraysEqual(prev, nextNodeIds) ? prev : nextNodeIds));
    setSelectedEdgeIds((prev) => (areStringArraysEqual(prev, nextEdgeIds) ? prev : nextEdgeIds));
  }, []);

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

  useEffect(() => {
    if (!selectedNode) return;
    if (String(selectedNode.data?.type || "") !== "action.dbInsert") return;

    const configuredDatabaseId = String(selectedNode.data?.config?.databaseId || "").trim();
    if (configuredDatabaseId) return;

    const defaultDatabaseId = appDefaultDatabaseId.trim();
    if (!defaultDatabaseId) return;

    const existsInOptions = databaseOptions.some((option) => option._id === defaultDatabaseId);
    if (!existsInOptions) return;

    updateNodeConfig(String(selectedNode.id), "databaseId", defaultDatabaseId);
  }, [selectedNode, appDefaultDatabaseId, databaseOptions, updateNodeConfig]);

  const updateEdgeBranch = useCallback((edgeId: string, branch: BranchValue) => {
    setEdges((prev) => prev.map((edge) => {
      if (String(edge.id || "") !== edgeId) return edge;
      return {
        ...edge,
        label: branch,
        data: {
          ...(edge.data || {}),
          branch,
        },
      };
    }));
  }, [setEdges]);

  useEffect(() => {
    setNodes((prev) => {
      let changed = false;

      const next = prev.map((node) => {
        const nodeType = String(node?.data?.type || "");
        if (nodeType !== "action.dbInsert") return node;

        const currentLabel = String(node?.data?.label || "");
        if (!hasLegacyDbInsertLabel(currentLabel)) return node;

        changed = true;
        return {
          ...node,
          data: {
            ...(node.data || {}),
            label: `Action: ${getActionLabel("action.dbInsert")}`,
          },
        };
      });

      return changed ? next : prev;
    });
  }, [setNodes]);

  useEffect(() => {
    if (!externalSettingsSidebar) return;

    const onMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;

      const message = event.data as {
        source?: string;
        type?: string;
        payload?: Record<string, unknown>;
      };

      if (!message || message.source !== "workflow-sidebar") return;

      if (message.type === "update-node-config") {
        const nodeId = String(message.payload?.nodeId || "");
        const key = String(message.payload?.key || "");
        const rawValue = message.payload?.value;
        const value = typeof rawValue === "string" ? rawValue : String(rawValue ?? "");

        if (!nodeId || !key) return;
        updateNodeConfig(nodeId, key, value);
        return;
      }

      if (message.type === "update-edge-branch") {
        const edgeId = String(message.payload?.edgeId || "");
        const branch = String(message.payload?.branch || "always") as BranchValue;
        if (!edgeId || !["always", "true", "false"].includes(branch)) return;
        updateEdgeBranch(edgeId, branch);
      }
    };

    window.addEventListener("message", onMessage);
    return () => {
      window.removeEventListener("message", onMessage);
    };
  }, [externalSettingsSidebar, updateEdgeBranch, updateNodeConfig]);

  useEffect(() => {
    if (!externalSettingsSidebar) return;

    const payload = {
      selectedNode: selectedNode
        ? {
          id: String(selectedNode.id),
          label: String(selectedNode.data?.label || selectedNode.id),
          type: String(selectedNode.data?.type || ""),
          config: ((selectedNode.data?.config || {}) as Record<string, unknown>),
        }
        : null,
      selectedEdge: selectedEdge
        ? {
          id: String(selectedEdge.id || ""),
          branch: String(selectedEdge.data?.branch || "always"),
        }
        : null,
      databaseOptions,
      isDatabaseOptionsLoading,
    };

    window.parent.postMessage(
      {
        source: "workflow-editor",
        type: "state",
        payload,
      },
      window.location.origin
    );
  }, [externalSettingsSidebar, selectedNode, selectedEdge, databaseOptions, isDatabaseOptionsLoading]);

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

  const flowStyles = `
    .workflow-flow .react-flow {
      --xy-node-background-color-default: var(--card);
      --xy-node-color-default: var(--card-foreground);
      --xy-node-border-default: 1px solid var(--border);
      --xy-controls-button-background-color-default: var(--card);
      --xy-controls-button-color-default: var(--card-foreground);
      --xy-controls-button-background-color-hover-default: var(--accent);
      --xy-controls-button-color-hover-default: var(--accent-foreground);
      --xy-controls-button-border-color-default: var(--border);
      --xy-minimap-background-color-default: var(--card);
    }

    .workflow-flow .react-flow__node,
    .workflow-flow .react-flow__node-default {
      background: var(--card) !important;
      color: var(--card-foreground) !important;
      border: 1px solid var(--border) !important;
      border-radius: 0.75rem;
      min-width: 200px;
      padding: 10px 14px;
      text-align: center;
      font-weight: 500;
      box-shadow: 0 8px 24px -16px rgba(0, 0, 0, 0.45);
    }

    .workflow-flow .react-flow__handle {
      width: 12px;
      height: 12px;
      border: 2px solid var(--background);
      background: var(--primary);
      box-shadow: 0 0 0 1px var(--border);
    }

    .workflow-flow .react-flow__controls {
      border: 1px solid var(--border);
      border-radius: 0.75rem;
      overflow: hidden;
      box-shadow: 0 10px 25px -15px rgba(0, 0, 0, 0.5);
      background: var(--card);
    }

    .workflow-flow .react-flow__controls-button {
      width: 34px;
      height: 34px;
      border: 0;
      border-bottom: 1px solid var(--border);
      background: var(--card) !important;
      color: var(--card-foreground) !important;
    }

    .workflow-flow .react-flow__controls-button:hover {
      background: var(--accent) !important;
      color: var(--accent-foreground) !important;
    }

    .workflow-flow .react-flow__controls-button:last-child {
      border-bottom: 0;
    }

    .workflow-flow .react-flow__controls-button svg,
    .workflow-flow .react-flow__controls-button path {
      fill: currentColor !important;
      stroke: currentColor !important;
      opacity: 1 !important;
    }

    .workflow-flow .react-flow__minimap {
      border: 1px solid var(--border);
      border-radius: 0.75rem;
      background: var(--card);
    }
  `;

  return (
    <div className="workflow-flow flex h-[80vh] flex-col overflow-hidden rounded-xl border border-border/80 bg-background">
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

        <button
          onClick={async () => {
            try {
              setIsSaving(true);
              setStatusMessage("Saving workflow...");
              await onSave({ nodes, edges });
              setStatusMessage(`Saved at ${new Date().toLocaleTimeString()}`);
            } catch (error) {
              setStatusMessage(error instanceof Error ? error.message : "Failed to save workflow");
            } finally {
              setIsSaving(false);
            }
          }}
          className="border p-2 rounded-xl"
          disabled={isSaving || isPublishing}
        >
          {isSaving ? "Saving..." : "Save"}
        </button>
        <button
          onClick={async () => {
            try {
              setIsPublishing(true);
              setStatusMessage("Publishing workflow...");
              await onPublish();
              setStatusMessage(`Published at ${new Date().toLocaleTimeString()}`);
            } catch (error) {
              setStatusMessage(error instanceof Error ? error.message : "Failed to publish workflow");
            } finally {
              setIsPublishing(false);
            }
          }}
          className="border p-2 rounded-xl"
          disabled={isSaving || isPublishing}
        >
          {isPublishing ? "Publishing..." : "Publish"}
        </button>
        {statusMessage ? <span className="text-xs text-muted-foreground">{statusMessage}</span> : null}
        {!externalSettingsSidebar ? (
          <button
            onClick={() => setIsSettingsPanelCollapsed((value) => !value)}
            className="border p-2 rounded-xl"
            type="button"
          >
            {isSettingsPanelCollapsed ? "Show Settings" : "Hide Settings"}
          </button>
        ) : null}
      </div>

      <div className="flex min-h-0 flex-1 border-t border-border/60">
        <div className="min-w-0 flex-1">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onSelectionChange={handleSelectionChange}
            fitView
          >
            <MiniMap />
            <Controls />
            <Background />
          </ReactFlow>
        </div>

        {!externalSettingsSidebar ? (
          <aside
            className={`${isSettingsPanelCollapsed ? "w-12" : "w-[340px] max-w-[45%]"} shrink-0 overflow-y-auto border-l border-border/60 bg-card/30 p-3 transition-all duration-200`}
          >
          {isSettingsPanelCollapsed ? (
            <button
              className="h-full w-full rounded border border-border/60 text-xs text-muted-foreground"
              onClick={() => setIsSettingsPanelCollapsed(false)}
              type="button"
              title="Show settings"
              aria-label="Show settings"
            >
              Settings
            </button>
          ) : (
            <>
              <div className="mb-3 border-b border-border/60 pb-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="text-xs uppercase tracking-wide text-muted-foreground">Node Settings</div>
                  <button
                    className="rounded border border-border/60 px-2 py-1 text-xs text-muted-foreground"
                    onClick={() => setIsSettingsPanelCollapsed(true)}
                    type="button"
                  >
                    Collapse
                  </button>
                </div>
                <div className="mt-1 text-sm text-foreground">
                  {selectedNode ? String(selectedNode.data?.label || selectedNode.id) : "Select a node"}
                </div>
              </div>

              {selectedNode ? (
                <div className="space-y-3">
                  {selectedNodeType === "trigger.webhook" && (
                    <>
                      <label className="block text-xs text-muted-foreground">Webhook secret</label>
                      <input
                        value={String(selectedNode.data?.config?.secret || "")}
                        onChange={(e) => updateNodeConfig(String(selectedNode.id), "secret", e.target.value)}
                        className="w-full rounded border p-2"
                        placeholder="x-workflow-secret"
                      />
                    </>
                  )}

                  {selectedNodeType === "trigger.schedule" && (
                    <>
                      <label className="block text-xs text-muted-foreground">Cron</label>
                      <input
                        value={String(selectedNode.data?.config?.cron || "")}
                        onChange={(e) => updateNodeConfig(String(selectedNode.id), "cron", e.target.value)}
                        className="w-full rounded border p-2"
                        placeholder="*/5 * * * *"
                      />
                    </>
                  )}

                  {selectedNodeType === "trigger.formSubmit" && (
                    <>
                      <label className="block text-xs text-muted-foreground">Trigger secret (optional)</label>
                      <input
                        value={String(selectedNode.data?.config?.secret || "")}
                        onChange={(e) => updateNodeConfig(String(selectedNode.id), "secret", e.target.value)}
                        className="w-full rounded border p-2"
                        placeholder="Shared secret required from public page"
                      />

                      <label className="block text-xs text-muted-foreground">Allowed origins (optional)</label>
                      <textarea
                        value={String(selectedNode.data?.config?.allowedOrigins || "")}
                        onChange={(e) => updateNodeConfig(String(selectedNode.id), "allowedOrigins", e.target.value)}
                        className="w-full rounded border p-2"
                        rows={3}
                        placeholder="https://example.com, https://*.example.com"
                      />
                    </>
                  )}

                  {selectedNodeType === "action.webhook" && (
                    <>
                      <label className="block text-xs text-muted-foreground">Webhook URL</label>
                      <input
                        value={String(selectedNode.data?.config?.url || "")}
                        onChange={(e) => updateNodeConfig(String(selectedNode.id), "url", e.target.value)}
                        className="w-full rounded border p-2"
                        placeholder="https://example.com/webhook"
                      />
                    </>
                  )}

                  {selectedNodeType === "action.dbInsert" && (
                    <>
                      <label className="block text-xs text-muted-foreground">Select table</label>
                      <select
                        value={String(selectedNode.data?.config?.databaseId || "")}
                        onChange={(e) => updateNodeConfig(String(selectedNode.id), "databaseId", e.target.value)}
                        className="w-full rounded border bg-white p-2 text-black dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
                      >
                        <option value="">
                          {isDatabaseOptionsLoading ? "Loading tables..." : "Use form binding / app default table"}
                        </option>
                        {databaseOptions.map((database) => (
                          <option key={database._id} value={database._id}>
                            {database.name}
                          </option>
                        ))}
                      </select>

                      <label className="block text-xs text-muted-foreground">Database ID</label>
                      <input
                        value={String(selectedNode.data?.config?.databaseId || "")}
                        onChange={(e) => updateNodeConfig(String(selectedNode.id), "databaseId", e.target.value)}
                        className="w-full rounded border p-2"
                        placeholder="Optional: use form binding or app default table"
                      />

                      <label className="block text-xs text-muted-foreground">Title field key</label>
                      <input
                        value={String(selectedNode.data?.config?.titleField || "title")}
                        onChange={(e) => updateNodeConfig(String(selectedNode.id), "titleField", e.target.value)}
                        className="w-full rounded border p-2"
                        placeholder="title"
                      />

                      <label className="block text-xs text-muted-foreground">Description field key</label>
                      <input
                        value={String(selectedNode.data?.config?.descriptionField || "description")}
                        onChange={(e) => updateNodeConfig(String(selectedNode.id), "descriptionField", e.target.value)}
                        className="w-full rounded border p-2"
                        placeholder="description"
                      />

                      <label className="block text-xs text-muted-foreground">Email field key</label>
                      <input
                        value={String(selectedNode.data?.config?.emailField || "email")}
                        onChange={(e) => updateNodeConfig(String(selectedNode.id), "emailField", e.target.value)}
                        className="w-full rounded border p-2"
                        placeholder="email"
                      />

                      <label className="block text-xs text-muted-foreground">From date field key</label>
                      <input
                        value={String(selectedNode.data?.config?.fromDateField || "fromDate")}
                        onChange={(e) => updateNodeConfig(String(selectedNode.id), "fromDateField", e.target.value)}
                        className="w-full rounded border p-2"
                        placeholder="fromDate"
                      />

                      <label className="block text-xs text-muted-foreground">To date field key</label>
                      <input
                        value={String(selectedNode.data?.config?.toDateField || "toDate")}
                        onChange={(e) => updateNodeConfig(String(selectedNode.id), "toDateField", e.target.value)}
                        className="w-full rounded border p-2"
                        placeholder="toDate"
                      />

                      <label className="block text-xs text-muted-foreground">Milestones field key</label>
                      <input
                        value={String(selectedNode.data?.config?.milestonesField || "milestones")}
                        onChange={(e) => updateNodeConfig(String(selectedNode.id), "milestonesField", e.target.value)}
                        className="w-full rounded border p-2"
                        placeholder="milestones"
                      />

                      <label className="block text-xs text-muted-foreground">Status value</label>
                      <input
                        value={String(selectedNode.data?.config?.statusValue || "To Do")}
                        onChange={(e) => updateNodeConfig(String(selectedNode.id), "statusValue", e.target.value)}
                        className="w-full rounded border p-2"
                        placeholder="To Do"
                      />
                    </>
                  )}

                  {["action.log", "action.alert"].includes(selectedNodeType) && (
                    <>
                      <label className="block text-xs text-muted-foreground">Message</label>
                      <input
                        value={String(selectedNode.data?.config?.message || "")}
                        onChange={(e) => updateNodeConfig(String(selectedNode.id), "message", e.target.value)}
                        className="w-full rounded border p-2"
                        placeholder="Workflow test alert"
                      />
                    </>
                  )}

                  {selectedNodeType.startsWith("condition.") && (
                    <>
                      <label className="block text-xs text-muted-foreground">Condition key</label>
                      <select
                        value={String(selectedNode.data?.config?.key || "always")}
                        onChange={(e) => updateNodeConfig(String(selectedNode.id), "key", e.target.value)}
                        className="w-full rounded border bg-white p-2 text-black dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
                      >
                        <option value="always">always</option>
                        <option value="email">email</option>
                        <option value="hasEmail">hasEmail</option>
                      </select>
                    </>
                  )}

                  {![
                    "trigger.webhook",
                    "trigger.schedule",
                    "action.webhook",
                    "action.dbInsert",
                    "action.log",
                    "action.alert",
                  ].includes(selectedNodeType) && !selectedNodeType.startsWith("condition.") ? (
                    <p className="text-xs text-muted-foreground">No custom settings for this node type.</p>
                  ) : null}
                </div>
              ) : null}

              {!selectedNode ? (
                <p className="text-xs text-muted-foreground">Select any trigger, action, or condition node to edit its settings.</p>
              ) : null}

              <div className="mt-4 border-t border-border/60 pt-3">
                <div className="text-xs uppercase tracking-wide text-muted-foreground">Edge Settings</div>
                <div className="text-sm text-foreground">{selectedEdge ? String(selectedEdge.id || "") : "Select an edge"}</div>

                {selectedEdge ? (
                  <div className="mt-3 space-y-2">
                    <label className="block text-xs text-muted-foreground">Branch</label>
                    <select
                      value={String(selectedEdge.data?.branch || "always")}
                      onChange={(e) => updateEdgeBranch(String(selectedEdge.id || ""), e.target.value as BranchValue)}
                      className="w-full rounded border bg-white p-2 text-black dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
                    >
                      <option value="always">always</option>
                      <option value="true">true</option>
                      <option value="false">false</option>
                    </select>
                  </div>
                ) : (
                  <p className="mt-2 text-xs text-muted-foreground">Select a connection line to edit branch behavior.</p>
                )}
              </div>
            </>
          )}
          </aside>
        ) : null}
      </div>

      <style jsx global>{flowStyles}</style>
    </div>
  );
}