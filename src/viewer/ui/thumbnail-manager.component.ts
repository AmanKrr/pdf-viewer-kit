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

import { PDFDocumentProxy } from 'pdfjs-dist';
import { ThumbnailVirtualizationEngine } from '../../core/engine/thumbnail-virtualization-engine';
import ThumbnailViewer from './thumbnail-viewer.component';
import { PDFLinkService } from '../services/link.service';
import { PDF_VIEWER_CLASSNAMES } from '../../constants/pdf-viewer-selectors';
import { debounce } from 'lodash';

/**
 * Configuration for the thumbnail manager
 */
export interface ThumbnailManagerConfig {
  containerId: string;
  pdfDocument: PDFDocumentProxy;
  linkService: PDFLinkService;
  bufferSize?: number;
}

/**
 * Manages virtualized thumbnail rendering for optimal performance and memory usage.
 * Only renders visible thumbnails + buffer zone, destroying thumbnails outside the range.
 */
export class ThumbnailManager {
  private _config: ThumbnailManagerConfig;
  private _pdfDocument: PDFDocumentProxy;
  private _linkService: PDFLinkService;
  private _containerId: string;

  private _sidebarContainer: HTMLElement | null = null;
  private _innerContainer: HTMLElement | null = null;
  private _virtualScrollContainer: HTMLElement | null = null;

  private _virtualizationEngine: ThumbnailVirtualizationEngine | null = null;
  private _renderedThumbnails: Map<number, ThumbnailViewer> = new Map();
  private _thumbnailWrappers: Map<number, HTMLElement> = new Map(); // Track wrapper elements

  private _isInitialized: boolean = false;
  private _currentActivePage: number = 1;

  // Average thumbnail height (will be calculated from first render)
  // Include margin-bottom (20px) + padding (8px) + label (~20px) = ~48px overhead
  private _avgThumbnailHeight: number = 220; // Initial estimate (A4 at 0.2 scale ≈ 170px + 50px overhead)

  constructor(config: ThumbnailManagerConfig) {
    this._config = config;
    this._pdfDocument = config.pdfDocument;
    this._linkService = config.linkService;
    this._containerId = config.containerId;
  }

  /**
   * Initializes the thumbnail manager and creates the virtual scroll container
   */
  public async initialize(): Promise<void> {
    if (this._isInitialized) {
      return;
    }

    // Create sidebar container structure
    this._createSidebarStructure();

    if (!this._innerContainer || !this._virtualScrollContainer) {
      console.error('Failed to create thumbnail containers');
      return;
    }

    // Get actual container height
    const containerHeight = this._sidebarContainer?.clientHeight || 600;

    // Initialize virtualization engine
    this._virtualizationEngine = new ThumbnailVirtualizationEngine({
      totalPages: this._pdfDocument.numPages,
      thumbnailHeight: this._avgThumbnailHeight,
      containerHeight,
      bufferSize: this._config.bufferSize ?? 5,
    });

    // Set virtual scroll container height
    const totalHeight = this._virtualizationEngine.calculateTotalHeight();
    this._virtualScrollContainer.style.height = `${totalHeight}px`;

    // Attach scroll listener
    this._attachScrollListener();

    // Initial render
    await this._updateVisibleThumbnails();

    this._isInitialized = true;
  }

