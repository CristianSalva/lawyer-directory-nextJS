import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The data layer reads src/data/{state}.json at request time via a dynamic
  // path that Next.js cannot auto-trace. These routes render on-demand (see
  // generateStaticParams returning []), so the JSON must be bundled explicitly
  // into their serverless functions or they 500 with ENOENT in production.
  outputFileTracingIncludes: {
    "/[state]": ["./src/data/**"],
    "/[state]/attorneys/[slug]": ["./src/data/**"],
    "/[state]/firms/[slug]": ["./src/data/**"],
  },
};

export default nextConfig;
