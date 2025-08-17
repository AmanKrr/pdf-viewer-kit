/*
  Copyright 2025 Aman Kumar

  Licensed under the Apache License, Version 2.0 (the "License");
  you may not use this file except in compliance with the License.
  You may obtain a copy of the License at

      http://www.apache.org/licenses/LICENSE-2.0

  Unless required by applicable law or agreed to in writing, software
  distributed under the License is distributed on an "AS IS" BASIS,
  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
  See the License for the specific language governing permissions and
  limitations under the License.
*/

import './index.css';

// Core PDF viewer class
import PdfViewerKitClass from './base/web-pdf-viewer';
export { default as PdfViewerKit } from './base/web-pdf-viewer';

// Public API interfaces and types
export * from './public-api';

// Utility functions
import { normalizeRect, convertPdfToViewportCoords } from './utils/annotation-utils';
export { normalizeRect, convertPdfToViewportCoords } from './utils/annotation-utils';

// Additional types for advanced usage
export type { IShapeConfig, IRectangleConfig, IEllipseConfig, ILineConfig, ICoordinateConverter, ICoordinateValidation } from './public-api';

// Library namespace for organized access
export const PDFViewerKit = {
  // Main viewer class
  Viewer: PdfViewerKitClass,

  // Event constants
  Events: {
    SCALE_CHANGE: 'scaleChange',
    ANNOTATION_SELECTED: 'ANNOTATION_SELECTED',
    ANNOTATION_CREATED: 'ANNOTATION_CREATED',
    ANNOTATION_DELETED: 'ANNOTATION_DELETED',
    ANNOTATION_DESELECT: 'ANNOTATION_DESELECT',
    ANNOTATION_UPDATED: 'ANNOTATION_UPDATED',
    INTERACTIVE_MODE_CHANGED: 'interactiveModeChanged',
  },

  // Utility functions
  Utils: {
    normalizeRect,
    convertPdfToViewportCoords,
  },
} as const;
