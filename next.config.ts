
import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
    ],
  },
  webpack: (config, { isServer }) => {
    // Adicionado para resolver o erro "Module not found: Can't resolve 'fs'" com pdf-parse
    if (!isServer) {
      config.resolve.fallback = {
        fs: false,
        canvas: false,
      };
    }
    return config;
  },
};

export default nextConfig;
