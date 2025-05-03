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

import { PageViewport, PDFDocumentProxy, PDFPageProxy } from 'pdfjs-dist';
import TextLayer from './PDFTextLayer';
import PdfState from './PDFState';
import { RenderParameters } from 'pdfjs-dist/types/src/display/api';
import PageElement from './PDFPageElement';
import { debounce, throttle } from 'lodash';
import ThumbnailViewer from './PDFThumbnailViewer';
import WebViewer from './WebViewer';
import { PDFLinkService } from '../services/LinkService';
import { ViewerLoadOptions } from '../../types/webpdf.types';
import AnnotationLayer from './PDFAnnotationLayer';
import { PDF_VIEWER_IDS } from '../../constants/pdf-viewer-selectors';
import { AnnotationManager } from '../manager/AnnotationManager';
import { SelectionManager } from '../manager/SelectionManager';
import SearchHighlighter from '../manager/SearchHighlighter';

/**
 * Handles virtualization of PDF pages, rendering only those visible within the viewport.
 */
class PageVirtualization {
  private _options: ViewerLoadOptions | null = null;
  private _parentContainer: HTMLElement | null = null;
  private _container: HTMLElement | null = null;
  private _pageBuffer: number = 3; // Number of pages to keep in the buffer around the viewport.
  private _totalPages: number;
  private _pdf!: PDFDocumentProxy;
  private _renderedPages: Set<number> = new Set();
  private _lastScrollTop: number = 0;
  private _pagePosition: Map<number, number> = new Map();
  private _pdfState!: PdfState;
  private _pdfViewer!: WebViewer;
  private _selectionManager: SelectionManager;
  private _searchHighlighter: SearchHighlighter;
  private _bindOnScaleChange = this._onScaleChange.bind(this);
  private _isScaleChangeActive = false;

  private _resolveReady!: () => void;
  private _observer: IntersectionObserver | null = null;

  /**
   * Constructor initializes the PageVirtualization with required parameters.
   *
   * @param {LoadOptions} options - Configuration options for the PDF viewer.
   * @param {HTMLElement} parentContainer - The parent container element for the viewer.
   * @param {HTMLElement} container - The container element for the pages.
   * @param {number} totalPages - Total number of pages in the PDF.
   * @param {WebViewer} pdfViewer - Instance of the WebViewer.
   * @param {number} [pageBuffer=3] - Number of extra pages to render around the viewport.
   */
  constructor(
    options: ViewerLoadOptions,
    parentContainer: HTMLElement,
    container: HTMLElement,
    totalPages: number,
    pdfViewer: WebViewer,
    selectionManager: SelectionManager,
    searchHighlighter: SearchHighlighter,
    pageBuffer = 3,
  ) {
    pdfViewer.ready = new Promise((res) => (this._resolveReady = res));
    this._options = options;
    this._totalPages = totalPages;
    this._parentContainer = parentContainer;
    this._container = container.parentElement;
    this._pageBuffer = pageBuffer;
    this._pdfState = PdfState.getInstance(options.containerId);
    this._pdf = this._pdfState.pdfInstance;
    this._pdfViewer = pdfViewer;
    this._selectionManager = selectionManager;
    this._searchHighlighter = searchHighlighter;

    this.calculatePagePositioning().then(async () => {
      if (this.isThereSpecificPageToRender == null || this.isThereSpecificPageToRender == undefined) {
        await this._renderInitialPages();
        this._attachScrollListener();
      } else {
        await this._renderInitialPages();
      }

      this._resolveReady();
      if ((this._options?.toolbarOptions ?? {})?.showThumbnail) {
        await this.generateThumbnail();
      }
    });
  }

  set pageObserver(observer: IntersectionObserver) {
    this._observer = observer;
  }

  /**
   * Getter for the visible pages in the viewport.
   * This returns a read-only set of page numbers that are currently rendered.
   */
  get visiblePages(): ReadonlySet<number> {
    return new Set(this._renderedPages);
  }

