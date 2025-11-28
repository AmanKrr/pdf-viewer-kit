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

import { PageViewport, PDFDocumentProxy, PDFPageProxy, RenderTask } from 'pdfjs-dist';
import TextLayer from './text-layer.component';
import PageElement from './page-element.component';
import { debounce, throttle } from 'lodash';
import ThumbnailViewer from './thumbnail-viewer.component';
import WebViewer from './web-viewer.component';
import { ViewerLoadOptions } from '../../types/webpdf.types';
import AnnotationLayer from './annotation-layer.component';
import { PDF_VIEWER_IDS } from '../../constants/pdf-viewer-selectors';
import { AnnotationManager } from '../managers/annotation-manager.manager';
import { SelectionManager } from '../managers/selection.manager';
import SearchHighlighter from '../managers/search-highlighter.manager';
import { reportError } from '../../utils/debug-utils';
import Logger from '../../utils/logger-utils';
import { PDFLinkService } from '../services/link.service';
import {
  PageRenderer,
  ScaleManager,
  MemoryManager,
  MemoryPressure,
  RenderScheduler,
  PageDomAdapter,
  VirtualizationEngine,
  TileManager,
  type MemoryStats,
  type RenderTask as EngineRenderTask,
  type RenderResult as EngineRenderResult,
  type PageDimensions,
  type ViewportBounds,
} from '../../core/engine';

/**
 * Lifecycle state for individual rendering layers
 */
interface LayerState {
  isRendered: boolean;        // Is this layer successfully rendered?
  renderFailed: boolean;       // Did this layer fail to render?
  renderAttempts: number;      // Number of render attempts for this layer
  lastError?: Error;           // Last error encountered for this layer
}

interface CachedPageInfo {
  pageNumber: number;
  pdfPageProxy: PDFPageProxy | null;
  pageWrapperDiv: HTMLDivElement;
  canvasElement?: HTMLCanvasElement;
  renderTask?: RenderTask;
  highResImageBitmap?: ImageBitmap;
  highResRenderTask?: RenderTask;
  textLayer?: TextLayer;
  annotationLayer?: AnnotationLayer;
  isVisible: boolean;

  // DECOUPLED layer states - each layer has independent lifecycle
  canvasState: LayerState;        // Base canvas render state
  textLayerState: LayerState;     // Text layer (for selection) state
  annotationLayerState: LayerState; // Annotation layer (for interactions) state

  // Legacy fields - kept for backward compatibility during transition
  isFullyRendered: boolean;    // TRUE only when ALL layers are rendered
  renderFailed: boolean;        // TRUE if ANY critical layer failed (canvas only)
  isTransitioningToFullRender: boolean;
  renderedScale?: number;       // Track the scale at which this page was last fully rendered
  renderAttempts?: number;      // Deprecated - use canvasState.renderAttempts
  lastRenderError?: Error;      // Deprecated - use canvasState.lastError
}

/**
 * Classification of render errors for smart retry logic
 *
 * Note: Cancellations are NOT errors and should never reach this classification.
 * They are handled separately in _renderPageContent() and don't set renderFailed.
 */
enum RenderErrorType {
  TRANSIENT,      // Network issues, temporary resource exhaustion → RETRY with limit (3 attempts)
  PERMANENT,      // Corrupt PDF, invalid page, parse errors → DON'T RETRY
}

/**
 * Classify a render error to determine retry strategy
 *
 * This function should only receive REAL errors, never cancellations.
 */
function classifyError(error: Error | undefined): RenderErrorType {
  if (!error) {
    return RenderErrorType.TRANSIENT;
  }

  const errorMessage = error.message || '';

  // Permanent errors - never retry
  if (errorMessage.includes('Invalid PDF') ||
      errorMessage.includes('Page not found') ||
      errorMessage.includes('Corrupt') ||
      errorMessage.includes('parse error') ||
      errorMessage.includes('malformed') ||
      errorMessage.includes('Missing PDF') ||
      errorMessage.includes('Invalid object')) {
    return RenderErrorType.PERMANENT;
  }

  // Default to transient (network, temporary issues) - retry with limit
  return RenderErrorType.TRANSIENT;
}

/**
 * Handles virtualized rendering of PDF pages:
 * - placeholders for offscreen pages
 * - low-res “blurry” base renders
 * - high-res final renders
 * - text layer & annotation layers
 */
class PageVirtualization {
  private _options: ViewerLoadOptions;
  private _scrollableContainer: HTMLElement;
  private _pagesParentDiv: HTMLElement;

  private _pageBuffer: number;
  private _totalPages: number;
  private _pdfDocument: PDFDocumentProxy;

  private _maxPooledWrappers!: number;
  private _cachedPages: Map<number, CachedPageInfo> = new Map();

  private _thumbnailViewer: ThumbnailViewer | null = null;
  private _pagePositions: Map<number, number> = new Map();
  private _pageDimensions: Map<number, PageDimensions> = new Map();
  private _webViewer: WebViewer;
  private _selectionManager: SelectionManager;
  private _searchHighlighter: SearchHighlighter;

  private _boundOnScaleChange = this._onScaleChange.bind(this);

  private _pageIntersectionObserver: IntersectionObserver | null = null;
  private _intersectionObserver: IntersectionObserver | null = null;

  // Engine modules
  private _pageRenderer!: PageRenderer;
  private _scaleManager!: ScaleManager;
  private _memoryManager!: MemoryManager;
  private _renderScheduler!: RenderScheduler<CachedPageInfo>;
  private _pageDomAdapter!: PageDomAdapter;
  private _tileManager!: TileManager;

  // Direct layer tracking (no manager wrappers)
  private _activeTextLayers: Map<number, TextLayer> = new Map();
  private _activeAnnotationLayers: Map<number, AnnotationLayer> = new Map();

  // Timer IDs for cleanup (CRITICAL: prevent memory leaks)
  private _cancellationIntervalId?: number;
  private _memoryPressureIntervalId?: number;
  private _memoryPressureUnsubscribe?: () => void;

  public readonly bufferReady: Promise<void>;
  private _resolveBufferReady!: () => void;

  /**
   * @param options             Viewer configuration & container IDs.
   * @param scrollableContainer The scrollable wrapper element.
   * @param pagesParentDiv      The element into which page wrappers are inserted.
   * @param totalPages          Total number of PDF pages.
   * @param pdfViewer           Host WebViewer instance.
   * @param selectionManager    Manages text/annotation selection.
   * @param searchHighlighter   Highlights search matches.
   * @param pageBuffer          Number of pages to render around the viewport.
   */
  constructor(
    options: ViewerLoadOptions,
    scrollableContainer: HTMLElement,
    pagesParentDiv: HTMLElement,
    totalPages: number,
    pdfViewer: WebViewer,
    selectionManager: SelectionManager,
    searchHighlighter: SearchHighlighter,
    pageBuffer = 3,
  ) {
    this._options = options;
    this._totalPages = totalPages;
    this._scrollableContainer = scrollableContainer;
    this._pagesParentDiv = pagesParentDiv;
    this._pageBuffer = pageBuffer;

    this._webViewer = pdfViewer;
    this._pdfDocument = this._webViewer.pdfDocument;
    this._selectionManager = selectionManager;
    this._searchHighlighter = searchHighlighter;

    // Initialize engine modules
    this._pageRenderer = new PageRenderer();
    this._scaleManager = new ScaleManager();
    this._memoryManager = new MemoryManager({
      pressureThreshold: 0.75,
      checkInterval: 5000,
      detectWebGL: true,
      fallbackMemoryLimit: 100,
    });
    this._renderScheduler = new RenderScheduler<CachedPageInfo>({
      maxConcurrentRenders: 2,
      cancelCheckInterval: 100,
      aggressiveCancelDistance: 8,
      rapidScrollThreshold: 500,
      debug: false,
    });
    this._pageDomAdapter = new PageDomAdapter(
      this._pagesParentDiv,
      this._scrollableContainer,
      {
        instanceId: this.instanceId,
        containerId: this._options.containerId,
        pageGap: 10,
        maxPooledWrappers: 10, // Initial pool size, can be expanded
      }
    );
    this._tileManager = new TileManager({
      tileSize: this._options.tileConfig?.tileSize ?? 512,
      progressiveRendering: this._options.tileConfig?.progressiveRendering ?? true,
      maxCachedTiles: this._options.tileConfig?.maxCachedTiles ?? 100,
      enableHighDPI: this._options.tileConfig?.enableHighDPI ?? true,
      debug: this._options.tileConfig?.debug ?? false, // Configurable via options
    });

    // Connect TileManager to canvas pool
    this._tileManager.setCanvasPool({
      getTileCanvas: (w, h) => this.canvasPool.getCanvas(w, h),
      releaseTileCanvas: (c) => this.canvasPool.releaseCanvas(c),
    });

    // Set up render task executor
    this._renderScheduler.setExecutor(async (task, signal) => {
      const pageInfo = task.data;
      if (!pageInfo) {
        return { pageNumber: task.pageNumber, success: false, error: new Error('No page info') };
      }

      try {
        await this._transitionToFullRender(pageInfo);
        return { pageNumber: task.pageNumber, success: true };
      } catch (error: any) {
        return { pageNumber: task.pageNumber, success: false, error };
      }
    });

    // Register layer resize callback with ScaleManager
    this._scaleManager.registerLayerResizeCallback((pageNumber, viewport) => {
      // Resize annotation drawing layer
      const annotationLayerId = `annotation-drawing-layer-${this.instanceId}`;
      const annotationLayer = document.querySelector<HTMLElement>(`#${annotationLayerId}`);
      if (annotationLayer) {
        annotationLayer.style.width = `${viewport.width}px`;
        annotationLayer.style.height = `${viewport.height}px`;
      }
    });

    // Signal readiness after initialization completes
    // this._webViewer.ready = new Promise<void>((res) => (this._resolveReadyPromise = res));
    this.bufferReady = new Promise((res) => (this._resolveBufferReady = res));
    this._initAsync();
  }

  get instanceId(): string {
    return this._webViewer.instanceId;
  }

  get containerId(): string {
    return this._webViewer.containerId;
  }

  get state() {
    return this._webViewer.state;
  }

  get pdfDocument() {
    return this._webViewer.pdfDocument!;
  }

  get events() {
    return this._webViewer.events;
  }

  get canvasPool() {
    return this._webViewer.canvasPool;
  }

  /** call when first screenful of pages fully rendered */
  private _markBufferReady() {
    this._resolveBufferReady();
  }

