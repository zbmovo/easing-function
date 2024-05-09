import path from "node:path";
import { defineConfig } from "vite";

// https://vitejs.dev/config/
export default defineConfig({
  root: "./examples/",
  base: "/easing-function",
  resolve: {
    alias: {
      "@": path.join(import.meta.dirname, "src"),
    },
  },
});
