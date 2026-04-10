export function normalizeSlug(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export function uniqueSlug(name: string): string {
  const base = normalizeSlug(name || "untitled");
  const suffix = Math.random().toString(36).slice(2, 8);
  return `${base || "page"}-${suffix}`;
}