  /**
   * Checks if a specific page has been designated for rendering.
   *
   * @returns {number | undefined} The page number to be rendered if specified, otherwise `undefined` or `null`.
   */
  get isThereSpecificPageToRender(): number | undefined | null {
    return this._options?.renderSpecificPageOnly;
  }

  /**
   * Getter for cached page positions.
   *
   * @returns {Map<number, number>} A map storing page positions.
   */
  get cachedPagePosition(): Map<number, number> {
    return this._pagePosition;
  }

  /**
   * Attach a scroll listener to dynamically load/unload pages based on the viewport.
   */
  private _attachScrollListener(): void {
    if (!this._container) return;

    this._pdfState.on('scaleChange', this._bindOnScaleChange);

    this._container.addEventListener('scroll', this._scrollHandler);
  }

  private _onScaleChange() {
    this._isScaleChangeActive = true;
    setTimeout(() => (this._isScaleChangeActive = false), 300);
  }

  private _scrollHandler = (event: Event) => {
    this._debouncedScrollHandler(this._isScaleChangeActive);
  };

  private _debouncedScrollHandler = throttle(async (isScaleChangeActive: boolean) => {
    if (!isScaleChangeActive) {
      const scrollTop = this._container!.scrollTop;
      const isScrollingDown = scrollTop > this._lastScrollTop;
      this._lastScrollTop = scrollTop;

      const targetPage = this._calculatePageFromScroll(scrollTop);
      await this._updateVisiblePages(isScrollingDown, targetPage);
    }
  }, 160);

  /**
   * Calculate the number of pages required to fill the viewport.
   *
   * @returns {Promise<number>} Number of pages needed to render initially.
   */
  private async _calculatePagesToFillViewport(): Promise<number> {
    if (!this._container) return 0;

    const containerHeight = this._container.getBoundingClientRect().height;
    let accumulatedHeight = 0;
    let pageCount = 0;

    for (let pageNumber = 1; pageNumber <= this._totalPages; pageNumber++) {
      const page = await this._pdf.getPage(pageNumber);
      const scale = this._pdfState.scale;
      const viewport = page.getViewport({ scale });
      const pageHeight = viewport.height;

      if (pageHeight > containerHeight) {
        pageCount++;
        break;
      }

      accumulatedHeight += pageHeight;

      if (accumulatedHeight >= containerHeight) {
        pageCount++;
        break;
      }

      pageCount++;
    }

    return pageCount;
  }

  /**
   * Render pages visible in the initial viewport.
   */
  private async _renderInitialPages(): Promise<void> {
    const isSpecificPage = this.isThereSpecificPageToRender;
    if (isSpecificPage != null && isSpecificPage != undefined) {
      this._renderedPages.add(isSpecificPage);
      await this._renderPage(isSpecificPage);
    } else {
      const pagesToRender = await this._calculatePagesToFillViewport();
      const initialPages = [];

      for (let pageNumber = 1; pageNumber <= pagesToRender; pageNumber++) {
        initialPages.push(pageNumber);
        this._renderedPages.add(pageNumber);
      }

      for (const pageNumber of initialPages) {
        await this._renderPage(pageNumber);
      }
    }
  }

  /**
   * Generates thumbnails for the document.
   */
  public async generateThumbnail(): Promise<void> {
    const isSpecificPage = this.isThereSpecificPageToRender;
    const thumbnailContainer = ThumbnailViewer.createThumbnailContainer(this._options!.containerId);
    const linkService = new PDFLinkService({ pdfState: this._pdfState, pdfViewer: this._pdfViewer });

    for (let pageNumber = isSpecificPage ?? 1; pageNumber <= (isSpecificPage ?? this._totalPages); pageNumber++) {
      const thumbnail = new ThumbnailViewer({
        container: thumbnailContainer as HTMLElement,
        pageNumber,
        pdfDocument: this._pdf,
        linkService,
      });

      await thumbnail.initThumbnail();

      if (pageNumber === isSpecificPage || pageNumber === this._pdfState.currentPage) {
        thumbnail.activeThumbnail = this._pdfState.currentPage;
      }
    }
  }

