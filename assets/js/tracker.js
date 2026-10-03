// Web price tracker page: a watchlist kept in this browser's local storage.
import { toast, guessRegion, REGIONS, googleUrl } from './site.js';
import { escapeHtml, formatPrice, timeAgo, hostOf } from './format.js';
import { getVerdict, priceStats } from './verdict.js';
import { recordPrice, sortedProducts } from './store.js';
import { loadList, saveList, addItem, parseNum } from './watch.js';
import { I } from './icons.js';

const form = document.getElementById('add');
const itemsEl = document.getElementById('items');
const countEl = document.getElementById('count');
const saveLine = document.getElementById('save-line');
const region = guessRegion();

// Currency list: the visitor's own first, then the common ones.
const CURRENCIES = ['AED', 'SAR', 'USD', 'GBP', 'EUR', 'INR', 'PKR', 'CAD', 'AUD', 'QAR', 'KWD', 'OMR', 'BHD', 'EGP', 'TRY', 'SGD', 'JPY'];
const mine = REGIONS[region]?.currency || 'USD';
form.currency.innerHTML = [mine, ...CURRENCIES.filter(c => c !== mine)].map(c => `<option>${c}</option>`).join('');

// ---- Add form --------------------------------------------------------------
let pct = 10;
function syncTarget(fromChip) {
  const price = parseNum(form.price.value);
  if (fromChip && price) form.target.value = Math.floor(price * (1 - pct / 100));
  const t = parseNum(form.target.value);
  const cur = form.currency.value;
  const real = price && t ? Math.round((1 - t / price) * 100) : null;
  form.querySelectorAll('[data-pct]').forEach(c => c.setAttribute('aria-pressed', String(Number(c.dataset.pct) === real)));
  saveLine.textContent = price && t && t < price ? `You save ${formatPrice(price - t, cur)} (${real}%) at this price` : price && t ? 'At or above today’s price: the verdict will say Buy now' : '';
}
form.addEventListener('click', e => {
  const chip = e.target.closest('[data-pct]');
  if (!chip) return;
  pct = Number(chip.dataset.pct);
  syncTarget(true);
});
form.price.addEventListener('input', () => { if (!form.target.dataset.touched) syncTarget(true); else syncTarget(false); });
form.target.addEventListener('input', () => { form.target.dataset.touched = '1'; syncTarget(false); });
form.currency.addEventListener('change', () => syncTarget(false));

