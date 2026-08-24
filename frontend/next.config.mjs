/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  swcMinify: true,
  experimental: {
    workerThreads: false,
    cpus: 1,
  },
  onDemandEntries: {
    maxInactiveAge: 60 * 1000,
    pagesBufferLength: 5,
  },
  webpack: (config, { isServer }) => {
    config.watchOptions = {
      poll: 1000,
      aggregateTimeout: 300,
    };
    // Ensure chunk loading timeout is resilient
    config.output = {
      ...config.output,
      chunkLoadingGlobal: 'webpackChunkner_logistics',
    };
    return config;
  },
};

export default nextConfig;
