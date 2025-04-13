/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  images: {
    domains: ['api.dicebear.com'],
  },
  // Ensure experimental features are enabled for App Router
  experimental: {
    serverActions: true,
  },
}

export default nextConfig
