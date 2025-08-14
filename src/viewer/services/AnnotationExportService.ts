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

import { PDFDocument, rgb } from 'pdf-lib';
import type { PageViewport } from 'pdfjs-dist';
import { normalizeColor } from '../../utils/annotation-utils';

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
export class PdfExportService {
  /**
   * Embeds annotations into a copy of the source PDF.
   *
   * @param originalBytes Raw bytes of the source PDF.
   * @param annotations   Array of annotations to draw.
   * @param viewports     Map from page number to its PDF.js viewport (at annotation scale).
   * @param onProgress    Optional progress callback for tracking build progress.
   * @returns Uint8Array of the annotated PDF.
   */
  public async buildAnnotatedPdf(
    originalBytes: ArrayBuffer,
    annotations: ShapeAnno[],
    viewports: Map<number, PageViewport>,
    onProgress?: (progress: number) => void,
  ): Promise<Uint8Array> {
    const pdf = await PDFDocument.load(originalBytes);
    onProgress?.(0.7); // PDF loaded

    // Group annotations by page for better performance
    const annotationsByPage = new Map<number, ShapeAnno[]>();
    for (const annotation of annotations) {
      if (!annotationsByPage.has(annotation.page)) {
        annotationsByPage.set(annotation.page, []);
      }
      annotationsByPage.get(annotation.page)!.push(annotation);
    }

    const totalAnnotations = annotations.length;
    let processedAnnotations = 0;

    // Process annotations page by page
    for (const [pageNum, pageAnnotations] of annotationsByPage) {
      const page = pdf.getPage(pageNum - 1);
      const vp = viewports.get(pageNum);

      if (!vp) {
        console.warn(`Skipping annotations on page ${pageNum}: Viewport not found.`);
        processedAnnotations += pageAnnotations.length;
        continue;
      }

      // Process all annotations for this page
      for (const a of pageAnnotations) {
        try {
          const [r, g, b] = PdfExportService._hexToRgb(a.stroke);
          const fillHex = normalizeColor(a.fill);
          const fillRgb = fillHex ? PdfExportService._hexToRgb(fillHex) : undefined;
          const linePt = this._cssPxToPt(a.strokeWidth);
          const opacity = a.opacity ?? 1;

          switch (a.kind) {
            case 'rectangle': {
              const pdfRect = PdfExportService._toPdfRect(vp, a);
              page.drawRectangle({
                x: pdfRect.x,
                y: pdfRect.y,
                width: pdfRect.width,
                height: pdfRect.height,
                borderColor: rgb(r, g, b),
                borderWidth: linePt,
                color: fillRgb ? rgb(...fillRgb) : undefined,
                opacity,
                borderOpacity: opacity,
              });
              break;
            }
            case 'ellipse': {
              const pdfRect = PdfExportService._toPdfRect(vp, a);
              page.drawEllipse({
                x: pdfRect.x + pdfRect.width / 2,
                y: pdfRect.y + pdfRect.height / 2,
                xScale: pdfRect.width / 2,
                yScale: pdfRect.height / 2,
                borderColor: rgb(r, g, b),
                borderWidth: linePt,
                color: fillRgb ? rgb(...fillRgb) : undefined,
                opacity,
                borderOpacity: opacity,
              });
              break;
            }
            case 'line': {
              const [sx, sy] = PdfExportService._toPdfPoint(vp, a.x1, a.y1);
              const [ex, ey] = PdfExportService._toPdfPoint(vp, a.x2, a.y2);
              page.drawLine({
                start: { x: sx, y: sy },
                end: { x: ex, y: ey },
                thickness: linePt,
                color: rgb(r, g, b),
                opacity,
              });
              break;
            }
            default:
              console.warn('Unsupported annotation kind:', (a as any).kind);
          }
        } catch (error) {
          console.error(`Error processing annotation on page ${pageNum}:`, error);
        }

        processedAnnotations++;
        // Update progress for annotation processing (70% to 85%)
        const annotationProgress = 0.7 + (processedAnnotations / totalAnnotations) * 0.15;
        onProgress?.(annotationProgress);
      }
    }

    // Save with optimized settings for better performance and smaller file size
    onProgress?.(0.85); // Starting save
    const pdfBytes = await pdf.save({
      useObjectStreams: true, // Enable for smaller file size
      addDefaultPage: false,
      objectsPerTick: 50, // Process in smaller batches to avoid blocking
    });

    return pdfBytes;
  }

  /**
   * Convert a value in CSS pixels to PDF points (1/72 in).
   *
   * @param px  Value in CSS px.
   * @param dpi Screen resolution, default 96 dpi.
   * @returns Value in PDF points.
   */
  private _cssPxToPt(px: number, dpi = 96): number {
    return (px / dpi) * 72;
  }

  /**
   * Convert a CSS‐space point to PDF user‐space point.
   * Handles rotation and scaling via the viewport.
   *
   * @param vp  PDF.js PageViewport at annotation scale.
   * @param x   CSS‐pixel X relative to viewport top-left.
   * @param y   CSS‐pixel Y relative to viewport top-left.
   * @returns Tuple [pdfX, pdfY] in PDF user‐space coords.
   */
  private static _toPdfPoint(vp: PageViewport, x: number, y: number) {
    return vp.convertToPdfPoint(x, y);
  }

  /**
   * Convert a CSS‐space rectangle to PDF user‐space rectangle.
   * Ensures origin at bottom‐left in PDF coordinates.
   *
   * @param vp   PDF.js PageViewport at annotation scale.
   * @param rect Rectangle {x, y, width, height} in CSS px.
   * @returns Rectangle {x, y, width, height} in PDF points.
   */
  private static _toPdfRect(vp: PageViewport, rect: { x: number; y: number; width: number; height: number }): { x: number; y: number; width: number; height: number } {
    const [x1, y1] = vp.convertToPdfPoint(rect.x, rect.y);
    const [x2, y2] = vp.convertToPdfPoint(rect.x + rect.width, rect.y + rect.height);
    const pdfX = Math.min(x1, x2);
    const pdfY = Math.min(y1, y2);
    const pdfW = Math.abs(x2 - x1);
    const pdfH = Math.abs(y2 - y1);
    return { x: pdfX, y: pdfY, width: pdfW, height: pdfH };
  }

  /**
   * Parse a hex color string "#RRGGBB" (or shorthand "#RGB") into an rgb tuple [r,g,b] in [0,1].
   * Logs errors and returns red [1,0,0] on invalid input.
   *
   * @param hex  Hex color string.
   * @returns [r, g, b] each in 0–1 range.
   */
  private static _hexToRgb(hex: string): [number, number, number] {
    const defaultColor: [number, number, number] = [1, 0, 0];
    if (typeof hex !== 'string') {
      console.error(`Invalid hex color: ${hex}`);
      return defaultColor;
    }

    const shorthand = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
    hex = hex.replace(shorthand, (_, r, g, b) => `#${r}${r}${g}${g}${b}${b}`);

    const full = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (!full) {
      console.error(`Failed to parse hex color: ${hex}`);
      return defaultColor;
    }

    const [_, rs, gs, bs] = full;
    return [parseInt(rs, 16) / 255, parseInt(gs, 16) / 255, parseInt(bs, 16) / 255];
  }
}
