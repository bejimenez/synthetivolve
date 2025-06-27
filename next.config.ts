/** @type {import('next').NextConfig} */
interface ExperimentalConfig {
  serverActions: boolean;
}

interface WebpackConfig {
  resolve: {
    fallback: {
      fs: boolean;
      net: boolean;
      tls: boolean;
    };
  };
}

interface NextConfig {
  experimental: ExperimentalConfig;
  reactStrictMode: boolean;
  webpack: (config: WebpackConfig) => WebpackConfig;
}

const nextConfig: NextConfig = {
  experimental: {
    serverActions: true,
  },
  // Suppress hydration warnings in development
  reactStrictMode: true,
  // Handle dynamic imports properly
  webpack: (config: WebpackConfig): WebpackConfig => {
    config.resolve.fallback = { fs: false, net: false, tls: false };
    return config;
  },
}

module.exports = nextConfig