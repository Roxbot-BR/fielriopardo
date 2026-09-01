import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  output: 'standalone',
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'upload.wikimedia.org' },
      { protocol: 'https', hostname: 'via.placeholder.com' },
      { protocol: 'https', hostname: 'fielriopardo.com.br' },
      { protocol: 'https', hostname: 'i.imgur.com' },
      { protocol: 'https', hostname: 'logodetimes.com' },
      { protocol: 'https', hostname: '**.fbcdn.net' },
      { protocol: 'https', hostname: 'cdn.sportsapi.com' },
      { protocol: 'https', hostname: 'cdn.meutimao.com.br' },
      { protocol: 'https', hostname: '**.meutimao.com.br' },
      { protocol: 'https', hostname: 's.glbimg.com' },
      { protocol: 'https', hostname: '**.glbimg.com' },
      { protocol: 'https', hostname: '**.globo.com' },
      { protocol: 'https', hostname: '**.ge.globo.com' },
      { protocol: 'https', hostname: '**.espn.com' },
      { protocol: 'https', hostname: 'a.espncdn.com' },
      { protocol: 'https', hostname: 'media.api-sports.io' },
    ],
  },
};

export default nextConfig;
