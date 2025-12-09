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
 * Configuration options for thumbnail virtualization
 */
export interface ThumbnailVirtualizationConfig {
  /** Total number of pages in the document */
  totalPages: number;
  /** Average height of a thumbnail in pixels (including margin) */
  thumbnailHeight: number;
  /** Height of the visible container in pixels */
  containerHeight: number;
  /** Number of thumbnails to render above and below the visible area */
  bufferSize?: number;
}

/**
 * Represents a range of thumbnails to render
 */
export interface ThumbnailRange {
  /** First thumbnail page number to render (1-indexed) */
  start: number;
  /** Last thumbnail page number to render (1-indexed) */
  end: number;
  /** Pages that should be visible in viewport */
  visibleStart: number;
  visibleEnd: number;
}

/**
 * Information about thumbnail positioning
 */
export interface ThumbnailPosition {
  /** Page number (1-indexed) */
  pageNumber: number;
  /** Top offset in pixels from container start */
  top: number;
  /** Whether this thumbnail is in the visible viewport */
  isVisible: boolean;
}

/**
 * Pure math engine for thumbnail virtualization calculations.
 * No DOM dependencies - only math and logic.
 *
 * Responsible for:
 * - Calculating which thumbnails should be rendered based on scroll position
 * - Determining visible range and buffer zones
 * - Computing thumbnail positions for virtual scrolling
 * - Managing render priorities for optimal perceived performance
 */
export class ThumbnailVirtualizationEngine {
  private config: Required<ThumbnailVirtualizationConfig>;
  private currentRange: ThumbnailRange | null = null;

  // Track individual page heights (pageNumber -> height)
  // For pages not yet measured, use average height
  private pageHeights: Map<number, number> = new Map();

  // Cache cumulative heights for performance (pageNumber -> cumulative top position)
  private cumulativeHeights: Map<number, number> = new Map();
  private cumulativeHeightsDirty: boolean = true;

  constructor(config: ThumbnailVirtualizationConfig) {
    this.config = {
      ...config,
      bufferSize: config.bufferSize ?? 5, // Default: 5 thumbnails above and below
    };
  }

  /**
   * Updates the container height (e.g., on window resize)
   */
  public updateContainerHeight(height: number): void {
    this.config.containerHeight = height;
  }

  /**
   * Updates the thumbnail height (if changed due to zoom or different page sizes)
   */
  public updateThumbnailHeight(height: number): void {
    this.config.thumbnailHeight = height;
  }

  /**
   * Sets the actual measured height for a specific page
   * This allows handling variable heights (portrait/landscape pages)
   *
   * @param pageNumber - Page number (1-indexed)
   * @param height - Actual measured height including margins/padding
   */
  public setPageHeight(pageNumber: number, height: number): void {
    this.pageHeights.set(pageNumber, height);
    this.cumulativeHeightsDirty = true;
  }

  /**
   * Gets the height for a specific page
   * Returns measured height if available, otherwise returns average height
   *
   * @param pageNumber - Page number (1-indexed)
   * @returns Height in pixels
   */
  public getPageHeight(pageNumber: number): number {
    return this.pageHeights.get(pageNumber) ?? this.config.thumbnailHeight;
  }

  /**
   * Rebuilds the cumulative height cache
   * This is called when page heights change
   */
  private rebuildCumulativeHeights(): void {
    this.cumulativeHeights.clear();
    let cumulativeTop = 0;

    for (let i = 1; i <= this.config.totalPages; i++) {
      this.cumulativeHeights.set(i, cumulativeTop);
      cumulativeTop += this.getPageHeight(i);
    }

    this.cumulativeHeightsDirty = false;
  }

  /**
   * Gets the cumulative top position for a page
   * Uses cached values for performance
   *
   * @param pageNumber - Page number (1-indexed)
   * @returns Top position in pixels
   */
  private getCumulativeTop(pageNumber: number): number {
    if (this.cumulativeHeightsDirty) {
      this.rebuildCumulativeHeights();
    }

    return this.cumulativeHeights.get(pageNumber) ?? 0;
  }

