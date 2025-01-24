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
import TextLayer from './TextLayer';
import PdfState from './PdfState';
import { RenderParameters } from 'pdfjs-dist/types/src/display/api';
import PageElement from './PageElement';
import { debounce, throttle } from 'lodash';
import ThumbnailViewer from './ThumbnailViewer';
import WebViewer from './WebViewer';
import { PDFLinkService } from '../service/LinkService';

/**
 * Handles virtualization of PDF pages, rendering only those visible within the viewport.
 */
class PageVirtualization {
  private options: LoadOptions | null = null;
  private parentContainer: HTMLElement | null = null;
  private container: HTMLElement | null = null;
  private pageBuffer: number = 3; // Number of pages to keep in the buffer around the viewport.
  private totalPages: number;
  private pdf!: PDFDocumentProxy;
  private renderedPages: Set<number> = new Set();
  private lastScrollTop: number = 0;
  private pagePosition: Map<number, number> = new Map();
  private pdfState!: PdfState;
  private pdfViewer!: WebViewer;
  public pageRenderComplete: Promise<boolean> = new Promise((resolve) => {
    resolve(false);
  });

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
  constructor(options: LoadOptions, parentContainer: HTMLElement, container: HTMLElement, totalPages: number, pdfViewer: WebViewer, pageBuffer = 3) {
    this.options = options;
    this.totalPages = totalPages;
    this.parentContainer = parentContainer;
    this.container = container.parentElement;
    this.pageBuffer = pageBuffer;
    this.pdfState = PdfState.getInstance(options.containerId);
    this.pdf = this.pdfState.pdfInstance;
    this.pdfViewer = pdfViewer;

    this.calculatePagePositioning().then(async () => {
      if (this.isThereSpecificPageToRender == null || this.isThereSpecificPageToRender == undefined) {
        await this.renderInitialPages();
        this.attachScrollListener();
      } else {
        await this.renderInitialPages();
      }

      await this.generateThumbnail();
    });
  }

  /**
   * Checks if a specific page has been designated for rendering.
   *
   * @returns {number | undefined} The page number to be rendered if specified, otherwise `undefined` or `null`.
   */
  get isThereSpecificPageToRender(): number | undefined | null {
    return this.options?.renderSpecificPageOnly;
  }

  /**
   * Getter for cached page positions.
   *
   * @returns {Map<number, number>} A map storing page positions.
   */
  get cachedPagePosition(): Map<number, number> {
    return this.pagePosition;
  }

  /**
   * Attach a scroll listener to dynamically load/unload pages based on the viewport.
   */
  private attachScrollListener(): void {
    if (!this.container) return;

    let isScaleChangeActive = false;

    this.pdfState.on('scaleChange', () => {
      isScaleChangeActive = true;
      setTimeout(() => (isScaleChangeActive = false), 300);
    });

    const debouncedScrollHandler = throttle(async () => {
      if (!isScaleChangeActive) {
        const scrollTop = this.container!.scrollTop;
        const isScrollingDown = scrollTop > this.lastScrollTop;
        this.lastScrollTop = scrollTop;

        const targetPage = this.calculatePageFromScroll(scrollTop);
        await this.updateVisiblePages(isScrollingDown, targetPage);
      }
    }, 160);

    this.container.addEventListener('scroll', debouncedScrollHandler);
  }

