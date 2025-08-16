/*
  Copyright 2025 Aman Kumar

  Licensed under the Apache License, Version 2.0 (the "License");
  you may not use this file except in compliance with the License.
  You may obtain a copy of the License at

      http://www.apache.org/licenses/LICENSE-2.0

  Unless required by applicable law or agreed to in writing, software
  distributed under the License is distributed on an "AS IS" BASIS,
  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, express or implied.
  See the License for the specific language governing permissions and
  limitations under the License.
*/

/**
 * Main entry point for the PDF viewer library.
 *
 * This module exports the core PdfViewerKit class and all essential utilities,
 * types, and interfaces needed for PDF viewing functionality.
 *
 * Features:
 * - Multi-instance PDF support with complete isolation
 * - Annotation tools and utilities
 * - Comprehensive type definitions
 * - Modern ES6+ module structure
 */
import './index.css';

export { default as PdfViewerKit } from './base/web-pdf-viewer';
export { normalizeRect, convertPdfToViewportCoords } from './utils/annotation-utils';

export * from './types/events.types';
export * from './types/geometry.types';
export * from './types/page-virtualization.types';
export * from './types/thumbnail.types';
export * from './types/toolbar.types';
export * from './types/webpdf.types';