  /**
   * Initializes page wrapper pool, computes positions, and sets up scroll/observer.
   */
  private async _initAsync(): Promise<void> {
    // Start memory monitoring
    this._memoryManager.startMonitoring();
    this._memoryPressureUnsubscribe = this._memoryManager.onPressureChange((pressure, stats) => {
      Logger.info('Memory pressure changed', { pressure, stats });

      // Adjust page buffer based on memory pressure
      const recommendedBuffer = MemoryManager.getRecommendedBuffer(this._pageBuffer, pressure);
      if (recommendedBuffer !== this._pageBuffer) {
        Logger.info('Adjusting page buffer due to memory pressure', {
          old: this._pageBuffer,
          new: recommendedBuffer,
          pressure,
        });
      }

      // Emergency cleanup on high/critical pressure
      if (pressure === MemoryPressure.HIGH || pressure === MemoryPressure.CRITICAL) {
        this._emergencyCancelAll();
      }
    });

    const initialPagesToFillViewport = await this._calculateInitialPagesToRender();
    const calculatedWrappers = initialPagesToFillViewport * 2 + 5;
    this._maxPooledWrappers = Math.min(this._totalPages > 0 ? this._totalPages : calculatedWrappers, calculatedWrappers);
    if (this._totalPages === 0) this._maxPooledWrappers = 5; // Fallback for empty PDF
    this._setupPeriodicCancellation();
    this.canvasPool.maxPoolSize = this._maxPooledWrappers > 0 ? this._maxPooledWrappers + 2 : 5;

    // PageDomAdapter initializes pool in constructor, no need to initialize here

    await this.calculatePagePositions();

    if (this.isRenderingSpecificPageOnly == null) {
      await this._updateRenderedPagesOnScroll(this._scrollableContainer.scrollTop, true);
      this._debouncedEnsureVisiblePagesRendered();
      if (!this._intersectionObserver) {
        this._intersectionObserver = new IntersectionObserver(
          (entries) => {
            for (const entry of entries) {
              const ratio = entry.intersectionRatio;
              if (ratio < 0.5) continue;

              const wrapper = entry.target as HTMLDivElement;
              const pageNum = Number(wrapper.dataset.pageNumber);

              // Only fully render the page the app thinks is "current"
              if (pageNum !== this.state.currentPage) {
                // Optionally unobserve so we don't even get called again for this page
                this._intersectionObserver?.unobserve(wrapper);
                continue;
              }

              const pageInfo = this._cachedPages.get(pageNum)!;
              if (!pageInfo.isFullyRendered) {
                this._intersectionObserver?.unobserve(wrapper);
                // Don't call _transitionToFullRender() directly - let the scheduler handle it
                // This prevents double rendering from two different code paths
                this._debouncedEnsureVisiblePagesRendered();
              }
            }
          },
          {
            root: this._scrollableContainer,
            threshold: [0.5],
          },
        );
      }
      this._attachScrollListener();
    } else {
      await this._renderSpecificPageOnly(this.isRenderingSpecificPageOnly);
    }

    this._markBufferReady();
    if ((this._options?.toolbarOptions ?? {})?.showThumbnail && this._totalPages > 0) {
      await this.generateThumbnails();
    }
  }

  public _forceObservePage() {
    this._cachedPages.forEach((pageInfo) => {
      if (pageInfo.pageWrapperDiv) {
        this._pageIntersectionObserver?.observe(pageInfo.pageWrapperDiv);
      }
    });
  }

  /**
   * Enhanced scroll handler with request coalescing.
   */
  private _scrollHandler = (event: Event) => {
    if (this.isRenderingSpecificPageOnly != null) return;

    // Update rapid scrolling state (keep this for aggressive cancellation)
    this._updateRapidScrollingState();

    // Aggressive cancellation during scroll (keep this optimization)
    this._aggressiveCancelRenders();

    Logger.info('scroll event', {
      scrollTop: this._scrollableContainer.scrollTop,
    });

    // Direct throttled handling - simple and effective
    this._throttledScrollHandler(this._scaleManager.isScaling());
  };

  /**
   * Adds a page to the render queue with specified priority.
   * Lower priority numbers = higher priority (0 = highest)
   * @param pageInfo The page information to render
   * @param priority Priority level (0 = current page, higher = lower priority)
   */
  private _queuePageForRender(pageInfo: CachedPageInfo, priority: number = 1): void {
    this._renderScheduler.enqueueTask({
      pageNumber: pageInfo.pageNumber,
      priority,
      data: pageInfo,
    });
    this._renderScheduler.startProcessing();
  }

  /**
   * Detects rapid scrolling to enable more aggressive cancellation.
   */
  private _updateRapidScrollingState(): void {
    this._renderScheduler.onScroll();
  }

  /**
   * Aggressively cancels renders based on visibility, distance, and memory pressure.
   */
  private _aggressiveCancelRenders(): void {
    const currentPage = this.state.currentPage;

    // Use RenderScheduler to cancel distant tasks
    this._renderScheduler.cancelDistantTasks(currentPage);

    // Keep memory pressure emergency cancel logic
    const isMemoryPressure = this._checkMemoryPressure();
    if (isMemoryPressure) {
      this._emergencyCancelAll();
    }
  }

  /**
   * Cancels base render task and cleans up resources.
   */
  private _cancelBaseRender(pageInfo: CachedPageInfo): void {
    if (pageInfo.renderTask) {
      Logger.info(`Aggressively cancelling base render for page ${pageInfo.pageNumber}`);

      // Use PageRenderer to cancel
      this._pageRenderer.cancelPageRender(pageInfo.pageNumber, 'base');
      pageInfo.renderTask = undefined;

      // Release canvas back to pool if it exists
      if (pageInfo.canvasElement) {
        this.canvasPool.releaseCanvas(pageInfo.canvasElement);
        pageInfo.canvasElement = undefined;
      }

      // Remove canvas from DOM
      const canvasPresentation = pageInfo.pageWrapperDiv.querySelector(`#canvasPresentation-${pageInfo.pageNumber}`);
      if (canvasPresentation) {
        canvasPresentation.innerHTML = '';
      }
    }
  }

  /**
   * Cancels high-resolution render task and cleans up ImageBitmap.
   */
  private _cancelHighResRender(pageInfo: CachedPageInfo): void {
    if (pageInfo.highResRenderTask) {
      Logger.info(`Aggressively cancelling high-res render for page ${pageInfo.pageNumber}`);

      // Use PageRenderer to cancel and cleanup bitmap
      this._pageRenderer.cancelPageRender(pageInfo.pageNumber, 'high');
      pageInfo.highResRenderTask = undefined;

      // Clean up ImageBitmap
      if (pageInfo.highResImageBitmap) {
        pageInfo.highResImageBitmap.close();
        pageInfo.highResImageBitmap = undefined;
      }

      // Clear high-res image container
      const imageContainer = pageInfo.pageWrapperDiv.querySelector(`#zoomedImageContainer-${pageInfo.pageNumber}`);
      if (imageContainer) {
        imageContainer.innerHTML = '';
      }
    }
  }

  /**
   * Removes a page from the render queue.
   */
  private _removeFromRenderQueue(pageNumber: number): boolean {
    return this._renderScheduler.cancelTask(pageNumber);
  }

  /**
   * Basic memory pressure detection using MemoryManager.
   */
  private _checkMemoryPressure(): boolean {
    const pressure = this._memoryManager.getCurrentPressure();
    return pressure === MemoryPressure.MEDIUM || pressure === MemoryPressure.HIGH || pressure === MemoryPressure.CRITICAL;
  }

  /**
   * Emergency cancellation for extreme memory pressure or performance issues.
   */
  private _emergencyCancelAll(): void {
    Logger.warn('Emergency render cancellation triggered');

    let cancelledCount = 0;
    const currentPage = this.state.currentPage;

    this._cachedPages.forEach((pageInfo) => {
      // Keep only current page and immediate neighbors
      if (Math.abs(pageInfo.pageNumber - currentPage) <= 1) {
        return;
      }

      if (pageInfo.renderTask || pageInfo.highResRenderTask) {
        this._cancelBaseRender(pageInfo);
        this._cancelHighResRender(pageInfo);
        cancelledCount++;
      }
    });

    // Clear most of the render queue, keeping only high-priority items
    // RenderScheduler will handle priority-based cancellation internally

    // Force memory cleanup
    this.canvasPool.handleMemoryPressure();

    Logger.warn(`Emergency cancellation completed: ${cancelledCount} renders cancelled`);
  }

  /**
   * Cancels renders for pages that are no longer visible and removes them from queue.
   */
  private _cancelOffscreenRenders(): void {
    this._cachedPages.forEach((pageInfo) => {
      if (!pageInfo.isVisible) {
        // Remove from render queue
        this._renderScheduler.cancelTask(pageInfo.pageNumber);

        // Cancel active renders
        if (pageInfo.renderTask || pageInfo.highResRenderTask) {
          this._cancelBaseRender(pageInfo);
          this._cancelHighResRender(pageInfo);
        }
      }
    });
  }

  /**
   * Clears the entire render queue (useful during scale changes or navigation).
   */
  private _clearRenderQueue(): void {
    this._renderScheduler.cancelAllTasks();
    Logger.info('Render queue cleared');
  }

  private _setupPeriodicCancellation(): void {
    // Run aggressive cancellation periodically
    this._cancellationIntervalId = window.setInterval(() => {
      if (!this._scaleManager.isScaling() && !this.isRenderingSpecificPageOnly) {
        this._aggressiveCancelRenders();
      }
    }, 2000); // Every 2 seconds

    // Emergency cleanup on memory pressure
    if ('memory' in performance) {
      this._memoryPressureIntervalId = window.setInterval(() => {
        if (this._checkMemoryPressure()) {
          this._emergencyCancelAll();
        }
      }, 5000); // Every 5 seconds
    }
  }

  /**
   * Creates a pool of recycled page wrapper DIVs.
   */

  /** Read-only map of cached page info. */
  get cachedPages(): ReadonlyMap<number, CachedPageInfo> {
    return this._cachedPages;
  }

  /** Read-only map of page top-offsets. */
  get pagePositions(): ReadonlyMap<number, number> {
    return this._pagePositions;
  }

  /**
   * Registers scroll and scale listeners.
   */
  private _attachScrollListener(): void {
    this.events.on('scaleChange', this._boundOnScaleChange);
    this._scrollableContainer.addEventListener('scroll', this._scrollHandler);
  }

  /**
   * Sets the page intersection observer.
   * @param observer The IntersectionObserver instance.
   */
  set pageObserver(observer: IntersectionObserver) {
    this._pageIntersectionObserver = observer;
  }

  /**
   * Returns a read-only set of currently visible pages.
   * @returns {ReadonlySet<number>} Set of currently visible page numbers.
   */
  get currentlyVisiblePages(): ReadonlySet<number> {
    const visible = new Set<number>();
    this._cachedPages.forEach((info) => {
      if (info.isVisible) {
        visible.add(info.pageNumber);
      }
    });
    return visible;
  }

