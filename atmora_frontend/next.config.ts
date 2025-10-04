import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow cross-origin requests in development
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Access-Control-Allow-Origin',
            value: '*',
          },
          {
            key: 'Access-Control-Allow-Methods',
            value: 'GET, POST, PUT, DELETE, OPTIONS',
          },
          {
            key: 'Access-Control-Allow-Headers',
            value: 'Content-Type, Authorization',
          },
        ],
      },
    ];
  },
  
  // Optimize for ArcGIS and external resources
  images: {
    domains: ['js.arcgis.com'],
  },
};

export default nextConfig;
