import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Workspace packages are TS source. Tell Next to transpile them so we can
  // import them directly without a separate build step.
  transpilePackages: ["@data-tw/db", "@data-tw/connectors"],
  // Avoid "Module not found: Can't resolve 'pino'" complaints when client
  // component graph accidentally pulls in server-only imports.
  serverExternalPackages: ["pino", "node-cron", "postgres"],
};

export default nextConfig;