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

/**
 * VirtualizationEngine - Pure Math Module
 *
 * This module handles all viewport calculations and page visibility logic.
 * It contains ZERO DOM dependencies and is fully unit-testable.
 *
 * Responsibilities:
 * - Calculate which pages are visible in viewport
 * - Calculate page positions (top/left coordinates)
 * - Determine center page in viewport
 * - Calculate buffer ranges around visible pages
 * - All pure mathematical operations
 */

/**
 * Configuration for the virtualization engine
 */
export interface VirtualizationConfig {
  /** Total number of pages in the document */
  totalPages: number;

  /** Number of pages to render before and after visible pages (buffer) */
  pageBuffer: number;

  /** Gap between pages in pixels */
  pageGap: number;

  /** Current scale/zoom level */
  scale: number;

  /** If set, only render this specific page number */
  specificPageOnly?: number;
}

/**
 * Represents the dimensions of a PDF page
 */
export interface PageDimensions {
  pageNumber: number;
  width: number;
  height: number;
  top: number; // Y position
  left: number; // X position (for centering)
}

/**
 * Result of viewport calculation
 */
export interface ViewportCalculation {
  /** Pages that should be visible in the viewport */
  visiblePages: Set<number>;

  /** The center/current page number */
  centerPage: number;

  /** Pages that should be rendered (visible + buffer) */
  pagesToRender: Set<number>;

  /** Pages that should be removed from DOM */
  pagesToRemove: number[];
}

/**
 * Container dimensions and scroll position
 */
export interface ViewportState {
  scrollTop: number;
  containerHeight: number;
  containerWidth: number;
}

/**
 * VirtualizationEngine
 *
 * Pure logic for viewport calculations. No DOM manipulation.
 * All methods are static and can be tested without a browser.
 */
export class VirtualizationEngine {
  /**
   * Calculate page positions based on their dimensions
   *
   * @param pageDimensions Array of page dimensions (width/height)
   * @param config Virtualization configuration
   * @returns Map of page number to page dimensions with positions
   */
  static calculatePagePositions(
    pageDimensions: Array<{ pageNumber: number; width: number; height: number }>,
    config: VirtualizationConfig
  ): Map<number, PageDimensions> {
    const positions = new Map<number, PageDimensions>();
    let currentYOffset = config.pageGap;
    let maxPageWidth = 0;

    // Calculate positions for each page
    for (const { pageNumber, width, height } of pageDimensions) {
      maxPageWidth = Math.max(maxPageWidth, width);

      positions.set(pageNumber, {
        pageNumber,
        width,
        height,
        top: currentYOffset,
        left: 0, // Will be calculated for centering if needed
      });

      currentYOffset += height + config.pageGap;
    }

    // Calculate left position for centering (if needed)
    // This would be used when pages need to be centered in container
    positions.forEach((dims) => {
      dims.left = Math.max(0, (maxPageWidth - dims.width) / 2);
    });

    return positions;
  }

  /**
   * Calculate the total content height
   *
   * @param pagePositions Map of page positions
   * @param config Virtualization configuration
   * @returns Total height in pixels
   */
  static calculateTotalHeight(
    pagePositions: Map<number, PageDimensions>,
    config: VirtualizationConfig
  ): number {
    if (pagePositions.size === 0) return 0;

    let maxBottom = 0;
    pagePositions.forEach((dims) => {
      const bottom = dims.top + dims.height;
      maxBottom = Math.max(maxBottom, bottom);
    });

    return maxBottom + config.pageGap;
  }

  /**
   * Calculate the maximum content width
   *
   * @param pagePositions Map of page positions
   * @returns Maximum width in pixels
   */
  static calculateTotalWidth(pagePositions: Map<number, PageDimensions>): number {
    if (pagePositions.size === 0) return 0;

    let maxWidth = 0;
    pagePositions.forEach((dims) => {
      maxWidth = Math.max(maxWidth, dims.width);
    });

    return maxWidth;
  }

  /**
   * Determine which page is at the center of the viewport
   *
   * @param viewport Current viewport state
   * @param pagePositions Map of page positions
   * @param currentPage Current page number (fallback)
   * @returns Page number at viewport center
   */
  static determineCenterPage(
    viewport: ViewportState,
    pagePositions: Map<number, PageDimensions>,
    currentPage: number
  ): number {
    const viewportCenter = viewport.scrollTop + viewport.containerHeight / 2;

    let closestPageNum = currentPage;
    let minDistance = Infinity;

    pagePositions.forEach((dims, pageNum) => {
      const pageCenter = dims.top + dims.height / 2;
      const distance = Math.abs(viewportCenter - pageCenter);

      if (distance < minDistance) {
        minDistance = distance;
        closestPageNum = pageNum;
      }
    });

    return closestPageNum;
  }

