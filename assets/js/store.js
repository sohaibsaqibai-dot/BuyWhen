// Storage model. The background service worker is the only writer;
// popup and dashboard read directly and send change requests as messages.

export const DEFAULT_SETTINGS = {
  checkEveryHours: 6,
  notifyOnTarget: true,
  notifyOnDrop: true,
  dropPercent: 5,
  googlePanel: true,
  panelStart: 'open',
  defaultTargetPct: 10
};

export const MAX_HISTORY = 500;

const TRACKING_PARAMS = /^(utm_|ref$|ref_|tag$|gclid$|fbclid$|msclkid$|_encoding$|psc$|pd_rd|pf_rd|content-id$|smid$|spm$|srsltid$|sprefix$|crid$|qid$|sr$|keywords$|dib)/i;

/** Normalise a product URL so the same product always maps to one record. */
export function normalizeUrl(raw) {
  if (!raw) return '';
  let u;
  try { u = new URL(raw); } catch (_) { return raw; }
  u.hash = '';
  // Amazon: every product lives at /dp/ASIN regardless of slug or params.
  const asin = u.hostname.includes('amazon.') && u.pathname.match(/\/(?:dp|gp\/product)\/([A-Z0-9]{10})/i);
  if (asin) return `${u.protocol}//${u.hostname}/dp/${asin[1].toUpperCase()}`;
  for (const key of [...u.searchParams.keys()]) {
    if (TRACKING_PARAMS.test(key)) u.searchParams.delete(key);
  }
  u.searchParams.sort();
  let s = u.toString();
  if (s.endsWith('?')) s = s.slice(0, -1);
  return s;
}

/** Stable short id from the normalised URL (FNV-1a). */
export function productId(url) {
  const s = normalizeUrl(url || '');
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return 'p' + (h >>> 0).toString(36);
}

export function originPattern(url) {
  try { return new URL(url).origin + '/*'; } catch (_) { return null; }
}

export async function loadState() {
  const { products = {}, settings = {} } = await chrome.storage.local.get(['products', 'settings']);
  return { products, settings: { ...DEFAULT_SETTINGS, ...settings } };
}

export async function saveProducts(products) {
  await chrome.storage.local.set({ products });
}

export async function saveSettings(settings) {
  await chrome.storage.local.set({ settings });
}

/**
 * Record a price observation. Adds a history point when the price changed,
 * or when the last point is older than 12 hours (so flat prices still build history).
 */
export function recordPrice(product, price, at = Date.now()) {
  const history = product.history || (product.history = []);
  const last = history[history.length - 1];
  if (!last || last.p !== price || at - last.t > 12 * 3600 * 1000) {
    history.push({ t: at, p: price });
    if (history.length > MAX_HISTORY) history.splice(0, history.length - MAX_HISTORY);
  }
  product.previousPrice = product.currentPrice ?? null;
  product.currentPrice = price;
  product.lastChecked = at;
  product.lastError = null;
  return product;
}

export function sortedProducts(products) {
  return Object.values(products).sort((a, b) => (b.addedAt || 0) - (a.addedAt || 0));
}
