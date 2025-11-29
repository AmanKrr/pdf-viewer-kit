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

import type { PDFPageProxy, PageViewport, RenderTask } from 'pdfjs-dist';
import type { RenderParameters } from 'pdfjs-dist/types/src/display/api';

/**
 * PageRenderer - PDF Page Rendering Module
 *
 * Handles all PDF.js rendering operations:
 * - Low-res base canvas rendering
 * - High-res bitmap rendering
 * - Offscreen canvas management
 * - Render task lifecycle
 * - ImageBitmap creation and management
 *
 * This module encapsulates all PDF.js rendering complexity
 * and provides a clean API for PageVirtualization.
 */

/**
 * Canvas pool interface for dependency injection
 */
export interface CanvasPool {
  getCanvas(width: number, height: number): [HTMLCanvasElement, CanvasRenderingContext2D];
  releaseCanvas(canvas: HTMLCanvasElement): void;
}

/**
 * Render quality levels
 */
export type RenderQuality = 'low' | 'base' | 'high';

/**
 * Base render options
 */
export interface BaseRenderOptions {
  page: PDFPageProxy;
  viewport: PageViewport;
  canvasPool: CanvasPool;
  scale: number;
  pageNumber: number;
}

/**
 * High-res render options
 */
export interface HighResRenderOptions extends BaseRenderOptions {
  currentViewport: PageViewport;
}

/**
 * Render result
 */
export interface RenderResult {
  success: boolean;
  cancelled?: boolean;
  canvas?: HTMLCanvasElement;
  bitmap?: ImageBitmap;
  renderTask?: RenderTask;
  error?: Error;
}

/**
 * Active render tracking
 */
interface ActiveRender {
  renderTask: RenderTask;
  canvas: HTMLCanvasElement;
  quality: RenderQuality;
}

/**
 * PageRenderer
 *
 * Encapsulates all PDF.js rendering logic.
 * Manages render tasks, canvases, and bitmaps.
 */
export class PageRenderer {
  private activeRenders = new Map<number, ActiveRender>();
  private activeBitmaps = new Map<number, ImageBitmap>();

  /**
   * Render base canvas (low or medium resolution for quick display)
   *
   * @param options Render options
   * @returns Render result with canvas
   */
  async renderBaseCanvas(options: BaseRenderOptions): Promise<RenderResult> {
    const { page, viewport, canvasPool, scale, pageNumber } = options;

    // Cancel any existing base render for this page
    this.cancelPageRender(pageNumber, 'base');

    // Calculate base render scale (lower res for quick display)
    const baseRenderScale = scale > 1 ? Math.min(1.0, scale / 2) : scale;
    const baseViewport = page.getViewport({ scale: baseRenderScale });

    // Get canvas from pool
    const [canvas, context] = canvasPool.getCanvas(baseViewport.width, baseViewport.height);

    // Apply CSS scaling if needed
    if (scale > 1) {
      canvas.style.width = 'inherit';
      canvas.style.height = 'inherit';
    }

    try {
      const renderParams: RenderParameters = {
        canvasContext: context,
        canvas,
        viewport: baseViewport,
        annotationMode: 2, // ENABLE_FORMS
      };

      const renderTask = page.render(renderParams);

      // Track active render
      this.activeRenders.set(pageNumber, {
        renderTask,
        canvas,
        quality: 'base',
      });

      await renderTask.promise;

      // Remove from active renders
      this.activeRenders.delete(pageNumber);

      return {
        success: true,
        canvas,
        renderTask,
      };
    } catch (error: any) {
      // Remove from active renders
      this.activeRenders.delete(pageNumber);

      // Release canvas back to pool
      canvasPool.releaseCanvas(canvas);

      if (error?.name === 'RenderingCancelledException') {
        return {
          success: false,
          cancelled: true,
        };
      }

      return {
        success: false,
        error,
      };
    }
  }

