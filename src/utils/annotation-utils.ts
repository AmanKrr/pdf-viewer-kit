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

import { INNER_PADDING_PX } from '../constants/geometry-constants';
import { EllipseConfig, LineConfig, RectangleConfig } from '../types/geometry';
import { ShapeAnno } from '../viewer/services/AnnotationExportService';

/**
 * Convert an array of shape configurations into ShapeAnno objects
 * scaled to CSS pixels.
 *
 * @param configs - Array of RectangleConfig, EllipseConfig, or LineConfig
 * @param scale - Current zoom scale factor
 * @returns Array of ShapeAnno for export
 */
export function toShapeAnnos(configs: Array<RectangleConfig | EllipseConfig | LineConfig>, scale: number): ShapeAnno[] {
  return configs.map((cfg) => _convertOne(cfg, scale));
}

/**
 * @internal
 * Convert a single shape configuration into a ShapeAnno.
 *
 * @param cfg - The shape configuration
 * @param scale - Zoom scale factor
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
 * @param r - RectangleConfig with logical coordinates
 * @param scale - Zoom scale factor
 */
function _rectToShape(r: RectangleConfig, scale: number): ShapeAnno {
  const x0 = r.x0 * scale;
  const y0 = r.y0 * scale;
  const width0 = r.x1 * scale; // x1 is logical width
  const height0 = r.y1 * scale; // y1 is logical height
  const pad = INNER_PADDING_PX * scale;

  return {
    page: r.pageNumber,
    kind: 'rectangle',
    x: x0 + pad,
    y: y0 + pad,
    width: width0 - pad * 2,
    height: height0 - pad * 2,
    stroke: r.strokeColor ?? '#000000',
    fill: r.fillColor,
    strokeWidth: r.strokeWidth ?? 1,
    opacity: r.opacity,
  };
}

/**
 * @internal
 * Transform an EllipseConfig into an EllipseAnno.
 *
 * @param e - EllipseConfig with center and radii
 * @param scale - Zoom scale factor
 */
function _ellipseToShape(e: EllipseConfig, scale: number): ShapeAnno {
  const cx = e.cx * scale;
  const cy = e.cy * scale;
  const rx = e.rx * scale;
  const ry = e.ry * scale;
  const pad = INNER_PADDING_PX * scale;

  return {
    page: e.pageNumber,
    kind: 'ellipse',
    x: cx - rx,
    y: cy - ry,
    width: rx * 2,
    height: ry * 2,
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
 * @param scale - Zoom scale factor
 */
function _lineToShape(l: LineConfig, scale: number): ShapeAnno {
  return {
    page: l.pageNumber,
    kind: 'line',
    x1: l.x1 * scale,
    y1: l.y1 * scale,
    x2: l.x2 * scale,
    y2: l.y2 * scale,
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
