export async function runAction(
  actionType: string,
  config: Record<string, unknown>,
  context: Record<string, unknown>
): Promise<Record<string, unknown>> {
  if (actionType === "action.webhook") {
    const url = String(config?.url || "");
    if (!url) throw new Error("Missing webhook url");

    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ context }),
    });

    return {
      status: res.status,
      ok: res.ok,
    };
  }

  if (actionType === "action.log") {
    return { logged: true, message: String(config?.message || "log") };
  }

  throw new Error(`Unsupported action type: ${actionType}`);
}