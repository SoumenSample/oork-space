import connectDB from "@/lib/dbConnect";
import Database from "@/lib/models/Database";
import DatabaseItem from "@/lib/models/DatabaseItem";
import DatabaseProperty from "@/lib/models/DatabaseProperty";
import NocodeApp from "@/lib/models/NocodeApp";

function getString(value: unknown, fallback = ""): string {
  const str = String(value ?? "").trim();
  return str || fallback;
}

function getTriggerPayload(context: Record<string, unknown>): Record<string, unknown> {
  const trigger = context?.trigger;
  if (!trigger || typeof trigger !== "object") return {};
  return trigger as Record<string, unknown>;
}

function pickPayloadValue(
  payload: Record<string, unknown>,
  configuredKey: unknown,
  fallbackKey: string
): unknown {
  const key = getString(configuredKey, fallbackKey);
  return payload[key];
}

function normalizeLookupKey(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "");
}

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
    const message = String(config?.message || "log");
    console.log(`[workflow:action.log] ${message}`);
    return { logged: true, message };
  }

  if (actionType === "action.alert") {
    return {
      alert: true,
      message: String(config?.message || "Workflow test alert"),
    };
  }

  if (actionType === "action.dbInsert") {
    await connectDB();

    const payload = getTriggerPayload(context);
    const configuredDatabaseId = getString(config?.databaseId || "");
    const payloadDatabaseId = getString(payload.__databaseId || "");
    let databaseId = configuredDatabaseId || payloadDatabaseId;

    const appId = getString(context?.appId || "");
    let appProjectId = "";
    if (appId) {
      const app = await NocodeApp.findById(appId).select("_id projectId defaultDatabaseId");
      if (!app) {
        throw new Error("App not found for action.dbInsert");
      }

      appProjectId = String(app.projectId || "");
      const appDefaultDatabaseId = getString(app.defaultDatabaseId || "");
      if (!databaseId) {
        databaseId = appDefaultDatabaseId;
      }
    }

    if (!databaseId) {
      throw new Error("Missing databaseId for action.dbInsert");
    }

    const database = await Database.findById(databaseId).select("_id projectId ownerId");
    if (!database) {
      throw new Error("Database not found for action.dbInsert");
    }

    if (appProjectId && appProjectId !== String(database.projectId || "")) {
      throw new Error("Selected database is outside app project scope");
    }

    const properties = await DatabaseProperty.find({ databaseId })
      .select("_id name")
      .lean();

    const propertyIdByLookup = new Map<string, string>();
    properties.forEach((property: any) => {
      const propertyId = getString(property?._id || "");
      const propertyName = getString(property?.name || "");
      const lookupKey = normalizeLookupKey(propertyName);
      if (propertyId && lookupKey && !propertyIdByLookup.has(lookupKey)) {
        propertyIdByLookup.set(lookupKey, propertyId);
      }
    });

    const payloadWithoutMeta = Object.fromEntries(
      Object.entries(payload).filter(([key]) => !key.startsWith("__"))
    );

    const title = getString(
      pickPayloadValue(payload, config?.titleField, "title"),
      "Form submission"
    );
    const description = getString(
      pickPayloadValue(payload, config?.descriptionField, "description")
    );
    const email = getString(pickPayloadValue(payload, config?.emailField, "email"));
    const fromDate = getString(pickPayloadValue(payload, config?.fromDateField, "fromDate"));
    const toDate = getString(pickPayloadValue(payload, config?.toDateField, "toDate"));

    const milestonesValue = pickPayloadValue(payload, config?.milestonesField, "milestones");
    const milestones = Array.isArray(milestonesValue) ? milestonesValue : [];

    const values: Record<string, unknown> = {
      ...payloadWithoutMeta,
      title,
      description,
      email,
      assignee: email,
      fromDate,
      toDate,
      milestones,
      Status: getString(config?.statusValue, "To Do"),
      progress: 0,
    };

    Object.entries({ ...values }).forEach(([key, value]) => {
      const propertyId = propertyIdByLookup.get(normalizeLookupKey(key));
      if (propertyId && values[propertyId] === undefined) {
        values[propertyId] = value;
      }
    });

    const ownerId = getString(database.ownerId || context?.userId || "");

    const created = await DatabaseItem.create({
      ownerId,
      databaseId,
      values,
    });

    const createdAtDate = created?.createdAt ? new Date(created.createdAt) : new Date();
    const createdAtIso = Number.isNaN(createdAtDate.getTime())
      ? new Date().toISOString()
      : createdAtDate.toISOString();
    const createdAtDateOnly = createdAtIso.slice(0, 10);

    const systemValues: Record<string, unknown> = {
      id: String(created._id),
      dateCreated: createdAtDateOnly,
    };

    const valuesPatch: Record<string, unknown> = {};
    Object.entries(systemValues).forEach(([key, value]) => {
      valuesPatch[`values.${key}`] = value;
      const propertyId = propertyIdByLookup.get(normalizeLookupKey(key));
      if (propertyId) {
        valuesPatch[`values.${propertyId}`] = value;
      }
    });

    if (Object.keys(valuesPatch).length) {
      await DatabaseItem.updateOne(
        { _id: created._id },
        { $set: valuesPatch }
      );
    }

    return {
      inserted: true,
      databaseId,
      itemId: String(created._id),
      ownerId,
    };
  }

  throw new Error(`Unsupported action type: ${actionType}`);
}