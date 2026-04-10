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
        const res = await fetch(`/api/nocode/pages/${pageId}`, { cache: "no-store" });
        if (!res.ok) {
          throw new Error(`Failed to load page (${res.status})`);
        }
        const json = await res.json();
        if (!json?.success) {
          throw new Error("Failed to load page data");
        }
        setPage(json?.data || null);
      } catch {
        setPage(null);
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
          pageId={pageId}
          initialProjectData={page?.draft?.grapesProjectData}
          initialHtml={page?.draft?.html}
          initialCss={page?.draft?.css}
          initialSeo={page?.draft?.seo}
          pageUpdatedAt={page?.updatedAt}
          pageName={page?.name}
          pageSlug={page?.slug}
          appId={String(page?.appId || "")}
          onSave={async (draft) => {
            const res = await fetch(`/api/nocode/pages/${pageId}`, {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ draft }),
            });

            if (!res.ok) {
              throw new Error(`Failed to save draft (${res.status})`);
            }

            const json = await res.json();
            if (!json?.success) {
              throw new Error("Failed to save draft");
            }
          }}
          onPublish={async () => {
            const res = await fetch(`/api/nocode/pages/${pageId}/publish`, { method: "POST" });
            if (!res.ok) {
              throw new Error(`Failed to publish page (${res.status})`);
            }

            const json = await res.json();
            if (!json?.success) {
              throw new Error("Failed to publish page");
            }
            alert("Published");
          }}
        />
      </div>
    </div>
  );
}
