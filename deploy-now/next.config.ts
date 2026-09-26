import type { NextConfig } from 'next';

// Lolipop Deploy Now requires standalone output; the app only serves the
// static Lolipop edition copied into public/ by build.mjs.
const nextConfig: NextConfig = {
  output: 'standalone',
  async headers() {
    // Match the Apache .htaccess behavior: no caching, so pushes go live.
    return [{ source: '/:path*', headers: [{ key: 'Cache-Control', value: 'no-cache' }] }];
  },
};

export default nextConfig;
