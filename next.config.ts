import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // WebAssembly support per @imgly/background-removal
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.experiments = {
        ...config.experiments,
        asyncWebAssembly: true,
      };
    }
    return config;
  },
};

export default nextConfig;