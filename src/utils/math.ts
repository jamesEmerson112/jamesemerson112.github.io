export function clampPercent(value: unknown): number {
  const safe = Number.isFinite(Number(value)) ? Number(value) : 0;
  return Math.max(0, Math.min(100, safe));
}
