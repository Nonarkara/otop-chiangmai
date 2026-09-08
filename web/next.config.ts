import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '*.supabase.co' },
      { protocol: 'https', hostname: 'profile.line-scdn.net' },
    ],
  },
  turbopack: {},
};

export default nextConfig;