  /**
   * Precalculates page positions and sets the container dimensions.
   * This helps in efficiently determining which pages should be rendered based on scrolling.
   *
   * @returns {Promise<Map<number, number>>} A map storing page positions with their page numbers.
   */
  async calculatePagePositioning(): Promise<Map<number, number>> {
    const scale = this._pdfState.scale;
    let pageHeight = PageElement.gap;
    let pageWidth = Number.NEGATIVE_INFINITY;

    const specificPage = this.isThereSpecificPageToRender;
    for (let pageNumber = specificPage ?? 1; pageNumber <= (specificPage ?? this._pdf.numPages); pageNumber++) {
      const page = await this._pdf.getPage(pageNumber);
      const viewport = page.getViewport({ scale });

      // Store the page's position
      this._pagePosition.set(pageNumber, pageHeight);

      // Increment total document height for the next page
      pageHeight += viewport.height + PageElement.gap;
      pageWidth = Math.max(pageWidth, viewport.width);
    }

    // Set the final dimensions of the container
    this._setContainerHeight(pageHeight + PageElement.gap);
    this._setContainerWidth(pageWidth + PageElement.gap * 2);

    return this._pagePosition;
  }

  /**
   * Sets the height of the container based on the total page height.
   *
   * @param {number} height - The computed height to be set.
   */
  private _setContainerHeight(height: number): void {
    if (this._container?.firstChild) {
      (this._container.firstChild as HTMLElement).style.height = `${height}px`;
    }
  }

  /**
   * Sets the width of the container based on the widest page.
   *
   * @param {number} width - The computed width to be set.
   */
  private _setContainerWidth(width: number): void {
    if (this._container?.firstChild) {
      (this._container.firstChild as HTMLElement).style.width = `${width}px`;
    }
  }

  /**
   * Determines the page number corresponding to a given scrollTop position.
   * Uses a binary search on the cached page positions for efficiency.
   *
   * @param {number} scrollTop - The scroll position in pixels.
   * @returns {number} The page number that is currently in view.
   */
  private _calculatePageFromScroll(scrollTop: number): number {
    const sortedPositions = Array.from(this._pagePosition.entries()).sort((a, b) => a[1] - b[1]);
    let low = 0;
    let high = sortedPositions.length - 1;

    while (low <= high) {
      const mid = Math.floor((low + high) / 2);
      const [, topPosition] = sortedPositions[mid];

      if (scrollTop < topPosition) {
        high = mid - 1;
      } else {
        low = mid + 1;
      }
    }

    return sortedPositions[Math.max(high, 0)][0];
  }

  /**
   * Updates the pages visible within the viewport dynamically based on scrolling.
   * Removes pages that are outside the buffer zone and loads new ones as needed.
   *
   * @param {boolean} isScrollingDown - Direction of scrolling.
   * @param {number} targetPage - The current page in view.
   */
  private async _updateVisiblePages(isScrollingDown: boolean, targetPage: number): Promise<void> {
    const visiblePages = this._getPagesInBuffer(targetPage);

    for (const pageNumber of visiblePages) {
      if (!this._renderedPages.has(pageNumber)) {
        await this._renderPage(pageNumber);
        this._renderedPages.add(pageNumber);
      }
    }

    this._cleanupOutOfBufferPages(visiblePages);
  }

  /**
   * Gets the page numbers that should be rendered within the buffer range.
   *
   * @param {number} targetPage - The current page in view.
   * @returns {number[]} An array of page numbers that should be visible in the viewport.
   */
  private _getPagesInBuffer(targetPage: number): number[] {
    if (this.isThereSpecificPageToRender) return [];

    const startPage = Math.max(1, targetPage - this._pageBuffer);
    const endPage = Math.min(this._totalPages, targetPage + this._pageBuffer);

    const bufferPages: number[] = [];
    for (let pageNumber = startPage; pageNumber <= endPage; pageNumber++) {
      bufferPages.push(pageNumber);
    }

    return bufferPages;
  }

