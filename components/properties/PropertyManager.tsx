"use client";

import { useEffect, useState } from "react";
import AddPropertyModal from "./AddPropertyModal";

type Property = {
  _id: string;
  databaseId: string;
  name: string;
  type: string;
  options?: string[];
};

export default function PropertyManager({ databaseId }: { databaseId: string }) {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);

  const fetchProps = async () => {
    setLoading(true);
    const res = await fetch(`/api/properties?databaseId=${databaseId}`);
    setProperties(await res.json());
    setLoading(false);
  };

  useEffect(() => {
    fetchProps();
  }, [databaseId]);

  const renameProperty = async (id: string, name: string) => {
    await fetch(`/api/properties/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });

    fetchProps();
  };

  const deleteProperty = async (id: string) => {
    if (!confirm("Delete this property?")) return;

    await fetch(`/api/properties/${id}`, { method: "DELETE" });
    fetchProps();
  };

  if (loading) return <div className="p-6 text-sm">Loading properties...</div>;

  return (
    <div className="rounded-xl border bg-white overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b bg-gray-50">
        <div className="font-semibold text-gray-800">Properties</div>

        <button
          onClick={() => setShowAdd(true)}
          className="text-sm px-3 py-1.5 rounded-lg bg-black text-white hover:bg-gray-900"
        >
          + Add property
        </button>
      </div>

      <div className="p-4 space-y-2">
        {properties.map((p) => (
          <div
            key={p._id}
            className="flex items-center justify-between px-3 py-2 rounded-lg border"
          >
            <div className="flex-1">
              <input
                defaultValue={p.name}
                onBlur={(e) => renameProperty(p._id, e.target.value)}
                className="w-full outline-none bg-transparent font-medium text-sm"
              />
              <div className="text-xs text-gray-500 mt-0.5">{p.type}</div>
            </div>

            <button
              onClick={() => deleteProperty(p._id)}
              className="text-xs px-2 py-1 rounded-md border hover:bg-gray-50"
            >
              Delete
            </button>
          </div>
        ))}

        {properties.length === 0 && (
          <div className="text-sm text-gray-400">No properties yet.</div>
        )}
      </div>

      <AddPropertyModal
        isOpen={showAdd}
        onClose={() => setShowAdd(false)}
        databaseId={databaseId}
        onSaved={fetchProps}
      />
    </div>
  );
}
