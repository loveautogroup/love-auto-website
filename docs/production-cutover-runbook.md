# Production Cutover Runbook — loveautogroup.net

**Author:** Charlotte (webdev) + Sam (security)
**Audience:** Jeremiah, executing the cutover
**Estimated time:** 60 minutes, plus 48–72 hours of monitoring

This runbook covers switching `loveautogroup.net` from the existing legacy
auto-CMS site to the new Next.js build running on Cloudflare Pages. Follow
the steps in order. Do the pre-flight checks before touching DNS.

---

## ⚠️ Before you start

**Do not touch DNS until every pre-flight check passes.**

The current legacy site has accumulated search rankings, backlinks, and
Google Business Profile trust since 2014. A bad cutover can zero those out.
The `public/_redirects` file in this repo is the safety net — if it's not
catching a legacy URL, users and crawlers hit 404s and we lose equity.

Rollback plan if anything goes wrong: revert the DNS CNAME in Cloudflare
to whatever it was pointing at (write it down in Step 1).

---

## Step 1 — Capture the current state (5 min)

Before changing anything, document what the legacy site looks like to
Google and to a browser.

1. In a new tab, open Google Search Console for `loveautogroup.net` (if
   not set up, skip — it's worse than nothing but not blocking).
   Note the top 10 ranking pages + their top query each.
2. Run `curl -I https://www.loveautogroup.net/` and write down the
   response headers — especially `Server`, `Via`, and any `CF-*` headers.
   That tells us which provider is serving the site today.
3. Open `https://www.loveautogroup.net/` in a browser. Note the 5 most
   important pages by traffic (inventory, about, financing, contact,
   sell your car) and confirm their exact URL paths. Compare them to
   the entries already in `public/_redirects` — if any are missing,
   add them before continuing.
4. In Cloudflare Dashboard → **DNS** for `loveautogroup.net`, take a
   screenshot of the current A/AAAA/CNAME records. This is your
   rollback target.

## Step 2 — Verify the new site is ready (10 min)

1. Open `https://feature-vehicle-card-badges.love-auto-website.pages.dev/`
   and click through the key flows:
   - Homepage → inventory → VDP → financing
   - Homepage → FAQ
   - /serving/lombard-il / /serving/elmhurst-il / other service areas
   - /inventory/used-subaru / other make landings
   - /free-carfax-villa-park
2. Check these files are live at the preview URL (each should return 200):
   - `/sitemap.xml`
   - `/robots.txt`
   - `/og-image.png`
3. Validate the schema on the homepage using Google's Rich Results Test:
   https://search.google.com/test/rich-results
   Paste `https://feature-vehicle-card-badges.love-auto-website.pages.dev/`
   and confirm `AutoDealer` with `AggregateRating` validates cleanly.
4. Do the same test on a VDP — confirm `Car`, `BreadcrumbList`, and
   `FAQPage` all validate.

## Step 3 — Add environment variables (5 min)

In Cloudflare Pages Dashboard → **love-auto-website** → **Settings** →
**Environment Variables**, add (Production only):

- `GOOGLE_PLACES_API_KEY` — API key from Google Cloud Console with Places
  API (New) enabled. **Restrict by HTTP referrer to `*.loveautogroup.net/*`
  before pasting here.** Sam's requirement.
- `GOOGLE_PLACE_ID` — Place ID for Love Auto Group from Google Maps Platform
  "Find Place ID" tool.

After saving, trigger a rebuild so the VDP review cards pull live data.
Verify a VDP shows real customer reviews (not the Jordan-curated fallbacks)
before proceeding.

## Step 4 — Assign custom domain in Cloudflare Pages (5 min)

1. Cloudflare Pages Dashboard → **love-auto-website** → **Custom domains**
2. Click **Set up a custom domain**
3. Enter `www.loveautogroup.net`
4. Cloudflare will auto-detect the DNS is already managed by Cloudflare
   (assuming it is — verify in Step 1). Follow prompts. It'll create a
   CNAME record pointing to the Pages deployment.
5. Repeat for apex `loveautogroup.net` — this time Cloudflare creates a
   CNAME flattening record.
6. Wait ~2 minutes for SSL cert issuance. Status should read **Active**
   for both.

## Step 5 — Cut the branch (1 min, the reversible one)

Until this step, the new site is on a different domain. Everything up to
here is safe.

Decision point: merge the feature branch into `main` and let the Pages
auto-deploy serve `loveautogroup.net`?

```bash
git checkout main
git merge feature/vehicle-card-badges
git push origin main
```

If the project's Pages deployment is configured to deploy `main` to
production, this will trigger the production build. Monitor the build
log in Cloudflare Pages Dashboard → **Deployments**. Build should
complete in ~90 seconds.

## Step 6 — Verify the switch (10 min)

Open a fresh browser (incognito) and hit each of these. Every one must
return 200 and show the new site:

- https://www.loveautogroup.net/
- https://www.loveautogroup.net/inventory
- https://www.loveautogroup.net/inventory/2016-honda-pilot-touring-11334/
- https://www.loveautogroup.net/financing
- https://www.loveautogroup.net/about

Then hit these LEGACY URLs (from the old site) and confirm they 301-redirect
to the right new page:

- https://www.loveautogroup.net/newandusedcars → should 301 to `/inventory`
- https://www.loveautogroup.net/about-us → `/about`
- https://www.loveautogroup.net/store → `/contact`
- https://www.loveautogroup.net/reviews → `/about#reviews`
- https://www.loveautogroup.net/locatorservice → `/sell-your-car`

Use `curl -I -L` to see the redirect chain:
```bash
curl -I https://www.loveautogroup.net/newandusedcars
```
Expect `HTTP/2 301` with `location: /inventory`.

## Step 7 — Submit new sitemap (5 min)

1. **Google Search Console**
   - Open Search Console for `loveautogroup.net`
   - Sidebar → **Sitemaps**
   - Enter `sitemap.xml` and submit
   - Under **URL Inspection**, test a handful of new URLs to confirm
     Google can see them (`/inventory/used-subaru`, `/serving/lombard-il`,
     `/free-carfax-villa-park`, etc.). Request indexing for each.

2. **Bing Webmaster Tools**
   - Login → add `loveautogroup.net` if not already verified
   - Submit `https://www.loveautogroup.net/sitemap.xml`

3. **Update Google Business Profile**
   - Sign in to https://business.google.com
   - Confirm website URL is `https://www.loveautogroup.net/` (exact)
   - If the legacy URL was `www.loveautogroup.net/home` or similar, update
     to the canonical new homepage

## Step 8 — Update third-party listings (15 min)

Each of these has its own website URL field that should point at the
new production URL. Quickly verify / update:

- **Yelp**: https://www.yelp.com/biz/love-auto-group-villa-park
- **CarGurus dealer profile**: https://www.cargurus.com/Cars/m-Love-Auto-Group-sp414393
- **Carfax listing**: Carfax Advantage Dealer portal
- **Facebook Business Page**: https://www.facebook.com/LoveAutoGroup/
- **BBB**: https://www.bbb.org/us/il/villa-park/...
- **Yellow Pages / local directories**: wherever you know we're listed

## Step 9 — Monitor for 72 hours

For the first three days after cutover, check daily:

- **Google Search Console → Coverage**: watch for spikes in 404s. If you
  see legacy URLs 404'ing that weren't in `_redirects`, add them and
  redeploy.
- **Google Search Console → Performance**: rankings should be stable
  within 48 hours. A temporary dip of 10-20% in the first 3-5 days is
  normal while Google re-crawls.
- **Cloudflare Analytics**: watch for spikes in 4xx responses.
- **Places API quota**: first day will consume extra API calls as the
  build cache warms. Should settle to ~1 call per rebuild thereafter.

If organic traffic drops more than 30% and stays there for more than 5
days, something is wrong. Check `_redirects`, check Search Console for
crawl errors, and in the worst case — revert DNS to the legacy provider
from Step 1.

---

## Appendix: What's in `public/_redirects`

See the file for the actual list. Covers:

- Existing slug aliases (`/privacy` → `/privacy-policy/`, `/terms-of-service` → `/terms/`)
- Legacy top-level pages (`/about-us`, `/store`, `/reviews`, `/locatorservice`, `/contact-us`)
- Legacy inventory paths (`/newandusedcars`, `/newandusedcars/*`)
- Legacy auto-CMS paths (`/financing-application`, `/apply`, `/value-your-trade`, `/trade-in`, `/specials`)
- Legacy VDP patterns (`/vehicle-details/*`, `/vehicle/*` → inventory index)

Add new redirects as Search Console surfaces 404s from the legacy site.
Format:
```
/legacy/path    /new/path    301
```
