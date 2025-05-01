import { EllipseConfig, LineConfig, RectangleConfig } from '../types/geometry.types';
import { ShapeAnno } from '../viewer/services/AnnotationExportService';
/**
 * Convert an array of shape configurations into ShapeAnno objects
 * scaled to CSS pixels.
 *
 * @param configs - Array of RectangleConfig, EllipseConfig, or LineConfig
 * @param scale - Current zoom scale factor
 * @returns Array of ShapeAnno for export
 */
export declare function toShapeAnnos(configs: Array<RectangleConfig | EllipseConfig | LineConfig>, scale: number): ShapeAnno[];
/**
 * Normalize a CSS color input to a hex string, or return undefined
 * for transparent or unsupported formats.
 *
 * @param colorInput - CSS color name, hex code, or undefined
 * @returns Hex string (e.g. "#RRGGBB") or undefined
 */
export declare function normalizeColor(colorInput: string | undefined): string | undefined;
//# sourceMappingURL=annotation-utils.d.ts.map