  /**
   * Returns the page number being rendered if specific page rendering is enabled.
   * @returns {number | undefined | null} The page number or undefined if not set.
   */
  get isRenderingSpecificPageOnly(): number | undefined | null {
    return this._options?.renderSpecificPageOnly;
  }

  /**
   * Returns the page positions map.
   * @returns {ReadonlyMap<number, number>} The page positions map.
   */
  get pagePositionsMap(): ReadonlyMap<number, number> {
    return this._pagePositions;
  }

  /**
   * Handles PDF scaleChange events.
   */
  private async _onScaleChange(): Promise<void> {
    Logger.info('scale change start', { newScale: this.state.scale });
    this._scaleManager.beginScaleChange();

    // Reset retry tracking for all pages on scale change (new rendering context)
    this._cachedPages.forEach((pageInfo) => {
      pageInfo.renderAttempts = 0;
      pageInfo.lastRenderError = undefined;
      pageInfo.renderFailed = false;
    });

    try {
      this._emergencyCancelAll();
      this._clearRenderQueue();
      await this.updateVisiblePageBuffers();
      await this.refreshHighResForVisiblePages();

      await this._updateRenderedPagesOnScroll(this._scrollableContainer.scrollTop, false);
      this._debouncedEnsureVisiblePagesRendered();

      Logger.info('scale change end');
    } catch (error) {
      Logger.error('Error during scale change', error);
    } finally {
      this._scaleManager.endScaleChange();
    }
  }

  /**
   * Immediately updates the dimensions (CSS scaling) of currently visible and
   * fully rendered pages to reflect the new scale. This provides a quick,
   * blurry update during zoom. It also clears the high-resolution image container.
   */
  public async updateVisiblePageBuffers(): Promise<void> {
    if (!this._pagesParentDiv) return;

    for (const pageInfo of this._cachedPages.values()) {
      if (pageInfo.isVisible && pageInfo.pdfPageProxy) {
        try {
          const newViewport = pageInfo.pdfPageProxy.getViewport({ scale: this.state.scale });
          const pageNum = pageInfo.pageNumber;

          pageInfo.pageWrapperDiv.style.width = `${newViewport.width}px`;
          pageInfo.pageWrapperDiv.style.height = `${newViewport.height}px`;
          pageInfo.pageWrapperDiv.style.top = `${this._pagePositions.get(pageNum) || 0}px`;

          if (pageInfo.canvasElement) {
            pageInfo.canvasElement.style.width = `${newViewport.width}px`;
            pageInfo.canvasElement.style.height = `${newViewport.height}px`;
          }

          this._resizeExistingLayerDivs(pageInfo, newViewport);

          const imageContainer = pageInfo.pageWrapperDiv.querySelector<HTMLElement>(`#zoomedImageContainer-${pageNum}`);
          if (imageContainer) {
            imageContainer.innerHTML = '';
            imageContainer.style.width = `${newViewport.width}px`;
            imageContainer.style.height = `${newViewport.height}px`;
          }
        } catch (error) {
          Logger.error(`Failed to update dimensions for page ${pageInfo.pageNumber}`, error);
        }
      }
    }
  }

  /**
   * Resizes existing layer divs to match the new viewport dimensions.
   * @param pageInfo The page information object.
   * @param newViewport The new viewport dimensions.
   */
  private _resizeExistingLayerDivs(pageInfo: CachedPageInfo, newViewport: PageViewport): void {
    const resize = (selector: string) => {
      const div = pageInfo.pageWrapperDiv.querySelector<HTMLElement>(selector);
      if (div) {
        div.style.width = `${newViewport.width}px`;
        div.style.height = `${newViewport.height}px`;
      }
    };
    resize(`#${PDF_VIEWER_IDS.ANNOTATION_DRAWING_LAYER}-${this.instanceId}`);
  }

  /**
   * Refreshes high-resolution images for currently visible pages.
   * @returns {Promise<void>}
   */
  public async refreshHighResForVisiblePages(): Promise<void> {
    const pagesToRefresh = Array.from(this._cachedPages.values()).filter((pInfo) => pInfo.isVisible && pInfo.pdfPageProxy);

    // 🎨 SMART TILING: Use tiles only when scale > 1 (zoomed in)
    // At scale <= 1, use ImageBitmap since entire page is usually visible
    const currentScale = this.state.scale;
    const useTiling = (this._options.enableTiling ?? true) && currentScale > 1;

    for (const pageInfo of pagesToRefresh) {
      if (pageInfo.isVisible && pageInfo.pdfPageProxy) {
        if (useTiling) {
          await this._appendHighResToTiles(pageInfo);
        } else {
          await this.appendHighResImage(pageInfo);
        }
      }
    }
  }

  /**
   * Updates the page for a new scale, including rendering and resizing.
   * @param pageInfo The page information object.
   */
  private async _updatePageForNewScale(pageInfo: CachedPageInfo): Promise<void> {
    if (!pageInfo.pdfPageProxy && !pageInfo.isFullyRendered) {
      // If it was a placeholder, it needs its proxy
      try {
        pageInfo.pdfPageProxy = await this._pdfDocument.getPage(pageInfo.pageNumber);
      } catch (error) {
        // reportError(`getting page ${pageInfo.pageNumber} for scale update`, error);
        Logger.error(`_updatePageForNewScale: failed to fetch page ${pageInfo.pageNumber}`, error);
        return;
      }
    }

    // If still no proxy (e.g. error above, or it's a fundamental issue), we can't get a viewport.
    if (!pageInfo.pdfPageProxy) {
      // debugWarn(`no PDFPageProxy for page ${pageInfo.pageNumber} during scale update, using placeholder`);
      Logger.warn(`no proxy for page ${pageInfo.pageNumber} on scale update`);
      // We can still try to resize the placeholder div if pagePositions are available
      const placeholderViewportAttempt = PageElement.createLayers('', '', { width: 100, height: 100, scale: 1, rotation: 0 } as any, this.instanceId).getBoundingClientRect();
      const tempViewport = {
        width: this._pagePositions.has(pageInfo.pageNumber + 1) ? this._pagesParentDiv.clientWidth - PageElement.gap * 2 : placeholderViewportAttempt.width,
        height: this._pagePositions.has(pageInfo.pageNumber + 1)
          ? this._pagePositions.get(pageInfo.pageNumber + 1)! - this._pagePositions.get(pageInfo.pageNumber)! - PageElement.gap
          : placeholderViewportAttempt.height,
        scale: this.state.scale,
        rotation: 0,
      } as PageViewport; // This is a rough estimate if proxy fails

      PageElement.createOrUpdatePageContainerDiv(pageInfo.pageNumber, tempViewport, this._pagePositions, this.instanceId, pageInfo.pageWrapperDiv);
      pageInfo.isFullyRendered = false;
      return;
    }

    const newViewport = pageInfo.pdfPageProxy.getViewport({ scale: this.state.scale });

    PageElement.createOrUpdatePageContainerDiv(pageInfo.pageNumber, newViewport, this._pagePositions, this.instanceId, pageInfo.pageWrapperDiv);

    this._clearPageRenderArtifacts(pageInfo, true);
    pageInfo.isFullyRendered = false;

    // Don't call _transitionToFullRender() directly - mark page as needing render
    // The scheduler (via _ensureVisiblePagesRendered) will pick it up
    // This prevents multiple rendering paths and race conditions
  }

  /**
   * Throttled scroll handler to update rendered pages.
   * @param isScaling Indicates if a scale change is in progress.
   */
  private _throttledScrollHandler = throttle(async (isScaling: boolean) => {
    if (isScaling) return;

    const scrollTop = this._scrollableContainer.scrollTop;

    await this._updateRenderedPagesOnScroll(scrollTop);
    this._debouncedEnsureVisiblePagesRendered();
  }, 100);

  /**
   * Debounced function to ensure visible pages are rendered.
   * @returns {Promise<void>}
   */
  private _debouncedEnsureVisiblePagesRendered = debounce(() => {
    this._ensureVisiblePagesRendered();
  }, 100);

  /**
   * Ensures that visible pages are queued for rendering with appropriate priorities.
   */
  private async _ensureVisiblePagesRendered(): Promise<void> {
    if (this._scaleManager.isScaling()) return;

    const currentPage = this.state.currentPage;
    const pagesToQueue: Array<{ pageInfo: CachedPageInfo; priority: number }> = [];

    // Helper function to check if a page needs rendering with smart retry logic
    const needsRendering = (pageInfo: CachedPageInfo): boolean => {
      // Skip pages that are already being rendered (prevent duplicate queuing)
      if (pageInfo.isTransitioningToFullRender) {
        return false;
      }

      // If page previously failed with a REAL error (not cancellation), apply retry logic
      if (pageInfo.renderFailed) {
        const errorType = classifyError(pageInfo.lastRenderError);

        // PERMANENT errors - never retry
        if (errorType === RenderErrorType.PERMANENT) {
          Logger.warn(`Page ${pageInfo.pageNumber} has permanent render error, skipping retry`, {
            error: pageInfo.lastRenderError?.message,
          });
          return false;
        }

        // TRANSIENT errors - retry up to 3 times
        const attempts = pageInfo.renderAttempts || 0;
        if (errorType === RenderErrorType.TRANSIENT && attempts >= 3) {
          Logger.warn(`Page ${pageInfo.pageNumber} exceeded max retry attempts (${attempts}/3)`, {
            error: pageInfo.lastRenderError?.message,
          });
          return false;
        }

        // If we reach here, it's a transient error within retry limit - allow retry
        Logger.info(`Page ${pageInfo.pageNumber} will retry render (attempt ${attempts + 1}/3)`, {
          error: pageInfo.lastRenderError?.message,
        });
      }

      // Standard rendering check (includes pages that need first render or scale change)
      return !pageInfo.isFullyRendered || pageInfo.renderedScale == null || pageInfo.renderedScale !== this.state.scale;
    };

    // **Highest Priority (0)**: Current page
    const currentPageInfo = this._cachedPages.get(currentPage);
    if (currentPageInfo && currentPageInfo.isVisible && needsRendering(currentPageInfo)) {
      pagesToQueue.push({ pageInfo: currentPageInfo, priority: 0 });
    }

    // **High Priority (1-N)**: Pages in buffer around current page
    for (let i = 1; i <= this._pageBuffer; i++) {
      // Next pages (priority increases with distance)
      const nextPage = this._cachedPages.get(currentPage + i);
      if (nextPage && nextPage.isVisible && needsRendering(nextPage)) {
        pagesToQueue.push({ pageInfo: nextPage, priority: i });
      }

      // Previous pages (same priority as corresponding next pages)
      const prevPage = this._cachedPages.get(currentPage - i);
      if (prevPage && prevPage.isVisible && needsRendering(prevPage)) {
        pagesToQueue.push({ pageInfo: prevPage, priority: i });
      }
    }

    // **Lower Priority**: Any other visible but not fully rendered pages or rendered at wrong scale
    this._cachedPages.forEach((pageInfo) => {
      if (pageInfo.isVisible && needsRendering(pageInfo) && !pagesToQueue.some((item) => item.pageInfo.pageNumber === pageInfo.pageNumber)) {
        const distance = Math.abs(pageInfo.pageNumber - currentPage);
        const priority = Math.max(this._pageBuffer + 1, distance);
        pagesToQueue.push({ pageInfo: pageInfo, priority });
      }
    });

    // Queue all pages for rendering using RenderScheduler
    pagesToQueue.forEach(({ pageInfo, priority }) => {
      this._renderScheduler.enqueueTask({
        pageNumber: pageInfo.pageNumber,
        priority,
        data: pageInfo,
      });
    });

    // Start processing after queuing all
    if (pagesToQueue.length > 0) {
      this._renderScheduler.startProcessing();
    }

    Logger.info(`Queued ${pagesToQueue.length} pages for rendering`, {
      currentPage,
    });
  }

