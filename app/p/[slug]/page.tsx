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

  function parseAlertPreference(value) {
    const alertPref = String(value || 'true').toLowerCase();
    return alertPref !== 'false' && alertPref !== '0' && alertPref !== 'off';
  }

  function toSerializableValue(value) {
    if (value instanceof File) {
      return {
        name: value.name,
        size: value.size,
        type: value.type,
      };
    }

    return value;
  }

  function assignCollectedValue(target, key, value) {
    if (!Object.prototype.hasOwnProperty.call(target, key)) {
      target[key] = value;
      return;
    }

    const prev = target[key];
    if (Array.isArray(prev)) {
      prev.push(value);
      return;
    }

    target[key] = [prev, value];
  }

  function formDataToObject(fd) {
    const data = {};
    for (const [k, v] of fd.entries()) {
      assignCollectedValue(data, k, toSerializableValue(v));
    }
    return data;
  }

  function readStringField(data, key) {
    if (!data || typeof data !== 'object') return '';
    const raw = data[key];
    if (typeof raw === 'string') return raw.trim();
    if (raw === null || raw === undefined) return '';
    return String(raw).trim();
  }

  function normalizeAuthMode(rawMode) {
    const mode = String(rawMode || '').trim().toLowerCase();
    if (!mode) return '';

    if (mode === 'login' || mode === 'sign-in' || mode === 'signin') return 'login';
    if (mode === 'signup' || mode === 'sign-up' || mode === 'register') return 'signup';
    if (mode === 'verify-otp' || mode === 'verifyotp' || mode === 'otp') return 'verify-otp';

    return mode;
  }

  function getCurrentPublicSlug() {
    const path = String(window.location.pathname || '');
    if (!path.startsWith('/p/')) return '';

    const slugPart = path.slice(3).split('/')[0] || '';
    if (!slugPart) return '';

    try {
      return decodeURIComponent(slugPart);
    } catch {
      return slugPart;
    }
  }

  function resolveProjectAuthEndpoint(mode) {
    const slug = getCurrentPublicSlug();
    const base = '/api/public/auth/' + mode;
    if (!slug) return base;
    return base + '?slug=' + encodeURIComponent(slug);
  }

  function resolveAuthEndpoint(form, mode) {
    const configured = String(form.getAttribute('data-auth-endpoint') || '').trim();
    const projectEndpoint = resolveProjectAuthEndpoint(mode);

    if (!configured) return projectEndpoint;

    if (configured.startsWith('/api/public/auth/')) {
      return configured;
    }

    // On published builder pages, force auth traffic to project-scoped auth APIs.
    if (
      configured === '/api/auth/login'
      || configured === '/api/auth/signup'
      || configured === '/api/verify-otp'
      || configured.startsWith('/api/auth/')
    ) {
      return projectEndpoint;
    }

    return configured;
  }

  function normalizeRedirectTarget(value) {
    const configured = String(value || '').trim();
    if (!configured) return '';

    const normalizedConfigured = configured.toLowerCase();
    if (normalizedConfigured === '/login' || normalizedConfigured === '/signup') {
      return '';
    }

    return configured;
  }

  function resolveAuthRedirect(form, mode, result) {
    const configured = normalizeRedirectTarget(form.getAttribute('data-auth-redirect'));
    if (configured) return configured;

    // Avoid redirecting builder users into platform auth pages unless explicitly configured.
    return '';
  }

  function resolveWorkflowRedirect(primaryElement, fallbackElement) {
    const fromPrimaryWorkflow = normalizeRedirectTarget(primaryElement && primaryElement.getAttribute
      ? primaryElement.getAttribute('data-workflow-redirect')
      : '');
    if (fromPrimaryWorkflow) return fromPrimaryWorkflow;

    const fromPrimarySuccess = normalizeRedirectTarget(primaryElement && primaryElement.getAttribute
      ? primaryElement.getAttribute('data-success-redirect')
      : '');
    if (fromPrimarySuccess) return fromPrimarySuccess;

    const fromFallbackWorkflow = normalizeRedirectTarget(fallbackElement && fallbackElement.getAttribute
      ? fallbackElement.getAttribute('data-workflow-redirect')
      : '');
    if (fromFallbackWorkflow) return fromFallbackWorkflow;

    const fromFallbackSuccess = normalizeRedirectTarget(fallbackElement && fallbackElement.getAttribute
      ? fallbackElement.getAttribute('data-success-redirect')
      : '');
    if (fromFallbackSuccess) return fromFallbackSuccess;

    return '';
  }

  function resolveAuthPayload(form, mode, data) {
    const email = readStringField(data, 'email');
    const password = readStringField(data, 'password');
    const pageSlug = getCurrentPublicSlug();
    const databaseId = String(form.getAttribute('data-database-id') || '').trim();

    if (!databaseId) {
      throw new Error('Auth form is not linked to a table. In builder, select this form and bind the User table first.');
    }

    if (mode === 'login') {
      if (!email || !password) {
        throw new Error('Email and password are required.');
      }

      return {
        email,
        password,
        pageSlug,
        ...(databaseId ? { databaseId } : {}),
      };
    }

    if (mode === 'signup') {
      const name = readStringField(data, 'name');
      if (!name || !email || !password) {
        throw new Error('Name, email, and password are required.');
      }

      return {
        name,
        email,
        password,
        pageSlug,
        ...(databaseId ? { databaseId } : {}),
      };
    }

    if (mode === 'verify-otp') {
      const otp = readStringField(data, 'otp') || readStringField(data, 'code');
      if (!email || !otp) {
        throw new Error('Email and OTP are required.');
      }

      return {
        email,
        otp,
        pageSlug,
        ...(databaseId ? { databaseId } : {}),
      };
    }

    throw new Error('Unsupported auth form mode. Use login, signup, or verify-otp.');
  }

  async function submitAuthForm(form) {
    const mode = normalizeAuthMode(form.getAttribute('data-auth-form'));
    const shouldAlert = parseAlertPreference(form.getAttribute('data-auth-alert') || 'true');

    if (mode !== 'login' && mode !== 'signup' && mode !== 'verify-otp') {
      if (shouldAlert) {
        showNotification('Unsupported auth form mode. Use login, signup, or verify-otp.', 'error');
      }
      return;
    }

    const endpoint = resolveAuthEndpoint(form, mode);
    const submitButton = form.querySelector('button[type="submit"], input[type="submit"]');
    let originalButtonText = '';
    const buttonLoadingText = mode === 'login'
      ? 'Signing in...'
      : (mode === 'signup' ? 'Creating account...' : 'Verifying...');

    if (submitButton) {
      if (submitButton instanceof HTMLButtonElement) {
        originalButtonText = submitButton.textContent || '';
        submitButton.textContent = buttonLoadingText;
        submitButton.disabled = true;
      } else if (submitButton instanceof HTMLInputElement) {
        originalButtonText = submitButton.value || '';
        submitButton.value = buttonLoadingText;
        submitButton.disabled = true;
      }
    }

    try {
      const data = formDataToObject(new FormData(form));
      const payload = resolveAuthPayload(form, mode, data);

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
      });

      const result = await res.json().catch(() => ({}));
      if (!res.ok) {
        const message = String(result?.message || result?.error || 'Authentication request failed');
        throw new Error(message);
      }

      if (shouldAlert) {
        const successMessage = mode === 'signup'
          ? String(result?.message || 'Account created successfully.')
          : (mode === 'verify-otp'
            ? String(result?.message || 'OTP verified successfully.')
            : String(result?.message || 'Signed in successfully.'));
        showNotification(successMessage, 'success');
      }

      const redirectTarget = resolveAuthRedirect(form, mode, result);
      if (redirectTarget) {
        setTimeout(() => {
          window.location.assign(redirectTarget);
        }, shouldAlert ? 450 : 0);
      }
    } catch (err) {
      if (shouldAlert) {
        const message = err && err.message ? err.message : 'Authentication request failed';
        showNotification(message, 'error');
      }
    } finally {
      if (submitButton) {
        if (submitButton instanceof HTMLButtonElement) {
          submitButton.disabled = false;
          if (originalButtonText) submitButton.textContent = originalButtonText;
        } else if (submitButton instanceof HTMLInputElement) {
          submitButton.disabled = false;
          if (originalButtonText) submitButton.value = originalButtonText;
        }
      }
    }
  }

  async function triggerWorkflowExecution(params) {
    const appId = String(params.appId || '');
    const workflowKey = String(params.workflowKey || '');
    const databaseId = String(params.databaseId || '');
    const shouldAlert = Boolean(params.shouldAlert);
    const redirectTarget = String(params.redirectTarget || '').trim();
    const formData = params.formData || {};

    try {
      const res = await fetch('/api/nocode/trigger/form-submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ appId, workflowKey, databaseId, formData })
      });

      const result = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(result?.error || 'Workflow trigger failed');
      }

      const runId = result?.runId;
      const shouldWaitForRunResult = Boolean(runId) && (shouldAlert || Boolean(redirectTarget));
      const run = shouldWaitForRunResult ? await pollRunResult(runId) : null;

      if (run) {
        const logMessages = extractLogMessages(run);
        for (const msg of logMessages) {
          console.info('[workflow:action.log]', msg);
        }
      }

      if (shouldAlert && runId) {
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

      if (redirectTarget) {
        const canRedirect = runId ? Boolean(run && run.status === 'success') : true;
        if (canRedirect) {
          setTimeout(() => {
            window.location.assign(redirectTarget);
          }, shouldAlert ? 450 : 0);
        }
      }
    } catch (err) {
      if (shouldAlert) {
        const msg = err && err.message ? err.message : 'Workflow trigger failed';
        showNotification(msg, 'error');
      }
    }
  }

  function resolveStandaloneScope(triggerElement) {
    const explicitSelector = String(triggerElement.getAttribute('data-workflow-scope') || '').trim();
    if (explicitSelector && explicitSelector !== 'true') {
      const explicitScope = document.querySelector(explicitSelector);
      if (explicitScope) return explicitScope;
    }

    const nearestScope = triggerElement.closest('[data-workflow-scope]');
    if (nearestScope) return nearestScope;

    return document.body;
  }

  function resolveFieldKey(field, index) {
    const explicit = String(field.getAttribute('data-field-key') || '').trim();
    if (explicit) return explicit;

    const name = String(field.getAttribute('name') || '').trim();
    if (name) return name;

    const id = String(field.getAttribute('id') || '').trim();
    if (id) return id;

    return 'field_' + index;
  }

  function collectStandalonePayload(scope) {
    const data = {};
    const fields = Array.from(scope.querySelectorAll('input, textarea, select'));

    for (let i = 0; i < fields.length; i += 1) {
      const field = fields[i];
      const key = resolveFieldKey(field, i);
      if (!key) continue;

      if (field instanceof HTMLInputElement) {
        const type = String(field.type || 'text').toLowerCase();

        if (type === 'radio') {
          if (!field.checked) continue;
          assignCollectedValue(data, key, field.value);
          continue;
        }

        if (type === 'checkbox') {
          assignCollectedValue(data, key, Boolean(field.checked));
          continue;
        }

        if (type === 'file') {
          const files = Array.from(field.files || []);
          if (!files.length) {
            assignCollectedValue(data, key, null);
            continue;
          }

          if (files.length === 1) {
            assignCollectedValue(data, key, toSerializableValue(files[0]));
            continue;
          }

          assignCollectedValue(data, key, files.map((file) => toSerializableValue(file)));
          continue;
        }

        assignCollectedValue(data, key, field.value);
        continue;
      }

      if (field instanceof HTMLSelectElement) {
        if (field.multiple) {
          const values = Array.from(field.selectedOptions || []).map((opt) => opt.value);
          assignCollectedValue(data, key, values);
        } else {
          assignCollectedValue(data, key, field.value);
        }
        continue;
      }

      if (field instanceof HTMLTextAreaElement) {
        assignCollectedValue(data, key, field.value);
      }
    }

    return data;
  }

  async function onSubmit(e) {
    const form = e.target;
    if (!form || form.tagName !== 'FORM') return;

    if (form.matches('form[data-auth-form]')) {
      e.preventDefault();
      await submitAuthForm(form);
      return;
    }

    if (!form.matches('form[data-workflow-key]')) return;
    e.preventDefault();

    const workflowKey = form.getAttribute('data-workflow-key') || '';
    const appId = form.getAttribute('data-app-id') || '';
    const databaseId = form.getAttribute('data-database-id') || '';
    const shouldAlert = parseAlertPreference(form.getAttribute('data-workflow-alert'));
    const redirectTarget = resolveWorkflowRedirect(form, null);
    const data = formDataToObject(new FormData(form));

    await triggerWorkflowExecution({ appId, workflowKey, databaseId, shouldAlert, redirectTarget, formData: data });
  }

  async function onStandaloneTriggerClick(e) {
    const target = e.target;
    if (!target || typeof target.closest !== 'function') return;

    const trigger = target.closest('[data-workflow-submit]');
    if (!trigger) return;

    if (trigger.closest('form[data-workflow-key]')) return;

    e.preventDefault();

    const scope = resolveStandaloneScope(trigger);

    const workflowKey = String(
      trigger.getAttribute('data-workflow-key')
      || (scope.getAttribute ? scope.getAttribute('data-workflow-key') : '')
      || ''
    ).trim();

    const appId = String(
      trigger.getAttribute('data-app-id')
      || (scope.getAttribute ? scope.getAttribute('data-app-id') : '')
      || ''
    ).trim();

    const databaseId = String(
      trigger.getAttribute('data-database-id')
      || (scope.getAttribute ? scope.getAttribute('data-database-id') : '')
      || ''
    ).trim();

    const shouldAlert = parseAlertPreference(
      trigger.getAttribute('data-workflow-alert')
      || (scope.getAttribute ? scope.getAttribute('data-workflow-alert') : 'true')
    );
    const redirectTarget = resolveWorkflowRedirect(trigger, scope);

    if (!workflowKey || !appId) {
      if (shouldAlert) {
        showNotification('Missing workflowKey or appId on standalone workflow trigger', 'error');
      }
      return;
    }

    const data = collectStandalonePayload(scope);
    await triggerWorkflowExecution({ appId, workflowKey, databaseId, shouldAlert, redirectTarget, formData: data });
  }

  document.addEventListener('submit', onSubmit);
  document.addEventListener('click', onStandaloneTriggerClick);
})();

${js}
`,
        }}
      />
    </main>
  );
}