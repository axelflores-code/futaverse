import type { NextConfig } from 'next'

const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
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