  /**
   * Fully renders the page content.
   * @param pageInfo The page information object.
   * @returns {Promise<void>}
   */
  private async _transitionToFullRender(pageInfo: CachedPageInfo): Promise<void> {
    const currentScale = this.state.scale;
    if ((pageInfo.isFullyRendered && pageInfo.renderedScale === currentScale) || !pageInfo.isVisible || !pageInfo.pageWrapperDiv.parentElement) {
      return;
    }
    // Prevent re-entrancy
    if (pageInfo.isTransitioningToFullRender) {
      Logger.info(`Page ${pageInfo.pageNumber} is already transitioning to full render. Skipping.`);
      return;
    }
    pageInfo.isTransitioningToFullRender = true; // Set lock

    try {
      pageInfo.renderFailed = false;

      if (!pageInfo.pdfPageProxy) {
        try {
          pageInfo.pdfPageProxy = await this._pdfDocument.getPage(pageInfo.pageNumber);
        } catch (error) {
          // console.error(`Failed to get page ${pageInfo.pageNumber} for full render:`, error);
          Logger.error(`_transitionToFullRender: failed to fetch page ${pageInfo.pageNumber}`, error);
          pageInfo.renderFailed = true;
          return;
        }
      }
      if (!pageInfo.pdfPageProxy || pageInfo.renderFailed) return;

      const viewport = pageInfo.pdfPageProxy.getViewport({ scale: currentScale });

      PageElement.createOrUpdatePageContainerDiv(pageInfo.pageNumber, viewport, this._pagePositions, this.instanceId, pageInfo.pageWrapperDiv);

      Logger.info(`_transitionToFullRender → page ${pageInfo.pageNumber}`);
      await this._renderPageContent(pageInfo, viewport);

      // FIX: Only set isFullyRendered if canvas render succeeded (critical layer)
      if (pageInfo.renderFailed || !pageInfo.canvasState.isRendered) {
        Logger.error(`_transitionToFullRender: canvas render failed for page ${pageInfo.pageNumber}`);
        return;
      }

      // Retry failed text/annotation layers if needed (non-critical enhancements)
      if (pageInfo.textLayerState.renderFailed || pageInfo.annotationLayerState.renderFailed) {
        await this._retryFailedLayers(pageInfo);
      }

      // Render high-resolution content (only if zoom > 1x)
      if (!pageInfo.renderFailed && currentScale != 1) {
        // 🎨 SMART TILING: Use tiles only when scale > 1 (zoomed in)
        // At scale <= 1, use ImageBitmap since entire page is usually visible
        const useTiling = (this._options.enableTiling ?? true) && currentScale > 1;

        if (useTiling) {
          // Use tiles (memory efficient, only visible tiles when zoomed)
          await this._appendHighResToTiles(pageInfo);
        } else {
          // Use ImageBitmap (original approach, better for full page view)
          await this.appendHighResImage(pageInfo);
        }
      }

      pageInfo.pageWrapperDiv.classList.remove('page-placeholder');
      pageInfo.pageWrapperDiv.style.backgroundColor = '';

      // Page is fully rendered when:
      // 1. Canvas is rendered (critical) - MUST be true
      // 2. Text/annotation layers either succeeded OR exceeded retry attempts (enhancements)
      const allLayersComplete =
        pageInfo.canvasState.isRendered &&
        (pageInfo.textLayerState.isRendered || pageInfo.textLayerState.renderAttempts >= 3) &&
        (pageInfo.annotationLayerState.isRendered || pageInfo.annotationLayerState.renderAttempts >= 3);

      pageInfo.isFullyRendered = allLayersComplete;
      pageInfo.renderedScale = currentScale;

      Logger.info(`_transitionToFullRender done page ${pageInfo.pageNumber}`, {
        renderedScale: pageInfo.renderedScale,
        canvasRendered: pageInfo.canvasState.isRendered,
        textLayerRendered: pageInfo.textLayerState.isRendered,
        annotationLayerRendered: pageInfo.annotationLayerState.isRendered,
        fullyRendered: pageInfo.isFullyRendered,
      });
    } catch (error) {
      Logger.error(`Unexpected error in _transitionToFullRender for page ${pageInfo.pageNumber}`, { rawError: error });
      pageInfo.renderFailed = true;
    } finally {
      pageInfo.isTransitioningToFullRender = false;
    }
  }

  /**
   * Calculates the number of pages to render initially based on container height.
   * @returns {Promise<number>} Number of pages to render.
   */
  private async _calculateInitialPagesToRender(): Promise<number> {
    if (this._totalPages === 0) return 0;
    const containerHeight = this._scrollableContainer.getBoundingClientRect().height;
    if (containerHeight <= 0) return 1;

    const scale = this.state.scale;

    // Get dimensions for all pages
    const pageDimensions: Array<{ pageNumber: number; width: number; height: number }> = [];
    for (let pageNum = 1; pageNum <= this._totalPages; pageNum++) {
      const page = await this._pdfDocument.getPage(pageNum);
      const viewport = page.getViewport({ scale });
      pageDimensions.push({
        pageNumber: pageNum,
        width: viewport.width,
        height: viewport.height,
      });
    }

    // Use VirtualizationEngine to calculate initial page count
    return VirtualizationEngine.calculateInitialPageCount(
      containerHeight,
      pageDimensions,
      PageElement.gap
    );
  }

  /**
   * Renders only the specified page and clears others.
   * @param pageNumber The page number to render.
   */
  private async _renderSpecificPageOnly(pageNumber: number): Promise<void> {
    for (const existingPageNum of this._cachedPages.keys()) {
      this._removePageFromDom(existingPageNum);
    }
    this._cachedPages.clear();

    let pageInfo = await this._addPageToDom(pageNumber); // Adds as placeholder
    if (pageInfo) {
      pageInfo.isVisible = true;
      this.state.currentPage = pageNumber;
      await this._transitionToFullRender(pageInfo); // Then fully render it
    }
  }

  /**
   * Generates thumbnails for all pages.
   * @returns {Promise<void>}
   */
  public async generateThumbnails(): Promise<void> {
    if (this._totalPages === 0) return;
    const isSpecificPage = this.isRenderingSpecificPageOnly;
    const thumbnailContainer = ThumbnailViewer.createThumbnailContainer(this._options!.containerId);
    const linkService = new PDFLinkService({ pdfViewer: this._webViewer });

    for (let pageNum = isSpecificPage ?? 1; pageNum <= (isSpecificPage ?? this._totalPages); pageNum++) {
      const thumbnail = new ThumbnailViewer({
        container: thumbnailContainer as HTMLElement,
        pageNumber: pageNum,
        pdfDocument: this._pdfDocument,
        linkService,
      });
      await thumbnail.initThumbnail();
      if (pageNum === (isSpecificPage ?? this.state.currentPage)) {
        thumbnail.activeThumbnail = this.state.currentPage;
      }
      this._thumbnailViewer = thumbnail;
    }
  }

  /**
   * Calculates the positions of all pages in the document.
   * @returns {Promise<Map<number, number>>} A map of page numbers to their top offsets.
   */
  async calculatePagePositions(): Promise<Map<number, number>> {
    const scale = this.state.scale;
    this._pagePositions.clear();

    if (this._totalPages === 0 && !this.isRenderingSpecificPageOnly) {
      this._pagesParentDiv.style.height = '0px';
      this._pagesParentDiv.style.width = '0px';
      return this._pagePositions;
    }

    const startPageNum = this.isRenderingSpecificPageOnly ?? 1;
    const endPageNum = this.isRenderingSpecificPageOnly ?? this._pdfDocument.numPages;

    // Get dimensions for all pages
    const pageDimensions: Array<{ pageNumber: number; width: number; height: number }> = [];
    for (let pageNum = startPageNum; pageNum <= endPageNum; pageNum++) {
      const page = await this._pdfDocument.getPage(pageNum);
      const viewport = page.getViewport({ scale });
      pageDimensions.push({
        pageNumber: pageNum,
        width: viewport.width,
        height: viewport.height,
      });
    }

    // Use VirtualizationEngine to calculate page positions
    const positions = VirtualizationEngine.calculatePagePositions(pageDimensions, {
      totalPages: this._totalPages,
      pageBuffer: this._pageBuffer,
      pageGap: PageElement.gap,
      scale,
      specificPageOnly: this.isRenderingSpecificPageOnly ?? undefined,
    });

    // Store full dimensions and convert to Map<number, number> (just top positions)
    this._pageDimensions = positions;
    positions.forEach((dims, pageNum) => {
      this._pagePositions.set(pageNum, dims.top);
    });

    // Calculate and set total dimensions
    const totalHeight = VirtualizationEngine.calculateTotalHeight(positions, {
      totalPages: this._totalPages,
      pageBuffer: this._pageBuffer,
      pageGap: PageElement.gap,
      scale,
    });

    const totalWidth = VirtualizationEngine.calculateTotalWidth(positions);

    this._pagesParentDiv.style.height = `${totalHeight}px`;
    this._pagesParentDiv.style.width = `${totalWidth + PageElement.gap * 2}px`;

    return this._pagePositions;
  }

