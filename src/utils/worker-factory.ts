/**
 * Returns the URL that PDF.js should use for its worker script.
 */
export function getPdfWorkerSrc(): string {
  return new URL('pdfjs-dist/build/pdf.worker.min.mjs', import.meta.url).href;
}
