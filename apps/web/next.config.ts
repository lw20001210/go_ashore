import type { NextConfig } from "next";
import os from "node:os";
import path from "node:path";

function getLanOrigins(): string[] {
  const fromEnv = process.env.DEV_ALLOWED_ORIGINS?.split(",")
    .map((item) => item.trim())
    .filter(Boolean);

  if (fromEnv?.length) return fromEnv;

  const origins = new Set<string>();
  for (const iface of Object.values(os.networkInterfaces())) {
    for (const addr of iface ?? []) {
      if (addr.family === "IPv4" && !addr.internal) {
        origins.add(addr.address);
      }
    }
  }

  return [...origins];
}

const nextConfig: NextConfig = {
  allowedDevOrigins: getLanOrigins(),
  devIndicators: false,
  output: "standalone",
  turbopack: {
    root: path.resolve(__dirname, "../.."),
  },
  async headers() {
    return [
      {
        source: "/((?!_next|favicon.ico|icon.svg|manifest.json|sw.js).*)",
        headers: [{ key: "Cache-Control", value: "no-transform" }],
      },
    ];
  },
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: "http://localhost:3001/api/:path*",
      },
    ];
  },
};

export default nextConfig;