  /**
   * Determines the page number that is most centered in the viewport.
   * @param scrollTop The current scroll position.
   * @returns {number} The page number that is most centered in the viewport.
   */
  private _determineCenterPageInViewport(scrollTop: number): number {
    if (this._pageDimensions.size === 0) return 1;

    // Use VirtualizationEngine to determine center page
    return VirtualizationEngine.determineCenterPage(
      {
        scrollTop,
        containerHeight: this._scrollableContainer.clientHeight,
        containerWidth: this._scrollableContainer.clientWidth,
      },
      this._pageDimensions,
      this.state.currentPage
    );
  }

  /**
   * Updates the rendered pages based on the current scroll position.
   * @param scrollTop The current scroll position.
   * @param isInitialLoad Indicates if this is the initial load.
   */
  private async _updateRenderedPagesOnScroll(scrollTop: number, isInitialLoad: boolean = false): Promise<void> {
    if (this.isRenderingSpecificPageOnly != null || this._totalPages === 0) return;

    const centralPageNum = this._determineCenterPageInViewport(scrollTop);
    if (this.state.currentPage !== centralPageNum) {
      this.state.currentPage = centralPageNum;
    }

    const pagesToKeepInDom = new Set<number>();
    const startPage = Math.max(1, centralPageNum - this._pageBuffer);
    const endPage = Math.min(this._totalPages, centralPageNum + this._pageBuffer);

    for (let pageNum = startPage; pageNum <= endPage; pageNum++) {
      pagesToKeepInDom.add(pageNum);
    }

    // MEMORY OPTIMIZATION: Remove ALL pages not in the keep set
    const pagesToRemoveFromDom: number[] = [];
    this._cachedPages.forEach((_pageInfo, pageNum) => {
      if (!pagesToKeepInDom.has(pageNum)) {
        pagesToRemoveFromDom.push(pageNum);
      }
    });

    // Remove pages from DOM and cache
    for (const pageNum of pagesToRemoveFromDom) {
      this._removePageFromDom(pageNum);
    }

    this._cancelOffscreenRenders();

    // Add or restore pages that should be visible
    for (const pageNum of pagesToKeepInDom) {
      let pageInfo = this._cachedPages.get(pageNum);
      if (!pageInfo) {
        pageInfo = await this._addPageToDom(pageNum);
      } else {
        pageInfo.isVisible = true;
      }
    }

    // 🎨 UPDATE TILES ON SCROLL: Re-render tiles for visible pages when scrolling
    // Only update tiles if tiling is enabled AND scale > 1 (zoomed in)
    const currentScale = this.state.scale;
    const useTiling = (this._options.enableTiling ?? true) && currentScale > 1;

    if (useTiling) {
      // Update tiles for all visible pages (horizontal/vertical scroll)
      this._cachedPages.forEach((pageInfo) => {
        if (pageInfo.isVisible && pageInfo.isFullyRendered && pageInfo.pdfPageProxy) {
          // Update tile visibility and render new visible tiles
          this._updateTilesForVisiblePage(pageInfo).catch(err => {
            Logger.warn(`Failed to update tiles for page ${pageInfo.pageNumber}`, err);
          });
        }
      });
    }

    // AGGRESSIVE CACHE CLEANUP: If cache is still too large, remove oldest pages
    const MAX_CACHE_SIZE = (this._pageBuffer * 2) + 10; // Keep buffer + some margin
    if (this._cachedPages.size > MAX_CACHE_SIZE) {
      const pagesToPurge: number[] = [];
      this._cachedPages.forEach((_pageInfo, pageNum) => {
        if (!pagesToKeepInDom.has(pageNum)) {
          pagesToPurge.push(pageNum);
        }
      });

      // Remove excess pages
      const excessCount = this._cachedPages.size - MAX_CACHE_SIZE;
      for (let i = 0; i < Math.min(excessCount, pagesToPurge.length); i++) {
        this._removePageFromDom(pagesToPurge[i]);
      }

      Logger.info(`Aggressive cache cleanup: removed ${Math.min(excessCount, pagesToPurge.length)} pages, cache size: ${this._cachedPages.size}`);

      // MEMORY OPTIMIZATION: Shrink canvas and wrapper pools after cleanup
      this._shrinkMemoryPools();
    }
  }

  /**
   * Aggressively shrink memory pools to free up memory
   * Called after removing many pages from cache
   */
  private _shrinkMemoryPools(): void {
    try {
      // Shrink canvas pool to minimal size (keep minimum for visible pages)
      const currentVisiblePages = Array.from(this._cachedPages.values()).filter(p => p.isVisible).length;
      const minCanvasPool = Math.max(5, currentVisiblePages + 2);
      if (this.canvasPool && this.canvasPool.maxPoolSize > minCanvasPool) {
        this.canvasPool.maxPoolSize = minCanvasPool;
        Logger.info(`Reduced canvas pool size to ${minCanvasPool} (visible: ${currentVisiblePages})`);
      }

      // Note: PageDomAdapter manages its own pool internally
    } catch (e) {
      // Ignore pool shrinking errors
      Logger.warn('Failed to shrink memory pools', e);
    }
  }

  /**
   * Clears rendering artifacts for a page.
   * @param pageInfo The page information object.
   * @param destroyLayers Indicates if layers should be destroyed.
   */
  private _clearPageRenderArtifacts(pageInfo: CachedPageInfo, destroyLayers: boolean = true): void {
    // Use PageRenderer to cancel all renders for this page
    this._pageRenderer.cancelPageRender(pageInfo.pageNumber, 'all');

    pageInfo.renderTask = undefined;
    pageInfo.highResRenderTask = undefined;

    if (pageInfo.canvasElement) {
      this.canvasPool.releaseCanvas(pageInfo.canvasElement);
      pageInfo.canvasElement = undefined;
    }
    if (pageInfo.highResImageBitmap) {
      pageInfo.highResImageBitmap.close();
      pageInfo.highResImageBitmap = undefined;
    }

    // Clear error objects to prevent memory retention
    pageInfo.canvasState.lastError = undefined;
    pageInfo.textLayerState.lastError = undefined;
    pageInfo.annotationLayerState.lastError = undefined;

    const canvasPresentationDiv = pageInfo.pageWrapperDiv.querySelector(`#canvasPresentation-${pageInfo.pageNumber}`);
    canvasPresentationDiv?.remove();

    if (destroyLayers) {
      // Destroy and remove text layer
      if (this._activeTextLayers.has(pageInfo.pageNumber)) {
        this._activeTextLayers.get(pageInfo.pageNumber)?.destroy();
        this._activeTextLayers.delete(pageInfo.pageNumber);
      }
      pageInfo.textLayer?.destroy();
      pageInfo.textLayer = undefined;

      // Destroy and remove annotation layer
      if (this._activeAnnotationLayers.has(pageInfo.pageNumber)) {
        this._activeAnnotationLayers.get(pageInfo.pageNumber)?.destroy();
        this._activeAnnotationLayers.delete(pageInfo.pageNumber);
      }
      pageInfo.annotationLayer?.destroy();
      pageInfo.annotationLayer = undefined;

      this._webViewer.annotation.unregisterAnnotationManager(pageInfo.pageNumber);
      this._searchHighlighter.deregisterPage(pageInfo.pageNumber);
    }
    pageInfo.isFullyRendered = false;
    pageInfo.renderedScale = undefined;
  }

  /**
   * Adds a page to the DOM as a placeholder.
   * @param pageNumber The page number to add.
   * @returns {Promise<CachedPageInfo | undefined>} The cached page information or undefined if not added.
   */
  private async _addPageToDom(pageNumber: number): Promise<CachedPageInfo | undefined> {
    let pageInfo = this._cachedPages.get(pageNumber);

    if (pageInfo && pageInfo.pageWrapperDiv.parentElement) {
      pageInfo.isVisible = true;
      //  FIX: Ensure existing pages have correct dimensions
      if (pageInfo.pdfPageProxy) {
        const currentViewport = pageInfo.pdfPageProxy.getViewport({ scale: this.state.scale });
        const currentWidth = parseInt(pageInfo.pageWrapperDiv.style.width || '0');
        if (Math.abs(currentWidth - currentViewport.width) > 2) {
          Logger.info(`Correcting dimensions for existing page ${pageNumber}`);
          pageInfo.pageWrapperDiv.style.width = `${currentViewport.width}px`;
          pageInfo.pageWrapperDiv.style.height = `${currentViewport.height}px`;
          pageInfo.pageWrapperDiv.style.top = `${this._pagePositions.get(pageNumber) || 0}px`;
        }
      }
      return pageInfo;
    }

    let pdfPageProxy: PDFPageProxy | null = null;
    let placeholderViewport: PageViewport;
    try {
      const tempPageForSize = await this._pdfDocument.getPage(pageNumber);
      pdfPageProxy = tempPageForSize;
      placeholderViewport = tempPageForSize.getViewport({ scale: this.state.scale });
    } catch (e) {
      reportError(`getting page ${pageNumber} for placeholder size`, e);
      Logger.error(`_addPageToDom: failed placeholder size for page ${pageNumber}`, e);
      placeholderViewport = { width: 200, height: 300, scale: this.state.scale, rotation: 0 } as PageViewport;
    }

    // Use PageDomAdapter to get or create wrapper
    const wrapper = this._pageDomAdapter.getOrCreateWrapper({
      pageNumber,
      width: placeholderViewport.width,
      height: placeholderViewport.height,
      top: this._pagePositions.get(pageNumber) || 0,
      left: 0,
      scale: this.state.scale,
    });

    const pageWrapperDiv = wrapper.element;

    this._pageDomAdapter.setPlaceholder(pageNumber, '#fff');
    PageElement.createOrUpdatePageContainerDiv(pageNumber, placeholderViewport, this._pagePositions, this.instanceId, pageWrapperDiv);
    if (this._intersectionObserver) {
      this._intersectionObserver.observe(pageWrapperDiv);
    }

    pageInfo = {
      pageNumber,
      pdfPageProxy,
      pageWrapperDiv,
      isVisible: true,
      isFullyRendered: false,
      renderFailed: false,
      isTransitioningToFullRender: false,
      renderedScale: undefined,
      // Initialize decoupled layer states
      canvasState: { isRendered: false, renderFailed: false, renderAttempts: 0 },
      textLayerState: { isRendered: false, renderFailed: false, renderAttempts: 0 },
      annotationLayerState: { isRendered: false, renderFailed: false, renderAttempts: 0 },
    };
    this._cachedPages.set(pageNumber, pageInfo);

    if (this._pageIntersectionObserver) {
      this._pageIntersectionObserver.observe(pageWrapperDiv);
    }
    return pageInfo;
  }