  /**
   * Calculates the total height needed for the virtual scroll container
   * This creates the scrollable area for all thumbnails
   */
  public calculateTotalHeight(): number {
    if (this.cumulativeHeightsDirty) {
      this.rebuildCumulativeHeights();
    }

    // Sum all page heights
    let totalHeight = 0;
    for (let i = 1; i <= this.config.totalPages; i++) {
      totalHeight += this.getPageHeight(i);
    }

    return totalHeight;
  }

  /**
   * Calculates which thumbnails should be rendered based on current scroll position
   *
   * @param scrollTop - Current scroll position of the container
   * @returns Range of thumbnails to render (including buffer)
   */
  public calculateVisibleRange(scrollTop: number): ThumbnailRange {
    const { containerHeight, bufferSize, totalPages } = this.config;

    if (this.cumulativeHeightsDirty) {
      this.rebuildCumulativeHeights();
    }

    // Binary search to find first visible page
    let firstVisiblePage = 1;
    for (let i = 1; i <= totalPages; i++) {
      const pageTop = this.getCumulativeTop(i);
      const pageBottom = pageTop + this.getPageHeight(i);

      if (pageBottom > scrollTop) {
        firstVisiblePage = i;
        break;
      }
    }

    // Find last visible page
    let lastVisiblePage = firstVisiblePage;
    const scrollBottom = scrollTop + containerHeight;
    for (let i = firstVisiblePage; i <= totalPages; i++) {
      const pageTop = this.getCumulativeTop(i);

      if (pageTop >= scrollBottom) {
        break;
      }
      lastVisiblePage = i;
    }

    // Add buffer above and below
    const bufferStart = Math.max(1, firstVisiblePage - bufferSize);
    const bufferEnd = Math.min(totalPages, lastVisiblePage + bufferSize);

    const range: ThumbnailRange = {
      start: bufferStart,
      end: bufferEnd,
      visibleStart: firstVisiblePage,
      visibleEnd: lastVisiblePage,
    };

    this.currentRange = range;
    return range;
  }

  /**
   * Gets the current visible range (last calculated)
   */
  public getCurrentRange(): ThumbnailRange | null {
    return this.currentRange;
  }

  /**
   * Calculates the position of a specific thumbnail
   *
   * @param pageNumber - Page number (1-indexed)
   * @returns Position information for the thumbnail
   */
  public calculateThumbnailPosition(pageNumber: number): ThumbnailPosition {
    if (this.cumulativeHeightsDirty) {
      this.rebuildCumulativeHeights();
    }

    const top = this.getCumulativeTop(pageNumber);

    const isVisible = this.currentRange
      ? pageNumber >= this.currentRange.visibleStart && pageNumber <= this.currentRange.visibleEnd
      : false;

    return {
      pageNumber,
      top,
      isVisible,
    };
  }

  /**
   * Calculates positions for all thumbnails in a given range
   *
   * @param start - Start page number (1-indexed)
   * @param end - End page number (1-indexed)
   * @returns Array of thumbnail positions
   */
  public calculateThumbnailPositions(start: number, end: number): ThumbnailPosition[] {
    const positions: ThumbnailPosition[] = [];

    for (let pageNumber = start; pageNumber <= end; pageNumber++) {
      positions.push(this.calculateThumbnailPosition(pageNumber));
    }

    return positions;
  }

  /**
   * Determines which thumbnails to add and remove based on range change
   *
   * @param previousRange - Previous render range
   * @param newRange - New render range
   * @returns Pages to add and remove
   */
  public calculateRangeChanges(
    previousRange: ThumbnailRange | null,
    newRange: ThumbnailRange
  ): { toAdd: number[]; toRemove: number[] } {
    const toAdd: number[] = [];
    const toRemove: number[] = [];

    if (!previousRange) {
      // First render - add all pages in range
      for (let i = newRange.start; i <= newRange.end; i++) {
        toAdd.push(i);
      }
      return { toAdd, toRemove };
    }

    // Find pages to remove (in previous but not in new)
    for (let i = previousRange.start; i <= previousRange.end; i++) {
      if (i < newRange.start || i > newRange.end) {
        toRemove.push(i);
      }
    }

    // Find pages to add (in new but not in previous)
    for (let i = newRange.start; i <= newRange.end; i++) {
      if (i < previousRange.start || i > previousRange.end) {
        toAdd.push(i);
      }
    }

    return { toAdd, toRemove };
  }

