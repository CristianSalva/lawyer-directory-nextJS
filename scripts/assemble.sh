#!/usr/bin/env bash
# Assemble out/ + cloudflare/assets from an existing .next build.
# (Extracted from deploy-cloudflare.sh so it can run standalone.)
set -euo pipefail
cd "$(dirname "$0")/.."

rm -rf out cloudflare/assets
mkdir -p out/data cloudflare/assets/_next
rsync -am --include='*/' --include='*.html' --exclude='*' .next/server/app/ out/
rm -rf 'out/[state]' out/_global-error.html
mv out/_not-found.html out/404.html
for f in .next/server/app/data/*.json.body; do
  cp "$f" "out/data/$(basename "${f%.body}")"
done

cp -R .next/static cloudflare/assets/_next/static
cp -R public/. cloudflare/assets/
cp .next/server/app/favicon.ico.body cloudflare/assets/favicon.ico

echo "---summary---"
find out -name '*.html' | wc -l
ls out/data | wc -l
du -sh out cloudflare/assets
