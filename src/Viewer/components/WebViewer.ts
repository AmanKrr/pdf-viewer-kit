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
import WebUiUtils from '../../utils/WebUiUtils';
import { aPdfViewerClassNames, aPdfViewerIds } from '../../constant/ElementIdClass';
import throttle from 'lodash/throttle';
import PdfState from './PdfState';
import Toolbar from './Toolbar';
import PageVirtualization from './PageVirtualization';
import { debounce } from 'lodash';

/**
 * A class for managing and interacting with a PDF viewer in the browser.
 */
class WebViewer {
  private __Observer;
  private __pageVirtualization!: PageVirtualization;
  private __viewerOptions!: ViewerLoadOptions;
  private __pdfInstance!: PDFDocumentProxy;
  private __pdfState!: PdfState;
  private __cachedSideBarElement: HTMLElement | undefined;

  /**
   * Initializes the WebViewer instance.
   * @param pdfInstance - The PDF document instance.
   * @param viewerOptions - Configuration for viewer.
   * @param pageVirtualization - The instance for page virtualization.
   */
  constructor(pdfInstance: PDFDocumentProxy, viewerOptions: ViewerLoadOptions, parentContainer: HTMLElement, pageParentContainer: HTMLElement) {
    this.__pdfInstance = pdfInstance;
    this.__viewerOptions = viewerOptions;

    this.__Observer = throttle(WebUiUtils.Observer, 200);
    this.__pdfState = PdfState.getInstance(viewerOptions.containerId);

    // Initialize components for text layer, annotation layer, and page virtualization.
    this.__pageVirtualization = new PageVirtualization(this.__viewerOptions, parentContainer, pageParentContainer, this.__pdfInstance.numPages, this);

    new Toolbar(this.__viewerOptions.containerId, this.__viewerOptions.customToolbarItems ?? [], this);
    this.addEvents();
  }

  /**
   * Adds event listeners to the viewer for user interactions.
   */
  private addEvents() {
    const mainViewer = document.querySelector(`#${this.__viewerOptions.containerId} #${aPdfViewerIds['_MAIN_VIEWER_CONTAINER']}`);
    if (mainViewer) {
      mainViewer.addEventListener('scroll', () => {
        // Update the current page number on scroll.
        const updateCurrentPage = (pageNumber: number) => {
          this.__pdfState.currentPage = pageNumber;
          this.updateCurrentPageInput();
        };
        this.__Observer(updateCurrentPage, this.__viewerOptions.containerId);
        debounce(() => {
          this.syncThumbnailScrollWithMainPageContainer();
        }, 600)();
      });
    }
  }

  private syncThumbnailScrollWithMainPageContainer() {
    const pageNumber = this.currentPageNumber;

    const previousActiveThumbnail = document.querySelector(`.thumbnail.thumbnail-active`);
    if (previousActiveThumbnail) {
      if (previousActiveThumbnail.classList.contains('thumbnail-active')) {
        previousActiveThumbnail.classList.remove('thumbnail-active');
      }
    }
    const thumbnailToBeActive = document.querySelector(`[data-page-number="${pageNumber}"]`);
    if (thumbnailToBeActive) {
      thumbnailToBeActive.classList.add('thumbnail-active');
      thumbnailToBeActive.scrollIntoView({ block: 'center', behavior: 'smooth' });
    }
  }

  /**
   * Retrieves the current page number being viewed.
   *
   * This getter fetches the current page number from the PdfState,
   * which holds the shared state of the PDF viewer.
   *
   * @returns The current page number.
   */
  get currentPageNumber() {
    return this.__pdfState.currentPage;
  }

  /**
   * Retrieves the total page number in a pdf.
   *
   * This getter fetches the total page number from the PdfState,
   * which holds the shared state of the PDF viewer.
   *
   * @returns The current page number.
   */
  get totalPages() {
    return this.__pdfState.pdfInstance?.numPages;
  }

