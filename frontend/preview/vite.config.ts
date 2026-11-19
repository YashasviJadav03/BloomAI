import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// The features live in ../src, outside this folder, so their bare imports
// (react, recharts, test libraries) are pointed at this folder's node_modules.
const nm = (pkg: string) => fileURLToPath(new URL(`./node_modules/${pkg}`, import.meta.url));

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: [
      { find: /^react$/, replacement: nm("react") },
      { find: /^react\/(.*)$/, replacement: nm("react/$1") },
      { find: /^react-dom$/, replacement: nm("react-dom") },
      { find: /^react-dom\/(.*)$/, replacement: nm("react-dom/$1") },
      { find: /^recharts$/, replacement: nm("recharts") },
      { find: /^@testing-library\/react$/, replacement: nm("@testing-library/react") },
    ],
    dedupe: ["react", "react-dom"],
  },
  server: { port: 5173, fs: { allow: [".."] } },
  test: { dir: "..", include: ["src/**/*.test.{ts,tsx}"] },
});