  /**
   * Creates the sidebar DOM structure
   */
  private _createSidebarStructure(): void {
    const shadowRoot = document.getElementById(this._containerId)?.shadowRoot as ShadowRoot | null;
    const pdfViewer = shadowRoot?.querySelector(`.${PDF_VIEWER_CLASSNAMES.A_VIEWER_WRAPPER}`);

    if (!pdfViewer) {
      console.error('PDF Viewer not found');
      return;
    }

    // Check if sidebar already exists
    let sidebarContainer = shadowRoot?.querySelector(
      `.${PDF_VIEWER_CLASSNAMES.A_SIDEBAR_CONTAINER}`
    ) as HTMLElement;

    if (!sidebarContainer) {
      // Create new sidebar
      sidebarContainer = document.createElement('div');
      sidebarContainer.classList.add(PDF_VIEWER_CLASSNAMES.A_SIDEBAR_CONTAINER);
      pdfViewer.prepend(sidebarContainer);
    }

    this._sidebarContainer = sidebarContainer;

    // Create inner container for thumbnails
    let innerContainer = sidebarContainer.querySelector(
      `.${PDF_VIEWER_CLASSNAMES.A_INNER_SIDEBAR_CONTAINER_CONTENT}`
    ) as HTMLElement;

    if (!innerContainer) {
      innerContainer = document.createElement('div');
      innerContainer.classList.add(PDF_VIEWER_CLASSNAMES.A_INNER_SIDEBAR_CONTAINER_CONTENT);
      sidebarContainer.appendChild(innerContainer);
    }

    this._innerContainer = innerContainer;

    // Create virtual scroll container
    let virtualScrollContainer = innerContainer.querySelector(
      '.thumbnail-virtual-scroll-container'
    ) as HTMLElement;

    if (!virtualScrollContainer) {
      virtualScrollContainer = document.createElement('div');
      virtualScrollContainer.className = 'thumbnail-virtual-scroll-container';
      virtualScrollContainer.style.position = 'relative';
      virtualScrollContainer.style.width = '100%';
      innerContainer.appendChild(virtualScrollContainer);
    }

    this._virtualScrollContainer = virtualScrollContainer;
  }

  /**
   * Attaches scroll listener to the sidebar with debouncing
   */
  private _attachScrollListener(): void {
    if (!this._sidebarContainer) return;

    const scrollHandler = debounce(() => {
      this._updateVisibleThumbnails();
    }, 16); // 16ms (~60fps) for smooth scrolling without blank containers

    this._sidebarContainer.addEventListener('scroll', scrollHandler);
  }

  /**
   * Updates visible thumbnails based on current scroll position
   */
  private async _updateVisibleThumbnails(): Promise<void> {
    if (!this._virtualizationEngine || !this._sidebarContainer) {
      return;
    }

    const scrollTop = this._sidebarContainer.scrollTop;
    const previousRange = this._virtualizationEngine.getCurrentRange();
    const newRange = this._virtualizationEngine.calculateVisibleRange(scrollTop);

    // Calculate which thumbnails to add/remove
    const { toAdd, toRemove } = this._virtualizationEngine.calculateRangeChanges(previousRange, newRange);

    console.log(`[ThumbnailManager] Scroll update: Remove ${toRemove.length}, Add ${toAdd.length}`);

    // Remove thumbnails outside the buffer
    for (const pageNumber of toRemove) {
      this._removeThumbnail(pageNumber);
    }

    // Separate visible and buffer pages
    const visiblePages: number[] = [];
    const bufferPages: number[] = [];

    for (const pageNumber of toAdd) {
      if (pageNumber >= newRange.visibleStart && pageNumber <= newRange.visibleEnd) {
        visiblePages.push(pageNumber);
      } else {
        bufferPages.push(pageNumber);
      }
    }

    // Render visible pages immediately (no await - render synchronously)
    for (const pageNumber of visiblePages) {
      this._addThumbnail(pageNumber);
    }

    // Render buffer pages in the background with priority ordering
    const sortedBufferPages = this._virtualizationEngine.sortByRenderPriority(bufferPages);

    // Use requestIdleCallback or setTimeout to render buffer pages without blocking
    this._renderBufferPages(sortedBufferPages);

    console.log(`[ThumbnailManager] Now rendering: ${this._renderedThumbnails.size} thumbnails`);
  }

