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

import type { PDFPageProxy, PageViewport } from 'pdfjs-dist';
import type { PageDimensions } from './virtualization-engine';
import Logger from '../../utils/logger-utils';

/**
 * ScaleManager - Zoom/Scale Change Management
 *
 * Handles all scale (zoom) change operations:
 * - CSS-based quick zoom (instant visual feedback)
 * - Dimension updates during zoom
 * - Layer resizing (text, annotation)
 * - High-res image refresh coordination
 * - Scale change lifecycle management
 *
 * This module provides smooth zoom experience by separating
 * quick CSS updates from full re-rendering.
 */

/**
 * Page info for scale updates
 */
export interface PageScaleInfo {
  pageNumber: number;
  pageProxy: PDFPageProxy | null;
  wrapperElement: HTMLElement;
  canvasElement?: HTMLCanvasElement;
  isVisible: boolean;
  isFullyRendered: boolean;
}

/**
 * Scale change options
 */
export interface ScaleChangeOptions {
  newScale: number;
  oldScale: number;
  pagePositions: Map<number, PageDimensions>;
  visiblePages: PageScaleInfo[];
  instanceId: string;
}

/**
 * Layer resize callback
 */
export type LayerResizeCallback = (
  pageNumber: number,
  viewport: PageViewport
) => void | Promise<void>;

/**
 * ScaleManager
 *
 * Manages all zoom/scale operations with two-phase approach:
 * 1. Quick CSS update for instant visual feedback
 * 2. Full re-render for high quality
 */
export class ScaleManager {
  private isScaleChangeInProgress = false;
  private layerResizeCallbacks: LayerResizeCallback[] = [];

  /**
   * Register a callback for layer resizing
   *
   * @param callback Callback to invoke when layers need resizing
   */
  registerLayerResizeCallback(callback: LayerResizeCallback): void {
    this.layerResizeCallbacks.push(callback);
  }

  /**
   * Check if scale change is in progress
   *
   * @returns True if scale is changing
   */
  isScaling(): boolean {
    return this.isScaleChangeInProgress;
  }

  /**
   * Begin scale change operation
   *
   * Sets flag to prevent other operations during scaling
   */
  beginScaleChange(): void {
    this.isScaleChangeInProgress = true;
    Logger.info('Scale change started');
  }

  /**
   * End scale change operation
   */
  endScaleChange(): void {
    this.isScaleChangeInProgress = false;
    Logger.info('Scale change completed');
  }

  /**
   * Quick CSS-based dimension update for visible pages
   *
   * This provides instant visual feedback during zoom by updating
   * CSS dimensions without re-rendering. Pages will be blurry until
   * full re-render completes.
   *
   * @param options Scale change options
   */
  async quickDimensionUpdate(options: ScaleChangeOptions): Promise<void> {
    const { newScale, pagePositions, visiblePages, instanceId } = options;

    Logger.info(`Quick dimension update for ${visiblePages.length} visible pages`, {
      newScale,
    });

    for (const pageInfo of visiblePages) {
      if (!pageInfo.isVisible || !pageInfo.pageProxy) {
        continue;
      }

      try {
        const newViewport = pageInfo.pageProxy.getViewport({ scale: newScale });
        const pagePosition = pagePositions.get(pageInfo.pageNumber);

        if (!pagePosition) {
          continue;
        }

        // Update wrapper dimensions
        pageInfo.wrapperElement.style.width = `${newViewport.width}px`;
        pageInfo.wrapperElement.style.height = `${newViewport.height}px`;
        pageInfo.wrapperElement.style.top = `${pagePosition.top}px`;

        // Update canvas dimensions (CSS scaling for quick visual)
        if (pageInfo.canvasElement) {
          pageInfo.canvasElement.style.width = `${newViewport.width}px`;
          pageInfo.canvasElement.style.height = `${newViewport.height}px`;
        }

        // Resize existing layers
        await this.resizeLayers(pageInfo.pageNumber, newViewport, instanceId);

        // Clear high-res image container (will be re-rendered later)
        this.clearHighResContainer(pageInfo.pageNumber, newViewport);
      } catch (error) {
        Logger.error(`Failed to update dimensions for page ${pageInfo.pageNumber}`, error);
      }
    }
  }

