/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['api.dicebear.com'],
  },
  experimental: {
    serverActions: {
      allowedOrigins: ['*']
    }
  }
}

export default nextConfig