  /**
   * Renders a specific page onto the canvas within the viewport.
   *
   * @param {number} pageNumber - The page number to render.
   */
  private async _renderPage(pageNumber: number): Promise<void> {
    if (!this._container) return;

    const page = await this._pdf.getPage(pageNumber);
    const scale = this._pdfState.scale > 1 ? 1 : this._pdfState.scale;
    let viewport = page.getViewport({ scale });

    // Create and append a page container
    const pageWrapper = PageElement.createPageContainerDiv(pageNumber, viewport, this._pagePosition);
    pageWrapper.style.backgroundColor = 'white'; // Ensure a white placeholder is shown
    this._container.firstChild?.appendChild(pageWrapper);

    // Create and append a canvas for rendering
    const [canvas, context] = PageElement.createCanvas(viewport);
    const div = document.createElement('div');
    div.setAttribute('id', 'canva-presentation');
    div.appendChild(canvas);
    pageWrapper.appendChild(div);

    // zoom content warapper
    const imageContainer = document.createElement('div');
    imageContainer.setAttribute('id', 'a-zoomed-page-image-container');
    imageContainer.style.position = 'absolute';
    imageContainer.style.left = '0';
    imageContainer.style.top = '0';
    imageContainer.style.width = `${viewport.width}px`;
    imageContainer.style.height = `${viewport.height}px`;
    imageContainer.style.overflow = 'hidden';
    div.appendChild(imageContainer);

    // Render the page on the canvas
    const renderContext: RenderParameters = {
      canvasContext: context,
      viewport,
      annotationMode: 2,
    };
    if (this._pdfState.scale > 1) {
      this.updatePageBuffers(pageNumber);
    }
    page.render(renderContext).promise.then(async () => {
      if (this._options && !this._options.disableTextSelection) {
        viewport = page.getViewport({ scale: this._pdfState.scale });
        const [_, annotationDrawLayer] = await new TextLayer(pageWrapper, page, viewport).createTextLayer();
        await new AnnotationLayer(pageWrapper, page, viewport).createAnnotationLayer(this._pdfViewer, this._pdf);
        if (this._pdfState.isAnnotationEnabled && this._pdfState.isAnnotationConfigurationPropertiesEnabled) {
          if (annotationDrawLayer) {
            (annotationDrawLayer as HTMLElement).style.cursor = 'crosshair';
            (annotationDrawLayer as HTMLElement).style.pointerEvents = 'all';
          }
        }
        this._searchHighlighter.registerPage(pageNumber);
        if (!this._pdfViewer.annotation.isAnnotationManagerRegistered(pageNumber)) {
          this._pdfViewer.annotation.registerAnnotationManager(pageNumber, new AnnotationManager(annotationDrawLayer, this._pdfState, this._selectionManager));
        }
        if (this._pdfState.scale > 1) {
          await this.appendHighResImageToPageContainer(pageNumber);
        }
        if (this._observer) {
          this._observer.observe(pageWrapper);
        }
      }
    });
  }

  /**
   * Removes pages from the DOM that are outside the buffer zone.
   *
   * @param {number[]} visiblePages - An array of currently visible pages.
   */
  private _cleanupOutOfBufferPages(visiblePages: number[]): void {
    const minPage = Math.min(...visiblePages);
    const maxPage = Math.max(...visiblePages);

    for (const pageNumber of this._renderedPages) {
      if (pageNumber < minPage || pageNumber > maxPage) {
        this._pdfViewer.annotation.unregisterAnnotationManager(pageNumber);
        this._searchHighlighter.deregisterPage(pageNumber);
        this._removePage(pageNumber);
        this._renderedPages.delete(pageNumber);
      }
    }
  }

