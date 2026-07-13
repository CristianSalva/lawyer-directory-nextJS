#!/usr/bin/env bash
# Build the static site and deploy to Cloudflare (R2 + Worker).
# Photos are uploaded separately (one-time):
#   node scripts/r2-upload.mjs ../lawyer-directory-nextjs/attorney_photos attorney-photos
#   node scripts/r2-upload.mjs ../lawyer-directory-nextjs/firm_photos firm-photos
set -euo pipefail
cd "$(dirname "$0")/.."

npm run build

# Assemble out/ from .next (in lieu of `output: 'export'` — see next.config.ts).
# RSC prefetch payloads are deliberately not shipped: client navigations fall
# back to plain full-page loads, which keeps R2 within free-tier limits.
rm -rf out cloudflare/assets
mkdir -p out/data cloudflare/assets/_next
rsync -am --include='*/' --include='*.html' --exclude='*' .next/server/app/ out/
rm -rf 'out/[state]' out/_global-error.html
mv out/_not-found.html out/404.html
for f in .next/server/app/data/*.json.body; do
  cp "$f" "out/data/$(basename "${f%.body}")"
done

# Hashed build assets + public files are served as Worker static assets
# (free, no worker invocation); out/ (HTML + data JSON) goes to R2.
cp -R .next/static cloudflare/assets/_next/static
cp -R public/. cloudflare/assets/
cp .next/server/app/favicon.ico.body cloudflare/assets/favicon.ico

# Inline the stylesheet into every page — the <link> was the last
# render-blocking request. React re-inserts the link after hydration (it's
# still referenced in the RSC payload), which is async and harmless.
node scripts/inline-css.mjs

node scripts/r2-upload.mjs out

# Fresh DEPLOY_ID namespaces the worker's edge cache so the new content
# serves immediately (cached pages otherwise persist up to their s-maxage).
npx wrangler deploy --var "DEPLOY_ID:$(date +%s)"
