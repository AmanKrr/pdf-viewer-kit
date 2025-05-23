import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';
import cssInjectedByJsPlugin from 'vite-plugin-css-injected-by-js';

export default defineConfig(({ command }) => {
  console.log('command', command);
  if (command === 'serve') {
    // DEV: serve your demo
    return {
      root: 'examples',
      // If you want a different port:
      // server: { port: 5174 },
      server: {
        open: '/', // auto-open http://localhost:5173/
      },
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
      plugins: [cssInjectedByJsPlugin(), dts({ insertTypesEntry: true })],
    };
  }
});