  /**
   * Retrieves the viewport of a specific page for rendering purposes.
   *
   * @param {number} pageNumber - The page number.
   * @returns {Promise<PageViewport>} The viewport object of the specified page.
   */
  private async _getViewport(pageNumber: number): Promise<PageViewport> {
    const page = await this._pdf.getPage(pageNumber);
    return page.getViewport({ scale: this._pdfState.scale });
  }

  /**
   * Removes a specific page element from the DOM.
   *
   * @param {number} pageNumber - The number of the page to be removed.
   */
  private _removePage(pageNumber: number): void {
    const pageElement = document.querySelector(`#${this._options?.containerId} #pageContainer-${pageNumber}`);
    if (pageElement) {
      if (this._observer) {
        this._observer.unobserve(pageElement);
      }
      pageElement.remove();
    }
  }

  /**
   * Redraws all visible pages based on the updated buffer and scale.
   *
   * @param {number} targetPage - The page number used to determine the visible buffer range.
   * @returns {Promise<void>} A promise that resolves when all visible pages are rendered.
   */
  async redrawVisiblePages(targetPage: number): Promise<void> {
    const visiblePages = this._renderedPages;

    // Re-render visible pages at the updated scale
    if (this.isThereSpecificPageToRender) {
      await this._renderPage(this.isThereSpecificPageToRender);
      // this._renderedPages.add(this.isThereSpecificPageToRender);
      await this.appendHighResImageToPageContainer(this.isThereSpecificPageToRender);
    } else {
      for (const pageNumber of visiblePages) {
        await this.appendHighResImageToPageContainer(pageNumber);
      }
    }
  }

  /**
   * Updates the style and dimensions of all page buffers in the container.
   * Iterates over every element with the class 'a-page-view' and adjusts its position,
   * width, and height based on the corresponding PDF page's viewport.
   *
   * @returns A promise that resolves once all page buffers have been updated.
   */
  public async updatePageBuffers(pageNumber: number | null = null): Promise<void> {
    if (!this._container) return;

    if (pageNumber !== null) {
      const domPages = document.querySelector(`#${this._options?.containerId} #pageContainer-${pageNumber}`) as HTMLElement;
      if (domPages) {
        const page: PDFPageProxy = await this._pdf.getPage(pageNumber);
        const scale: number = this._pdfState.scale;
        const viewport = page.getViewport({ scale });
        const pageTop = this._pagePosition.get(pageNumber) || 0;

        domPages.style.top = `${pageTop}px`;
        // Set the page container dimensions.
        domPages.style.height = `${viewport.height}px`;
        domPages.style.width = `${viewport.width}px`;

        const canvas = domPages.querySelector('canvas');
        if (canvas) {
          canvas.style.width = `${viewport.width}px`;
          canvas.style.height = `${viewport.height}px`;
        }

        const annotationLayer = domPages.querySelector(`#${PDF_VIEWER_IDS.ANNOTATION_DRAWING_LAYER}`);
        if (annotationLayer) {
          (annotationLayer as HTMLElement).style.width = `${viewport.width}px`;
          (annotationLayer as HTMLElement).style.height = `${viewport.height}px`;
        }

        const zoomContainer = canvas?.nextElementSibling;
        if (zoomContainer) {
          (zoomContainer as HTMLElement).style.width = `${viewport.width}px`;
          (zoomContainer as HTMLElement).style.height = `${viewport.height}px`;
          zoomContainer.innerHTML = '';
        }
      }
    } else {
      const domPages = document.querySelectorAll(`#${this._options?.containerId} .a-page-view`);
      if (!domPages) return;

      for (let i = 0; i < domPages.length; i++) {
        const pageNumber = parseInt(domPages[i].id.split('-')[1]);
        // Retrieve the PDF page and its viewport.
        const page: PDFPageProxy = await this._pdf.getPage(pageNumber);
        const scale: number = this._pdfState.scale;
        const viewport = page.getViewport({ scale });
        const pageTop = this._pagePosition.get(pageNumber) || 0;

        (domPages[i] as HTMLElement).style.top = `${pageTop}px`;
        // Set the page container dimensions.
        (domPages[i] as HTMLElement).style.height = `${viewport.height}px`;
        (domPages[i] as HTMLElement).style.width = `${viewport.width}px`;

        const canvas = domPages[i].querySelector('canvas');
        if (canvas) {
          canvas.style.width = `${viewport.width}px`;
          canvas.style.height = `${viewport.height}px`;
        }

        const annotationLayer = domPages[i].querySelector(`#${PDF_VIEWER_IDS.ANNOTATION_DRAWING_LAYER}`);
        if (annotationLayer) {
          (annotationLayer as HTMLElement).style.width = `${viewport.width}px`;
          (annotationLayer as HTMLElement).style.height = `${viewport.height}px`;
        }

        const zoomContainer = canvas?.nextElementSibling;
        if (zoomContainer) {
          (zoomContainer as HTMLElement).style.width = `${viewport.width}px`;
          (zoomContainer as HTMLElement).style.height = `${viewport.height}px`;
          zoomContainer.innerHTML = '';
        }
      }
    }
  }

