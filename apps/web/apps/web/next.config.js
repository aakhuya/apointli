/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['localhost', 'storage.googleapis.com'],
  },
  // Suppress React DevTools warning in development
  reactStrictMode: true,
  // Remove the warning about serverActions (it's default now)
}

module.exports = nextConfig
