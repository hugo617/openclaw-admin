import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["better-sqlite3"],
  env: {
    NEXT_PUBLIC_OPENCLAW_HOME: process.env.OPENCLAW_HOME || "~/.openclaw",
  },
};

export default nextConfig;
