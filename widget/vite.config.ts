import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Serves the widget SPA (the iframe's actual content) at http://localhost:5173/
// The loader script (public/widget.js, built separately via vite.loader.config.ts)
// is what host sites/the demo site actually embed with a <script> tag.
export default defineConfig({
  plugins: [react()],
  server: { port: 5173 },
  preview: { port: 5173 },
  build: {
    outDir: "dist",
    emptyOutDir: true,
  },
});
