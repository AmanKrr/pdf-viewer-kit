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
import { PDF_VIEWER_CLASSNAMES, PDF_VIEWER_IDS } from '../../constants/pdf-viewer-selectors';
import PdfState from './PDFState';
import { debounce } from 'lodash';
import PageVirtualization from './PDFPageVirtualization';
import ZoomHandler from './PDFZoomHandler';
import { ViewerLoadOptions } from '../../types/webpdf.types';
import { AnnotationService } from '../services/AnnotationService';
import { SelectionManager } from '../manager/SelectionManager';
import SearchBar from './PDFSearchBar';
import SearchHighlighter from '../manager/SearchHighlighter';
import { Toolbar } from './PDFToolbar';
import { DownloadManager } from '../manager/PDFDownloadManager';

/**
 * Manages the PDF viewer instance and provides various functionalities, including:
 * - Page navigation
 * - Zooming
 * - Searching
 * - Toolbar interactions
 */
class WebViewer {
  private _pageVirtualization!: PageVirtualization;
  private _viewerOptions!: ViewerLoadOptions;
  private _pdfInstance!: PDFDocumentProxy;
  private _pdfState!: PdfState;
  private _cachedSideBarElement: HTMLElement | undefined;
  private _zoomHandler: ZoomHandler;
  private _annotationService: AnnotationService;
  private _toolbar: Toolbar | undefined;
  private _bindScrollHandler = this._onScroll.bind(this);
  private _downloadManager;

  public ready!: Promise<void>;
  private _intersectionObserver?: IntersectionObserver;

  /**
   * Initializes the WebViewer instance.
   *
   * @param {PDFDocumentProxy} pdfInstance - The PDF.js document instance.
   * @param {import('../../types/webpdf.types').ViewerLoadOptions} viewerOptions - Configuration for the viewer.
   * @param {HTMLElement} parentContainer - The parent container where the viewer is rendered.
   * @param {HTMLElement} pageParentContainer - The container holding the PDF pages.
   */
  constructor(pdfInstance: PDFDocumentProxy, viewerOptions: ViewerLoadOptions, parentContainer: HTMLElement, pageParentContainer: HTMLElement) {
    this._pdfInstance = pdfInstance;
    this._viewerOptions = viewerOptions;

    this._pdfState = PdfState.getInstance(viewerOptions.containerId);

    const selectionManager = new SelectionManager();
    const searchHighlighter = new SearchHighlighter(this._pdfState, this);
    new SearchBar(
      this._pdfState,
      async (searchTerm, options) => {
        await searchHighlighter.search(searchTerm, options, this._pdfState);
      },
      searchHighlighter.prevMatch.bind(searchHighlighter),
      searchHighlighter.nextMatch.bind(searchHighlighter),
      searchHighlighter.getMatchStatus.bind(searchHighlighter),
    );
    this._pageVirtualization = new PageVirtualization(
      this._viewerOptions,
      parentContainer,
      pageParentContainer,
      this._pdfInstance.numPages,
      this,
      selectionManager,
      searchHighlighter,
    );

    if (!viewerOptions.disableToolbar) {
      const toolbarHost = document.querySelector(`#${this._viewerOptions.containerId} #toolbar-container`)! as HTMLElement;
      const pdfState = PdfState.getInstance(viewerOptions.containerId);
      const buttons = viewerOptions.customToolbarItems ?? [];
      const opts = viewerOptions.toolbarOptions ?? {};
      this._toolbar = viewerOptions.customToolbar ? viewerOptions.customToolbar : (new Toolbar(this, pdfState, buttons, opts) as any);
      this._toolbar!.render(toolbarHost);
    }

    this._addEvents();
    this._zoomHandler = new ZoomHandler(this._pdfState, this._pageVirtualization);
    this._annotationService = new AnnotationService(this._pdfState, this);
    this.ready.then(() => {
      this.observer((pageNum) => {
        this._pdfState.currentPage = pageNum;
        this._updateCurrentPageInput();
      });
    });
    this._downloadManager = new DownloadManager(this._annotationService, this._pdfState);
  }