  /**
   * Render high-resolution image using offscreen canvas and ImageBitmap
   *
   * @param options High-res render options
   * @returns Render result with bitmap
   */
  async renderHighResImage(options: HighResRenderOptions): Promise<RenderResult> {
    const { page, currentViewport, canvasPool, pageNumber } = options;

    // Cancel any existing high-res render for this page
    this.cancelPageRender(pageNumber, 'high');

    // Clean up old bitmap
    const oldBitmap = this.activeBitmaps.get(pageNumber);
    if (oldBitmap) {
      oldBitmap.close();
      this.activeBitmaps.delete(pageNumber);
    }

    // Get offscreen canvas from pool
    const [offscreenCanvas, offscreenContext] = canvasPool.getCanvas(
      currentViewport.width,
      currentViewport.height
    );

    try {
      const renderParams: RenderParameters = {
        canvasContext: offscreenContext,
        canvas: offscreenCanvas,
        viewport: currentViewport,
        annotationMode: 2, // ENABLE_FORMS
      };

      const renderTask = page.render(renderParams);

      // Track active render
      this.activeRenders.set(pageNumber, {
        renderTask,
        canvas: offscreenCanvas,
        quality: 'high',
      });

      await renderTask.promise;

      // Create ImageBitmap from offscreen canvas
      const bitmap = await createImageBitmap(offscreenCanvas);

      // Store bitmap
      this.activeBitmaps.set(pageNumber, bitmap);

      // Remove from active renders
      this.activeRenders.delete(pageNumber);

      // Release offscreen canvas back to pool
      canvasPool.releaseCanvas(offscreenCanvas);

      return {
        success: true,
        bitmap,
        renderTask,
      };
    } catch (error: any) {
      // Remove from active renders
      this.activeRenders.delete(pageNumber);

      // Release canvas back to pool
      canvasPool.releaseCanvas(offscreenCanvas);

      if (error?.name === 'RenderingCancelledException') {
        return {
          success: false,
          cancelled: true,
        };
      }

      return {
        success: false,
        error,
      };
    }
  }

  /**
   * Create display canvas from ImageBitmap with device pixel ratio scaling
   *
   * @param bitmap ImageBitmap to display
   * @param viewport Target viewport for sizing
   * @returns Display canvas element
   */
  createDisplayCanvas(bitmap: ImageBitmap, viewport: PageViewport): HTMLCanvasElement {
    const displayCanvas = document.createElement('canvas');
    const ratio = window.devicePixelRatio || 1;

    // Set canvas size with device pixel ratio
    displayCanvas.width = Math.floor(viewport.width * ratio);
    displayCanvas.height = Math.floor(viewport.height * ratio);

    // Set CSS size
    displayCanvas.style.width = `${viewport.width}px`;
    displayCanvas.style.height = `${viewport.height}px`;

    // Draw bitmap to display canvas
    const displayCtx = displayCanvas.getContext('2d');
    if (displayCtx) {
      displayCtx.drawImage(bitmap, 0, 0, displayCanvas.width, displayCanvas.height);
    }

    return displayCanvas;
  }

  /**
   * Cancel render for a specific page
   *
   * @param pageNumber Page number to cancel
   * @param quality Quality level to cancel ('base', 'high', or 'all')
   */
  cancelPageRender(pageNumber: number, quality: RenderQuality | 'all' = 'all'): void {
    const activeRender = this.activeRenders.get(pageNumber);

    if (activeRender) {
      // Check if we should cancel this quality level
      if (quality === 'all' || quality === activeRender.quality) {
        // Cancel the render task
        activeRender.renderTask.cancel();

        // Remove from active renders
        this.activeRenders.delete(pageNumber);
      }
    }

    // Clean up bitmap if cancelling high-res
    if (quality === 'high' || quality === 'all') {
      const bitmap = this.activeBitmaps.get(pageNumber);
      if (bitmap) {
        bitmap.close();
        this.activeBitmaps.delete(pageNumber);
      }
    }
  }

  /**
   * Cancel all active renders
   */
  cancelAllRenders(): void {
    this.activeRenders.forEach((activeRender, pageNumber) => {
      activeRender.renderTask.cancel();
    });

    this.activeRenders.clear();

    // Clean up all bitmaps
    this.activeBitmaps.forEach((bitmap) => {
      bitmap.close();
    });

    this.activeBitmaps.clear();
  }

  /**
   * Get active render for a page
   *
   * @param pageNumber Page number
   * @returns Active render or undefined
   */
  getActiveRender(pageNumber: number): ActiveRender | undefined {
    return this.activeRenders.get(pageNumber);
  }

  /**
   * Check if a page is currently rendering
   *
   * @param pageNumber Page number to check
   * @param quality Optional quality level to check
   * @returns True if page is rendering
   */
  isRendering(pageNumber: number, quality?: RenderQuality): boolean {
    const activeRender = this.activeRenders.get(pageNumber);

    if (!activeRender) {
      return false;
    }

    if (quality) {
      return activeRender.quality === quality;
    }

    return true;
  }

  /**
   * Get number of active renders
   *
   * @returns Count of active renders
   */
  getActiveRenderCount(): number {
    return this.activeRenders.size;
  }

  /**
   * Get bitmap for a page
   *
   * @param pageNumber Page number
   * @returns ImageBitmap or undefined
   */
  getBitmap(pageNumber: number): ImageBitmap | undefined {
    return this.activeBitmaps.get(pageNumber);
  }

  /**
   * Clean up bitmap for a page
   *
   * @param pageNumber Page number
   */
  cleanupBitmap(pageNumber: number): void {
    const bitmap = this.activeBitmaps.get(pageNumber);
    if (bitmap) {
      bitmap.close();
      this.activeBitmaps.delete(pageNumber);
    }
  }

  /**
   * Clean up all resources
   */
  destroy(): void {
    this.cancelAllRenders();
  }
}
