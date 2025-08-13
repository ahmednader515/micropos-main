/** @type {import('next').NextConfig} */
const nextConfig = {
  // Disable static generation for API routes
  serverExternalPackages: ['@prisma/client'],
  // Ensure API routes are not statically generated
  async headers() {
    return []
  },
  // Disable static optimization for API routes
  async rewrites() {
    return []
  }
}

module.exports = nextConfig 