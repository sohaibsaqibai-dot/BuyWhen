// Formatting helpers shared by popup, dashboard and background.

export function formatPrice(value, currency) {
  if (value == null || !Number.isFinite(value)) return '—';
  if (currency && /^[A-Z]{3}$/.test(currency)) {
    try {
      return new Intl.NumberFormat(undefined, {
        style: 'currency',
        currency,
        currencyDisplay: 'narrowSymbol',
        maximumFractionDigits: value >= 1000 ? 0 : 2
      }).format(value);
    } catch (_) { /* unknown code, fall through */ }
  }
  const n = new Intl.NumberFormat(undefined, { maximumFractionDigits: 2 }).format(value);
  return currency ? `${currency} ${n}` : n;
}

export function formatPercent(fraction) {
  return `${Math.round(Math.abs(fraction) * 100)}%`;
}

export function timeAgo(ts) {
  if (!ts) return 'never';
  const s = Math.round((Date.now() - ts) / 1000);
  if (s < 60) return 'just now';
  const m = Math.round(s / 60);
  if (m < 60) return `${m} min ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h} h ago`;
  const d = Math.round(h / 24);
  return `${d} day${d === 1 ? '' : 's'} ago`;
}

export function hostOf(url) {
  try { return new URL(url).hostname.replace(/^www\./, ''); } catch (_) { return ''; }
}

export function escapeHtml(s) {
  return String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