  public toogleThumbnailViewer() {
    const thumbnailSidebarElement = this.__cachedSideBarElement ?? document.querySelector(`#${this.__viewerOptions.containerId} .${aPdfViewerClassNames['_A_SIDEBAR_CONTAINER']}`);

    if (!thumbnailSidebarElement) {
      console.error(`Invalid sidebar container element ${thumbnailSidebarElement}.`);
      return;
    }

    if (!this.__cachedSideBarElement) {
      this.__cachedSideBarElement = thumbnailSidebarElement as HTMLElement;
    }

    if (this.__cachedSideBarElement.classList.contains('active')) {
      this.__cachedSideBarElement.classList.remove('active');
    } else {
      this.__cachedSideBarElement.classList.add('active');
      this.syncThumbnailScrollWithMainPageContainer();
    }
  }

  /**
   * Navigates to the next page.
   */
  public nextPage() {
    if (this.totalPages == undefined) {
      console.error(`nextPage: ${this.totalPages} is not a valid total page count.`);
    }

    if (this.currentPageNumber < this.totalPages!) {
      this.__pdfState.currentPage = this.currentPageNumber + 1;
      this.goToPage(this.currentPageNumber);
    }
  }

  /**
   * Navigates to the previous page.
   */
  public previousPage(): void {
    if (this.currentPageNumber > 1) {
      this.__pdfState.currentPage = this.currentPageNumber - 1;
      this.goToPage(this.currentPageNumber);
    }
  }

  /**
   * Navigates to the first page.
   */
  public firstPage(): void {
    if (this.currentPageNumber > 1) {
      this.__pdfState.currentPage = 1;
      this.goToPage(this.currentPageNumber);
    }
  }

  /**
   * Navigates to the last page.
   */
  public lastPage(): void {
    if (this.totalPages == undefined) {
      console.error(`lastPage: ${this.totalPages} is not a valid total page count.`);
    }

    if (this.currentPageNumber < this.totalPages!) {
      this.__pdfState.currentPage = this.totalPages!;
      this.goToPage(this.currentPageNumber);
    }
  }

  /**
   * Searches for a query in the PDF.
   * @param query - The search query string.
   */
  public search(query: string): void {
    // Implement search logic here
    console.log(`Performing search for: ${query}`);
  }

  /**
   * Zooms into the PDF by incrementing the scale.
   */
  async zoomIn() {
    const currentScale = this.__pdfState.scale;
    const currentPage = this.currentPageNumber;

    if (currentScale < 4.0) {
      const newScale = currentScale + 0.5;
      const scrollOffset = this.getScrollOffsetRelativeToPage(currentPage);

      this.__pdfState.scale = newScale;
      this.applyCssScale(newScale);

      requestAnimationFrame(async () => {
        await this.__pageVirtualization.calculatePagePositioning();
        this.adjustScrollPosition(currentPage, scrollOffset, currentScale, newScale);
        await this.__pageVirtualization.redrawVisiblePages(currentPage);
      });
    }
  }

  /**
   * Zooms out of the PDF by decrementing the scale.
   */
  async zoomOut() {
    const currentScale = this.__pdfState.scale;
    const currentPage = this.currentPageNumber;

    if (currentScale > 0.5) {
      const newScale = currentScale - 0.5;
      const scrollOffset = this.getScrollOffsetRelativeToPage(currentPage);

      this.__pdfState.scale = newScale;
      this.applyCssScale(newScale);

      requestAnimationFrame(async () => {
        await this.__pageVirtualization.calculatePagePositioning();
        this.adjustScrollPosition(currentPage, scrollOffset, currentScale, newScale);
        await this.__pageVirtualization.redrawVisiblePages(currentPage);
      });
    }
  }

  /**
   * Gets the scroll offset relative to the top of a page.
   * @param targetPage - The target page number.
   * @returns The scroll offset from the top of the page.
   */
  private getScrollOffsetRelativeToPage(targetPage: number): number {
    const pageTop = this.__pageVirtualization.cachedPagePosition.get(targetPage) || 0;
    const scrollTop = document.querySelector(`#${this.__viewerOptions.containerId} #${aPdfViewerIds['_MAIN_VIEWER_CONTAINER']}`)!.scrollTop;

    return scrollTop - pageTop;
  }

