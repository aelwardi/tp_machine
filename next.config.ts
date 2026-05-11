import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    mages: {
        remotePatterns: [
            {
                protocol: "https",
                hostname: "raw.githubusercontent.com",
            },
            {
                protocol: "https",
                hostname: "static.wikia.nocookie.net",
            },
        ],
    },};

export default nextConfig;
