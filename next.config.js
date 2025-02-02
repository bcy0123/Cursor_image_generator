/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['pollinations.ai'], // Add any other domains your images come from
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
}

module.exports = nextConfig 