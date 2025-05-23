/**
 * Entry point for the PDF viewer module.
 * This module exports the `WebPdf` class, which is responsible for loading and managing PDF documents.
 */
import './index.css';
import PdfViewerKit from './base/web-pdf-viewer';

export { PdfViewerKit };
export * from './types/events.types';
export * from './types/geometry.types';
export * from './types/pagevirtualization.types';
export * from './types/thumbnail.types';
export * from './types/toolbar.types';
export * from './types/webpdf.types';
