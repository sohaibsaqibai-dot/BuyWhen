// Price search page. A static site cannot read live store prices (browsers block
// cross-site reads), so this page hands the search to Google, where the BuyWhen
// extension ranks the offers, and links to each store's own search.
import { REGIONS, guessRegion, saveRegion, googleUrl, badge, toast, CHROME_STORE_URL } from './site.js';
import { escapeHtml, formatPrice } from './format.js';
import { addItem, parseNum } from './watch.js';
import { I } from './icons.js';

const params = new URLSearchParams(location.search);
const q = (params.get('q') || '').trim().slice(0, 150);
let region = REGIONS[params.get('r')] ? params.get('r') : guessRegion();
saveRegion(region);

const input = document.getElementById('sq');
const sel = document.getElementById('sr');
input.value = q;
sel.value = region;
const out = document.getElementById('results');

const POPULAR = ['iPhone 17 256GB', 'PlayStation 5 Slim', 'AirPods Pro 3', 'Samsung Galaxy S26 Ultra', 'Dyson V15', 'Nintendo Switch 2', 'MacBook Air M4', 'Sony WH-1000XM6'];

function emptyState() {
  out.innerHTML = `
    <div class="panel">
      <h2>Popular searches</h2>
      <div class="chips">${POPULAR.map(p => `<a class="chip" href="?q=${encodeURIComponent(p)}&r=${region}">${escapeHtml(p)}</a>`).join('')}</div>
      <p class="sub">Tip: include the model and size, such as “256GB” or “Slim”, so the comparison matches the exact product.</p>
    </div>`;
}

function results() {
  document.title = `${q}: compare prices | BuyWhen`;
  const r = REGIONS[region];
  const stores = r.stores.map(([name, base]) => `
    <a class="store" href="${escapeHtml(base + encodeURIComponent(q))}" target="_blank" rel="noopener">${badge(name)}<span>${escapeHtml(name)}</span><span class="go">${I.arrow}</span></a>`).join('');
  out.innerHTML = `
  <div class="result">
    <div style="display:flex;flex-direction:column;gap:18px">
      <section class="panel">
        <span class="kicker">Lowest prices · ${escapeHtml(r.name)}</span>
        <h2>Compare “${escapeHtml(q)}” across stores</h2>
        <p class="sub">Google shows offers from many stores for this search. With the BuyWhen extension installed, a <b>Best prices</b> panel appears next to the results and ranks every offer from lowest to highest, with Buy and Track on each one.</p>
        <div class="chips">
          <a class="btn primary" href="${escapeHtml(googleUrl(region, q))}" target="_blank" rel="noopener">${I.search}Compare on Google</a>
          <a class="btn" href="${escapeHtml(googleUrl(region, q, true))}" target="_blank" rel="noopener">Google Shopping tab</a>
        </div>
        <p class="note"><b>No extension yet?</b> <a data-install href="#">Add BuyWhen to Chrome</a> first, then press Compare on Google to see the ranked list.</p>
      </section>
      <section class="panel">
        <h3>Search the stores directly</h3>
        <div class="stores">${stores}</div>
      </section>
    </div>
    <form class="panel form" id="quick" autocomplete="off">
      <span class="kicker">Track it</span>
      <h2>Add to your watchlist</h2>
      <p class="sub">Found a price? Save it with your target and BuyWhen will show a Buy or Wait verdict as you update it.</p>
      <label class="field">Product name<input class="input" name="title" value="${escapeHtml(q)}" required maxlength="160"></label>
      <label class="field">Product link (optional)<input class="input" name="url" type="url" placeholder="Paste the store page link"></label>
      <div class="row2">
        <label class="field">Price now<input class="input" name="price" inputmode="decimal" required placeholder="0.00"></label>
        <label class="field">Target<input class="input" name="target" inputmode="decimal" placeholder="−10%"></label>
      </div>
      <p class="save-line" id="qs"></p>
      <button class="btn primary" type="submit">${I.bell}Start tracking</button>
      <a class="meta" href="../price-tracker/">Open my watchlist</a>
    </form>
  </div>`;

  // Install link inside rendered HTML
  out.querySelectorAll('[data-install]').forEach(a => { a.href = CHROME_STORE_URL; a.target = '_blank'; a.rel = 'noopener'; });

  const form = document.getElementById('quick');
  const line = document.getElementById('qs');
  const sync = () => {
    const price = parseNum(form.price.value);
    if (price && !form.target.value) form.target.placeholder = String(Math.floor(price * 0.9));
    const t = parseNum(form.target.value) ?? (price ? Math.floor(price * 0.9) : null);
    line.textContent = price && t && t < price ? `Alert at ${formatPrice(t, r.currency)} · you save ${formatPrice(price - t, r.currency)}` : '';
  };
  form.addEventListener('input', sync);
  form.addEventListener('submit', e => {
    e.preventDefault();
    const price = parseNum(form.price.value);
    if (!price) { form.price.focus(); return; }
    const url = form.url.value.trim();
    if (url && !/^https?:\/\//i.test(url)) { form.url.focus(); toast('Paste a full link starting with https://'); return; }
    const target = parseNum(form.target.value) ?? Math.floor(price * 0.9);
    addItem({ title: form.title.value, url, price, currency: r.currency, target });
    toast(`Tracking · alert at ${formatPrice(target, r.currency)}`);
    form.price.value = ''; form.target.value = ''; line.textContent = '';
  });
}

sel.addEventListener('change', () => { region = sel.value; saveRegion(region); if (q) results(); else emptyState(); });
q ? results() : emptyState();
