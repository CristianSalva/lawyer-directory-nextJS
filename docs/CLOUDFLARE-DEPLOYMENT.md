# Cloudflare Free-Tier Deployment — How It Works

Live site: **https://lawyer-directory.noel-a02.workers.dev**
Account: Noel@worksimpli.io (account ID `a0237a50f5b3a070d940d253bb9bc845`)
Deployed: July 7, 2026 · Cost: **$0/month**

## The problem

Cloudflare's free plan has three hard limits the site crashed into:

1. **A Worker (their mini-server) can only be 10 MB** — the site needs 241 MB of
   attorney data to answer requests, so running it as a normal server on
   Cloudflare was impossible.
2. **Static file hosting is capped at 20,000 files** — the site has ~51,000 pages.
3. **Their upload API only allows ~1,200 requests per 5 minutes** — we had
   ~148,000 files to upload.

So we couldn't just "put the site on Cloudflare" — we had to restructure how it
works.

## The solution, step by step

### Step 1 — Make the site 100% static

Instead of a server building each page when someone visits (how it worked on
Render), we build *every single page in advance* on the build machine — all 41k
attorney profiles, 8.6k firm profiles, 53 state pages — producing ~51,000 plain
HTML files. Once a page is just a file, you don't need a server, and the 241 MB
of data never has to leave the build machine.

Code changes: full `generateStaticParams` on the profile pages
(`src/app/[state]/attorneys/[slug]/page.tsx`, `src/app/[state]/firms/[slug]/page.tsx`)
with `dynamicParams = false`.

### Step 2 — Move the search filter into the browser

One thing genuinely needed a server: the "pick a legal issue + city → see
matching lawyers" flow (`?area=&city=` on state pages). We rewrote it so the
browser does the filtering itself — when a visitor picks filters, the page
quietly downloads a small pre-made data file for that state
(`/data/{state}.json` — just names, cities, practice areas; not the full 26 MB),
filters it with JavaScript, and shows the results. Same look, same behavior, no
server.

Code changes:

- `src/components/StateFlow.tsx` — reads the query params client-side, shows
  either the landing UI or the results
- `src/components/StateResults.tsx` — fetches the slim state JSON and filters
  in the browser (same logic the server used, including the 150-mile radius)
- `src/components/StatesBrowse.tsx` — same treatment for `/attorneys` and `/firms`
- `src/app/data/[state]/route.ts` — generates the slim per-state JSON files at
  build time

### Step 3 — Store everything in R2 instead of static hosting

R2 is Cloudflare's file storage (like Dropbox for websites). Unlike their
static hosting, it has **no file-count limit** and gives 10 GB free. We put all
51k HTML pages plus all ~97k photos there — 4.4 GB total (148,436 objects) in
the `lawyer-directory` bucket.

### Step 4 — Write a tiny doorman (the Worker)

Since R2 is just storage, something must answer web requests. We wrote a
~90-line Worker (`cloudflare/worker.js`) that does one job: when someone asks
for `/texas/attorneys/john-doe`, it grabs the matching HTML file from R2 and
hands it back, then caches it at Cloudflare's edge so repeat visits don't even
touch storage. CSS and JavaScript files (only a few hundred) go through the
free static-asset channel (`cloudflare/assets/`), which doesn't count against
any request quota.

### Step 5 — Sneak past the upload rate limit

Uploading 148k files one-by-one through Cloudflare's official API kept failing
(their rate limit). Trick: we deployed a *second, temporary* Worker
(`cloudflare/uploader-worker.js`) whose only job was receiving files — we sent
them in bundles of 25 (`scripts/r2-upload.mjs`), and it saved each bundle
straight into R2 from the inside, where no rate limit applies. Once everything
was uploaded, we deleted that Worker.

## The result

A visitor's request now goes: **browser → Worker → R2 file → cached at the
edge**. No server to sleep or wake up (goodbye Render's 30-second cold starts),
nothing to maintain, and every part fits inside the free tier.

Remaining free-tier ceilings to be aware of:

| Limit | Free tier | We use |
|---|---|---|
| R2 storage | 10 GB | 4.4 GB |
| R2 writes (uploads) | 1M/month | ~51k per site redeploy (photos don't re-upload) |
| Worker requests | 100k/day | 1 per uncached page view (assets & cached pages are free) |

If traffic ever grows past 100k requests/day, the $5/month Workers Paid plan
removes that cap.

## Redeploying after changes

```bash
./scripts/deploy-cloudflare.sh
```

One script does the whole pipeline: rebuild pages → assemble `out/` +
`cloudflare/assets/` → upload to R2 → deploy the Worker.

Photos are uploaded separately (only needed when photos change):

```bash
node scripts/r2-upload.mjs ../lawyer-directory-nextjs/attorney_photos attorney-photos
node scripts/r2-upload.mjs ../lawyer-directory-nextjs/firm_photos firm-photos
```

Note: `scripts/r2-upload.mjs` requires the uploader Worker to be deployed and
`.upload-token` present (see comments in the script). Deploy it with
`npx wrangler deploy --config cloudflare/uploader-wrangler.jsonc`, and delete it
afterwards with `npx wrangler delete --config cloudflare/uploader-wrangler.jsonc`.

## Where to see it in the Cloudflare dashboard

- Worker: dash.cloudflare.com → Noel@worksimpli.io's Account → Workers & Pages → `lawyer-directory`
- Storage: same account → R2 → `lawyer-directory` bucket
