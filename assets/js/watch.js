// Web watchlist storage (this browser only). Records use the same shape as the
// extension's products, so an export can be imported into BuyWhen directly.
import { normalizeUrl, productId, recordPrice } from './store.js';

const KEY = 'bw.watchlist';

export function loadList() {
  try { return JSON.parse(localStorage.getItem(KEY) || '{}') || {}; } catch (_) { return {}; }
}
export function saveList(list) {
  try { localStorage.setItem(KEY, JSON.stringify(list)); return true; } catch (_) { return false; }
}

export function parseNum(v) {
  const n = parseFloat(String(v ?? '').replace(/[^\d.,-]/g, '').replace(/,(?=\d{3}\b)/g, '').replace(',', '.'));
  return Number.isFinite(n) && n > 0 ? n : null;
}

/** Add (or update) a product. Items without a link get a local id from their name. */
export function addItem({ title, url, price, currency, target }) {
  const list = loadList();
  const clean = url ? normalizeUrl(url) : '';
  const id = clean ? productId(clean) : productId('local:' + title.trim().toLowerCase());
  const now = Date.now();
  const p = list[id] || { id, url: clean || null, addedAt: now, history: [], source: 'web' };
  p.title = title.trim();
  p.currency = currency;
  p.targetPrice = target ?? null;
  if (price != null) recordPrice(p, price, now);
  list[id] = p;
  saveList(list);
  return p;
}