  /**
   * Render high-res tiles (replaces appendHighResImage when tiling enabled)
   * Tiles are rendered into zoomedImageContainer, same as high-res ImageBitmap
   */
  private async _appendHighResToTiles(pageInfo: CachedPageInfo): Promise<void> {
    if (!pageInfo.pdfPageProxy || !pageInfo.isVisible) {
      return;
    }

    // Recalculate viewport with current scale
    const currentScale = this.state.scale;
    const currentViewport = pageInfo.pdfPageProxy.getViewport({ scale: currentScale });

    // Get zoomedImageContainer (same as in appendHighResImage)
    const imageContainer = pageInfo.pageWrapperDiv.querySelector<HTMLElement>(
      `#zoomedImageContainer-${pageInfo.pageNumber}`
    );

    if (!imageContainer) {
      return;
    }

    // Clear old high-res content (bitmap or tiles)
    imageContainer.innerHTML = '';

    // Calculate viewport bounds relative to page
    const pageBounds = pageInfo.pageWrapperDiv.getBoundingClientRect();
    const containerBounds = this._scrollableContainer.getBoundingClientRect();

    const viewportBounds: ViewportBounds = {
      top: Math.max(0, containerBounds.top - pageBounds.top),
      left: Math.max(0, containerBounds.left - pageBounds.left),
      width: Math.min(currentViewport.width, containerBounds.width),
      height: Math.min(currentViewport.height, containerBounds.height),
    };

    Logger.info(`Rendering HIGH-RES TILES for page ${pageInfo.pageNumber}`, {
      scale: currentScale,
      viewport: `${currentViewport.width}×${currentViewport.height}`,
    });

    // Render visible tiles at full resolution
    const tiles = await this._tileManager.renderVisibleTiles(
      pageInfo.pageNumber,
      pageInfo.pdfPageProxy,
      currentViewport,
      viewportBounds
    );

    // Append tiles to imageContainer (they replace the high-res bitmap)
    tiles.forEach(tile => {
      if (tile.canvas && tile.isRendered) {
        tile.canvas.id = tile.id;
        imageContainer.appendChild(tile.canvas);
      }
    });

    pageInfo.renderedScale = currentScale;

    Logger.info(`✅ Rendered ${tiles.length} high-res tiles for page ${pageInfo.pageNumber}`, {
      tileStats: this._tileManager.getStats(),
    });
  }

  /**
   * Updates tiles for a visible page when scrolling reveals new areas.
   * This ensures high-res tiles are rendered for newly visible portions.
   * @param pageInfo The page information object.
   * @returns {Promise<void>}
   */
  private async _updateTilesForVisiblePage(pageInfo: CachedPageInfo): Promise<void> {
    const currentScale = this.state.scale;

    // Get current viewport for this page
    const currentViewport = pageInfo.pdfPageProxy!.getViewport({
      scale: currentScale,
    });

    // Get the zoomedImageContainer
    const imageContainer = pageInfo.pageWrapperDiv.querySelector<HTMLElement>(
      `#zoomedImageContainer-${pageInfo.pageNumber}`
    );

    if (!imageContainer) {
      Logger.warn(`No zoomedImageContainer found for page ${pageInfo.pageNumber}`);
      return;
    }

    // Calculate viewport bounds (what's currently visible in the scroll container)
    const containerBounds = this._scrollableContainer.getBoundingClientRect();
    const pageBounds = pageInfo.pageWrapperDiv.getBoundingClientRect();

    const viewportBounds: ViewportBounds = {
      top: Math.max(0, containerBounds.top - pageBounds.top),
      left: Math.max(0, containerBounds.left - pageBounds.left),
      width: Math.min(currentViewport.width, containerBounds.width),
      height: Math.min(currentViewport.height, containerBounds.height),
    };

    // Get currently rendered tiles from the DOM
    const existingTileIds = new Set<string>();
    const existingTileElements = imageContainer.querySelectorAll<HTMLCanvasElement>('canvas[id^="tile-"]');
    existingTileElements.forEach((canvas) => {
      existingTileIds.add(canvas.id);
    });

    // Update tile visibility based on new viewport bounds
    this._tileManager.updateTileVisibility(pageInfo.pageNumber, viewportBounds);

    // Render any new visible tiles
    const tiles = await this._tileManager.renderVisibleTiles(
      pageInfo.pageNumber,
      pageInfo.pdfPageProxy!,
      currentViewport,
      viewportBounds
    );

    // Add new tiles to the container (skip tiles that are already in DOM)
    let newTilesAdded = 0;
    tiles.forEach((tile) => {
      if (tile.canvas && tile.isRendered && !existingTileIds.has(tile.canvas.id)) {
        imageContainer.appendChild(tile.canvas);
        newTilesAdded++;
      }
    });

    // Remove tiles that are no longer visible
    const visibleTileIds = new Set<string>(tiles.map(t => t.canvas?.id).filter(Boolean) as string[]);
    existingTileElements.forEach((canvas) => {
      if (!visibleTileIds.has(canvas.id)) {
        canvas.remove();
      }
    });

    if (newTilesAdded > 0) {
      Logger.info(`Updated tiles for page ${pageInfo.pageNumber}: added ${newTilesAdded} new tiles`, {
        totalVisible: tiles.length,
      });
    }
  }

  /**
   * Renders the page content.
   * @param pageInfo The page information object.
   * @param viewport The viewport for rendering.
   * @returns {Promise<void>}
   */
  private async _renderPageContent(pageInfo: CachedPageInfo, viewport: PageViewport): Promise<void> {
    Logger.info(`renderPageContent start`, {
      page: pageInfo.pageNumber,
      scale: this.state.scale,
      width: viewport.width,
      height: viewport.height,
    });
    if (pageInfo.renderTask) {
      Logger.warn(`cancelling in‐flight base render`, { page: pageInfo.pageNumber });
      const oldTask = pageInfo.renderTask;
      oldTask.cancel();
      try {
        await oldTask.promise;
      } catch (err: any) {
        // expected RenderingCancelledException—ignore, but log if it's something else
        if (err.name !== 'RenderingCancelledException') {
          Logger.error(`unexpected error while cancelling`, { page: pageInfo.pageNumber, err });
        }
      }
      pageInfo.renderTask = undefined;

      // also put that canvas back into the pool if it hasn't been already
      if (pageInfo.canvasElement) {
        this.canvasPool.releaseCanvas(pageInfo.canvasElement);
        pageInfo.canvasElement = undefined;
      }
    }
    if (!pageInfo.pdfPageProxy || !viewport || !pageInfo.isVisible || (pageInfo.isFullyRendered && pageInfo.renderedScale == this.state.scale)) {
      return;
    }

    // Clear any previous partial renderings or ensure clean state before drawing
    // Passing 'false' to not destroy layer instances if they might be reused (though unlikely here)
    this._clearPageRenderArtifacts(pageInfo, false);

    const canvasPresentationDiv = this._ensureCanvasPresentationDiv(pageInfo);
    this._ensureImageContainerDiv(pageInfo, viewport, canvasPresentationDiv);

    // Use PageRenderer for base canvas rendering
    const baseResult = await this._pageRenderer.renderBaseCanvas({
      page: pageInfo.pdfPageProxy,
      viewport,
      canvasPool: this.canvasPool,
      scale: this.state.scale,
      pageNumber: pageInfo.pageNumber,
    });

    if (!baseResult.success) {
      if (baseResult.cancelled) {
        // Cancellation is NOT an error - it's expected behavior during scrolling
        // Don't set renderFailed, don't store error, don't increment attempts
        Logger.info(`Base render cancelled for page ${pageInfo.pageNumber} (normal during scroll)`);
        return;
      } else {
        // This is a REAL canvas failure - track it in decoupled canvasState
        Logger.error(`Base render failed for page ${pageInfo.pageNumber}`, baseResult.error);
        Logger.download();

        // Update decoupled canvas state
        pageInfo.canvasState.renderFailed = true;
        pageInfo.canvasState.lastError = baseResult.error;
        pageInfo.canvasState.renderAttempts++;

        // Legacy field - for backward compatibility
        pageInfo.renderFailed = true;
        pageInfo.lastRenderError = baseResult.error;
        pageInfo.renderAttempts = pageInfo.canvasState.renderAttempts;
      }
      return;
    }

    // Store canvas and render task
    pageInfo.canvasElement = baseResult.canvas;
    pageInfo.renderTask = baseResult.renderTask;

    // Append canvas to presentation div
    if (baseResult.canvas) {
      canvasPresentationDiv.appendChild(baseResult.canvas);
    }

    // Clear render task after completion
    pageInfo.renderTask = undefined;

    // Canvas rendered successfully - update decoupled canvas state
    pageInfo.canvasState.isRendered = true;
    pageInfo.canvasState.renderFailed = false;
    pageInfo.canvasState.renderAttempts = 0;
    pageInfo.canvasState.lastError = undefined;

    // Legacy fields - for backward compatibility
    pageInfo.renderFailed = false;
    pageInfo.renderAttempts = 0;
    pageInfo.lastRenderError = undefined;

    // Render text and annotation layers (enhancements) - DECOUPLED and independent
    if (this._options && !this._options.disableTextSelection) {
      if (!pageInfo.pdfPageProxy || !viewport || !pageInfo.isVisible) return;

      // Render text layer directly
      try {
        Logger.info(`Rendering text layer for page ${pageInfo.pageNumber}`);

        // CRITICAL: Clean up ALL existing text layer references to prevent memory leak
        if (pageInfo.textLayer) {
          Logger.warn(`Destroying pageInfo.textLayer for page ${pageInfo.pageNumber}`);
          pageInfo.textLayer.destroy();
          pageInfo.textLayer = undefined;
        }
        if (this._activeTextLayers.has(pageInfo.pageNumber)) {
          Logger.warn(`Destroying active text layer for page ${pageInfo.pageNumber}`);
          const existingTextLayer = this._activeTextLayers.get(pageInfo.pageNumber);
          existingTextLayer?.destroy();
          this._activeTextLayers.delete(pageInfo.pageNumber);
        }

        // Create text layer instance
        const textLayer = new TextLayer(
          this.containerId,
          this.instanceId,
          pageInfo.pageWrapperDiv,
          pageInfo.pdfPageProxy,
          viewport
        );

        // Render text layer (returns [textLayerDiv, annotationHostDiv])
        // NOTE: We ignore annotationHostDiv - that's AnnotationLayer's job
        const [textLayerDiv] = await textLayer.createTextLayer();

        // Track active text layer
        this._activeTextLayers.set(pageInfo.pageNumber, textLayer);
        pageInfo.textLayer = textLayer;

        // Update state
        pageInfo.textLayerState.isRendered = true;
        pageInfo.textLayerState.renderFailed = false;
        pageInfo.textLayerState.renderAttempts = 0;
        pageInfo.textLayerState.lastError = undefined;

        Logger.info(`Text layer rendered successfully for page ${pageInfo.pageNumber}`);
      } catch (error: any) {
        // Text layer failed
        if ((error?.message || '').includes('was destroyed')) {
          Logger.warn(`Text layer destroyed mid-create for page ${pageInfo.pageNumber}`);
        } else {
          pageInfo.textLayerState.renderFailed = true;
          pageInfo.textLayerState.lastError = error;
          pageInfo.textLayerState.renderAttempts++;
          Logger.error(`Text layer failed for page ${pageInfo.pageNumber} (will retry)`, {
            error: error?.message,
            attempts: pageInfo.textLayerState.renderAttempts,
          });
        }
      }

      // Render annotation layer directly (INDEPENDENT of text layer)
      try {
        Logger.info(`Rendering annotation layer for page ${pageInfo.pageNumber}`);

        // CRITICAL: Clean up ALL existing annotation layer references to prevent memory leak
        if (pageInfo.annotationLayer) {
          Logger.warn(`Destroying pageInfo.annotationLayer for page ${pageInfo.pageNumber}`);
          pageInfo.annotationLayer.destroy();
          pageInfo.annotationLayer = undefined;
        }
        if (this._activeAnnotationLayers.has(pageInfo.pageNumber)) {
          Logger.warn(`Destroying active annotation layer for page ${pageInfo.pageNumber}`);
          const existingAnnotLayer = this._activeAnnotationLayers.get(pageInfo.pageNumber);
          existingAnnotLayer?.destroy();
          this._activeAnnotationLayers.delete(pageInfo.pageNumber);
        }

        // Create annotation layer instance
        const annotationLayer = new AnnotationLayer(
          pageInfo.pageWrapperDiv,
          pageInfo.pdfPageProxy,
          viewport
        );

        // Render annotation layer
        // NOTE: We pass undefined for annotationHostDiv since we create our own
        const annotationLayerDiv = await annotationLayer.createAnnotationLayer(
          this._webViewer,
          this._pdfDocument,
          undefined
        );

        // Track active annotation layer
        this._activeAnnotationLayers.set(pageInfo.pageNumber, annotationLayer);
        pageInfo.annotationLayer = annotationLayer;

        // Update state
        pageInfo.annotationLayerState.isRendered = true;
        pageInfo.annotationLayerState.renderFailed = false;
        pageInfo.annotationLayerState.renderAttempts = 0;
        pageInfo.annotationLayerState.lastError = undefined;

        // Register annotation features
        if (annotationLayerDiv) {
          const annotationState = this._webViewer.annotationState;
          if (annotationState?.state.isAnnotationEnabled) {
            annotationLayerDiv.style.cursor = 'crosshair';
            annotationLayerDiv.style.pointerEvents = 'all';
          }
          this._searchHighlighter.registerPage(pageInfo.pageNumber);
          if (!this._webViewer.annotation.isAnnotationManagerRegistered(pageInfo.pageNumber)) {
            this._webViewer.annotation.registerAnnotationManager(
              pageInfo.pageNumber,
              new AnnotationManager(annotationLayerDiv, this, this._selectionManager)
            );
          }
        }

        Logger.info(`Annotation layer rendered successfully for page ${pageInfo.pageNumber}`);
      } catch (error: any) {
        // Annotation layer failed
        if ((error?.message || '').includes('was destroyed')) {
          Logger.warn(`Annotation layer destroyed mid-create for page ${pageInfo.pageNumber}`);
        } else {
          pageInfo.annotationLayerState.renderFailed = true;
          pageInfo.annotationLayerState.lastError = error;
          pageInfo.annotationLayerState.renderAttempts++;
          Logger.error(`Annotation layer failed for page ${pageInfo.pageNumber} (will retry)`, {
            error: error?.message,
            attempts: pageInfo.annotationLayerState.renderAttempts,
          });
        }
      }
    } else {
      // Text selection disabled - mark layers as "rendered" (skipped intentionally)
      pageInfo.textLayerState.isRendered = true;
      pageInfo.annotationLayerState.isRendered = true;
    }
  }