  /**
   * Calculate the number of pages required to fill the viewport.
   *
   * @returns {Promise<number>} Number of pages needed to render initially.
   */
  private async calculatePagesToFillViewport(): Promise<number> {
    if (!this.container) return 0;

    const containerHeight = this.container.getBoundingClientRect().height;
    let accumulatedHeight = 0;
    let pageCount = 0;

    for (let pageNumber = 1; pageNumber <= this.totalPages; pageNumber++) {
      const page = await this.pdf.getPage(pageNumber);
      const scale = this.pdfState.scale;
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
  private async renderInitialPages(): Promise<void> {
    const isSpecificPage = this.isThereSpecificPageToRender;
    if (isSpecificPage != null && isSpecificPage != undefined) {
      this.renderedPages.add(isSpecificPage);
      await this.renderPage(isSpecificPage);
    } else {
      const pagesToRender = await this.calculatePagesToFillViewport();
      const initialPages = [];

      for (let pageNumber = 1; pageNumber <= pagesToRender; pageNumber++) {
        initialPages.push(pageNumber);
        this.renderedPages.add(pageNumber);
      }

      for (const pageNumber of initialPages) {
        await this.renderPage(pageNumber);
      }
    }
  }

  /**
   * Generates thumbnails for the document.
   */
  public async generateThumbnail(): Promise<void> {
    const isSpecificPage = this.isThereSpecificPageToRender;
    const thumbnailContainer = ThumbnailViewer.createThumbnailContainer(this.options!.containerId);
    const linkService = new PDFLinkService({ pdfState: this.pdfState, pdfViewer: this.pdfViewer });

    for (let pageNumber = isSpecificPage ?? 1; pageNumber <= (isSpecificPage ?? this.totalPages); pageNumber++) {
      const thumbnail = new ThumbnailViewer({
        container: thumbnailContainer as HTMLElement,
        pageNumber,
        pdfDocument: this.pdf,
        linkService,
      });

      await thumbnail.initThumbnail();

      if (pageNumber === isSpecificPage || pageNumber === this.pdfState.currentPage) {
        thumbnail.activeThumbnail = this.pdfState.currentPage;
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
    const scale = this.pdfState.scale;
    let pageHeight = PageElement.gap;
    let pageWidth = Number.NEGATIVE_INFINITY;

    const specificPage = this.isThereSpecificPageToRender;
    for (let pageNumber = specificPage ?? 1; pageNumber <= (specificPage ?? this.pdf.numPages); pageNumber++) {
      const page = await this.pdf.getPage(pageNumber);
      const viewport = page.getViewport({ scale });

      // Store the page's position
      this.pagePosition.set(pageNumber, pageHeight);

      // Increment total document height for the next page
      pageHeight += viewport.height + PageElement.gap;
      pageWidth = Math.max(pageWidth, viewport.width);
    }

    // Set the final dimensions of the container
    this.setContainerHeight(pageHeight + PageElement.gap);
    this.setContainerWidth(pageWidth + PageElement.gap * 2);

    return this.pagePosition;
  }

  /**
   * Sets the height of the container based on the total page height.
   *
   * @param {number} height - The computed height to be set.
   */
  private setContainerHeight(height: number): void {
    if (this.container?.firstChild) {
      (this.container.firstChild as HTMLElement).style.height = `${height}px`;
    }
  }

  /**
   * Sets the width of the container based on the widest page.
   *
   * @param {number} width - The computed width to be set.
   */
  private setContainerWidth(width: number): void {
    if (this.container?.firstChild) {
      (this.container.firstChild as HTMLElement).style.width = `${width}px`;
    }
  }

  /**
   * Determines the page number corresponding to a given scrollTop position.
   * Uses a binary search on the cached page positions for efficiency.
   *
   * @param {number} scrollTop - The scroll position in pixels.
   * @returns {number} The page number that is currently in view.
   */
  private calculatePageFromScroll(scrollTop: number): number {
    const sortedPositions = Array.from(this.pagePosition.entries()).sort((a, b) => a[1] - b[1]);
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
  private async updateVisiblePages(isScrollingDown: boolean, targetPage: number): Promise<void> {
    const visiblePages = this.getPagesInBuffer(targetPage);

    for (const pageNumber of visiblePages) {
      if (!this.renderedPages.has(pageNumber)) {
        await this.renderPage(pageNumber);
        this.renderedPages.add(pageNumber);
      }
    }

    this.cleanupOutOfBufferPages(visiblePages);
  }

  /**
   * Gets the page numbers that should be rendered within the buffer range.
   *
   * @param {number} targetPage - The current page in view.
   * @returns {number[]} An array of page numbers that should be visible in the viewport.
   */
  private getPagesInBuffer(targetPage: number): number[] {
    if (this.isThereSpecificPageToRender) return [];

    const startPage = Math.max(1, targetPage - this.pageBuffer);
    const endPage = Math.min(this.totalPages, targetPage + this.pageBuffer);

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
  private async renderPage(pageNumber: number): Promise<void> {
    if (!this.container) return;

    const page = await this.pdf.getPage(pageNumber);
    const scale = this.pdfState.scale;
    const viewport = page.getViewport({ scale });

    // Create and append a page container
    const pageWrapper = PageElement.createPageContainerDiv(pageNumber, viewport, this.pagePosition);
    this.container.firstChild?.appendChild(pageWrapper);

    // Create and append a canvas for rendering
    const [canvas, context] = PageElement.createCanvas(viewport);
    pageWrapper.appendChild(canvas);

    // Render the page on the canvas
    const renderContext: RenderParameters = {
      canvasContext: context,
      viewport,
      annotationMode: 2,
    };
    await page.render(renderContext).promise;

    // Render the text layer if text selection is enabled
    if (this.options && !this.options.disableTextSelection) {
      const debounceTextRender = debounce(async (pageWrapper: HTMLElement, container: HTMLElement, page: PDFPageProxy, viewport: PageViewport) => {
        await new TextLayer(pageWrapper, container.firstChild as HTMLElement, page, viewport).createTextLayer();
      }, 200);
      await debounceTextRender(pageWrapper, this.container.firstChild as HTMLElement, page, viewport);
    }
  }

  /**
   * Removes pages from the DOM that are outside the buffer zone.
   *
   * @param {number[]} visiblePages - An array of currently visible pages.
   */
  private cleanupOutOfBufferPages(visiblePages: number[]): void {
    const minPage = Math.min(...visiblePages);
    const maxPage = Math.max(...visiblePages);

    for (const pageNumber of this.renderedPages) {
      if (pageNumber < minPage || pageNumber > maxPage) {
        this.removePage(pageNumber);
        this.renderedPages.delete(pageNumber);
      }
    }
  }

  /**
   * Retrieves the viewport of a specific page for rendering purposes.
   *
   * @param {number} pageNumber - The page number.
   * @returns {Promise<PageViewport>} The viewport object of the specified page.
   */
  private async getViewport(pageNumber: number): Promise<PageViewport> {
    const page = await this.pdf.getPage(pageNumber);
    return page.getViewport({ scale: this.pdfState.scale });
  }

  /**
   * Removes a specific page element from the DOM.
   *
   * @param {number} pageNumber - The number of the page to be removed.
   */
  private removePage(pageNumber: number): void {
    const pageElement = document.querySelector(`#${this.options?.containerId} #pageContainer-${pageNumber}`);
    if (pageElement) pageElement.remove();
  }

  /**
   * Redraws all visible pages based on the updated buffer and scale.
   *
   * @param {number} targetPage - The page number used to determine the visible buffer range.
   * @returns {Promise<void>} A promise that resolves when all visible pages are rendered.
   */
  async redrawVisiblePages(targetPage: number): Promise<void> {
    const visiblePages = this.getPagesInBuffer(targetPage);

    // Remove all currently rendered pages
    for (const pageNumber of this.renderedPages) {
      this.removePage(pageNumber);
    }
    this.renderedPages.clear();

    // Re-render visible pages at the updated scale
    if (this.isThereSpecificPageToRender) {
      await this.renderPage(this.isThereSpecificPageToRender);
      this.renderedPages.add(this.isThereSpecificPageToRender);
    } else {
      for (const pageNumber of visiblePages) {
        await this.renderPage(pageNumber);
        this.renderedPages.add(pageNumber);
      }
    }
  }
}

export default PageVirtualization;
