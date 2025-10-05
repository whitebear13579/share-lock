import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    generateEtags: false,
    compress: false,
    onDemandEntries: {
        maxInactiveAge: 25 * 1000,
        pagesBufferLength: 2,
    },
};

export default nextConfig;
