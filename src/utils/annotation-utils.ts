/*
  Copyright 2025 Aman Kumar

  Licensed under the Apache License, Version 2.0 (the "License");
  You may not use this file except in compliance with the License.
  You may obtain a copy of the License at

      http://www.apache.org/licenses/LICENSE-2.0

  Unless required by applicable law or agreed to in writing, software
  distributed under the License is distributed on an "AS IS" BASIS,
  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
  See the License for the specific language governing permissions and
  limitations under the License.
*/

import { RectangleConfig, EllipseConfig, LineConfig } from '../types/geometry.types';
import { RectangleAnno, EllipseAnno, LineAnno, ShapeAnno } from '../viewer/services/annotation-export.service';

/**
 * Normalizes rectangle coordinates to ensure proper positioning.
 * @param x0 - First X coordinate
 * @param y0 - First Y coordinate
 * @param x1 - Second X coordinate
 * @param y1 - Second Y coordinate
 * @returns Normalized rectangle with top, left, width, height
 */
export function normalizeRect(x0: number, y0: number, x1: number, y1: number) {
  const left = Math.min(x0, x1);
  const top = Math.min(y0, y1);
  const width = Math.abs(x1 - x0);
  const height = Math.abs(y1 - y0);
  return { top, left, width, height };
}

/**
 * Converts PDF coordinates to viewport coordinates for proper annotation positioning.
 * @param pdfCoords - PDF coordinates {x0, y0, x1, y1}
 * @param pageHeight - Page height in PDF points
 * @param viewport - PDF.js viewport object
 * @returns Viewport coordinates ready for annotation
 */
export function convertPdfToViewportCoords(pdfCoords: { x0: number; y0: number; x1: number; y1: number }, pageHeight: number, viewport: any) {
  // Flip Y coordinates (PDF uses bottom-left origin, viewport uses top-left)
  const pdfBL = { x: pdfCoords.x0, y: pageHeight - pdfCoords.y1 };
  const pdfTR = { x: pdfCoords.x1, y: pageHeight - pdfCoords.y0 };

  // Convert PDF space to viewport space
  const [vx0, vy0, vx1, vy1] = viewport.convertToViewportRectangle([pdfBL.x, pdfBL.y, pdfTR.x, pdfTR.y]);

  const left = Math.min(vx0, vx1);
  const top = Math.min(vy0, vy1);
  const width = Math.abs(vx1 - vx0);
  const height = Math.abs(vy1 - vy0);

  return { left, top, width, height };
}

/**
 * Converts viewport coordinates back to PDF coordinates.
 * @param viewportCoords - Viewport coordinates {left, top, width, height}
 * @param pageHeight - Page height in PDF points
 * @param viewport - PDF.js viewport object
 * @returns PDF coordinates
 */
export function convertViewportToPdfCoords(viewportCoords: { left: number; top: number; width: number; height: number }, pageHeight: number, viewport: any) {
  const right = viewportCoords.left + viewportCoords.width;
  const bottom = viewportCoords.top + viewportCoords.height;

  // Convert viewport space to PDF space
  const [px0, py0, px1, py1] = viewport.convertToPdfPointRectangle([viewportCoords.left, viewportCoords.top, right, bottom]);

  // Flip Y coordinates back
  const y0 = pageHeight - py1;
  const y1 = pageHeight - py0;

  return { x0: px0, y0, x1: px1, y1 };
}

/**
 * Convert an array of shape configurations into ShapeAnno objects
 * ready for PDF export. Coordinates are used as-is since they're already
 * at the correct scale from the annotation system.
 *
 * @param configs - Array of RectangleConfig, EllipseConfig, or LineConfig
 * @param scale - Current zoom scale factor (unused, kept for API compatibility)
 * @returns Array of ShapeAnno for export
 */
export function toShapeAnnos(configs: Array<RectangleConfig | EllipseConfig | LineConfig>, scale: number): ShapeAnno[] {
  // Note: We don't use scale here because coordinates are already at the correct scale
  return configs.map((cfg) => _convertOne(cfg, 1)); // Use scale=1 to avoid double scaling
}