  /**
   * Calculate which pages should be visible and rendered
   *
   * @param viewport Current viewport state
   * @param pagePositions Map of page positions
   * @param config Virtualization configuration
   * @param currentlyRendered Set of currently rendered page numbers
   * @returns ViewportCalculation with pages to render/remove
   */
  static calculateVisiblePages(
    viewport: ViewportState,
    pagePositions: Map<number, PageDimensions>,
    config: VirtualizationConfig,
    currentlyRendered: Set<number>
  ): ViewportCalculation {
    // Handle specific page mode
    if (config.specificPageOnly !== undefined) {
      return {
        visiblePages: new Set([config.specificPageOnly]),
        centerPage: config.specificPageOnly,
        pagesToRender: new Set([config.specificPageOnly]),
        pagesToRemove: Array.from(currentlyRendered).filter(
          (p) => p !== config.specificPageOnly
        ),
      };
    }

    // Determine center page
    const centerPage = this.determineCenterPage(viewport, pagePositions, 1);

    // Calculate visible pages (pages that intersect viewport)
    const visiblePages = new Set<number>();
    const viewportTop = viewport.scrollTop;
    const viewportBottom = viewport.scrollTop + viewport.containerHeight;

    pagePositions.forEach((dims, pageNum) => {
      const pageTop = dims.top;
      const pageBottom = dims.top + dims.height;

      // Check if page intersects viewport
      if (pageBottom >= viewportTop && pageTop <= viewportBottom) {
        visiblePages.add(pageNum);
      }
    });

    // Calculate buffer range around center page
    const startPage = Math.max(1, centerPage - config.pageBuffer);
    const endPage = Math.min(config.totalPages, centerPage + config.pageBuffer);

    const pagesToRender = new Set<number>();
    for (let pageNum = startPage; pageNum <= endPage; pageNum++) {
      pagesToRender.add(pageNum);
    }

    // Determine pages to remove (currently rendered but outside buffer)
    const pagesToRemove: number[] = [];
    currentlyRendered.forEach((pageNum) => {
      if (!pagesToRender.has(pageNum)) {
        pagesToRemove.push(pageNum);
      }
    });

    return {
      visiblePages,
      centerPage,
      pagesToRender,
      pagesToRemove,
    };
  }

  /**
   * Check if a page is within the visible viewport
   *
   * @param pageNumber Page number to check
   * @param viewport Current viewport state
   * @param pagePositions Map of page positions
   * @returns True if page is visible
   */
  static isPageVisible(
    pageNumber: number,
    viewport: ViewportState,
    pagePositions: Map<number, PageDimensions>
  ): boolean {
    const dims = pagePositions.get(pageNumber);
    if (!dims) return false;

    const viewportTop = viewport.scrollTop;
    const viewportBottom = viewport.scrollTop + viewport.containerHeight;
    const pageTop = dims.top;
    const pageBottom = dims.top + dims.height;

    return pageBottom >= viewportTop && pageTop <= viewportBottom;
  }

  /**
   * Calculate how many pages fit in the initial viewport
   *
   * @param containerHeight Height of the container
   * @param pageDimensions Array of page dimensions
   * @param pageGap Gap between pages
   * @returns Number of pages that fit in viewport
   */
  static calculateInitialPageCount(
    containerHeight: number,
    pageDimensions: Array<{ pageNumber: number; width: number; height: number }>,
    pageGap: number
  ): number {
    if (containerHeight <= 0 || pageDimensions.length === 0) return 1;

    let accumulatedHeight = 0;
    let pagesToRender = 0;

    for (const { height } of pageDimensions) {
      const pageHeightWithGap = height + pageGap;

      // If first page is taller than container, still show it
      if (pagesToRender === 0 && pageHeightWithGap > containerHeight) {
        return 1;
      }

      accumulatedHeight += pageHeightWithGap;
      pagesToRender++;

      if (accumulatedHeight >= containerHeight) {
        break;
      }
    }

    return Math.min(pagesToRender, pageDimensions.length);
  }

  /**
   * Calculate the distance of a page from the center page
   *
   * @param pageNumber Page to check
   * @param centerPage Center page number
   * @returns Distance in pages (0 = center, 1 = adjacent, etc.)
   */
  static calculatePageDistance(pageNumber: number, centerPage: number): number {
    return Math.abs(pageNumber - centerPage);
  }

  /**
   * Calculate priority for rendering a page (lower = higher priority)
   *
   * @param pageNumber Page to calculate priority for
   * @param centerPage Center page number
   * @param isVisible Is the page currently visible in viewport
   * @returns Priority value (0 = highest, higher numbers = lower priority)
   */
  static calculateRenderPriority(
    pageNumber: number,
    centerPage: number,
    isVisible: boolean
  ): number {
    const distance = this.calculatePageDistance(pageNumber, centerPage);

    // Visible pages get priority boost
    const visibilityBoost = isVisible ? 0 : 10;

    return distance + visibilityBoost;
  }
}
