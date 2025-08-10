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
import TextLayer from './PDFTextLayer';
import PdfState from './PDFState';
import { RenderParameters } from 'pdfjs-dist/types/src/display/api';
import PageElement from './PDFPageElement';
import { debounce, throttle } from 'lodash';
import ThumbnailViewer from './PDFThumbnailViewer';
import WebViewer from './WebViewer';
import { ViewerLoadOptions } from '../../types/webpdf.types';
import AnnotationLayer from './PDFAnnotationLayer';
import { PDF_VIEWER_IDS, PDF_VIEWER_CLASSNAMES } from '../../constants/pdf-viewer-selectors';
import { AnnotationManager } from '../manager/AnnotationManager';
import { SelectionManager } from '../manager/SelectionManager';
import SearchHighlighter from '../manager/SearchHighlighter';
import CanvasPool from './CanvasPool';
import { debugWarn, reportError } from '../../utils/debug-utils';
import Logger from '../../utils/logger-utils';
import { PDFLinkService } from '../services/LS';

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
  isFullyRendered: boolean;
  renderFailed: boolean;
  isTransitioningToFullRender: boolean;
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

  private _pageWrapperPool: HTMLDivElement[] = [];
  private _maxPooledWrappers!: number;
  private _cachedPages: Map<number, CachedPageInfo> = new Map();

  private _lastScrollTop: number = 0;
  private _thumbnailViewer: ThumbnailViewer | null = null;
  private _pagePositions: Map<number, number> = new Map();
  private _pdfState: PdfState;
  private _pdfViewer: WebViewer;
  private _selectionManager: SelectionManager;
  private _searchHighlighter: SearchHighlighter;
  private _canvasPool!: CanvasPool;

  private _boundOnScaleChange = this._onScaleChange.bind(this);
  private _isScaleChangeInProgress = false;

  private _resolveReadyPromise!: () => void;
  private _pageIntersectionObserver: IntersectionObserver | null = null;
  private _intersectionObserver: IntersectionObserver | null = null;

  /**
   * @param options            Viewer configuration & container IDs.
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
    Logger.info('PageVirtualization ctor', { containerId: options.containerId, totalPages });
    this._options = options;
    this._totalPages = totalPages;
    this._scrollableContainer = scrollableContainer;
    this._pagesParentDiv = pagesParentDiv;
    this._pageBuffer = pageBuffer;

    this._pdfState = PdfState.getInstance(options.containerId);
    this._pdfDocument = this._pdfState.pdfInstance;
    this._pdfViewer = pdfViewer;
    this._selectionManager = selectionManager;
    this._searchHighlighter = searchHighlighter;

    // Signal readiness after initialization completes
    this._pdfViewer.ready = new Promise<void>((res) => (this._resolveReadyPromise = res));
    this._initAsync();
  }

  /**
   * Initializes page wrapper pool, computes positions, and sets up scroll/observer.
   */
  private async _initAsync(): Promise<void> {
    Logger.info('_initAsync start');
    const initialPagesToFillViewport = await this._calculateInitialPagesToRender();
    Logger.info('_calculateInitialPagesToRender →', initialPagesToFillViewport);
    const calculatedWrappers = initialPagesToFillViewport * 2 + 5;
    this._maxPooledWrappers = Math.min(this._totalPages > 0 ? this._totalPages : calculatedWrappers, calculatedWrappers);
    if (this._totalPages === 0) this._maxPooledWrappers = 5; // Fallback for empty PDF

    this._canvasPool = new CanvasPool(this._maxPooledWrappers > 0 ? this._maxPooledWrappers + 2 : 5);
    this._canvasPool.setupMemoryPressureHandling();
    PageElement.init(this._canvasPool);
    if (this._maxPooledWrappers > 0) {
      this._initializePageWrapperPool();
    }

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

              // **only** fully render the page the app thinks is "current"
              if (pageNum !== this._pdfState.currentPage) {
                // optionally unobserve so we don't even get called again for this page
                this._intersectionObserver?.unobserve(wrapper);
                continue;
              }

              const pageInfo = this._cachedPages.get(pageNum)!;
              if (!pageInfo.isFullyRendered) {
                this._intersectionObserver?.unobserve(wrapper);
                this._transitionToFullRender(pageInfo);
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

    this._resolveReadyPromise();
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
   * Creates a pool of recycled page wrapper DIVs.
   */
  private _initializePageWrapperPool(): void {
    if (this._maxPooledWrappers === undefined || this._maxPooledWrappers <= 0) {
      console.warn('PageVirtualization: _maxPooledWrappers is not set or invalid, skipping pool initialization.');
      return;
    }
    for (let i = 0; i < this._maxPooledWrappers; i++) {
      const div = document.createElement('div');
      div.style.position = 'absolute';
      div.style.display = 'none';
      div.classList.add('recycled-page-wrapper');
      this._pagesParentDiv.appendChild(div);
      this._pageWrapperPool.push(div);
    }
  }

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
    this._pdfState.on('scaleChange', this._boundOnScaleChange);
    this._scrollableContainer.addEventListener('scroll', this._scrollHandler);
  }

  /**
   * Retrieves an available page wrapper from the pool or creates a new one.
   * @returns {HTMLDivElement | null} The available page wrapper or null if not found.
   */
  private _getAvailablePageWrapper(): HTMLDivElement | null {
    if (this._pageWrapperPool.length === 0 && this._maxPooledWrappers > 0) {
      console.warn('PageVirtualization: Attempting to get wrapper from empty pool. Re-check initialization.');
    }
    const wrapper = this._pageWrapperPool.find((div) => div.style.display === 'none');
    if (wrapper) {
      wrapper.style.display = '';
      wrapper.classList.remove('recycled-page-wrapper');
      wrapper.classList.add('pooled-page-wrapper');
      return wrapper;
    }

    const tempWrapper = document.createElement('div');
    tempWrapper.style.position = 'absolute';
    tempWrapper.classList.add('transient-page-wrapper');

    if (this._pagesParentDiv) {
      this._pagesParentDiv.appendChild(tempWrapper);
      return tempWrapper;
    } else {
      return null;
    }
  }

  /**
   * Releases a page wrapper back to the pool or removes it if transient.
   * @param wrapperDiv The wrapper DIV to release.
   */
  private _releasePageWrapper(wrapperDiv: HTMLDivElement): void {
    while (wrapperDiv.firstChild) {
      wrapperDiv.removeChild(wrapperDiv.firstChild);
    }
    wrapperDiv.removeAttribute('id');
    wrapperDiv.removeAttribute('data-page-number');
    wrapperDiv.className = '';

    if (this._pageWrapperPool.includes(wrapperDiv)) {
      wrapperDiv.style.display = 'none';
      wrapperDiv.classList.add('recycled-page-wrapper');
    } else {
      wrapperDiv.remove();
    }
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
    Logger.info('scale change start', { newScale: this._pdfState.scale });
    this._isScaleChangeInProgress = true;
    await this.updateVisiblePageBuffers();
    await this.refreshHighResForVisiblePages();
    await this._updateRenderedPagesOnScroll(this._scrollableContainer.scrollTop, false);
    this._debouncedEnsureVisiblePagesRendered();
    this._isScaleChangeInProgress = false;
    Logger.info('scale change end');
  }

  /**
   * Immediately updates the dimensions (CSS scaling) of currently visible and
   * fully rendered pages to reflect the new scale. This provides a quick,
   * blurry update during zoom. It also clears the high-resolution image container.
   */
  public async updateVisiblePageBuffers(): Promise<void> {
    if (!this._pagesParentDiv) return;

    for (const pageInfo of this._cachedPages.values()) {
      // console.log('pageInfo', pageInfo);
      if (pageInfo.isVisible && pageInfo.isFullyRendered && pageInfo.pdfPageProxy && pageInfo.canvasElement) {
        const newViewport = pageInfo.pdfPageProxy.getViewport({ scale: this._pdfState.scale });
        const pageNum = pageInfo.pageNumber;

        pageInfo.pageWrapperDiv.style.width = `${newViewport.width}px`;
        pageInfo.pageWrapperDiv.style.height = `${newViewport.height}px`;
        pageInfo.pageWrapperDiv.style.top = `${this._pagePositions.get(pageNum) || 0}px`;

        pageInfo.canvasElement.style.width = `${newViewport.width}px`;
        pageInfo.canvasElement.style.height = `${newViewport.height}px`;

        this._resizeExistingLayerDivs(pageInfo, newViewport);

        const imageContainer = pageInfo.pageWrapperDiv.querySelector<HTMLElement>(`#zoomedImageContainer-${pageNum}`);
        if (imageContainer) {
          imageContainer.innerHTML = '';
          imageContainer.style.width = `${newViewport.width}px`;
          imageContainer.style.height = `${newViewport.height}px`;
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
    resize(`#${PDF_VIEWER_IDS.ANNOTATION_DRAWING_LAYER}`);
  }

  /**
   * Refreshes high-resolution images for currently visible pages.
   * @returns {Promise<void>}
   */
  public async refreshHighResForVisiblePages(): Promise<void> {
    const pagesToRefresh = Array.from(this._cachedPages.values()).filter((pInfo) => pInfo.isVisible && pInfo.isFullyRendered && pInfo.pdfPageProxy);

    for (const pageInfo of pagesToRefresh) {
      if (pageInfo.isVisible && pageInfo.isFullyRendered && pageInfo.pdfPageProxy) {
        const newViewport = pageInfo.pdfPageProxy.getViewport({ scale: this._pdfState.scale });
        await this.appendHighResImage(pageInfo, newViewport);
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
      const placeholderViewportAttempt = PageElement.createLayers('', '', { width: 100, height: 100, scale: 1, rotation: 0 } as any).getBoundingClientRect();
      const tempViewport = {
        width: this._pagePositions.has(pageInfo.pageNumber + 1) ? this._pagesParentDiv.clientWidth - PageElement.gap * 2 : placeholderViewportAttempt.width,
        height: this._pagePositions.has(pageInfo.pageNumber + 1)
          ? this._pagePositions.get(pageInfo.pageNumber + 1)! - this._pagePositions.get(pageInfo.pageNumber)! - PageElement.gap
          : placeholderViewportAttempt.height,
        scale: this._pdfState.scale,
        rotation: 0,
      } as PageViewport; // This is a rough estimate if proxy fails

      PageElement.createOrUpdatePageContainerDiv(pageInfo.pageNumber, tempViewport, this._pagePositions, pageInfo.pageWrapperDiv);
      pageInfo.isFullyRendered = false;
      return;
    }

    const newViewport = pageInfo.pdfPageProxy.getViewport({ scale: this._pdfState.scale });

    PageElement.createOrUpdatePageContainerDiv(pageInfo.pageNumber, newViewport, this._pagePositions, pageInfo.pageWrapperDiv);

    this._clearPageRenderArtifacts(pageInfo, true);
    pageInfo.isFullyRendered = false;

    await this._transitionToFullRender(pageInfo);
  }

  /**
   * Handles scroll events to update rendered pages.
   * @param event The scroll event.
   */
  private _scrollHandler = (event: Event) => {
    if (this.isRenderingSpecificPageOnly != null) return;
    Logger.info('scroll event', { scrollTop: this._scrollableContainer.scrollTop });
    this._throttledScrollHandler(this._isScaleChangeInProgress);
  };

  /**
   * Throttled scroll handler to update rendered pages.
   * @param isScaling Indicates if a scale change is in progress.
   */
  private _throttledScrollHandler = throttle(async (isScaling: boolean) => {
    if (isScaling) return;

    const scrollTop = this._scrollableContainer.scrollTop;
    this._lastScrollTop = scrollTop;
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
   * Ensures that visible pages are fully rendered.
   * @returns {Promise<void>}
   */
  private async _ensureVisiblePagesRendered(): Promise<void> {
    if (this._isScaleChangeInProgress) return;

    const pagesToRenderFully: CachedPageInfo[] = [];
    const currentPage = this._pdfState.currentPage;

    // Prioritize current page
    const centerPageInfo = this._cachedPages.get(currentPage);
    if (centerPageInfo && centerPageInfo.isVisible && !centerPageInfo.isFullyRendered) {
      pagesToRenderFully.push(centerPageInfo);
    }

    // Then pages in buffer around current page
    for (let i = 1; i <= this._pageBuffer; i++) {
      const nextPage = this._cachedPages.get(currentPage + i);
      if (nextPage && nextPage.isVisible && !nextPage.isFullyRendered && !pagesToRenderFully.includes(nextPage)) {
        pagesToRenderFully.push(nextPage);
      }
      const prevPage = this._cachedPages.get(currentPage - i);
      if (prevPage && prevPage.isVisible && !prevPage.isFullyRendered && !pagesToRenderFully.includes(prevPage)) {
        pagesToRenderFully.push(prevPage);
      }
    }

    // Add any other visible but not fully rendered pages that weren't caught by buffer logic
    this._cachedPages.forEach((pInfo) => {
      if (pInfo.isVisible && !pInfo.isFullyRendered && !pagesToRenderFully.includes(pInfo)) {
        pagesToRenderFully.push(pInfo);
      }
    });

    for (const pInfo of pagesToRenderFully) {
      if (this._cachedPages.has(pInfo.pageNumber) && pInfo.isVisible && (!pInfo.isFullyRendered || pInfo.renderFailed)) {
        await this._transitionToFullRender(pInfo);
      }
    }
  }

  /**
   * Fully renders the page content.
   * @param pageInfo The page information object.
   * @returns {Promise<void>}
   */
  private async _transitionToFullRender(pageInfo: CachedPageInfo): Promise<void> {
    if (pageInfo.isFullyRendered || !pageInfo.isVisible || !pageInfo.pageWrapperDiv.parentElement) {
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

      const viewport = pageInfo.pdfPageProxy.getViewport({ scale: this._pdfState.scale });

      PageElement.createOrUpdatePageContainerDiv(pageInfo.pageNumber, viewport, this._pagePositions, pageInfo.pageWrapperDiv);

      Logger.info(`_transitionToFullRender → page ${pageInfo.pageNumber}`);
      await this._renderPageContent(pageInfo, viewport);

      if (!pageInfo.renderFailed && this._pdfState.scale != 1) {
        await this.appendHighResImage(pageInfo, viewport);
      }

      pageInfo.pageWrapperDiv.classList.remove('page-placeholder');
      pageInfo.pageWrapperDiv.style.backgroundColor = '';

      pageInfo.isFullyRendered = true;
      Logger.info(`_transitionToFullRender done page ${pageInfo.pageNumber}`);
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

    let accumulatedHeight = 0;
    let pagesToRender = 0;
    const scale = this._pdfState.scale;

    for (let pageNum = 1; pageNum <= this._totalPages; pageNum++) {
      const page = await this._pdfDocument.getPage(pageNum);
      const viewport = page.getViewport({ scale });
      const pageHeightWithGap = viewport.height + PageElement.gap;

      if (pagesToRender === 0 && pageHeightWithGap > containerHeight) {
        pagesToRender = 1;
        break;
      }
      accumulatedHeight += pageHeightWithGap;
      pagesToRender++;
      if (accumulatedHeight >= containerHeight) {
        break;
      }
    }
    return Math.min(pagesToRender, this._totalPages);
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
      this._pdfState.currentPage = pageNumber;
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
    const linkService = new PDFLinkService({ pdfViewer: this._pdfViewer });

    for (let pageNum = isSpecificPage ?? 1; pageNum <= (isSpecificPage ?? this._totalPages); pageNum++) {
      const thumbnail = new ThumbnailViewer({
        container: thumbnailContainer as HTMLElement,
        pageNumber: pageNum,
        pdfDocument: this._pdfDocument,
        linkService,
      });
      await thumbnail.initThumbnail();
      if (pageNum === (isSpecificPage ?? this._pdfState.currentPage)) {
        thumbnail.activeThumbnail = this._pdfState.currentPage;
      }
      this._thumbnailViewer = thumbnail;
    }
  }

  /**
   * Calculates the positions of all pages in the document.
   * @returns {Promise<Map<number, number>>} A map of page numbers to their top offsets.
   */
  async calculatePagePositions(): Promise<Map<number, number>> {
    const scale = this._pdfState.scale;
    let currentYOffset = PageElement.gap;
    let maxPageWidth = 0;
    this._pagePositions.clear();

    if (this._totalPages === 0 && !this.isRenderingSpecificPageOnly) {
      this._pagesParentDiv.style.height = '0px';
      this._pagesParentDiv.style.width = '0px';
      return this._pagePositions;
    }

    const startPageNum = this.isRenderingSpecificPageOnly ?? 1;
    const endPageNum = this.isRenderingSpecificPageOnly ?? this._pdfDocument.numPages;

    for (let pageNum = startPageNum; pageNum <= endPageNum; pageNum++) {
      const page = await this._pdfDocument.getPage(pageNum);
      const viewport = page.getViewport({ scale });
      this._pagePositions.set(pageNum, currentYOffset);
      currentYOffset += viewport.height + PageElement.gap;
      maxPageWidth = Math.max(maxPageWidth, viewport.width);
    }

    this._pagesParentDiv.style.height = `${currentYOffset}px`;
    this._pagesParentDiv.style.width = `${maxPageWidth + PageElement.gap * 2}px`;

    return this._pagePositions;
  }

  /**
   * Determines the page number that is most centered in the viewport.
   * @param scrollTop The current scroll position.
   * @returns {number} The page number that is most centered in the viewport.
   */
  private _determineCenterPageInViewport(scrollTop: number): number {
    if (this._pagePositions.size === 0) return 1;

    const viewportCenterY = scrollTop + this._scrollableContainer.clientHeight / 2;
    let bestMatchPageNum = Array.from(this._pagePositions.keys())[0] || 1;

    const sortedPageNumbers = Array.from(this._pagePositions.keys()).sort((a, b) => a - b);

    for (const pageNum of sortedPageNumbers) {
      const pageTopY = this._pagePositions.get(pageNum)!;
      const pageInfo = this._cachedPages.get(pageNum);
      let pageBottomY = pageTopY + this._scrollableContainer.clientHeight * 0.8;

      if (pageInfo?.pdfPageProxy && pageInfo.isFullyRendered) {
        const viewport = pageInfo.pdfPageProxy.getViewport({ scale: this._pdfState.scale });
        pageBottomY = pageTopY + viewport.height;
      } else if (this._pagePositions.has(pageNum + 1)) {
        pageBottomY = this._pagePositions.get(pageNum + 1)! - PageElement.gap;
      }

      if (viewportCenterY >= pageTopY && viewportCenterY < pageBottomY) {
        return pageNum;
      }
      if (viewportCenterY < pageTopY) {
        const currentIndex = sortedPageNumbers.indexOf(pageNum);
        return currentIndex > 0 ? sortedPageNumbers[currentIndex - 1] : pageNum;
      }
      bestMatchPageNum = pageNum;
    }
    return bestMatchPageNum;
  }

  /**
   * Updates the rendered pages based on the current scroll position.
   * @param scrollTop The current scroll position.
   * @param isInitialLoad Indicates if this is the initial load.
   */
  private async _updateRenderedPagesOnScroll(scrollTop: number, isInitialLoad: boolean = false): Promise<void> {
    if (this.isRenderingSpecificPageOnly != null || this._totalPages === 0) return;

    const centralPageNum = this._determineCenterPageInViewport(scrollTop);
    if (this._pdfState.currentPage !== centralPageNum) {
      this._pdfState.currentPage = centralPageNum;
    }

    const pagesToKeepInDom = new Set<number>();
    const startPage = Math.max(1, centralPageNum - this._pageBuffer);
    const endPage = Math.min(this._totalPages, centralPageNum + this._pageBuffer);

    for (let pageNum = startPage; pageNum <= endPage; pageNum++) {
      pagesToKeepInDom.add(pageNum);
    }

    const pagesToRemoveFromDom: number[] = [];
    this._cachedPages.forEach((pageInfo, pageNum) => {
      if (!pagesToKeepInDom.has(pageNum) && pageInfo.isVisible) {
        pagesToRemoveFromDom.push(pageNum);
      }
    });
    for (const pageNum of pagesToRemoveFromDom) {
      this._removePageFromDom(pageNum);
    }

    for (const pageNum of pagesToKeepInDom) {
      let pageInfo = this._cachedPages.get(pageNum);
      if (!pageInfo) {
        pageInfo = await this._addPageToDom(pageNum);
      } else {
        pageInfo.isVisible = true;
      }
    }
  }

  /**
   * Clears rendering artifacts for a page.
   * @param pageInfo The page information object.
   * @param destroyLayers Indicates if layers should be destroyed.
   */
  private _clearPageRenderArtifacts(pageInfo: CachedPageInfo, destroyLayers: boolean = true): void {
    if (pageInfo.renderTask) {
      pageInfo.renderTask.cancel();
      pageInfo.renderTask = undefined;
    }
    if (pageInfo.highResRenderTask) {
      pageInfo.highResRenderTask.cancel();
      pageInfo.highResRenderTask = undefined;
    }
    if (pageInfo.canvasElement) {
      PageElement.releaseCanvasToPool(pageInfo.canvasElement);
      pageInfo.canvasElement = undefined;
    }
    if (pageInfo.highResImageBitmap) {
      pageInfo.highResImageBitmap.close();
      pageInfo.highResImageBitmap = undefined;
    }

    const canvasPresentationDiv = pageInfo.pageWrapperDiv.querySelector(`#canvasPresentation-${pageInfo.pageNumber}`);
    canvasPresentationDiv?.remove();

    if (destroyLayers) {
      pageInfo.textLayer?.destroy();
      pageInfo.textLayer = undefined;
      pageInfo.annotationLayer?.destroy();
      pageInfo.annotationLayer = undefined;
      this._pdfViewer.annotation.unregisterAnnotationManager(pageInfo.pageNumber);
      this._searchHighlighter.deregisterPage(pageInfo.pageNumber);
    }
    pageInfo.isFullyRendered = false;
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
      return pageInfo;
    }

    const pageWrapperDiv = this._getAvailablePageWrapper();
    if (!pageWrapperDiv) {
      return undefined;
    }

    let placeholderViewport: PageViewport;
    try {
      const tempPageForSize = await this._pdfDocument.getPage(pageNumber);
      placeholderViewport = tempPageForSize.getViewport({ scale: this._pdfState.scale });
    } catch (e) {
      reportError(`getting page ${pageNumber} for placeholder size`, e);
      Logger.error(`_addPageToDom: failed placeholder size for page ${pageNumber}`, e);
      placeholderViewport = { width: 200, height: 300, scale: this._pdfState.scale, rotation: 0 } as PageViewport;
    }

    pageWrapperDiv.style.backgroundColor = '#fff';
    pageWrapperDiv.classList.add('page-placeholder');
    PageElement.createOrUpdatePageContainerDiv(pageNumber, placeholderViewport, this._pagePositions, pageWrapperDiv);
    if (this._intersectionObserver) {
      this._intersectionObserver.observe(pageWrapperDiv);
    }

    if (!pageWrapperDiv.parentElement) {
      this._pagesParentDiv.appendChild(pageWrapperDiv);
    }

    pageInfo = {
      pageNumber,
      pdfPageProxy: null,
      pageWrapperDiv,
      isVisible: true,
      isFullyRendered: false,
      renderFailed: false,
      isTransitioningToFullRender: false,
    };
    this._cachedPages.set(pageNumber, pageInfo);

    if (this._pageIntersectionObserver) {
      this._pageIntersectionObserver.observe(pageWrapperDiv);
    }
    return pageInfo;
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
      scale: this._pdfState.scale,
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
        // expected RenderingCancelledException—ignore, but log if it’s something else
        if (err.name !== 'RenderingCancelledException') {
          Logger.error(`unexpected error while cancelling`, { page: pageInfo.pageNumber, err });
        }
      }
      pageInfo.renderTask = undefined;

      // also put that canvas back into the pool if it hasn’t been already
      if (pageInfo.canvasElement) {
        PageElement.releaseCanvasToPool(pageInfo.canvasElement);
        pageInfo.canvasElement = undefined;
      }
    }
    if (!pageInfo.pdfPageProxy || !viewport || !pageInfo.isVisible || pageInfo.isFullyRendered) {
      return;
    }

    // Clear any previous partial renderings or ensure clean state before drawing
    // Passing 'false' to not destroy layer instances if they might be reused (though unlikely here)
    this._clearPageRenderArtifacts(pageInfo, false);

    const baseRenderScale = this._pdfState.scale > 1 ? Math.min(1.0, this._pdfState.scale / 2) : this._pdfState.scale;
    const baseViewport = pageInfo.pdfPageProxy.getViewport({ scale: baseRenderScale });

    const [canvas, context] = PageElement.getCanvasFromPool(baseViewport);
    pageInfo.canvasElement = canvas;

    const canvasPresentationDiv = this._ensureCanvasPresentationDiv(pageInfo);
    if (this._pdfState.scale > 1) {
      canvas.style.width = 'inherit';
      canvas.style.height = 'inherit';
    }
    canvasPresentationDiv.appendChild(canvas);
    this._ensureImageContainerDiv(pageInfo, viewport, canvasPresentationDiv);

    try {
      const renderParams: RenderParameters = {
        canvasContext: context,
        viewport: baseViewport,
        annotationMode: 2,
      };
      pageInfo.renderTask = pageInfo.pdfPageProxy.render(renderParams);
      await pageInfo.renderTask.promise;
      Logger.info(`base render complete`, { page: pageInfo.pageNumber });
    } catch (error: any) {
      pageInfo.renderTask = undefined;
      PageElement.releaseCanvasToPool(canvas);
      if (error && error.name === 'RenderingCancelledException') {
        // debugWarn(`rendering base canvas for page ${pageInfo.pageNumber}`, error);
        Logger.warn(`base render cancelled for page ${pageInfo.pageNumber}`, error);
      } else {
        // console.error(`Error rendering base canvas for page ${pageInfo.pageNumber}:`, error);
        Logger.error(`Base render failed for page ${pageInfo.pageNumber}`, {
          page: pageInfo.pageNumber,
          errName: error?.name,
          errMessage: error?.message,
          stack: error?.stack,
          rawError: error, // Log the full error object
        });
        Logger.download();
      }
      pageInfo.renderFailed = true;
      return;
    } finally {
      pageInfo.renderTask = undefined;
    }

    if (this._options && !this._options.disableTextSelection) {
      if (!pageInfo.pdfPageProxy || !viewport || !pageInfo.isVisible) return;
      try {
        pageInfo.textLayer = new TextLayer(this._pdfState.containerId, pageInfo.pageWrapperDiv, pageInfo.pdfPageProxy, viewport);
        const [, annotationHostDiv] = await pageInfo.textLayer.createTextLayer();

        pageInfo.annotationLayer = new AnnotationLayer(pageInfo.pageWrapperDiv, pageInfo.pdfPageProxy, viewport);
        await pageInfo.annotationLayer.createAnnotationLayer(this._pdfViewer, this._pdfDocument, annotationHostDiv);

        if (this._pdfState.isAnnotationEnabled && this._pdfState.isAnnotationConfigurationPropertiesEnabled) {
          if (annotationHostDiv) {
            (annotationHostDiv as HTMLElement).style.cursor = 'crosshair';
            (annotationHostDiv as HTMLElement).style.pointerEvents = 'all';
          }
        }
        this._searchHighlighter.registerPage(pageInfo.pageNumber);
        if (!this._pdfViewer.annotation.isAnnotationManagerRegistered(pageInfo.pageNumber)) {
          this._pdfViewer.annotation.registerAnnotationManager(pageInfo.pageNumber, new AnnotationManager(annotationHostDiv, this._pdfState, this._selectionManager));
        }
      } catch (error: any) {
        if ((error.message || '').includes('was destroyed')) {
          // console.warn(`Layer creation for page ${pageInfo.pageNumber} aborted due to concurrent destruction.`);
          Logger.warn(`text/annotation layer destroyed mid-create for page ${pageInfo.pageNumber}`);
        } else {
          // console.warn(`Error creating text/annotation layer for page ${pageInfo.pageNumber}:`, error);
          Logger.error(`text/annotation layer failed for page ${pageInfo.pageNumber}`, error);
          pageInfo.renderFailed = true;
        }
      }
    }
  }

  /**
   * Ensures there’s a `<div id="canvasPresentation-<N>">` inside the
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
    if (this._pdfState.scale > 1) {
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
    this._releasePageWrapper(pageInfo.pageWrapperDiv);

    if (pageInfo.pdfPageProxy) {
      pageInfo.pdfPageProxy.cleanup();
      pageInfo.pdfPageProxy = null;
    }

    this._cachedPages.delete(pageNumber);
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
          await this._transitionToFullRender(pageInfo); // Then fully render
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
      const container = wrapperDiv || document.querySelector<HTMLElement>(`#${this._options.containerId} #pageContainer-${pageNum}`);
      if (!container) return;

      const page = await this._pdfDocument.getPage(pageNum);
      const scale = this._pdfState.scale;
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
      const anno = container.querySelector<HTMLElement>(`#${PDF_VIEWER_IDS.ANNOTATION_DRAWING_LAYER}`);
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
  public async appendHighResImage(pageInfo: CachedPageInfo, viewport: PageViewport): Promise<void> {
    if (!pageInfo.pdfPageProxy || !pageInfo.isVisible) {
      if (pageInfo.highResImageBitmap) {
        pageInfo.highResImageBitmap.close();
        pageInfo.highResImageBitmap = undefined;
        const imageContainer = pageInfo.pageWrapperDiv.querySelector(`#zoomedImageContainer-${pageInfo.pageNumber}`);
        if (imageContainer) imageContainer.innerHTML = '';
      }
      return;
    }

    if (pageInfo.highResRenderTask) pageInfo.highResRenderTask.cancel();
    if (pageInfo.highResImageBitmap) pageInfo.highResImageBitmap.close();
    pageInfo.highResImageBitmap = undefined; // Clear previous before new render

    const imageContainer = pageInfo.pageWrapperDiv.querySelector(`#zoomedImageContainer-${pageInfo.pageNumber}`) as HTMLElement;
    if (!imageContainer) {
      return;
    }
    imageContainer.innerHTML = '';

    const [offscreenCanvas, offscreenContext] = PageElement.getCanvasFromPool(viewport);

    const renderParams: RenderParameters = {
      canvasContext: offscreenContext,
      viewport: viewport,
      annotationMode: 2,
    };

    pageInfo.highResRenderTask = pageInfo.pdfPageProxy.render(renderParams);
    try {
      await pageInfo.highResRenderTask.promise;
      Logger.info(`base render complete`, { page: pageInfo.pageNumber });
      if (!pageInfo.isVisible) {
        PageElement.releaseCanvasToPool(offscreenCanvas);
        pageInfo.highResRenderTask = undefined;
        return;
      }
      const bitmap = await createImageBitmap(offscreenCanvas);
      pageInfo.highResImageBitmap = bitmap;

      const displayCanvas = document.createElement('canvas');
      const ratio = window.devicePixelRatio || 1;
      displayCanvas.width = Math.floor(viewport.width * ratio);
      displayCanvas.height = Math.floor(viewport.height * ratio);
      displayCanvas.style.width = `${viewport.width}px`;
      displayCanvas.style.height = `${viewport.height}px`;

      const displayCtx = displayCanvas.getContext('2d');
      if (displayCtx) {
        displayCtx.drawImage(bitmap, 0, 0, displayCanvas.width, displayCanvas.height);
        imageContainer.appendChild(displayCanvas);
      } else {
        bitmap.close();
        pageInfo.highResImageBitmap = undefined;
      }
    } catch (error: any) {
      if (error && error.name === 'RenderingCancelledException') {
        // console.log(`High-res rendering cancelled for page ${pageInfo.pageNumber}`);
      } else {
        console.error(`Error rendering high-res image for page ${pageInfo.pageNumber}:`, error);
      }
      if (pageInfo.highResImageBitmap) {
        pageInfo.highResImageBitmap.close();
        pageInfo.highResImageBitmap = undefined;
      }
    } finally {
      pageInfo.highResRenderTask = undefined;
      PageElement.releaseCanvasToPool(offscreenCanvas);
    }
  }

  private _shouldUseWebGL(): boolean {
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') || (canvas.getContext('experimental-webgl') as WebGLRenderingContext);

      if (!gl) return false;

      // Check for basic WebGL support
      const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
      if (debugInfo) {
        const renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);

        // Avoid WebGL on known problematic configurations
        if (renderer.includes('Intel') && renderer.includes('HD Graphics')) {
          // Intel integrated graphics often perform worse with WebGL
          return false;
        }

        if (renderer.includes('Mali') || renderer.includes('PowerVR')) {
          // Mobile GPUs often have WebGL performance issues
          return false;
        }
      }

      // Check for reasonable texture size support
      const maxTextureSize = gl.getParameter(gl.MAX_TEXTURE_SIZE);
      if (maxTextureSize < 4096) {
        // Very low texture size limit indicates weak GPU
        return false;
      }

      return true;
    } catch (e) {
      return false;
    }
  }

  /**
   * Cleans up resources and removes event listeners.
   */
  destroy(): void {
    this._thumbnailViewer?.destroy();
    this._thumbnailViewer = null;
    this._scrollableContainer.removeEventListener('scroll', this._scrollHandler);
    this._pdfState.off('scaleChange', this._boundOnScaleChange);
    this._debouncedEnsureVisiblePagesRendered.cancel(); // Cancel any pending debounced calls
    this._throttledScrollHandler.cancel(); // Cancel any pending throttled calls
    this._intersectionObserver?.disconnect();
    this._intersectionObserver = null;

    this._cachedPages.forEach((pageInfo, pageNumber) => {
      Logger.info('destroying PageVirtualization');
      this._removePageFromDom(pageNumber);
    });
    this._cachedPages.clear();

    this._pageWrapperPool.forEach((wrapper) => wrapper.remove());
    this._pageWrapperPool = [];

    if (this._canvasPool) {
      // Check if canvas pool was initialized
      this._canvasPool.destroy();
    }

    this._pagePositions.clear();

    if (this._pageIntersectionObserver) {
      this._pageIntersectionObserver.disconnect();
      this._pageIntersectionObserver = null;
    }
  }
}

export default PageVirtualization;