/**
 * @internal
 * Convert a single shape configuration into a ShapeAnno.
 *
 * @param cfg - The shape configuration
 * @param scale - Scale factor (should be 1 to avoid double scaling)
 * @throws Error if cfg.type is unrecognized
 */
function _convertOne(cfg: RectangleConfig | EllipseConfig | LineConfig, scale: number): ShapeAnno {
  switch (cfg.type) {
    case 'rectangle':
      return _rectToShape(cfg, scale);
    case 'ellipse':
      return _ellipseToShape(cfg, scale);
    case 'line':
      return _lineToShape(cfg, scale);
    default: {
      const _never: never = cfg;
      throw new Error(`Unknown annotation type: ${(cfg as any).type}`);
    }
  }
}

/**
 * @internal
 * Transform a RectangleConfig into a RectangleAnno.
 *
 * @param r - RectangleConfig with corner coordinates (x0,y0) to (x1,y1)
 * @param scale - Scale factor (should be 1 to avoid double scaling)
 */
function _rectToShape(r: any, scale: number): ShapeAnno {
  // Handle both modern and legacy formats
  let coords;
  if (isModernFormat(r)) {
    coords = modernToLegacy(r);
  } else {
    coords = r;
  }

  // Calculate actual width and height from corner coordinates
  const actualWidth = Math.abs(coords.x1 - coords.x0);
  const actualHeight = Math.abs(coords.y1 - coords.y0);

  // Use the top-left corner as origin
  const x0 = Math.min(coords.x0, coords.x1);
  const y0 = Math.min(coords.y0, coords.y1);

  // NEW SYSTEM: Stored coordinates now represent actual shape coordinates
  // (not SVG container), so we can use them directly without padding adjustments
  return {
    page: coords.pageNumber,
    kind: 'rectangle',
    x: x0, // Direct shape coordinates (no padding adjustment needed)
    y: y0,
    width: actualWidth, // Direct shape dimensions (no padding adjustment needed)
    height: actualHeight,
    stroke: coords.strokeColor ?? '#000000',
    fill: coords.fillColor,
    strokeWidth: coords.strokeWidth ?? 1,
    opacity: coords.opacity,
  };
}

/**
 * @internal
 * Transform an EllipseConfig into an EllipseAnno.
 *
 * @param e - EllipseConfig with center and radii
 * @param scale - Scale factor (should be 1 to avoid double scaling)
 */
function _ellipseToShape(e: any, scale: number): ShapeAnno {
  // Ellipse coordinates are already actual shape coordinates (consistent with new system)
  const cx = e.cx;
  const cy = e.cy;
  const rx = e.rx;
  const ry = e.ry;

  return {
    page: e.pageNumber,
    kind: 'ellipse',
    x: cx - rx, // Bounding box left
    y: cy - ry, // Bounding box top
    width: rx * 2, // Bounding box width
    height: ry * 2, // Bounding box height
    stroke: e.strokeColor ?? '#000000',
    fill: e.fillColor,
    strokeWidth: e.strokeWidth ?? 1,
    opacity: e.opacity,
  };
}

/**
 * @internal
 * Transform a LineConfig into a LineAnno.
 *
 * @param l - LineConfig with endpoint coordinates
 * @param scale - Scale factor (should be 1 to avoid double scaling)
 */
function _lineToShape(l: LineConfig, scale: number): ShapeAnno {
  return {
    page: l.pageNumber,
    kind: 'line',
    x1: l.x1, // Line coordinates are already actual shape coordinates (consistent with new system)
    y1: l.y1,
    x2: l.x2,
    y2: l.y2,
    stroke: l.strokeColor ?? '#000000',
    strokeWidth: l.strokeWidth ?? 1,
    opacity: l.opacity,
  };
}

