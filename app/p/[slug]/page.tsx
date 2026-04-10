import { notFound } from "next/navigation";
import type { Metadata } from "next";
import connectDB from "@/lib/dbConnect";
import NocodePage from "@/lib/models/NocodePage";
import { safeCss, safeHtml } from "@/lib/nocode/renderer";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  await connectDB();
  const { slug } = await params;

  const page = await NocodePage.findOne({ slug, status: "published" }).lean<any>();
  const seo = page?.published?.seo || {};

  const title = String(seo?.title || page?.name || "Page");
  const description = String(seo?.description || "");
  const ogTitle = String(seo?.ogTitle || title);
  const ogDescription = String(seo?.ogDescription || description);
  const ogImage = String(seo?.ogImage || "");

  return {
    title,
    description,
    openGraph: {
      title: ogTitle,
      description: ogDescription,
      images: ogImage ? [{ url: ogImage }] : undefined,
      type: "website",
    },
  };
}

export default async function PublicPage({ params }: { params: Promise<{ slug: string }> }) {
  await connectDB();
  const { slug } = await params;

  const page = await NocodePage.findOne({ slug, status: "published" });
  if (!page) {
    notFound();
  }

  const html = safeHtml(page.published?.html || "");
  const css = safeCss(page.published?.css || "");
  const js = String(page.published?.js || "");

  return (
    <main>
      <style dangerouslySetInnerHTML={{ __html: css }} />
      <div dangerouslySetInnerHTML={{ __html: html }} />

      <script
        dangerouslySetInnerHTML={{
          __html: `
(function () {
  async function onSubmit(e) {
    const form = e.target;
    if (!form || !form.matches('form[data-workflow-key]')) return;
    e.preventDefault();

    const workflowKey = form.getAttribute('data-workflow-key') || '';
    const appId = form.getAttribute('data-app-id') || '';

    const data = {};
    const fd = new FormData(form);
    for (const [k, v] of fd.entries()) data[k] = v;

    await fetch('/api/nocode/trigger/form-submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ appId, workflowKey, formData: data })
    });
  }

  document.addEventListener('submit', onSubmit);
})();

${js}
`,
        }}
      />
    </main>
  );
}