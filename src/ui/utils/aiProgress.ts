export function parseStepProgressFromStatus(status: string, existingProgress = 0): number {
  if (!status) return Math.max(5, Math.min(99, existingProgress || 10));
  const m = status.match(/Step\s+(\d+)\/(\d+)/i);
  if (m) {
    const curr = parseInt(m[1], 10);
    const total = parseInt(m[2], 10) || 1;
    const pct = Math.round((curr / total) * 100);
    return Math.max(5, Math.min(99, pct));
  }
  // generic keyword bumps
  if (/starting|queued/i.test(status)) return Math.max(existingProgress, 5);
  if (/analyzing|processing/i.test(status)) return Math.max(existingProgress, 20);
  if (/mixing|aligning/i.test(status)) return Math.max(existingProgress, 50);
  if (/master/i.test(status)) return Math.max(existingProgress, 70);
  return Math.max(5, Math.min(99, existingProgress || 10));
}

