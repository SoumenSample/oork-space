"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { SiteHeader } from "@/components/site-header";

export default function NocodeAppsPage() {
  const router = useRouter();
  const [apps, setApps] = useState<any[]>([]);
  const [name, setName] = useState("My App");
  const [creatingPageFor, setCreatingPageFor] = useState<string | null>(null);

  const load = async () => {
    const res = await fetch("/api/nocode/apps");
    const json = await res.json();
    setApps(json?.data || []);
  };

  useEffect(() => {
    void load();
  }, []);

  const createPageAndOpenBuilder = async (appId: string, appName: string) => {
    try {
      setCreatingPageFor(appId);
      const res = await fetch("/api/nocode/pages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ appId, name: `${appName} Home` }),
      });

      const json = await res.json();
      const pageId = json?.data?._id;

      if (pageId) {
        router.push(`/nocode/builder/${pageId}`);
      }
    } finally {
      setCreatingPageFor(null);
    }
  };

  return (
    <main className="flex min-h-full flex-col">
      <SiteHeader />

      <div style={{ padding: 16 }}>
        <h1>No-code Apps</h1>

        <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
          <input value={name} onChange={(e) => setName(e.target.value)} />
          <button
            onClick={async () => {
              await fetch("/api/nocode/apps", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name }),
              });
              await load();
            }}
          >
            Create App
          </button>
        </div>

        <ul>
          {apps.map((a) => (
            <li key={a._id} style={{ marginBottom: 12 }}>
              <div>
                {a.name} ({a.key})
              </div>
              <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                <button
                  onClick={() => void createPageAndOpenBuilder(a._id, a.name)}
                  disabled={creatingPageFor === a._id}
                >
                  {creatingPageFor === a._id ? "Creating..." : "Create Page + Open Builder"}
                </button>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </main>
  );
}