  private observer(callback: (pageNumber: number) => void) {
    let lastNotified: number | null = null;
    if (!this._intersectionObserver) {
      this._intersectionObserver = new IntersectionObserver(
        (entries) => {
          // pick only the entries currently intersecting
          const visible = entries.filter((e) => e.isIntersecting);
          if (!visible.length) {
            return;
          }
          // find the one with the largest overlap
          const best = visible.reduce((a, b) => (a.intersectionRatio > b.intersectionRatio ? a : b));
          const pageNum = parseInt(best.target.id.split('-')[1], 10);

          if (pageNum !== lastNotified) {
            lastNotified = pageNum;
            callback(pageNum);
          }
        },
        {
          root: document.querySelector(`#${this._viewerOptions.containerId} #${PDF_VIEWER_IDS['MAIN_VIEWER_CONTAINER']}`),
          threshold: 0,
          rootMargin: '-50% 0px -50% 0px',
        },
      );
      this._pageVirtualization.pageObserver = this._intersectionObserver;
    }
  }

  /**
   * Adds event listeners for scrolling and updates page number input dynamically.
   */
  private _addEvents() {
    const mainViewer = document.querySelector(`#${this._viewerOptions.containerId} #${PDF_VIEWER_IDS['MAIN_VIEWER_CONTAINER']}`);
    if (mainViewer) {
      mainViewer.addEventListener('scroll', this._bindScrollHandler);
    }
  }

  private _onScroll(event: Event) {
    debounce(() => this._syncThumbnailScrollWithMainPageContainer(), 600)();
  }

  /**
   * Synchronizes the thumbnail sidebar scroll position with the currently viewed page.
   */
  private _syncThumbnailScrollWithMainPageContainer() {
    const pageNumber = this.currentPageNumber;
    const previousActiveThumbnail = document.querySelector(`#${this._viewerOptions.containerId} .thumbnail.thumbnail-active`);
    if (previousActiveThumbnail) {
      previousActiveThumbnail.classList.remove(`thumbnail-active`);
    }
    const thumbnailToBeActive = document.querySelector(`#${this._viewerOptions.containerId} [data-page-number="${pageNumber}"]`);
    if (thumbnailToBeActive) {
      thumbnailToBeActive.classList.add('thumbnail-active');
      thumbnailToBeActive.scrollIntoView({ block: 'center', behavior: 'smooth' });
    }
  }

  /**
   * @returnss visible page numbers in the PDF viewer.
   */
  get visiblePageNumbers() {
    return this._pageVirtualization.visiblePages;
  }

  /** @returns {number} The currently active page number. */
  get currentPageNumber(): number {
    return this._pdfState.currentPage;
  }

  /** @returns {number} The total number of pages in the PDF document. */
  get totalPages(): number {
    return this._pdfState.pdfInstance?.numPages;
  }

  get annotation() {
    return this._annotationService;
  }

  /**
   * Toggles the visibility of the thumbnail viewer sidebar.
   */
  public toogleThumbnailViewer() {
    const thumbnailSidebarElement = this._cachedSideBarElement ?? document.querySelector(`#${this._viewerOptions.containerId} .${PDF_VIEWER_CLASSNAMES['A_SIDEBAR_CONTAINER']}`);

    if (!thumbnailSidebarElement) {
      console.error(`Invalid sidebar container element ${thumbnailSidebarElement}.`);
      return;
    }

    if (!this._cachedSideBarElement) {
      this._cachedSideBarElement = thumbnailSidebarElement as HTMLElement;
    }

    if (this._cachedSideBarElement.classList.contains('active')) {
      this._cachedSideBarElement.classList.remove('active');
    } else {
      this._cachedSideBarElement.classList.add('active');
      this._syncThumbnailScrollWithMainPageContainer();
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
      this._pdfState.currentPage = this.currentPageNumber + 1;
      this.goToPage(this.currentPageNumber);
    }
  }

