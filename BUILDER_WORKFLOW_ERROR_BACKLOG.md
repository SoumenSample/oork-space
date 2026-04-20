# Builder + Workflow Error Backlog

Last updated: 2026-04-17

## Saved Error Dumps

- Full lint output: `reports/lint-errors-later.txt`
- Source command used: `npm run lint`
- Result snapshot: `491 problems (299 errors, 192 warnings)`

## Runtime/Environment Issues To Fix Later

1. Dev server lock conflict
- Symptom: `Unable to acquire lock at .next/dev/lock`
- Cause: another `next dev` process already running (port 3000 already in use)
- Action later: stop old process, clear lock if needed, restart dev cleanly.

2. Workspace root/lockfile warning
- Next is detecting multiple lockfiles and inferring root from `C:\Users\User\package-lock.json`.
- Action later: set `turbopack.root` in Next config or remove extra lockfile confusion.

## Builder + Workflow Functional Gaps

1. Public workflow run polling vs auth mismatch
- Public page polls run status from `/api/nocode/runs/:id`.
- Runs endpoints require authenticated user.
- Files:
  - `app/p/[slug]/page.tsx`
  - `app/api/nocode/runs/[id]/route.ts`
  - `app/api/nocode/runs/route.ts`
- Impact: public users can trigger runs but status/notification feedback can fail with 401.

2. Form-submit trigger security hardening
- `form-submit` trigger endpoint currently accepts requests without auth/secret checks.
- File:
  - `app/api/nocode/trigger/form-submit/route.ts`
- Action later: add rate limits + optional signed token/secret strategy.

3. In-process workflow execution
- Trigger endpoints execute workflow directly in request lifecycle (MVP path).
- Files:
  - `app/api/nocode/trigger/form-submit/route.ts`
  - `app/api/nocode/trigger/webhook/[workflowKey]/route.ts`
- Action later: move execution to queue worker for reliability and scaling.

4. File upload payload behavior
- Public page converts `File` to metadata object only (name/size/type) before trigger payload send.
- File:
  - `app/p/[slug]/page.tsx`
- Action later: define real upload pipeline (storage + URL references).

5. Sanitizer attribute coverage
- Sanitizer allowlist may be too narrow for some form/file attributes.
- File:
  - `lib/nocode/renderer.ts`
- Action later: validate needed attributes (`accept`, `multiple`, extra workflow attrs) and update safely.

## Builder-Specific Lint Debt

- `components/nocode/grapes/GrapesEditor.tsx` has multiple `no-explicit-any` errors and hook dependency warnings.
- These are not blocking `next build` right now, but should be cleaned to reduce regression risk.

## Recommended Resume Order

1. Fix public run polling/auth path (so notifications become reliable).
2. Add form-submit endpoint protection (rate-limit + token/secret).
3. Move run execution to queued worker.
4. Finalize file upload pipeline for workflow payloads.
5. Tackle lint debt in builder/workflow modules.
