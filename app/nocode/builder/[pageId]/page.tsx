"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { SiteHeader } from "@/components/site-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

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

  if (loading) {
    return (
      <div className="flex min-h-full flex-col bg-background text-foreground">
        <SiteHeader />
        <section className="mx-auto w-full max-w-6xl px-4 py-6 md:px-6 md:py-8">
          <Card>
            <CardContent className="p-8 text-center text-muted-foreground">Loading builder...</CardContent>
          </Card>
        </section>
      </div>
    );
  }

  if (!page) {
    return (
      <div className="flex min-h-full flex-col bg-background text-foreground">
        <SiteHeader />
        <section className="mx-auto w-full max-w-6xl px-4 py-6 md:px-6 md:py-8">
          <Card>
            <CardContent className="p-8 text-center text-muted-foreground">Page not found</CardContent>
          </Card>
        </section>
      </div>
    );
  }

  return (
    <div className="flex min-h-full flex-col bg-background text-foreground">
      <SiteHeader />
      <section className="mx-auto w-full max-w-[1500px] px-3 py-3 md:px-4 md:py-4">
        <Card className="mb-3 py-0">
          <CardHeader className="border-b border-border/60 pb-4">
            <CardTitle className="text-xl md:text-2xl">{page?.name || "Page Builder"}</CardTitle>
            <CardDescription>Design, edit, and publish this page from the visual editor.</CardDescription>
          </CardHeader>
        </Card>
        <GrapesEditor
          pageId={pageId}
          initialProjectData={page?.draft?.grapesProjectData}
          initialHtml={page?.draft?.html}
          initialCss={page?.draft?.css}
          initialSeo={page?.draft?.seo}
          initialRuntime={page?.draft?.runtime}
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
          }}
        />
      </section>
    </div>
  );
}