  /**
   * Adjusts the scroll position based on scale changes.
   * @param targetPage - The target page number.
   * @param relativeScrollOffset - The relative scroll offset.
   * @param previousScale - The previous scale factor.
   * @param newScale - The new scale factor.
   */
  private adjustScrollPosition(targetPage: number, relativeScrollOffset: number, previousScale: number, newScale: number): void {
    const pageTop = this.__pageVirtualization.cachedPagePosition.get(targetPage) || 0;
    const scaledOffset = relativeScrollOffset * (newScale / previousScale);
    const newScrollTop = pageTop + scaledOffset;

    document.querySelector(`#${this.__viewerOptions.containerId} #${aPdfViewerIds['_MAIN_VIEWER_CONTAINER']}`)!.scrollTop = newScrollTop;
  }

  /**
   * Updates the current page number input field.
   */
  private updateCurrentPageInput() {
    const currentPageInputField = document.querySelector(`#${this.__viewerOptions.containerId} #${aPdfViewerIds._CURRENT_PAGE_INPUT}`);
    if (currentPageInputField) {
      (currentPageInputField as HTMLInputElement).value = String(this.currentPageNumber);
    }
  }

  /**
   * Navigates to a specific page by number.
   * @param pageNumber - The target page number.
   */
  public goToPage(pageNumber: number) {
    if (this.totalPages == undefined) {
      console.error(`goToPage: ${this.totalPages} is not a valid total page count.`);
    }

    if (pageNumber >= 1 && pageNumber <= this.totalPages!) {
      const pagePosition = this.__pageVirtualization.cachedPagePosition;
      const position = pagePosition?.get(pageNumber);
      if (position != undefined && position >= 0) {
        const scrollElement = document.querySelector(`#${this.__viewerOptions.containerId} #${aPdfViewerIds['_MAIN_VIEWER_CONTAINER']}`);
        if (scrollElement) {
          scrollElement.scrollTop = position;
          this.__pdfState.currentPage = pageNumber;
          this.updateCurrentPageInput();
        }
      }
    } else {
      console.error(`Invalid ${pageNumber} page number.`);
    }
  }

  /**
   * Applies CSS scaling to the viewer.
   * @param scaleFactor - The scale factor to apply.
   */
  private applyCssScale(scaleFactor: number): void {
    const pageViewerContainer = document.querySelector(`#${this.__viewerOptions.containerId} #${aPdfViewerIds._MAIN_PAGE_VIEWER_CONTAINER}`) as HTMLElement;
    if (pageViewerContainer) {
      pageViewerContainer.style.setProperty('--scale-factor', String(scaleFactor));
    }
  }

  /**
   * Handles toolbar button clicks and executes corresponding actions.
   * @param buttonName - The name of the button clicked.
   * @param event - The event object associated with the click.
   */
  async toolbarButtonClick(buttonName: string, event: MouseEvent | Event) {
    switch (buttonName) {
      case 'firstPage':
        this.firstPage();
        break;
      case 'lastPage':
        this.lastPage();
        break;
      case 'previousPage':
        this.previousPage();
        break;
      case 'nextPage':
        this.nextPage();
        break;
      case 'zoomIn':
        await this.zoomIn();
        break;
      case 'zoomOut':
        await this.zoomOut();
        break;
      case 'currentPageNumber':
        this.__pdfState.currentPage = parseInt((event.target as HTMLInputElement).value);
        if (event && (event as KeyboardEvent).key === 'Enter') {
          (event.target as HTMLInputElement).blur();
          this.goToPage(this.currentPageNumber);
          this.syncThumbnailScrollWithMainPageContainer();
        }
        break;
      case 'rotate':
        break;
    }
  }
}

export default WebViewer;
