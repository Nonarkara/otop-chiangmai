import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Static export → Cloudflare Pages direct upload. Every page is a client
  // component with no API routes, so there is nothing for a server to do.
  output: 'export',
  images: {
    unoptimized: true, // ponytail: static export has no image optimiser; both call sites use raw <img> anyway
    remotePatterns: [
      { protocol: 'https', hostname: '*.supabase.co' },
      { protocol: 'https', hostname: 'profile.line-scdn.net' },
    ],
  },
  turbopack: {},
};

export default nextConfig;
