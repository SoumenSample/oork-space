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
  function showNotification(message, type = 'success') {
    const container = document.getElementById('workflow-notification-container');
    if (!container) {
      const newContainer = document.createElement('div');
      newContainer.id = 'workflow-notification-container';
      newContainer.style.cssText = 'position: fixed; top: 20px; right: 20px; z-index: 9999; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;';
      document.body.appendChild(newContainer);
    }

    const notif = document.createElement('div');
    notif.style.cssText = 'padding: 16px 20px; margin-bottom: 10px; border-radius: 8px; font-size: 14px; animation: slideIn 0.3s ease-out; box-shadow: 0 4px 12px rgba(0,0,0,0.15);';
    
    if (type === 'success') {
      notif.style.cssText += 'background-color: #10b981; color: white; border-left: 4px solid #059669;';
    } else {
      notif.style.cssText += 'background-color: #ef4444; color: white; border-left: 4px solid #dc2626;';
    }
    
    notif.textContent = message;
    document.getElementById('workflow-notification-container').appendChild(notif);

    setTimeout(() => {
      notif.style.animation = 'slideOut 0.3s ease-out forwards';
      setTimeout(() => notif.remove(), 300);
    }, 4000);
  }

  if (!document.querySelector('style[data-notification-animations]')) {
    const style = document.createElement('style');
    style.setAttribute('data-notification-animations', 'true');
    style.textContent = '@keyframes slideIn { from { transform: translateX(400px); opacity: 0; } to { transform: translateX(0); opacity: 1; } } @keyframes slideOut { to { transform: translateX(400px); opacity: 0; } }';
    document.head.appendChild(style);
  }

  async function pollRunResult(runId, maxAttempts = 30) {
    let attempts = 0;
    while (attempts < maxAttempts) {
      try {
        const res = await fetch('/api/nocode/runs/' + runId);
        if (!res.ok) {
          await new Promise(r => setTimeout(r, 500));
          attempts++;
          continue;
        }
        const apiResult = await res.json();
        const run = apiResult.data;
        if (run.status === 'running' || run.status === 'queued') {
          await new Promise(r => setTimeout(r, 500));
          attempts++;
          continue;
        }
        return run;
      } catch {
        await new Promise(r => setTimeout(r, 500));
        attempts++;
      }
    }
    return null;
  }

  function extractAlertMessage(run) {
    if (!run || !run.stepLogs || !Array.isArray(run.stepLogs)) return null;

    // Runtime stores concrete node types like "action.alert" and "action.log".
    // Prefer alert message; fall back to log message if alert did not run.
    const alertStep = run.stepLogs.find((step) => (
      step
      && step.status === 'success'
      && String(step.nodeType || '').startsWith('action.alert')
      && step.output
      && typeof step.output.message === 'string'
      && step.output.message.trim().length > 0
    ));
    if (alertStep) return alertStep.output.message;

    const logStep = run.stepLogs.find((step) => (
      step
      && step.status === 'success'
      && String(step.nodeType || '').startsWith('action.log')
      && step.output
      && typeof step.output.message === 'string'
      && step.output.message.trim().length > 0
    ));
    if (logStep) return logStep.output.message;

    return null;
  }

  function extractLogMessages(run) {
    if (!run || !run.stepLogs || !Array.isArray(run.stepLogs)) return [];

    return run.stepLogs
      .filter((step) => (
        step
        && step.status === 'success'
        && String(step.nodeType || '').startsWith('action.log')
        && step.output
        && typeof step.output.message === 'string'
        && step.output.message.trim().length > 0
      ))
      .map((step) => step.output.message);
  }

  function extractRunFailureReason(run) {
    if (!run || typeof run !== 'object') return '';

    const runError = typeof run.error === 'string' ? run.error.trim() : '';
    if (runError) return runError;

    if (!Array.isArray(run.stepLogs)) return '';
    const failedStep = run.stepLogs.find((step) => (
      step
      && step.status === 'failed'
      && typeof step.error === 'string'
      && step.error.trim().length > 0
    ));

    if (!failedStep) return '';
    const nodeType = String(failedStep.nodeType || failedStep.nodeId || 'step');
    return nodeType + ': ' + failedStep.error.trim();
  }

  async function onSubmit(e) {
    const form = e.target;
    if (!form || !form.matches('form[data-workflow-key]')) return;
    e.preventDefault();

    const workflowKey = form.getAttribute('data-workflow-key') || '';
    const appId = form.getAttribute('data-app-id') || '';
    const alertPref = (form.getAttribute('data-workflow-alert') || 'true').toLowerCase();
    const shouldAlert = alertPref !== 'false' && alertPref !== '0' && alertPref !== 'off';

    const data = {};
    const fd = new FormData(form);
    for (const [k, v] of fd.entries()) data[k] = v;

    try {
      const res = await fetch('/api/nocode/trigger/form-submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ appId, workflowKey, formData: data })
      });

      const result = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(result?.error || 'Workflow trigger failed');
      }

      const runId = result?.runId;
      if (shouldAlert && runId) {
        const run = await pollRunResult(runId);
        const logMessages = run ? extractLogMessages(run) : [];
        for (const msg of logMessages) {
          console.info('[workflow:action.log]', msg);
        }

        const alertMsg = run ? extractAlertMessage(run) : null;
        
        if (alertMsg) {
          const alertType = run.status === 'success' ? 'success' : 'error';
          showNotification(alertMsg, alertType);
        } else {
          const isFailed = run && run.status === 'failed';
          const statusText = run ? (run.status === 'success' ? 'completed' : run.status) : 'triggered';
          const failureReason = isFailed ? extractRunFailureReason(run) : '';
          const details = failureReason ? ' - ' + failureReason : '';
          showNotification(
            'Workflow ' + statusText + details + ' (Run: ' + runId + ')',
            isFailed ? 'error' : 'success'
          );
        }
      }
    } catch (err) {
      if (shouldAlert) {
        const msg = err && err.message ? err.message : 'Workflow trigger failed';
        showNotification(msg, 'error');
      }
    }
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