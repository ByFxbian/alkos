import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'upload.wikimedia.org',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'www.svgrepo.com',
      },
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com'
      },
      {
        protocol: 'https',
        hostname: 'appleid.cdn-apple.com'
      },
      {
        protocol: 'https',
        hostname: 'is1-ssl.mzstatic.com'
      },
      {
        protocol: 'https',
        hostname: '*.public.blob.vercel-storage.com'
      }
    ],
  },
};

export default nextConfig;
