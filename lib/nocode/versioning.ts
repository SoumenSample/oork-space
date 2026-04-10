export function nextVersion(current: number | undefined | null): number {
  const safe = typeof current === "number" && Number.isFinite(current) ? current : 0;
  return safe + 1;
}