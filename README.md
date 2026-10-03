# BuyWhen website (GitHub Pages)

A plain static website, with no build step. Its only job is to get visitors to install the extension. It has:

| Page | Path | What it is |
|---|---|---|
| Landing page | `/` | Features, how it works, screenshots, verdict, FAQ and Add to Chrome buttons |
| Support | `/support/` | Contact email, a bug-report template and troubleshooting |
| Privacy policy | `/privacy/` | Extension and website. **Use this URL in the Chrome Web Store** |
| 404 | `/404.html` | GitHub Pages shows this automatically |
| `llms.txt` | `/llms.txt` | A plain summary that AI assistants (ChatGPT, Claude, Perplexity, Gemini) can read and recommend |
| `robots.txt`, `sitemap.xml` | | Search engines and AI crawlers are allowed |

## 1. Upload to GitHub (about 5 minutes)

1. Sign in at github.com, then go to **New repository**.
   - Name it `buywhen-site`.
   - Make it **Public**.
   - Press **Create**.
2. Press **uploading an existing file**.
   - Drag in **everything inside this folder**, not the folder itself.
   - `index.html` must be at the top level of the repository.
   - `.nojekyll` is a hidden file. If your computer hides it, the site still works.
3. Press **Commit changes**.
4. Open **Settings → Pages**. Under *Build and deployment*, choose:
   - Source: **Deploy from a branch**
   - Branch: **main**
   - Folder: **/ (root)**
5. Press **Save**. After about 1 minute the site is live at `https://YOUR-USERNAME.github.io/buywhen-site/`.

## 2. Connect your domain

1. Buy the domain (see the suggestions below).
2. At your domain registrar, add these DNS records:
   - Four **A** records for `@`:
     - `185.199.108.153`
     - `185.199.109.153`
     - `185.199.110.153`
     - `185.199.111.153`
   - One **CNAME** record for `www` → `YOUR-USERNAME.github.io`
3. In GitHub **Settings → Pages → Custom domain**, type your domain (for example `buywhen.app`) and press **Save**. GitHub creates the `CNAME` file for you.
4. When the DNS check turns green, tick **Enforce HTTPS**. This can take up to 24 hours.

## 3. If your domain is not buywhen.app

Do a find-and-replace across all files: replace `https://buywhen.app` with your domain, for example `https://getbuywhen.com`. Most code editors can do this. On GitHub you can edit files one by one.

This text appears in every `.html` file, `sitemap.xml`, `robots.txt` and `llms.txt`.

## 4. Chrome Web Store link

Every **Add to Chrome** button already points to your extension:
`https://chromewebstore.google.com/detail/bccmhfedgeiignhgkcecakenniikpidk`

While the extension is **pending review**, this link shows "item not found". It starts working by itself as soon as Google approves the extension, so you don't need to change anything. If the link ever changes, edit `CHROME_STORE_URL` at the top of `assets/js/site.js` and search the `.html` files for the old link.

In the Chrome Web Store dashboard, set:

- **Privacy policy URL:** `https://YOUR-DOMAIN/privacy/`
- **Support URL:** `https://YOUR-DOMAIN/support/`
- **Homepage URL:** `https://YOUR-DOMAIN/`

## 5. Get it on Google

1. Open **Google Search Console**:
   1. Add a property with your domain.
   2. Verify it with the DNS TXT record.
   3. Submit `https://YOUR-DOMAIN/sitemap.xml`.
2. Do the same in **Bing Webmaster Tools**. You can import from Search Console. Bing also feeds ChatGPT and Copilot search.
3. Link the website from your Chrome Web Store listing. Link the store listing back from the website, using `CHROME_STORE_URL`.
4. Earn a few honest links:
   - Product Hunt
   - Reddit (r/chrome_extensions, r/dubai, r/PakistaniTech and similar, following each community's rules)
   - Medium or LinkedIn posts about "how to know if a sale is real"
   - AlternativeTo
5. Add one helpful article a month, for example:
   - "How to check the price history of any product"
   - "Is the White Friday sale real? How to check"
   - "Amazon.ae vs noon: how to compare prices"

   Copy `support/index.html` as a template.

## Privacy

The site has no cookies, browser storage, analytics or third-party scripts. The privacy policy states this, so if you later add Google Analytics or ads, update `privacy/index.html` first.