  /**
   * Renders a high-resolution version of the specified PDF page as an image and appends it
   * to the page container. The rendered image is wrapped inside a container div which is then
   * appended to the element with the ID 'canva-presentation' within the corresponding page container.
   *
   * @param pageNumber - The number of the page to process.
   * @returns A promise that resolves once the high-resolution image container has been appended.
   */
  public async appendHighResImageToPageContainer(pageNumber: number): Promise<void> {
    // Get the PDF page and its viewport using the current scale.
    const page: PDFPageProxy = await this._pdf.getPage(pageNumber);
    const scale: number = this._pdfState.scale;
    const viewport = page.getViewport({ scale });

    const img = document.createElement('img');
    img.style.width = `${viewport.width}px`;
    img.style.height = `${viewport.height}px`;

    // Render the high-resolution image and obtain its data URL.
    const [dataUrl, _] = await this._renderHighResImage(viewport, page);
    img.src = dataUrl;

    // if (scale <= 1) return;

    // Append the image container into the appropriate page container.
    const pageContainer = document.querySelector(`#${this._pdfState.containerId} #pageContainer-${pageNumber}`);
    if (pageContainer) {
      const canvasPresentation = pageContainer.querySelector('#canva-presentation');
      if (canvasPresentation) {
        const imgContainer = canvasPresentation.querySelector('#a-zoomed-page-image-container');
        if (imgContainer) {
          imgContainer.appendChild(img);
        }
      }
    }
  }

  /**
   * Renders a high-resolution image of a PDF page onto a canvas and returns the image as a data URL.
   * The rendered image is generated using the provided viewport and PDF page. The method returns a tuple
   * containing the data URL of the rendered image (in PNG format) along with the canvas element used for rendering.
   *
   * @param viewport - The PageViewport representing the dimensions and scale of the PDF page.
   * @param page - The PDFPageProxy object representing the PDF page to render.
   * @returns A promise that resolves with a tuple: [dataUrl: string, canvas: HTMLCanvasElement].
   */
  private async _renderHighResImage(viewport: PageViewport, page: PDFPageProxy): Promise<[string, HTMLCanvasElement]> {
    // Create a canvas with dimensions based on the viewport.
    const [canvas, context] = PageElement.createCanvas(viewport);

    // Render the PDF page onto the canvas.
    const renderContext: RenderParameters = {
      canvasContext: context,
      viewport,
      annotationMode: 2,
    };
    await page.render(renderContext).promise;

    return [canvas.toDataURL('image/png'), canvas];
  }

  destroy() {
    // remove its scroll listener
    this._container?.removeEventListener('scroll', this._scrollHandler);
    // unsubscribe its scale-change hook
    this._pdfState.off('scaleChange', this._bindOnScaleChange);
  }
}

export default PageVirtualization;
