import { notFound } from "next/navigation";
import connectDB from "@/lib/dbConnect";
import NocodePage from "@/lib/models/NocodePage";
import { safeCss, safeHtml } from "@/lib/nocode/renderer";

export default async function PublicPage({ params }: { params: Promise<{ slug: string }> }) {
  await connectDB();
  const { slug } = await params;

  const page = await NocodePage.findOne({ slug, status: "published" });
  if (!page) {
    notFound();
  }

  const html = safeHtml(page.published?.html || "");
  const css = safeCss(page.published?.css || "");

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
`,
      }}
    />
  </main>
);
}