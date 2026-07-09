export function formatNumber(num: number): string {
  return num.toLocaleString('en-US');
}

export function formatCompact(num: number): string {
  if (!Number.isFinite(num) || num <= 0) return '0';
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
  if (num >= 1_000) return `${Math.round(num / 1_000)}K`;
  return String(Math.round(num));
}

export function formatCurrency(amount: number): string {
  if (amount >= 1000000) {
    return `$${(amount / 1000000).toFixed(1)}M`;
  } else if (amount >= 1000) {
    return `$${(amount / 1000).toFixed(0)}K`;
  }
  return `$${amount}`;
}

export function formatDuration(months: number): string {
  if (!Number.isFinite(months) || months <= 0) {
    return '0 mo';
  }

  if (months >= 12) {
    const years = months / 12;
    return years >= 10 ? `${Math.round(years)} yrs` : `${years.toFixed(1)} yrs`;
  }

  if (months < 1) {
    const weeks = Math.max(1, Math.round(months * 4.33));
    return `${weeks} wk${weeks === 1 ? '' : 's'}`;
  }

  return `${months.toFixed(1)} mo`;
}
