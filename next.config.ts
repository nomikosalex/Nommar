import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Pin the workspace root (a stray lockfile in the home dir confuses inference).
  turbopack: {
    root: __dirname,
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
          { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains' },
          // Images-only CSP: local assets + data URIs + Supabase Storage (public
          // service images). Scoped to img-src so scripts/styles stay unrestricted
          // (the app relies on inline styles). No default-src → other types unaffected.
          { key: 'Content-Security-Policy', value: "img-src 'self' data: https://*.supabase.co" },
        ],
      },
    ];
  },
};

export default nextConfig;
