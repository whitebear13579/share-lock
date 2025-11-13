import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    generateEtags: false,
    compress: false,
    onDemandEntries: {
        maxInactiveAge: 25 * 1000,
        pagesBufferLength: 2,
    },
    async headers() {
        return [
            {
                source: '/:path*',
                headers: [
                    {
                        key: 'Cross-Origin-Opener-Policy',
                        value: 'same-origin-allow-popups',
                    },
                ],
            },
        ];
    },
};

export default nextConfig;