  /**
   * Retry rendering failed text/annotation layers for a page
   * Called independently from canvas rendering
   *
   * DECOUPLED: Each layer has independent retry logic
   */
  private async _retryFailedLayers(pageInfo: CachedPageInfo): Promise<void> {
    if (!pageInfo.pdfPageProxy || !pageInfo.isVisible) return;

    const viewport = pageInfo.pdfPageProxy.getViewport({ scale: this.state.scale });

    // Retry text layer if it failed and hasn't exceeded max attempts
    if (pageInfo.textLayerState.renderFailed && pageInfo.textLayerState.renderAttempts < 3) {
      Logger.info(`Retrying text layer for page ${pageInfo.pageNumber} (attempt ${pageInfo.textLayerState.renderAttempts + 1}/3)`);

      try {
        // CRITICAL: Clean up ALL existing text layer references
        if (pageInfo.textLayer) {
          pageInfo.textLayer.destroy();
          pageInfo.textLayer = undefined;
        }
        if (this._activeTextLayers.has(pageInfo.pageNumber)) {
          const existingTextLayer = this._activeTextLayers.get(pageInfo.pageNumber);
          existingTextLayer?.destroy();
          this._activeTextLayers.delete(pageInfo.pageNumber);
        }

        // Create and render text layer
        const textLayer = new TextLayer(
          this.containerId,
          this.instanceId,
          pageInfo.pageWrapperDiv,
          pageInfo.pdfPageProxy,
          viewport
        );

        await textLayer.createTextLayer();

        // Track and update state
        this._activeTextLayers.set(pageInfo.pageNumber, textLayer);
        pageInfo.textLayer = textLayer;
        pageInfo.textLayerState.isRendered = true;
        pageInfo.textLayerState.renderFailed = false;
        pageInfo.textLayerState.renderAttempts = 0;
        pageInfo.textLayerState.lastError = undefined;

        Logger.info(`Text layer retry successful for page ${pageInfo.pageNumber}`);
      } catch (error: any) {
        pageInfo.textLayerState.renderAttempts++;
        pageInfo.textLayerState.lastError = error;
        Logger.error(`Text layer retry failed for page ${pageInfo.pageNumber}`, {
          error: error?.message,
          attempts: pageInfo.textLayerState.renderAttempts,
        });
      }
    }

    // Retry annotation layer independently (whether text layer succeeded or not)
    if (pageInfo.annotationLayerState.renderFailed && pageInfo.annotationLayerState.renderAttempts < 3) {
      Logger.info(`Retrying annotation layer for page ${pageInfo.pageNumber} (attempt ${pageInfo.annotationLayerState.renderAttempts + 1}/3)`);

      try {
        // CRITICAL: Clean up ALL existing annotation layer references
        if (pageInfo.annotationLayer) {
          pageInfo.annotationLayer.destroy();
          pageInfo.annotationLayer = undefined;
        }
        if (this._activeAnnotationLayers.has(pageInfo.pageNumber)) {
          const existingAnnotLayer = this._activeAnnotationLayers.get(pageInfo.pageNumber);
          existingAnnotLayer?.destroy();
          this._activeAnnotationLayers.delete(pageInfo.pageNumber);
        }

        // Create and render annotation layer
        const annotationLayer = new AnnotationLayer(
          pageInfo.pageWrapperDiv,
          pageInfo.pdfPageProxy,
          viewport
        );

        const annotationLayerDiv = await annotationLayer.createAnnotationLayer(
          this._webViewer,
          this._pdfDocument,
          undefined
        );

        // Track and update state
        this._activeAnnotationLayers.set(pageInfo.pageNumber, annotationLayer);
        pageInfo.annotationLayer = annotationLayer;
        pageInfo.annotationLayerState.isRendered = true;
        pageInfo.annotationLayerState.renderFailed = false;
        pageInfo.annotationLayerState.renderAttempts = 0;
        pageInfo.annotationLayerState.lastError = undefined;

        Logger.info(`Annotation layer retry successful for page ${pageInfo.pageNumber}`);

        // Register annotation features
        if (annotationLayerDiv) {
          const annotationState = this._webViewer.annotationState;
          if (annotationState?.state.isAnnotationEnabled) {
            annotationLayerDiv.style.cursor = 'crosshair';
            annotationLayerDiv.style.pointerEvents = 'all';
          }
          this._searchHighlighter.registerPage(pageInfo.pageNumber);
          if (!this._webViewer.annotation.isAnnotationManagerRegistered(pageInfo.pageNumber)) {
            this._webViewer.annotation.registerAnnotationManager(
              pageInfo.pageNumber,
              new AnnotationManager(annotationLayerDiv, this, this._selectionManager)
            );
          }
        }
      } catch (error: any) {
        pageInfo.annotationLayerState.renderAttempts++;
        pageInfo.annotationLayerState.lastError = error;
        Logger.error(`Annotation layer retry failed for page ${pageInfo.pageNumber}`, {
          error: error?.message,
          attempts: pageInfo.annotationLayerState.renderAttempts,
        });
      }
    }
  }

  /**
   * Ensures there's a `<div id="canvasPresentation-<N>">` inside the
   * page wrapper div, and clears it if it exists.
   */
  private _ensureCanvasPresentationDiv(pageInfo: CachedPageInfo): HTMLDivElement {
    const canvasPresentationDivId = `canvasPresentation-${pageInfo.pageNumber}`;
    let canvasPresentationDiv = pageInfo.pageWrapperDiv.querySelector<HTMLDivElement>(`#${canvasPresentationDivId}`);
    if (!canvasPresentationDiv) {
      canvasPresentationDiv = document.createElement('div');
      canvasPresentationDiv.id = canvasPresentationDivId;
      canvasPresentationDiv.style.position = 'relative';
      pageInfo.pageWrapperDiv.appendChild(canvasPresentationDiv);
    } else {
      // Clear it if it exists from a previous placeholder state or partial render
      while (canvasPresentationDiv.firstChild) canvasPresentationDiv.removeChild(canvasPresentationDiv.firstChild);
    }
    if (this.state.scale > 1) {
      canvasPresentationDiv.style.width = 'inherit';
      canvasPresentationDiv.style.height = 'inherit';
    }
    return canvasPresentationDiv;
  }

  /**
   * Ensure there’s a `<div id="zoomedImageContainer-<N>">` inside the
   * canvasPresentation div, and size it to the full (high-res) viewport.
   */
  private _ensureImageContainerDiv(pageInfo: CachedPageInfo, viewport: PageViewport, canvasPresentationDiv: HTMLDivElement): HTMLDivElement {
    const imageContainerId = `zoomedImageContainer-${pageInfo.pageNumber}`;
    let imageContainer = canvasPresentationDiv.querySelector<HTMLDivElement>(`#${imageContainerId}`);
    if (!imageContainer) {
      imageContainer = document.createElement('div');
      imageContainer.id = imageContainerId;
      imageContainer.style.position = 'absolute';
      imageContainer.style.left = '0';
      imageContainer.style.top = '0';
      imageContainer.style.overflow = 'hidden';
      canvasPresentationDiv.appendChild(imageContainer);
    }
    imageContainer.style.width = `${viewport.width}px`;
    imageContainer.style.height = `${viewport.height}px`;
    return imageContainer;
  }

