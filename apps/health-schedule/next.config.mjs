import { fileURLToPath } from "node:url";

const nextConfiguration = {
  reactStrictMode: true,
  output: "standalone",
  outputFileTracingRoot: fileURLToPath(new URL("../..", import.meta.url)),
  transpilePackages: ["@healthalyst/ui", "@healthalyst/icons"],
  typescript: {
    ignoreBuildErrors: false,
  },
};

export default nextConfiguration;
