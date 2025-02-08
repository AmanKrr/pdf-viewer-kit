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
import PdfSearch from '../manager/PdfSearch';

/**
 * Manages the PDF viewer instance and provides various functionalities, including:
 * - Page navigation
 * - Zooming
 * - Searching
 * - Toolbar interactions
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
   *
   * @param {PDFDocumentProxy} pdfInstance - The PDF.js document instance.
   * @param {ViewerLoadOptions} viewerOptions - Configuration for the viewer.
   * @param {HTMLElement} parentContainer - The parent container where the viewer is rendered.
   * @param {HTMLElement} pageParentContainer - The container holding the PDF pages.
   */
  constructor(pdfInstance: PDFDocumentProxy, viewerOptions: ViewerLoadOptions, parentContainer: HTMLElement, pageParentContainer: HTMLElement) {
    this.__pdfInstance = pdfInstance;
    this.__viewerOptions = viewerOptions;

    this.__Observer = throttle(WebUiUtils.Observer, 200);
    this.__pdfState = PdfState.getInstance(viewerOptions.containerId);

    // Initialize page virtualization, search, and toolbar components
    this.__pageVirtualization = new PageVirtualization(this.__viewerOptions, parentContainer, pageParentContainer, this.__pdfInstance.numPages, this);
    new PdfSearch(this.__pdfState);
    new Toolbar(this.__viewerOptions.containerId, this.__viewerOptions.customToolbarItems ?? [], this);
    this.addEvents();
  }

  /**
   * Adds event listeners for scrolling and updates page number input dynamically.
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

  /**
   * Synchronizes the thumbnail sidebar scroll position with the currently viewed page.
   */
  private syncThumbnailScrollWithMainPageContainer() {
    const pageNumber = this.currentPageNumber;
    const previousActiveThumbnail = document.querySelector(`.thumbnail.thumbnail-active`);
    if (previousActiveThumbnail) {
      previousActiveThumbnail.classList.remove('thumbnail-active');
    }
    const thumbnailToBeActive = document.querySelector(`[data-page-number="${pageNumber}"]`);
    if (thumbnailToBeActive) {
      thumbnailToBeActive.classList.add('thumbnail-active');
      thumbnailToBeActive.scrollIntoView({ block: 'center', behavior: 'smooth' });
    }
  }

  /** @returns {number} The currently active page number. */
  get currentPageNumber() {
    return this.__pdfState.currentPage;
  }

  /** @returns {number} The total number of pages in the PDF document. */
  get totalPages() {
    return this.__pdfState.pdfInstance?.numPages;
  }

  /**
   * Toggles the visibility of the thumbnail viewer sidebar.
   */
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
   * Navigates to the next page in the PDF viewer.
   * If already on the last page, does nothing.
   */
  public nextPage(): void {
    if (this.totalPages === undefined) {
      console.error(`nextPage: ${this.totalPages} is not a valid total page count.`);
      return;
    }

    if (this.currentPageNumber < this.totalPages!) {
      this.__pdfState.currentPage = this.currentPageNumber + 1;
      this.goToPage(this.currentPageNumber);
    }
  }

  /**
   * Navigates to the previous page in the PDF viewer.
   * If already on the first page, does nothing.
   */
  public previousPage(): void {
    if (this.currentPageNumber > 1) {
      this.__pdfState.currentPage = this.currentPageNumber - 1;
      this.goToPage(this.currentPageNumber);
    }
  }

  /**
   * Navigates to the first page of the PDF.
   */
  public firstPage(): void {
    if (this.currentPageNumber > 1) {
      this.__pdfState.currentPage = 1;
      this.goToPage(this.currentPageNumber);
    }
  }

  /**
   * Navigates to the last page of the PDF.
   */
  public lastPage(): void {
    if (this.totalPages === undefined) {
      console.error(`lastPage: ${this.totalPages} is not a valid total page count.`);
      return;
    }

    if (this.currentPageNumber < this.totalPages!) {
      this.__pdfState.currentPage = this.totalPages!;
      this.goToPage(this.currentPageNumber);
    }
  }

  /**
   * Toggles the visibility of the search box in the viewer.
   */
  public search(): void {
    const searchContainer = document.querySelector(`#${this.__viewerOptions.containerId} .a-search-container`);
    if (searchContainer) {
      searchContainer.classList.toggle('a-search-hidden');
    }
  }

  /**
   * Zooms into the PDF by increasing the scale.
   * The scale increases by 0.5 per zoom-in action, with a maximum limit of 4.0.
   */
  public async zoomIn(): Promise<void> {
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
   * Zooms out of the PDF by decreasing the scale.
   * The scale decreases by 0.5 per zoom-out action, with a minimum limit of 0.5.
   */
  public async zoomOut(): Promise<void> {
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
   * Gets the scroll offset relative to the top of a specified page.
   *
   * @param {number} targetPage - The target page number.
   * @returns {number} The scroll offset from the top of the page.
   */
  private getScrollOffsetRelativeToPage(targetPage: number): number {
    const pageTop = this.__pageVirtualization.cachedPagePosition.get(targetPage) || 0;
    const scrollTop = document.querySelector(`#${this.__viewerOptions.containerId} #${aPdfViewerIds['_MAIN_VIEWER_CONTAINER']}`)!.scrollTop;

    return scrollTop - pageTop;
  }

  /**
   * Adjusts the scroll position after a zoom-in or zoom-out operation.
   *
   * @param {number} targetPage - The target page number.
   * @param {number} relativeScrollOffset - The relative scroll offset before zooming.
   * @param {number} previousScale - The scale before zooming.
   * @param {number} newScale - The new scale after zooming.
   */
  private adjustScrollPosition(targetPage: number, relativeScrollOffset: number, previousScale: number, newScale: number): void {
    const pageTop = this.__pageVirtualization.cachedPagePosition.get(targetPage) || 0;
    const scaledOffset = relativeScrollOffset * (newScale / previousScale);
    const newScrollTop = pageTop + scaledOffset;

    document.querySelector(`#${this.__viewerOptions.containerId} #${aPdfViewerIds['_MAIN_VIEWER_CONTAINER']}`)!.scrollTop = newScrollTop;
  }

  /**
   * Navigates to a specific page in the PDF viewer.
   *
   * @param {number} pageNumber - The target page number.
   */
  public goToPage(pageNumber: number) {
    if (pageNumber >= 1 && pageNumber <= this.totalPages!) {
      const pagePosition = this.__pageVirtualization.cachedPagePosition.get(pageNumber);
      if (pagePosition != undefined) {
        const scrollElement = document.querySelector(`#${this.__viewerOptions.containerId} #${aPdfViewerIds['_MAIN_VIEWER_CONTAINER']}`);
        if (scrollElement) {
          scrollElement.scrollTop = pagePosition;
          this.__pdfState.currentPage = pageNumber;
          this.updateCurrentPageInput();
        }
      }
    } else {
      console.error(`Invalid page number: ${pageNumber}`);
    }
  }

  /**
   * Updates the current page number input field in the toolbar.
   */
  private updateCurrentPageInput() {
    const currentPageInputField = document.querySelector(`#${this.__viewerOptions.containerId} #${aPdfViewerIds._CURRENT_PAGE_INPUT}`);
    if (currentPageInputField) {
      (currentPageInputField as HTMLInputElement).value = String(this.currentPageNumber);
    }
  }

  /**
   * Applies a CSS-based scaling transformation to the PDF viewer container.
   *
   * This method updates a CSS variable (`--scale-factor`) on the main page viewer container,
   * which allows CSS styles to dynamically adjust based on the applied scale.
   *
   * @param {number} scaleFactor - The scale factor to apply to the viewer.
   */
  private applyCssScale(scaleFactor: number): void {
    // Select the main page viewer container
    const pageViewerContainer = document.querySelector(`#${this.__viewerOptions.containerId} #${aPdfViewerIds._MAIN_PAGE_VIEWER_CONTAINER}`) as HTMLElement;

    // Apply the scale factor if the container exists
    if (pageViewerContainer) {
      pageViewerContainer.style.setProperty('--scale-factor', String(scaleFactor));
    }
  }

  /**
   * Handles toolbar button clicks and executes corresponding actions.
   *
   * @param {string} buttonName - The name of the toolbar button clicked.
   * @param {MouseEvent | Event} event - The event object associated with the action.
   */
  async toolbarButtonClick(buttonName: string, event: MouseEvent | Event) {
    switch (buttonName) {
      case 'firstPage':
        this.goToPage(1);
        break;
      case 'lastPage':
        this.goToPage(this.totalPages!);
        break;
      case 'previousPage':
        this.goToPage(this.currentPageNumber - 1);
        break;
      case 'nextPage':
        this.goToPage(this.currentPageNumber + 1);
        break;
      case 'zoomIn':
        await this.zoomIn();
        break;
      case 'zoomOut':
        await this.zoomOut();
        break;
      case 'currentPageNumber':
        this.__pdfState.currentPage = parseInt((event.target as HTMLInputElement).value);
        if ((event as KeyboardEvent).key === 'Enter') {
          (event.target as HTMLInputElement).blur();
          this.goToPage(this.currentPageNumber);
          this.syncThumbnailScrollWithMainPageContainer();
        }
        break;
    }
  }
}

export default WebViewer;
