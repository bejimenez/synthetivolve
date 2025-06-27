/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Remove experimental serverActions as it's not needed in Next.js 15
  // Remove webpack config that conflicts with Turbopack
}

module.exports = nextConfig