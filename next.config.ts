import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.supabase.co',
        port: '',
        pathname: '/storage/v1/object/public/**',
      },
    ],

    formats: [
      'image/avif',
      'image/webp',
    ],

    minimumCacheTTL: 86400,
  },

  async redirects() {
    return [
      {
        source: '/genre/:slug',
        destination: '/tag/:slug',
        permanent: true,
      },
    ]
  },
}

export default nextConfig