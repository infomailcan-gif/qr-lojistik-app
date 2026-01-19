/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    // Production build'de ESLint uyarıları hataya dönüştürülmesin
    ignoreDuringBuilds: false,
  },
  typescript: {
    // Production build'de TypeScript hataları kontrol edilsin
    ignoreBuildErrors: false,
  },
  // Supabase ve diğer external image'lar için
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.supabase.co',
      },
    ],
  },
  // Logging seviyesi
  logging: {
    fetches: {
      fullUrl: false,
    },
  },
  // Performans Optimizasyonları
  compiler: {
    // Production'da console.log'ları kaldır
    removeConsole: process.env.NODE_ENV === 'production',
  },
  // Bundle optimizasyonu
  experimental: {
    // Optimize package imports
    optimizePackageImports: ['lucide-react', 'framer-motion'],
  },
  // Powered by header'ını kaldır (küçük performans artışı)
  poweredByHeader: false,
  // Compression
  compress: true,
};

module.exports = nextConfig;