  /**
   * Renders buffer pages in the background without blocking the main thread
   */
  private _renderBufferPages(pages: number[]): void {
    if (pages.length === 0) return;

    const renderNext = (index: number) => {
      if (index >= pages.length) return;

      const pageNumber = pages[index];

      // Check if still needed (user might have scrolled away)
      const currentRange = this._virtualizationEngine?.getCurrentRange();
      if (currentRange && (pageNumber < currentRange.start || pageNumber > currentRange.end)) {
        renderNext(index + 1);
        return;
      }

      this._addThumbnail(pageNumber).then(() => {
        // Use requestIdleCallback if available, otherwise setTimeout
        if ('requestIdleCallback' in window) {
          requestIdleCallback(() => renderNext(index + 1));
        } else {
          setTimeout(() => renderNext(index + 1), 0);
        }
      });
    };

    renderNext(0);
  }

  /**
   * Adds a thumbnail to the rendered set
   */
  private async _addThumbnail(pageNumber: number): Promise<void> {
    if (!this._virtualScrollContainer || !this._virtualizationEngine) {
      return;
    }

    // Skip if already rendered
    if (this._renderedThumbnails.has(pageNumber)) {
      return;
    }

    // Calculate position
    const position = this._virtualizationEngine.calculateThumbnailPosition(pageNumber);

    // Create container for this thumbnail
    const thumbnailContainer = document.createElement('div');
    thumbnailContainer.className = 'thumbnail-wrapper';
    thumbnailContainer.style.top = `${position.top}px`;
    // Note: data-page-number is set on the inner .thumbnail element, not the wrapper

    this._virtualScrollContainer.appendChild(thumbnailContainer);

    // Create and render thumbnail
    const thumbnail = new ThumbnailViewer({
      container: thumbnailContainer,
      pdfDocument: this._pdfDocument,
      pageNumber,
      linkService: this._linkService,
    });

    await thumbnail.initThumbnail();

    // Measure and store actual height for each page (handles portrait/landscape variations)
    if (this._virtualScrollContainer && this._virtualizationEngine) {
      const actualHeight = thumbnailContainer.offsetHeight;
      const actualWidth = thumbnailContainer.offsetWidth;

      if (actualHeight > 0) {
        // Store the actual measured height for this specific page
        this._virtualizationEngine.setPageHeight(pageNumber, actualHeight);

        // Update average height on first render
        if (pageNumber === 1) {
          this._avgThumbnailHeight = actualHeight;
          this._virtualizationEngine.updateThumbnailHeight(this._avgThumbnailHeight);

          console.log(`[ThumbnailManager] Initial thumbnail height: ${this._avgThumbnailHeight}px`);
        }

        // Recalculate total height with actual measurements
        const totalHeight = this._virtualizationEngine.calculateTotalHeight();
        this._virtualScrollContainer.style.height = `${totalHeight}px`;

        // Recalculate position for this thumbnail now that we have actual height
        const position = this._virtualizationEngine.calculateThumbnailPosition(pageNumber);
        thumbnailContainer.style.top = `${position.top}px`;

        console.log(`[ThumbnailManager] Page ${pageNumber} height: ${actualHeight}px, position: ${position.top}px`);

        // Update positions for all already-rendered thumbnails after this one
        // since cumulative heights have changed
        this._updateThumbnailPositions(pageNumber + 1);
      }

      // Set container width based on first thumbnail
      if (pageNumber === 1 && actualWidth > 0) {
        this._virtualScrollContainer.style.width = `${actualWidth}px`;
      }
    }

    // Set active if this is the current page
    if (pageNumber === this._currentActivePage) {
      thumbnail.activeThumbnail = pageNumber;
    }

    // Store both the thumbnail and its wrapper
    this._renderedThumbnails.set(pageNumber, thumbnail);
    this._thumbnailWrappers.set(pageNumber, thumbnailContainer);
  }

