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
};

module.exports = nextConfig;
