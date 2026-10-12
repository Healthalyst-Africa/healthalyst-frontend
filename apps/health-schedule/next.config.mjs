import { fileURLToPath } from "node:url";

const nextConfiguration = {
  reactStrictMode: true,
  output: "standalone",
  outputFileTracingRoot: fileURLToPath(new URL("../..", import.meta.url)),
  transpilePackages: ["@healthalyst/ui"],
  typescript: {
    ignoreBuildErrors: false,
  },
};

export default nextConfiguration;
