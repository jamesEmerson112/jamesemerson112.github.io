export function formatNumber(num: number): string {
  return num.toLocaleString('en-US');
}

export function formatCurrency(amount: number): string {
  if (amount >= 1000000) {
    return `$${(amount / 1000000).toFixed(1)}M`;
  } else if (amount >= 1000) {
    return `$${(amount / 1000).toFixed(0)}K`;
  }
  return `$${amount}`;
}

export function formatYears(years: number): string {
  if (years >= 1) {
    return `${Math.round(years)} year${years !== 1 ? 's' : ''}`;
  }
  const months = Math.round(years * 12);
  return `${months} month${months !== 1 ? 's' : ''}`;
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
