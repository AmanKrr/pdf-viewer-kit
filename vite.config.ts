import { defineConfig } from 'vite';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dts from 'vite-plugin-dts';
import cssInjectedByJsPlugin from 'vite-plugin-css-injected-by-js';
import { viteStaticCopy } from 'vite-plugin-static-copy';

export default defineConfig(({ command }) => {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  const pdfjsImagesAbs = path.resolve(__dirname, 'node_modules/pdfjs-dist/web/images');
  const viewerAssetsAbs = path.resolve(__dirname, 'src/viewer/assets');
  if (command === 'serve') {
    return {
      root: 'examples',
      server: {
        open: '/',
      },
      plugins: [
        viteStaticCopy({
          targets: [
            {
              src: `${pdfjsImagesAbs}/*`,
              dest: 'pdfjs/web/images',
            },
          ],
        }),
      ],
    };
  } else {
    return {
      build: {
        lib: {
          entry: 'src/index.ts',
          name: 'pdfkitviewer',
          formats: ['es', 'cjs', 'umd'],
          fileName: (format) => `pdfkitviewer.${format}.js`,
        },
        rollupOptions: {
          external: ['pdfjs-dist', 'pdf-lib', 'lodash', './index.html', './main.ts'],
          output: {
            globals: {
              'pdfjs-dist': 'pdfjsDist',
              'pdf-lib': 'PDFLib',
              lodash: '_',
            },
          },
        },
      },
      plugins: [
        cssInjectedByJsPlugin(),
        dts({ insertTypesEntry: true }),
        viteStaticCopy({
          targets: [
            {
              src: viewerAssetsAbs,
              dest: 'viewer',
            },
            {
              src: `${pdfjsImagesAbs}/*`,
              dest: 'pdfjs/web/images',
            },
          ],
        }),
      ],
    };
  }
});