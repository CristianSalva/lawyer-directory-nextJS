import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // ponytail: no `output: 'export'` — the export copy step doubles peak disk
  // usage (~13 GB) and emits ~460k RSC prefetch .txt files we don't ship.
  // The app is still fully static (generateStaticParams everywhere,
  // dynamicParams=false); scripts/deploy-cloudflare.sh assembles the
  // deployable out/ folder straight from .next/server/app.
  // ponytail: no experimental.inlineCss — it copies the whole stylesheet into
  // every page's HTML *and* RSC segment files (~+16 GB build output for a
  // 150 ms est. saving). The 9.4 KiB cached stylesheet stays a separate file.
};

export default nextConfig;