  /**
   * Calculates the page number at a given scroll position
   * Useful for determining the current page from scroll position
   *
   * @param scrollTop - Scroll position
   * @returns Page number (1-indexed) at that position
   */
  public getPageNumberAtScrollPosition(scrollTop: number): number {
    const { totalPages } = this.config;

    if (this.cumulativeHeightsDirty) {
      this.rebuildCumulativeHeights();
    }

    // Find the page at the given scroll position
    for (let i = 1; i <= totalPages; i++) {
      const pageTop = this.getCumulativeTop(i);
      const pageBottom = pageTop + this.getPageHeight(i);

      if (scrollTop >= pageTop && scrollTop < pageBottom) {
        return i;
      }
    }

    return Math.max(1, Math.min(totalPages, totalPages));
  }

  /**
   * Calculates the scroll position needed to show a specific page
   * Useful for scrolling to a page when clicked in main viewer
   *
   * @param pageNumber - Page number (1-indexed)
   * @param alignment - Where to position the page ('start' | 'center' | 'end')
   * @returns Scroll position in pixels
   */
  public getScrollPositionForPage(
    pageNumber: number,
    alignment: 'start' | 'center' | 'end' = 'center'
  ): number {
    const { containerHeight, totalPages } = this.config;

    if (pageNumber < 1 || pageNumber > totalPages) {
      console.warn(`Invalid page number: ${pageNumber}`);
      return 0;
    }

    const position = this.calculateThumbnailPosition(pageNumber);
    const pageHeight = this.getPageHeight(pageNumber);

    switch (alignment) {
      case 'start':
        return position.top;
      case 'center':
        return position.top - (containerHeight / 2) + (pageHeight / 2);
      case 'end':
        return position.top - containerHeight + pageHeight;
      default:
        return position.top;
    }
  }

  /**
   * Calculates render priority for thumbnails
   * Higher priority = should be rendered first
   * Priority based on distance from current visible center
   *
   * @param pageNumber - Page number (1-indexed)
   * @returns Priority score (higher = more important)
   */
  public calculateRenderPriority(pageNumber: number): number {
    if (!this.currentRange) {
      return 0;
    }

    const centerPage = Math.floor(
      (this.currentRange.visibleStart + this.currentRange.visibleEnd) / 2
    );

    const distance = Math.abs(pageNumber - centerPage);

    // Inverse distance - closer pages have higher priority
    // Max priority = 1000, decreases linearly with distance
    return Math.max(0, 1000 - distance * 10);
  }

  /**
   * Sorts an array of page numbers by render priority
   *
   * @param pageNumbers - Array of page numbers to sort
   * @returns Sorted array (highest priority first)
   */
  public sortByRenderPriority(pageNumbers: number[]): number[] {
    return [...pageNumbers].sort((a, b) => {
      const priorityA = this.calculateRenderPriority(a);
      const priorityB = this.calculateRenderPriority(b);
      return priorityB - priorityA; // Descending order
    });
  }

  /**
   * Estimates memory usage for the current rendered range
   * Useful for monitoring and debugging
   *
   * @param bytesPerThumbnail - Average bytes per thumbnail image
   * @returns Estimated memory usage in bytes
   */
  public estimateMemoryUsage(bytesPerThumbnail: number = 15000): number {
    if (!this.currentRange) {
      return 0;
    }

    const renderedCount = this.currentRange.end - this.currentRange.start + 1;
    return renderedCount * bytesPerThumbnail;
  }
}
