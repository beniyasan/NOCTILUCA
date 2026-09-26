import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { NextConfig } from 'next';

const here = path.dirname(fileURLToPath(import.meta.url));

// Lolipop Deploy Now requires standalone output; the app only serves the
// static Lolipop edition copied into public/ by build.mjs. The tracing root is
// pinned here so the standalone layout stays flat (.next/standalone/server.js)
// instead of nesting under the app dir name.
const nextConfig: NextConfig = {
  output: 'standalone',
  outputFileTracingRoot: here,
  async headers() {
    // Match the Apache .htaccess behavior: no caching, so pushes go live.
    return [{ source: '/:path*', headers: [{ key: 'Cache-Control', value: 'no-cache' }] }];
  },
};

export default nextConfig;