  /**
   * Resize layers (text, annotation) for a page
   *
   * @param pageNumber Page number
   * @param viewport New viewport
   * @param instanceId Instance ID for DOM queries
   */
  private async resizeLayers(
    pageNumber: number,
    viewport: PageViewport,
    instanceId: string
  ): Promise<void> {
    // Invoke registered callbacks
    for (const callback of this.layerResizeCallbacks) {
      try {
        await callback(pageNumber, viewport);
      } catch (error) {
        Logger.error(`Layer resize callback failed for page ${pageNumber}`, error);
      }
    }

    // Legacy: Direct DOM resize for annotation drawing layer
    // TODO: This should be moved to a callback
    const annotationLayerId = `annotation-drawing-layer-${instanceId}`;
    const annotationLayer = document.querySelector<HTMLElement>(
      `#${annotationLayerId}`
    );

    if (annotationLayer) {
      annotationLayer.style.width = `${viewport.width}px`;
      annotationLayer.style.height = `${viewport.height}px`;
    }
  }

  /**
   * Clear high-res image container for a page
   *
   * @param pageNumber Page number
   * @param viewport New viewport for sizing
   */
  private clearHighResContainer(pageNumber: number, viewport: PageViewport): void {
    // Find the high-res image container
    const imageContainerId = `zoomedImageContainer-${pageNumber}`;
    const imageContainer = document.querySelector<HTMLElement>(`#${imageContainerId}`);

    if (imageContainer) {
      // Clear old high-res image
      imageContainer.innerHTML = '';

      // Update container dimensions
      imageContainer.style.width = `${viewport.width}px`;
      imageContainer.style.height = `${viewport.height}px`;
    }
  }

  /**
   * Calculate scale ratio between old and new scale
   *
   * @param oldScale Old scale value
   * @param newScale New scale value
   * @returns Scale ratio
   */
  static calculateScaleRatio(oldScale: number, newScale: number): number {
    return newScale / oldScale;
  }

  /**
   * Check if scale change requires full re-render
   *
   * Small scale changes might be handled with CSS only
   *
   * @param oldScale Old scale value
   * @param newScale New scale value
   * @param threshold Threshold for requiring re-render (default 0.1)
   * @returns True if re-render is needed
   */
  static requiresRerender(
    oldScale: number,
    newScale: number,
    threshold: number = 0.1
  ): boolean {
    const ratio = Math.abs(newScale - oldScale) / oldScale;
    return ratio > threshold;
  }

  /**
   * Determine optimal render scale for a given display scale
   *
   * For large zooms, we render at intermediate scale and use CSS
   * to avoid huge canvases
   *
   * @param displayScale Target display scale
   * @param maxRenderScale Maximum render scale (default 3.0)
   * @returns Optimal render scale
   */
  static getOptimalRenderScale(
    displayScale: number,
    maxRenderScale: number = 3.0
  ): number {
    return Math.min(displayScale, maxRenderScale);
  }

  /**
   * Calculate CSS transform for rendering at different scale
   *
   * When render scale < display scale, we need CSS transform
   *
   * @param renderScale Scale used for rendering
   * @param displayScale Scale for display
   * @returns CSS scale transform value
   */
  static getCSSScaleTransform(renderScale: number, displayScale: number): number {
    return displayScale / renderScale;
  }

  /**
   * Estimate memory impact of scale change
   *
   * Helps decide whether to proceed with scale change based on memory
   *
   * @param oldScale Old scale
   * @param newScale New scale
   * @param pageCount Number of pages
   * @param avgPageSize Average page size in pixels
   * @returns Estimated memory delta in MB
   */
  static estimateMemoryImpact(
    oldScale: number,
    newScale: number,
    pageCount: number,
    avgPageSize: { width: number; height: number }
  ): number {
    // Calculate canvas size at both scales
    const oldPixels = avgPageSize.width * oldScale * avgPageSize.height * oldScale;
    const newPixels = avgPageSize.width * newScale * avgPageSize.height * newScale;

    // 4 bytes per pixel (RGBA)
    const oldMemory = (oldPixels * 4 * pageCount) / (1024 * 1024);
    const newMemory = (newPixels * 4 * pageCount) / (1024 * 1024);

    return newMemory - oldMemory;
  }

  /**
   * Get recommended buffer size for scale
   *
   * At higher scales, we render fewer pages in buffer to save memory
   *
   * @param scale Current scale
   * @param defaultBuffer Default buffer size
   * @returns Recommended buffer size
   */
  static getRecommendedBuffer(scale: number, defaultBuffer: number): number {
    if (scale >= 3.0) {
      return Math.max(1, Math.floor(defaultBuffer / 2));
    } else if (scale >= 2.0) {
      return Math.max(2, Math.floor(defaultBuffer * 0.75));
    }

    return defaultBuffer;
  }

  /**
   * Clean up resources
   */
  destroy(): void {
    this.layerResizeCallbacks = [];
    this.isScaleChangeInProgress = false;
  }
}
