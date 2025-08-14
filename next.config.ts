import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    optimizePackageImports: ['@heroui/react'],
  },
  // 禁用預載功能
  generateEtags: false,
  compress: false,
  // 確保頁面轉換更流暢
  onDemandEntries: {
    maxInactiveAge: 25 * 1000,
    pagesBufferLength: 2,
  }
};

export default nextConfig;
