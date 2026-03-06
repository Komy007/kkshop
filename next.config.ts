import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
    output: 'standalone',
    typescript: {
        // !! WARN !!
        // Dangerously allow production builds to successfully complete even if
        // your project has type errors. This is required because Vercel's free tier
        // memory limit (1024MB) is causing OOM crashes during type checking.
        ignoreBuildErrors: true,
    },
    images: {
        // Prioritize modern formats for Cambodia's bandwidth constraints
        formats: ['image/webp', 'image/avif'],

        // Optimized device sizes for mobile-first Cambodia market
        deviceSizes: [640, 750, 828, 1080, 1200],
        imageSizes: [16, 32, 48, 64, 96, 128, 256],

        remotePatterns: [
            // Google Cloud Storage — primary image hosting
            {
                protocol: 'https',
                hostname: 'storage.googleapis.com',
            },
            // GCS alternate domain
            {
                protocol: 'https',
                hostname: '*.storage.googleapis.com',
            },
            // Unsplash — fallback / placeholder images
            {
                protocol: 'https',
                hostname: 'images.unsplash.com',
            },
            // Pravatar — avatar placeholders
            {
                protocol: 'https',
                hostname: 'i.pravatar.cc',
            },
        ],

        // Cache optimized images for 30 days
        minimumCacheTTL: 2592000,
    },
};

export default nextConfig;