/** Map of CSS color names to hex codes. */
const COLOR_NAME_TO_HEX: Record<string, string> = {
  black: '#000000',
  silver: '#C0C0C0',
  gray: '#808080',
  white: '#FFFFFF',
  maroon: '#800000',
  red: '#FF0000',
  purple: '#800080',
  fuchsia: '#FF00FF',
  green: '#008000',
  lime: '#00FF00',
  olive: '#808000',
  yellow: '#FFFF00',
  navy: '#000080',
  blue: '#0000FF',
  teal: '#008080',
  aqua: '#00FFFF',
};

/**
 * Normalize a CSS color input to a hex string, or return undefined
 * for transparent or unsupported formats.
 *
 * @param colorInput - CSS color name, hex code, or undefined
 * @returns Hex string (e.g. "#RRGGBB") or undefined
 */
export function normalizeColor(colorInput: string | undefined): string | undefined {
  if (!colorInput) return undefined;
  const lower = colorInput.toLowerCase();

  if (lower === 'transparent') {
    return undefined;
  }

  if (COLOR_NAME_TO_HEX[lower]) {
    return COLOR_NAME_TO_HEX[lower];
  }

  if (/^#?([a-f\d]{3}|[a-f\d]{6})$/i.test(lower)) {
    return lower.startsWith('#') ? lower : `#${lower}`;
  }

  console.warn(`Unsupported color format: "${colorInput}". Treating as transparent/default.`);
  return undefined;
}

// ===== MODERN COORDINATE SYSTEM UTILITIES =====

/**
 * Detects if coordinates are in modern format (left, top, width, height)
 */
export function isModernFormat(coords: any): boolean {
  return coords.left !== undefined && coords.top !== undefined && coords.width !== undefined && coords.height !== undefined;
}

/**
 * Detects if coordinates are in legacy format (x0, y0, x1, y1)
 */
export function isLegacyFormat(coords: any): boolean {
  return coords.x0 !== undefined && coords.y0 !== undefined && coords.x1 !== undefined && coords.y1 !== undefined;
}

/**
 * Converts modern format to legacy format for backward compatibility
 */
export function modernToLegacy(modern: { left: number; top: number; width: number; height: number }) {
  return {
    x0: modern.left,
    y0: modern.top,
    x1: modern.left + modern.width,
    y1: modern.top + modern.height,
  };
}

/**
 * Converts legacy format to modern format
 */
export function legacyToModern(legacy: { x0: number; y0: number; x1: number; y1: number }) {
  return {
    left: legacy.x0,
    top: legacy.y0,
    width: legacy.x1 - legacy.x0,
    height: legacy.y1 - legacy.y0,
  };
}

/**
 * Normalizes coordinates to modern format, regardless of input format
 */
export function normalizeToModern(coords: any) {
  if (isModernFormat(coords)) {
    return coords;
  } else if (isLegacyFormat(coords)) {
    return legacyToModern(coords);
  } else {
    throw new Error('Invalid coordinate format. Expected either {left, top, width, height} or {x0, y0, x1, y1}');
  }
}

/**
 * Converts PSPDFKit coordinate format to our viewer's corner coordinate format.
 * PSPDFKit uses {left, top, width, height} while our viewer uses {x0, y0, x1, y1}.
 * @param pspdfkitCoords - PSPDFKit coordinates {left, top, width, height}
 * @returns Corner coordinates {x0, y0, x1, y1} for our viewer
 * @deprecated Use modernToLegacy instead
 */
export function convertPSPDFKitToViewerCoords(pspdfkitCoords: { left: number; top: number; width: number; height: number }) {
  return modernToLegacy(pspdfkitCoords);
}

/**
 * Converts our viewer's corner coordinates to PSPDFKit format.
 * @param viewerCoords - Our viewer coordinates {x0, y0, x1, y1}
 * @returns PSPDFKit coordinates {left, top, width, height}
 * @deprecated Use legacyToModern instead
 */
export function convertViewerToPSPDFKitCoords(viewerCoords: { x0: number; y0: number; x1: number; y1: number }) {
  return legacyToModern(viewerCoords);
}
