/**
 * Entry point for the PDF viewer module.
 * This module exports the `PdfViewerKit` class, which is responsible for loading and managing PDF documents.
 * Now supports multiple PDFs with complete isolation between instances.
 */
import './index.css';
import PdfViewerKit from './base/web-pdf-viewer';
import { normalizeRect, convertPdfToViewportCoords } from './utils/annotation-utils';

// Export the main PdfViewerKit class (same as before)
export { default as PdfViewerKit } from './base/web-pdf-viewer';

// Export utility functions
export { normalizeRect, convertPdfToViewportCoords } from './utils/annotation-utils';

// Export types
export * from './types/events.types';
export * from './types/geometry.types';
export * from './types/pagevirtualization.types';
export * from './types/thumbnail.types';
export * from './types/toolbar.types';
export * from './types/webpdf.types';

// Default export for backward compatibility
export default PdfViewerKit;