  /**
   * Updates the positions of rendered thumbnails starting from a given page number
   * This is needed when a page height is measured and affects subsequent positions
   *
   * @param startPageNumber - The first page number to update positions for
   */
  private _updateThumbnailPositions(startPageNumber: number): void {
    if (!this._virtualizationEngine) {
      return;
    }

    // Update positions for all rendered thumbnails >= startPageNumber
    this._thumbnailWrappers.forEach((wrapper, pageNumber) => {
      if (pageNumber >= startPageNumber) {
        const position = this._virtualizationEngine!.calculateThumbnailPosition(pageNumber);
        wrapper.style.top = `${position.top}px`;
      }
    });
  }

  /**
   * Removes a thumbnail from the rendered set
   */
  private _removeThumbnail(pageNumber: number): void {
    const thumbnail = this._renderedThumbnails.get(pageNumber);
    const wrapper = this._thumbnailWrappers.get(pageNumber);

    if (thumbnail) {
      thumbnail.destroy();
      this._renderedThumbnails.delete(pageNumber);
    }

    // Remove the wrapper element from DOM
    if (wrapper && wrapper.parentNode) {
      wrapper.parentNode.removeChild(wrapper);
      this._thumbnailWrappers.delete(pageNumber);
    }
  }

  /**
   * Sets the active thumbnail (called when main viewer page changes)
   */
  public setActiveThumbnail(pageNumber: number): void {
    if (pageNumber < 1 || pageNumber > this._pdfDocument.numPages) {
      return;
    }

    this._currentActivePage = pageNumber;

    // Update active state on all rendered thumbnails
    this._renderedThumbnails.forEach((thumbnail, thumbPageNum) => {
      // Get the wrapper first, then find the inner .thumbnail element
      const wrapper = this._thumbnailWrappers.get(thumbPageNum);
      const thumbnailDiv = wrapper?.querySelector('.thumbnail') as HTMLElement;

      if (thumbnailDiv) {
        if (thumbPageNum === pageNumber) {
          thumbnailDiv.classList.add('thumbnail-active');
        } else {
          thumbnailDiv.classList.remove('thumbnail-active');
        }
      }
    });

    // Scroll to show the active thumbnail
    this.scrollToThumbnail(pageNumber);
  }

  /**
   * Scrolls the sidebar to show a specific thumbnail
   */
  public scrollToThumbnail(pageNumber: number, alignment: 'start' | 'center' | 'end' = 'center'): void {
    if (!this._virtualizationEngine || !this._sidebarContainer) {
      return;
    }

    const scrollPosition = this._virtualizationEngine.getScrollPositionForPage(pageNumber, alignment);
    this._sidebarContainer.scrollTop = scrollPosition;
  }

  /**
   * Destroys all thumbnails and cleans up resources
   */
  public destroy(): void {
    // Destroy all rendered thumbnails
    this._renderedThumbnails.forEach((thumbnail) => {
      thumbnail.destroy();
    });
    this._renderedThumbnails.clear();

    // Remove all wrapper elements
    this._thumbnailWrappers.forEach((wrapper) => {
      if (wrapper.parentNode) {
        wrapper.parentNode.removeChild(wrapper);
      }
    });
    this._thumbnailWrappers.clear();

    // Clear canvas pool
    ThumbnailViewer.clearCanvasPool();

    // Remove DOM elements
    if (this._virtualScrollContainer) {
      this._virtualScrollContainer.remove();
      this._virtualScrollContainer = null;
    }

    this._virtualizationEngine = null;
    this._isInitialized = false;
  }

  /**
   * Gets the number of currently rendered thumbnails (for debugging/monitoring)
   */
  public getRenderedCount(): number {
    return this._renderedThumbnails.size;
  }

  /**
   * Gets memory usage estimate (for debugging/monitoring)
   */
  public estimateMemoryUsage(): number {
    if (!this._virtualizationEngine) {
      return 0;
    }

    return this._virtualizationEngine.estimateMemoryUsage();
  }
}
