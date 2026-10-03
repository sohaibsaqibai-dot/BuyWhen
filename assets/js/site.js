// BuyWhen website: shared behaviour (menu, install links, regions, toast).
// ---------------------------------------------------------------------------
// EDIT THIS after your extension is approved: paste the exact Chrome Web Store
// link (it looks like https://chromewebstore.google.com/detail/buywhen/abcdef...).
export const CHROME_STORE_URL = 'https://chromewebstore.google.com/search/BuyWhen';
// ---------------------------------------------------------------------------

import { escapeHtml } from './format.js';

// Every "Add to Chrome" button carries data-install; one place to change the link.
document.querySelectorAll('[data-install]').forEach(a => {
  a.href = CHROME_STORE_URL;
  a.target = '_blank';
  a.rel = 'noopener';
});

// Mobile menu
const menuBtn = document.querySelector('.menu-btn');
const nav = document.querySelector('.nav');
menuBtn?.addEventListener('click', () => {
  const open = nav.classList.toggle('open');
  menuBtn.setAttribute('aria-expanded', String(open));
});

const year = document.querySelector('[data-year]');
if (year) year.textContent = new Date().getFullYear();

// ---- Regions: which Google and which stores to compare --------------------
export const REGIONS = {
  ae: { name: 'UAE', google: 'google.ae', currency: 'AED', stores: [['Amazon.ae', 'https://www.amazon.ae/s?k='], ['noon', 'https://www.noon.com/uae-en/search/?q='], ['Sharaf DG', 'https://uae.sharafdg.com/?q='], ['Carrefour', 'https://www.carrefouruae.com/mafuae/en/search?keyword='], ['Jumbo', 'https://www.jumbo.ae/search?q='], ['Virgin Megastore', 'https://www.virginmegastore.ae/en/search/?text=']] },
  sa: { name: 'Saudi Arabia', google: 'google.com.sa', currency: 'SAR', stores: [['Amazon.sa', 'https://www.amazon.sa/s?k='], ['noon', 'https://www.noon.com/saudi-en/search/?q='], ['eXtra', 'https://www.extra.com/en-sa/search/?text='], ['Jarir', 'https://www.jarir.com/sa-en/catalogsearch/result?search=']] },
  us: { name: 'United States', google: 'google.com', currency: 'USD', stores: [['Amazon', 'https://www.amazon.com/s?k='], ['Walmart', 'https://www.walmart.com/search?q='], ['Best Buy', 'https://www.bestbuy.com/site/searchpage.jsp?st='], ['Target', 'https://www.target.com/s?searchTerm='], ['eBay', 'https://www.ebay.com/sch/i.html?_nkw=']] },
  gb: { name: 'United Kingdom', google: 'google.co.uk', currency: 'GBP', stores: [['Amazon.co.uk', 'https://www.amazon.co.uk/s?k='], ['Argos', 'https://www.argos.co.uk/search/'], ['Currys', 'https://www.currys.co.uk/search?q='], ['eBay', 'https://www.ebay.co.uk/sch/i.html?_nkw=']] },
  in: { name: 'India', google: 'google.co.in', currency: 'INR', stores: [['Amazon.in', 'https://www.amazon.in/s?k='], ['Flipkart', 'https://www.flipkart.com/search?q='], ['Croma', 'https://www.croma.com/searchB?q='], ['Reliance Digital', 'https://www.reliancedigital.in/search?q=']] },
  de: { name: 'Germany', google: 'google.de', currency: 'EUR', stores: [['Amazon.de', 'https://www.amazon.de/s?k='], ['idealo', 'https://www.idealo.de/preisvergleich/MainSearchProductCategory.html?q='], ['MediaMarkt', 'https://www.mediamarkt.de/de/search.html?query='], ['eBay', 'https://www.ebay.de/sch/i.html?_nkw=']] },
  pk: { name: 'Pakistan', google: 'google.com.pk', currency: 'PKR', stores: [['Daraz', 'https://www.daraz.pk/catalog/?q='], ['PriceOye', 'https://priceoye.pk/search?q=']] },
  ca: { name: 'Canada', google: 'google.ca', currency: 'CAD', stores: [['Amazon.ca', 'https://www.amazon.ca/s?k='], ['Walmart', 'https://www.walmart.ca/search?q='], ['Best Buy', 'https://www.bestbuy.ca/en-ca/search?search='], ['eBay', 'https://www.ebay.ca/sch/i.html?_nkw=']] },
  au: { name: 'Australia', google: 'google.com.au', currency: 'AUD', stores: [['Amazon.com.au', 'https://www.amazon.com.au/s?k='], ['JB Hi-Fi', 'https://www.jbhifi.com.au/search?query='], ['Kogan', 'https://www.kogan.com/au/shop/?q='], ['eBay', 'https://www.ebay.com.au/sch/i.html?_nkw=']] }
};

/** Best guess of the visitor's region from their time zone and language. Nothing is sent anywhere. */
export function guessRegion() {
  try {
    const saved = localStorage.getItem('bw.region');
    if (saved && REGIONS[saved]) return saved;
  } catch (_) {}
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
  const byTz = { 'Asia/Dubai': 'ae', 'Asia/Riyadh': 'sa', 'Europe/London': 'gb', 'Asia/Kolkata': 'in', 'Asia/Calcutta': 'in', 'Europe/Berlin': 'de', 'Asia/Karachi': 'pk', 'Australia/Sydney': 'au', 'Australia/Melbourne': 'au', 'America/Toronto': 'ca', 'America/Vancouver': 'ca' };
  if (byTz[tz]) return byTz[tz];
  if (tz.startsWith('America/')) return 'us';
  const lang = (navigator.language || '').toLowerCase();
  const cc = lang.split('-')[1];
  return REGIONS[cc] ? cc : 'us';
}
export function saveRegion(r) { try { localStorage.setItem('bw.region', r); } catch (_) {} }

export function fillRegionSelect(select, current) {
  select.innerHTML = Object.entries(REGIONS).map(([k, r]) => `<option value="${k}"${k === current ? ' selected' : ''}>${escapeHtml(r.name)}</option>`).join('');
}

export function googleUrl(region, q, shoppingTab = false) {
  const r = REGIONS[region] || REGIONS.us;
  return `https://www.${r.google}/search?q=${encodeURIComponent(q)}${shoppingTab ? '&udm=28' : ''}`;
}

const BADGE_COLORS = ['#4353ff', '#0c9a57', '#e0590f', '#8b3dff', '#d92d20', '#0b7fab', '#b7791f', '#12142b'];
/** Local letter badge for a store (no third-party favicon service). */
export function badge(name) {
  let h = 0;
  for (const ch of String(name).toLowerCase()) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return `<span class="badge" aria-hidden="true" style="background:${BADGE_COLORS[h % BADGE_COLORS.length]}">${escapeHtml(String(name)[0].toUpperCase())}</span>`;
}

// Hero / masthead search forms all go to the price-search page.
document.querySelectorAll('form[data-search]').forEach(form => {
  const sel = form.querySelector('select[name="r"]');
  if (sel) { fillRegionSelect(sel, guessRegion()); sel.addEventListener('change', () => saveRegion(sel.value)); }
});

let toastEl;
export function toast(msg) {
  if (!toastEl) { toastEl = document.createElement('div'); toastEl.className = 'toast'; toastEl.setAttribute('role', 'status'); document.body.append(toastEl); }
  toastEl.textContent = msg;
  toastEl.classList.add('show');
  clearTimeout(toastEl._t);
  toastEl._t = setTimeout(() => toastEl.classList.remove('show'), 2800);
}
