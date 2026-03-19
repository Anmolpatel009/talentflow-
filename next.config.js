/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['localhost', 'supabase.co'],
  },
  // Optimize production builds
  poweredByHeader: false,
  compress: true,
  // Generate ETags for caching
  generateEtags: true,
  // Strict mode for better development
  reactStrictMode: true,
  // Compiler optimizations - only include removeConsole in production (not compatible with Turbopack)
  compiler: process.env.NODE_ENV === 'production' ? {
    removeConsole: true,
  } : {},
  // Experimental features for better performance
  experimental: {
    // Optimize package imports
    optimizePackageImports: ['@supabase/supabase-js'],
  },
}

module.exports = nextConfig
