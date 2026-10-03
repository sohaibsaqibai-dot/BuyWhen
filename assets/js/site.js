// BuyWhen website: menu, install links and footer year.
// Chrome Web Store link for every "Add to Chrome" button.
export const CHROME_STORE_URL = 'https://chromewebstore.google.com/detail/bccmhfedgeiignhgkcecakenniikpidk';

document.querySelectorAll('[data-install]').forEach(a => {
  a.href = CHROME_STORE_URL;
  a.target = '_blank';
  a.rel = 'noopener';
});

const menuBtn = document.querySelector('.menu-btn');
const nav = document.querySelector('.nav');
menuBtn?.addEventListener('click', () => {
  const open = nav.classList.toggle('open');
  menuBtn.setAttribute('aria-expanded', String(open));
});
// Close the mobile menu after picking a section link.
nav?.addEventListener('click', e => { if (e.target.closest('a')) { nav.classList.remove('open'); menuBtn?.setAttribute('aria-expanded', 'false'); } });

const year = document.querySelector('[data-year]');
if (year) year.textContent = new Date().getFullYear();