form.addEventListener('submit', e => {
  e.preventDefault();
  const price = parseNum(form.price.value);
  if (!price) { form.price.focus(); toast('Enter the price you see now'); return; }
  const url = form.url.value.trim();
  if (url && !/^https?:\/\//i.test(url)) { form.url.focus(); toast('Paste a full link starting with https://'); return; }
  const target = parseNum(form.target.value) ?? Math.floor(price * 0.9);
  const p = addItem({ title: form.title.value, url, price, currency: form.currency.value, target });
  form.reset();
  delete form.target.dataset.touched;
  form.currency.value = p.currency;
  saveLine.textContent = '';
  render();
  toast(`Tracking · alert at ${formatPrice(target, p.currency)}`);
});

// ---- List --------------------------------------------------------------------
function meter(p) {
  const s = priceStats(p.history), cur = p.currency;
  if (!s || s.count < 2 || s.high === s.low) {
    return `<div class="meter"><div class="track none"></div><div class="ends"><span>Building price history…</span><span>${s ? `${s.count} price${s.count === 1 ? '' : 's'}` : ''}</span></div></div>`;
  }
  const lo = Math.min(s.low, p.targetPrice ?? s.low), hi = s.high;
  const pos = v => Math.max(0, Math.min(100, ((v - lo) / (hi - lo)) * 100));
  const tgt = p.targetPrice != null && p.targetPrice <= hi ? `<span class="tgt" style="left:${pos(p.targetPrice)}%" title="Your target"></span>` : '';
  return `<div class="meter" role="img" aria-label="Price ${formatPrice(p.currentPrice, cur)}, lowest ${formatPrice(s.low, cur)}, highest ${formatPrice(s.high, cur)}">
    <div class="track">${tgt}<span class="now" style="left:${pos(p.currentPrice ?? s.low)}%"></span></div>
    <div class="ends"><span>Low <b>${formatPrice(s.low, cur)}</b></span><span>High <b>${formatPrice(s.high, cur)}</b></span></div></div>`;
}

function spark(history, w = 120, h = 34) {
  const pts = (history || []).slice(-30);
  if (pts.length < 2) return '';
  const ps = pts.map(p => p.p), lo = Math.min(...ps), hi = Math.max(...ps);
  const x = i => 2 + (i / (pts.length - 1)) * (w - 6);
  const y = v => hi === lo ? h / 2 : 3 + (1 - (v - lo) / (hi - lo)) * (h - 6);
  const d = pts.map((p, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(p.p).toFixed(1)}`).join(' ');
  const last = ps[ps.length - 1], first = ps[0];
  const color = last < first ? 'var(--buy)' : last > first ? 'var(--danger)' : 'var(--muted)';
  return `<svg class="spark" viewBox="0 0 ${w} ${h}" aria-hidden="true"><path d="${d}" fill="none" stroke="${color}" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/></svg>`;
}

function render() {
  const list = loadList();
  const items = sortedProducts(list);
  countEl.textContent = items.length ? `· ${items.length}` : '';
  if (!items.length) {
    itemsEl.innerHTML = `<div class="panel empty-state"><b>No products yet</b><p>Add one with the form, or find a product with <a href="../price-search/">price search</a>.</p></div>`;
    return;
  }
  itemsEl.innerHTML = items.map(p => {
    const v = getVerdict(p);
    const reason = v.code === 'unknown' ? 'Add the price you see now.' : v.code === 'tracking' ? v.reason.replace('Collecting price history.', 'Add a few more prices over the next days for a verdict.') : v.reason;
    const host = p.url ? hostOf(p.url) : '';
    const title = p.url ? `<a href="${escapeHtml(p.url)}" target="_blank" rel="noopener nofollow">${escapeHtml(p.title)}</a>` : escapeHtml(p.title);
    return `<article class="item" data-id="${escapeHtml(p.id)}">
      <div style="display:flex;flex-direction:column;gap:6px;min-width:0">
        <span class="pill ${v.code}">${escapeHtml(v.label)}</span>
        <div class="t">${title}</div>
        <div class="h">${host ? escapeHtml(host) + ' · ' : ''}updated ${timeAgo(p.lastChecked)}${p.targetPrice != null ? ` · target ${formatPrice(p.targetPrice, p.currency)}` : ''}</div>
      </div>
      <div class="price"><b>${formatPrice(p.currentPrice, p.currency)}</b>${spark(p.history)}</div>
      ${meter(p)}
      <p class="why">${escapeHtml(reason)}</p>
      <div class="acts">
        <form class="upd" data-act="price"><input class="input" name="v" inputmode="decimal" placeholder="New price" aria-label="New price for ${escapeHtml(p.title)}"><button class="btn sm primary">Update</button></form>
        <form class="upd" data-act="target"><input class="input" name="v" inputmode="decimal" placeholder="Target" aria-label="Target price for ${escapeHtml(p.title)}"><button class="btn sm">Set target</button></form>
        <a class="btn sm" href="${escapeHtml(googleUrl(region, p.title))}" target="_blank" rel="noopener">${I.search}Compare</a>
        <button class="btn sm danger" data-remove aria-label="Remove ${escapeHtml(p.title)}">${I.trash}</button>
      </div>
    </article>`;
  }).join('');
}

itemsEl.addEventListener('submit', e => {
  e.preventDefault();
  const f = e.target.closest('form.upd');
  const id = f.closest('.item').dataset.id;
  const val = parseNum(f.v.value);
  if (!val) { f.v.focus(); return; }
  const list = loadList();
  const p = list[id];
  if (!p) return;
  if (f.dataset.act === 'price') {
    const before = p.currentPrice;
    recordPrice(p, val);
    toast(before && val < before ? `Price dropped ${formatPrice(before - val, p.currency)}` : 'Price updated');
  } else {
    p.targetPrice = val;
    toast(`Target set to ${formatPrice(val, p.currency)}`);
  }
  saveList(list);
  render();
});

itemsEl.addEventListener('click', e => {
  const rm = e.target.closest('[data-remove]');
  if (!rm) return;
  const item = rm.closest('.item');
  if (rm.dataset.confirm !== '1') { rm.dataset.confirm = '1'; rm.textContent = 'Remove?'; setTimeout(() => { if (rm.isConnected) { rm.dataset.confirm = ''; rm.innerHTML = I.trash; } }, 3000); return; }
  const list = loadList();
  delete list[item.dataset.id];
  saveList(list);
  render();
  toast('Removed');
});

// ---- Export / import / clear ------------------------------------------------
document.getElementById('export').addEventListener('click', () => {
  const list = loadList();
  const products = {};
  for (const [id, p] of Object.entries(list)) if (p.url) products[id] = { ...p, needsAccess: true };
  const skipped = Object.keys(list).length - Object.keys(products).length;
  if (!Object.keys(products).length) { toast('Add a product link first. The extension needs it to check prices.'); return; }
  const blob = new Blob([JSON.stringify({ app: 'BuyWhen', version: 1, exportedAt: new Date().toISOString(), products }, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `buywhen-web-watchlist-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  toast(skipped ? `Exported. ${skipped} product${skipped === 1 ? '' : 's'} without a link left out.` : 'Exported. Import it in BuyWhen → Settings.');
});

document.getElementById('import').addEventListener('change', async e => {
  const file = e.target.files[0];
  if (!file) return;
  try {
    const data = JSON.parse(await file.text());
    if (!data || typeof data.products !== 'object') throw new Error();
    const list = loadList();
    let added = 0;
    for (const [id, p] of Object.entries(data.products)) {
      if (!p || !p.title || !Array.isArray(p.history)) continue;
      if (!list[id]) added++;
      list[id] = { ...list[id], ...p };
    }
    saveList(list);
    render();
    toast(`Imported ${added} new product${added === 1 ? '' : 's'}`);
  } catch (_) { toast('That file is not a BuyWhen backup'); }
  e.target.value = '';
});

const clearBtn = document.getElementById('clear');
clearBtn.addEventListener('click', () => {
  if (clearBtn.dataset.confirm !== '1') {
    clearBtn.dataset.confirm = '1'; clearBtn.textContent = 'Press again to delete all';
    setTimeout(() => { clearBtn.dataset.confirm = ''; clearBtn.textContent = 'Delete all'; }, 3500);
    return;
  }
  saveList({});
  clearBtn.dataset.confirm = ''; clearBtn.textContent = 'Delete all';
  render();
  toast('Watchlist deleted');
});

// Prefill from ?name= (links from other pages)
const pre = new URLSearchParams(location.search).get('name');
if (pre) form.title.value = pre.slice(0, 160);

window.addEventListener('storage', e => { if (e.key === 'bw.watchlist') render(); });
render();
