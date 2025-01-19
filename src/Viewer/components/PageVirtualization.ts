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
   * @param options - Configuration options for the PDF viewer.
   * @param parentContainer - The parent container element for the viewer.
   * @param container - The container element for the pages.
   * @param totalPages - Total number of pages in the PDF.
   * @param textLayer - Text layer instance (optional).
   * @param annotationLayer - Annotation layer instance (optional).
   * @param pageBuffer - Number of extra pages to render around the viewport (default: 3).
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
   * This getter retrieves the `renderSpecificPageOnly` property from the
   * options object, which specifies if the viewer should render only a specific page.
   *
   * @returns The page number to be rendered if specified, otherwise `undefined`.
   */
  get isThereSpecificPageToRender() {
    return this.options?.renderSpecificPageOnly;
  }

  /**
   * Getter for cached page positions.
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

    // Listener for scaleChange event
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

      // Check if the page exceeds the viewport height
      if (pageHeight > containerHeight) {
        pageCount++;
        break;
      }

      accumulatedHeight += pageHeight;

      // Include pages that partially or fully fit in the viewport.
      if (accumulatedHeight >= containerHeight) {
        pageCount++;
        break;
      }

      // Page fully fits into the container
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

  public async generateThumbnail() {
    const isSpecificPage = this.isThereSpecificPageToRender;
    const thumbnailContainer = ThumbnailViewer.createThumbnailContainer(this.options!.containerId);
    const linkService = new PDFLinkService({ pdfState: this.pdfState, pdfViewer: this.pdfViewer });
    for (let pageNumber = isSpecificPage ?? 1; pageNumber <= (isSpecificPage ?? this.totalPages); pageNumber++) {
      const thumbnail = new ThumbnailViewer({
        container: thumbnailContainer as HTMLElement,
        pageNumber: pageNumber,
        pdfDocument: this.pdf,
        linkService: linkService,
      });
      await thumbnail.initThumbnail();

      if (pageNumber === isSpecificPage || pageNumber === this.pdfState.currentPage) {
        thumbnail.activeThumbnail = this.pdfState.currentPage;
      }
    }
    // WebUiUtils.hideLoading(PdfState.getInstance(this.options!.containerId).uiLoading, this.options!.containerId);
  }

  /**
   * Precalculate page positions and set container dimensions.
   */
  async calculatePagePositioning() {
    const scale = this.pdfState.scale;
    let pageHeight = PageElement.gap;
    let pageWidth = Number.NEGATIVE_INFINITY;

    const specificPage = this.isThereSpecificPageToRender;
    for (let pageNumber = specificPage ?? 1; pageNumber <= (specificPage ?? this.pdf.numPages); pageNumber++) {
      const page = await this.pdf.getPage(pageNumber);
      const viewport = page.getViewport({ scale });
      this.pagePosition.set(pageNumber, pageHeight);
      pageHeight += viewport.height + PageElement.gap;
      pageWidth = Math.max(pageWidth, viewport.width);
    }

    this.setContainerHeight(pageHeight + PageElement.gap);
    this.setContainerWidth(pageWidth + PageElement.gap * 2);
    return this.pagePosition;
  }

  /**
   * Set the height of the container based on total page height.
   */
  private setContainerHeight(height: number): void {
    if (this.container?.firstChild) {
      (this.container.firstChild as HTMLElement).style.height = `${height}px`;
    }
  }

  /**
   * Set the width of the container based on the widest page.
   */
  private setContainerWidth(width: number): void {
    if (this.container?.firstChild) {
      (this.container.firstChild as HTMLElement).style.width = `${width}px`;
    }
  }

  /**
   * Calculate the page number corresponding to a given scrollTop position.
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
   * Update pages visible in the viewport dynamically.
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
   * Get pages within the buffer around the target page.
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
   * Render a specific page within the viewport.
   *
   * @param pageNumber - The page number to render.
   */
  private async renderPage(pageNumber: number): Promise<void> {
    if (!this.container) return;

    const page = await this.pdf.getPage(pageNumber);
    const scale = this.pdfState.scale;
    const viewport = page.getViewport({ scale });

    const pageWrapper = PageElement.createPageContainerDiv(pageNumber, viewport, this.pagePosition);
    this.container.firstChild?.appendChild(pageWrapper);

    const [canvas, context] = PageElement.createCanvas(viewport);
    pageWrapper.appendChild(canvas);

    const renderContext: RenderParameters = {
      canvasContext: context,
      viewport,
      annotationMode: 2,
    };
    await page.render(renderContext).promise;

    if (this.options && !this.options.disableTextSelection) {
      const debounceTextRender = debounce(async (pageWrapper: HTMLElement, container: HTMLElement, page: PDFPageProxy, viewport: PageViewport) => {
        await new TextLayer(pageWrapper, container.firstChild as HTMLElement, page, viewport).createTextLayer();
      }, 200);
      await debounceTextRender(pageWrapper, this.container.firstChild as HTMLElement, page, viewport);
    }
  }

  /**
   * Cleans up rendered pages outside the visible buffer range.
   *
   * @param visiblePages - An array of visible page numbers in the current buffer.
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
   * @param pageNumber - The number of the page to retrieve the viewport for.
   * @returns The viewport object of the specified page.
   */
  private async getViewport(pageNumber: number) {
    const page = await this.pdf.getPage(pageNumber);
    const scale = this.pdfState.scale;
    const viewport = page.getViewport({ scale });
    return viewport;
  }

  /**
   * Removes a specific page element from the DOM.
   *
   * @param pageNumber - The number of the page to be removed.
   */
  private removePage(pageNumber: number): void {
    const pageElement = document.querySelector(`#${this.options?.containerId} #pageContainer-${pageNumber}`);
    if (pageElement) pageElement.remove();
  }

  /**
   * Redraws all visible pages based on the updated buffer and scale.
   *
   * @param targetPage - The page number used to determine the visible buffer range.
   * @returns A promise that resolves when all visible pages are rendered.
   */
  async redrawVisiblePages(targetPage: number): Promise<void> {
    const visiblePages = this.getPagesInBuffer(targetPage); // Get currently visible pages with buffer

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
