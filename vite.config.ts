import { defineConfig } from "vite";
import dts from "vite-plugin-dts";
import cssInjectedByJsPlugin from "vite-plugin-css-injected-by-js";

export default defineConfig({
  build: {
    lib: {
      entry: "src/index.ts",
      name: "pdfkitviewer",
      formats: ["es", "cjs", "umd"],
      fileName: (format) => `pdfkitviewer.${format}.js`,
    },
    rollupOptions: {
      external: ["pdfjs-dist", "pdf-lib", "lodash"],
      output: {
        globals: {
          "pdfjs-dist": "pdfjsDist",
          "pdf-lib": "PDFLib",
          lodash: "_",
        },
      },
    },
  },
  plugins: [cssInjectedByJsPlugin(), dts({ insertTypesEntry: true })],
});