  /**
   * Navigates to the previous page in the PDF viewer.
   * If already on the first page, does nothing.
   */
  public previousPage(): void {
    if (this.currentPageNumber > 1) {
      this._pdfState.currentPage = this.currentPageNumber - 1;
      this.goToPage(this.currentPageNumber);
    }
  }

  /**
   * Navigates to the first page of the PDF.
   */
  public firstPage(): void {
    if (this.currentPageNumber > 1) {
      this._pdfState.currentPage = 1;
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
      this._pdfState.currentPage = this.totalPages!;
      this.goToPage(this.currentPageNumber);
    }
  }

  public downloadPdf(): void {
    this._downloadManager.download();
  }

  /**
   * Toggles the visibility of the search box in the viewer.
   */
  public search(): void {
    const searchContainer = document.querySelector(`#${this._viewerOptions.containerId} .a-search-container`);
    if (searchContainer) {
      searchContainer.classList.toggle('a-search-hidden');
    }
  }

  /**
   * Zooms into the PDF by increasing the scale.
   * The scale increases by 0.5 per zoom-in action, with a maximum limit of 4.0.
   */
  public async zoomIn(): Promise<void> {
    await this._zoomHandler.zoomIn();
  }

  /**
   * Zooms out of the PDF by decreasing the scale.
   * The scale decreases by 0.5 per zoom-out action, with a minimum limit of 0.5.
   */
  public async zoomOut(): Promise<void> {
    await this._zoomHandler.zoomOut();
  }

  // public async fitWidth() {
  //   await this._zoomHandler.fitWidth();
  // }

  // public async fitPage() {
  //   await this._zoomHandler.fitPage();
  // }

  /**
   * Navigates to a specific page in the PDF viewer.
   *
   * @param {number} pageNumber - The target page number.
   */
  public goToPage(pageNumber: number) {
    if (pageNumber >= 1 && pageNumber <= this.totalPages!) {
      const pagePosition = this._pageVirtualization.cachedPagePosition.get(pageNumber);
      if (pagePosition != undefined) {
        const scrollElement = document.querySelector(`#${this._viewerOptions.containerId} #${PDF_VIEWER_IDS['MAIN_VIEWER_CONTAINER']}`);
        if (scrollElement) {
          scrollElement.scrollTop = pagePosition;
          this._pdfState.currentPage = pageNumber;
          this._updateCurrentPageInput();
        }
      }
    } else {
      console.error(`Invalid page number: ${pageNumber}`);
    }
  }

  /**
   * Updates the current page number input field in the toolbar.
   */
  private _updateCurrentPageInput() {
    const currentPageInputField = document.querySelector(`#${this._viewerOptions.containerId} #${PDF_VIEWER_IDS.CURRENT_PAGE_INPUT}`);
    if (currentPageInputField) {
      (currentPageInputField as HTMLInputElement).value = String(this.currentPageNumber);
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
        this._pdfState.currentPage = parseInt((event.target as HTMLInputElement).value);
        if ((event as KeyboardEvent).key === 'Enter') {
          (event.target as HTMLInputElement).blur();
          this.goToPage(this.currentPageNumber);
          this._syncThumbnailScrollWithMainPageContainer();
        }
        break;
    }
  }

  public destroy(): void {
    const main = document.querySelector(`#${this._viewerOptions.containerId} #${PDF_VIEWER_IDS.MAIN_VIEWER_CONTAINER}`);
    main?.removeEventListener('scroll', this._bindScrollHandler);

    this._intersectionObserver?.disconnect();
    this._annotationService.destroy();
    this._toolbar?.destroy && this._toolbar.destroy();
    this._pageVirtualization.destroy();
    this._zoomHandler.destroy();

    const pagesWrapper = document.querySelector(`#${this._viewerOptions.containerId} .${PDF_VIEWER_CLASSNAMES.A_PAGE_VIEW}`)?.parentElement;
    if (pagesWrapper) pagesWrapper.innerHTML = '';
    this._pdfState.destroy();
  }
}

export default WebViewer;