  /**
   * Removes a page from the DOM and clears its resources.
   * @param pageNumber The page number to remove.
   */
  private _removePageFromDom(pageNumber: number): void {
    const pageInfo = this._cachedPages.get(pageNumber);
    if (!pageInfo) return;

    pageInfo.isVisible = false;
    this._clearPageRenderArtifacts(pageInfo, true); // true to destroy layers fully

    this._pageIntersectionObserver?.unobserve(pageInfo.pageWrapperDiv);
    this._intersectionObserver?.unobserve(pageInfo.pageWrapperDiv);
    this._pageDomAdapter.removeWrapper(pageNumber);

    if (pageInfo.pdfPageProxy) {
      pageInfo.pdfPageProxy.cleanup();
      pageInfo.pdfPageProxy = null;
    }

    this._cachedPages.delete(pageNumber);
    pageInfo.isFullyRendered = false;
    pageInfo.renderedScale = undefined;
  }

  /**
   * Redraws all visible pages.
   * @returns {Promise<void>}
   */
  async redrawAllVisiblePages(): Promise<void> {
    if (this.isRenderingSpecificPageOnly != null) {
      const pageNum = this.isRenderingSpecificPageOnly;
      let pageInfo = this._cachedPages.get(pageNum);
      if (!pageInfo || !pageInfo.pdfPageProxy) {
        // If no proxy, it was likely placeholder or error
        pageInfo = await this._addPageToDom(pageNum); // Re-add (will be placeholder)
        if (pageInfo) {
          pageInfo.isVisible = true;
          pageInfo.isFullyRendered = false; // Mark as needing render
        }
      } else if (pageInfo.pdfPageProxy) {
        await this._updatePageForNewScale(pageInfo);
      }
    } else {
      for (const pageInfo of this._cachedPages.values()) {
        if (pageInfo.isVisible) {
          // Update all visible, even if they were placeholders
          await this._updatePageForNewScale(pageInfo);
        }
      }
    }

    // Trigger scheduler to pick up pages that need rendering
    this._debouncedEnsureVisiblePagesRendered();
  }

  /**
   * Updates the page buffers for rendering.
   * @param pageNumber The page number to update.
   */
  public async updatePageBuffers(pageNumber: number | null = null): Promise<void> {
    if (!this._pagesParentDiv) return;

    // Helper to resize one page
    const resizeOne = async (pageNum: number) => {
      const pageInfo = this._cachedPages.get(pageNum);
      if (!pageInfo || !pageInfo.pdfPageProxy) return;
      // Get the wrapper div for this page
      const wrapperDiv = pageInfo.pageWrapperDiv;
      if (!wrapperDiv) return;
      const container =
        wrapperDiv ||
        document.getElementById(this.containerId)?.shadowRoot?.querySelector<HTMLElement>(`#pageContainer-${this.instanceId}-${pageNum}[data-page-number="${pageNum}"]`);
      if (!container) return;

      const page = await this._pdfDocument.getPage(pageNum);
      const scale = this.state.scale;
      const viewport = page.getViewport({ scale });
      const top = this._pagePositions.get(pageNum) || 0;

      // resize wrapper
      container.style.top = `${top}px`;
      container.style.width = `${viewport.width}px`;
      container.style.height = `${viewport.height}px`;

      // resize the base canvas
      const canvas = container.querySelector<HTMLCanvasElement>('canvas');
      if (canvas) {
        canvas.style.width = `${viewport.width}px`;
        canvas.style.height = `${viewport.height}px`;
      }

      // resize annotation layer
      const anno = container.querySelector<HTMLElement>(`#${PDF_VIEWER_IDS.ANNOTATION_DRAWING_LAYER}-${this.instanceId}`);
      if (anno) {
        anno.style.width = `${viewport.width}px`;
        anno.style.height = `${viewport.height}px`;
      }

      // clear out any old zoomed-in bitmap
      const zoomDiv = canvas?.nextElementSibling as HTMLElement | null;
      if (zoomDiv) {
        zoomDiv.style.width = `${viewport.width}px`;
        zoomDiv.style.height = `${viewport.height}px`;
        zoomDiv.innerHTML = '';
      }
    };

    if (pageNumber != null) {
      await resizeOne(pageNumber);
    } else {
      // batch-resize all in-DOM pages
      for (const info of this._cachedPages.values()) {
        if (info.isVisible) {
          await resizeOne(info.pageNumber);
        }
      }
    }
  }

  /**
   * Updates the styles and dimensions of the pages.
   * @param targetPageNumber The page number to update.
   */
  public async updatePageStylesAndDimensions(targetPageNumber: number | null = null): Promise<void> {
    await this.calculatePagePositions();

    if (targetPageNumber !== null) {
      const pageInfo = this._cachedPages.get(targetPageNumber);
      if (pageInfo && pageInfo.isVisible) {
        // No need for pdfPageProxy check here, _updatePageForNewScale handles it
        await this._updatePageForNewScale(pageInfo);
      }
    } else {
      await this.redrawAllVisiblePages();
    }
  }

  /**
   * Appends a high-resolution image to the page.
   * @param pageInfo The page information object.
   * @param viewport The viewport for rendering.
   */
  public async appendHighResImage(pageInfo: CachedPageInfo): Promise<void> {
    if (!pageInfo.pdfPageProxy || !pageInfo.isVisible) {
      if (pageInfo.highResImageBitmap) {
        pageInfo.highResImageBitmap.close();
        pageInfo.highResImageBitmap = undefined;
        const imageContainer = pageInfo.pageWrapperDiv.querySelector(`#zoomedImageContainer-${pageInfo.pageNumber}`);
        if (imageContainer) imageContainer.innerHTML = '';
      }
      return;
    }

    // FIX: Recalculate viewport with current scale to avoid race conditions
    const currentScale = this.state.scale;
    const currentViewport = pageInfo.pdfPageProxy.getViewport({ scale: currentScale });

    // Cancel any existing high-res render
    this._pageRenderer.cancelPageRender(pageInfo.pageNumber, 'high');

    const imageContainer = pageInfo.pageWrapperDiv.querySelector(`#zoomedImageContainer-${pageInfo.pageNumber}`) as HTMLElement;
    if (!imageContainer) {
      return;
    }
    imageContainer.innerHTML = '';

    // Use PageRenderer for high-res rendering
    const highResResult = await this._pageRenderer.renderHighResImage({
      page: pageInfo.pdfPageProxy,
      viewport: currentViewport,
      currentViewport,
      canvasPool: this.canvasPool,
      scale: currentScale,
      pageNumber: pageInfo.pageNumber,
    });

    if (!highResResult.success) {
      if (!highResResult.cancelled) {
        console.error(`Error rendering high-res image for page ${pageInfo.pageNumber}:`, highResResult.error);
      }
      return;
    }

    if (!pageInfo.isVisible || !highResResult.bitmap) {
      return;
    }

    // Store bitmap and render task
    pageInfo.highResImageBitmap = highResResult.bitmap;
    pageInfo.highResRenderTask = highResResult.renderTask;

    // Create display canvas from bitmap
    const displayCanvas = this._pageRenderer.createDisplayCanvas(highResResult.bitmap, currentViewport);
    imageContainer.appendChild(displayCanvas);

    pageInfo.renderedScale = currentScale;
    pageInfo.highResRenderTask = undefined;
  }

  /**
   * Cleans up resources and removes event listeners.
   */
  destroy(): void {
    // CRITICAL: Clear all timers first to prevent memory leaks
    if (this._cancellationIntervalId) {
      clearInterval(this._cancellationIntervalId);
      this._cancellationIntervalId = undefined;
    }
    if (this._memoryPressureIntervalId) {
      clearInterval(this._memoryPressureIntervalId);
      this._memoryPressureIntervalId = undefined;
    }
    if (this._memoryPressureUnsubscribe) {
      this._memoryPressureUnsubscribe();
      this._memoryPressureUnsubscribe = undefined;
    }

    // Cancel debounced/throttled functions and clear closures
    this._debouncedEnsureVisiblePagesRendered.cancel();
    (this._debouncedEnsureVisiblePagesRendered as any) = null;
    this._throttledScrollHandler.cancel();
    (this._throttledScrollHandler as any) = null;

    // Disconnect observers BEFORE clearing pages
    this._intersectionObserver?.disconnect();
    this._intersectionObserver = null;
    this._pageIntersectionObserver?.disconnect();
    this._pageIntersectionObserver = null;

    // Clean up engine modules
    this._renderScheduler.stopProcessing();
    this._clearRenderQueue();
    this._pageRenderer.destroy();
    this._scaleManager.destroy();
    this._memoryManager.destroy();
    this._pageDomAdapter.destroy();
    this._tileManager.destroy();

    // Destroy all active layers
    this._activeTextLayers.forEach((textLayer, pageNumber) => {
      try {
        textLayer.destroy();
      } catch (error) {
        Logger.error(`Error destroying text layer for page ${pageNumber}`, error);
      }
    });
    this._activeTextLayers.clear();

    this._activeAnnotationLayers.forEach((annotationLayer, pageNumber) => {
      try {
        annotationLayer.destroy();
      } catch (error) {
        Logger.error(`Error destroying annotation layer for page ${pageNumber}`, error);
      }
    });
    this._activeAnnotationLayers.clear();

    // Clear render queue
    this._thumbnailViewer?.destroy();
    this._thumbnailViewer = null;
    this._scrollableContainer.removeEventListener('scroll', this._scrollHandler);
    this.events.off('scaleChange', this._boundOnScaleChange);

    // Clean up all cached pages (nullify Error objects and PDFPageProxy)
    this._cachedPages.forEach((pageInfo, pageNumber) => {
      // Clear error objects to prevent memory retention
      pageInfo.canvasState.lastError = undefined;
      pageInfo.textLayerState.lastError = undefined;
      pageInfo.annotationLayerState.lastError = undefined;
      pageInfo.lastRenderError = undefined;

      Logger.info('destroying PageVirtualization');
      this._removePageFromDom(pageNumber);
    });
    this._cachedPages.clear();

    if (this.canvasPool) {
      this.canvasPool.destroy();
    }

    this._pagePositions.clear();
    this._pageDimensions.clear();
  }
}

export default PageVirtualization;
