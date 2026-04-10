"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { SiteHeader } from "@/components/site-header";

const GrapesEditor = dynamic(() => import("@/components/nocode/grapes/GrapesEditor"), {
  ssr: false,
});

export default function NocodeBuilderPage() {
  const params = useParams();
  const pageId = useMemo(() => {
    const id = params?.pageId;
    return Array.isArray(id) ? id[0] : (id as string);
  }, [params]);

  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState<any>(null);

  useEffect(() => {
    if (!pageId) return;

    const load = async () => {
      try {
        const res = await fetch(`/api/nocode/pages/${pageId}`);
        const json = await res.json();
        setPage(json?.data || null);
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, [pageId]);

  if (loading) return <div>Loading builder...</div>;
  if (!page) return <div>Page not found</div>;

  return (
    <div className="flex min-h-full flex-col">
      <SiteHeader />
      <div style={{ padding: 12 }}>
        <GrapesEditor
          initialProjectData={page?.draft?.grapesProjectData}
          pageName={page?.name}
          pageSlug={page?.slug}
          appId={String(page?.appId || "")}
          onSave={async (draft) => {
            await fetch(`/api/nocode/pages/${pageId}`, {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ draft }),
            });
          }}
          onPublish={async () => {
            await fetch(`/api/nocode/pages/${pageId}/publish`, { method: "POST" });
            alert("Published");
          }}
        />
      </div>
    </div>
  );
}
