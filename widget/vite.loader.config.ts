import { defineConfig } from "vite";
import path from "path";

// Builds src/loader.ts into a single dependency-free IIFE: public/widget.js.
// This is the literal file host sites embed via:
//   <script src="http://localhost:5173/widget.js" data-tenant-id="..."></script>
export default defineConfig({
  build: {
    outDir: "public",
    emptyOutDir: false,
    lib: {
      entry: path.resolve(__dirname, "src/loader.ts"),
      name: "NovaDeskWidgetLoader",
      formats: ["iife"],
      fileName: () => "widget.js",
    },
    minify: true,
  },
});
