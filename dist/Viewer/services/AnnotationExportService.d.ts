import type { PageViewport } from 'pdfjs-dist';
/**
 * Base properties for any shape annotation.
 */
export interface ShapeAnnoBase {
    /** 1-based page number */
    page: number;
    /** Stroke color in "#RRGGBB" format */
    stroke: string;
    /** Optional fill color in "#RRGGBB" format */
    fill?: string;
    /** Stroke width in CSS pixels (at creation zoom) */
    strokeWidth: number;
    /** Optional opacity [0–1] */
    opacity?: number;
}
/**
 * Rectangle annotation payload.
 */
export interface RectangleAnno extends ShapeAnnoBase {
    kind: 'rectangle';
    x: number;
    y: number;
    width: number;
    height: number;
}
/**
 * Ellipse annotation payload (bounding box form).
 */
export interface EllipseAnno extends ShapeAnnoBase {
    kind: 'ellipse';
    x: number;
    y: number;
    width: number;
    height: number;
}
/**
 * Line annotation payload.
 */
export interface LineAnno extends ShapeAnnoBase {
    kind: 'line';
    x1: number;
    y1: number;
    x2: number;
    y2: number;
}
/** Union of all supported annotation types. */
export type ShapeAnno = RectangleAnno | EllipseAnno | LineAnno;
/**
 * Service to export a PDF with embedded annotations.
 * Uses pdf-lib to draw shapes onto a fresh copy of the original PDF.
 */
export declare class PdfExportService {
    /**
     * Embeds annotations into a copy of the source PDF.
     *
     * @param originalBytes Raw bytes of the source PDF.
     * @param annotations   Array of annotations to draw.
     * @param viewports     Map from page number to its PDF.js viewport (at annotation scale).
     * @returns Uint8Array of the annotated PDF.
     */
    buildAnnotatedPdf(originalBytes: ArrayBuffer, annotations: ShapeAnno[], viewports: Map<number, PageViewport>): Promise<Uint8Array>;
    /**
     * Convert a value in CSS pixels to PDF points (1/72 in).
     *
     * @param px  Value in CSS px.
     * @param dpi Screen resolution, default 96 dpi.
     * @returns Value in PDF points.
     */
    private _cssPxToPt;
    /**
     * Convert a CSS‐space point to PDF user‐space point.
     * Handles rotation and scaling via the viewport.
     *
     * @param vp  PDF.js PageViewport at annotation scale.
     * @param x   CSS‐pixel X relative to viewport top-left.
     * @param y   CSS‐pixel Y relative to viewport top-left.
     * @returns Tuple [pdfX, pdfY] in PDF user‐space coords.
     */
    private static _toPdfPoint;
    /**
     * Convert a CSS‐space rectangle to PDF user‐space rectangle.
     * Ensures origin at bottom‐left in PDF coordinates.
     *
     * @param vp   PDF.js PageViewport at annotation scale.
     * @param rect Rectangle {x, y, width, height} in CSS px.
     * @returns Rectangle {x, y, width, height} in PDF points.
     */
    private static _toPdfRect;
    /**
     * Parse a hex color string "#RRGGBB" (or shorthand "#RGB") into an rgb tuple [r,g,b] in [0,1].
     * Logs errors and returns red [1,0,0] on invalid input.
     *
     * @param hex  Hex color string.
     * @returns [r, g, b] each in 0–1 range.
     */
    private static _hexToRgb;
}
//# sourceMappingURL=AnnotationExportService.d.ts.map