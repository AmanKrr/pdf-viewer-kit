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
import { IToolbar } from '../../interface/IToolbar';

/**
 * Manages the PDF viewer instance and provides various functionalities, including:
 * - Page navigation
 * - Zooming
 * - Searching
 * - Toolbar interactions
 */
class WebViewer {
  // Private properties
  private _pdfInstance: PDFDocumentProxy;
  private _viewerOptions: ViewerLoadOptions;
  private _pdfState: PdfState;
  private _pageVirtualization: PageVirtualization;
  private _toolbar?: IToolbar;
  private _annotationService: AnnotationService;
  private _downloadManager: DownloadManager;
  private _zoomHandler: ZoomHandler;
  private _boundScrollHandler: (event: Event) => void;
  private _intersectionObserver?: IntersectionObserver;
  private _globalClickHandler?: (event: Event) => void;

  public ready!: Promise<void>;

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
      parentContainer.querySelector(`#${PDF_VIEWER_IDS['MAIN_VIEWER_CONTAINER']}`)!,
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

    this._boundScrollHandler = this._onScroll.bind(this);
    this._addEvents();
    this._zoomHandler = new ZoomHandler(this._pdfState, this._pageVirtualization);
    this._annotationService = new AnnotationService(this._pdfState, this);

    // Subscribe to drawing events to manage interactive effects through SelectionManager
    this._pdfState.on('DRAWING_STARTED', () => {
      selectionManager.setDrawingState(true);
    });

    this._pdfState.on('DRAWING_FINISHED', () => {
      // Small delay to ensure selection is fully registered
      setTimeout(() => {
        selectionManager.setDrawingState(false);
      }, 50);
    });

    // Add global click handler for deselection
    this._addGlobalClickHandler(selectionManager);

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
      this._pageVirtualization._forceObservePage();
    }
  }

  /**
   * Adds event listeners for scrolling and updates page number input dynamically.
   */
  private _addEvents() {
    const mainViewer = document.querySelector(`#${this._viewerOptions.containerId} #${PDF_VIEWER_IDS['MAIN_VIEWER_CONTAINER']}`);
    if (mainViewer && this._viewerOptions.toolbarOptions?.showThumbnail) {
      mainViewer.addEventListener('scroll', this._boundScrollHandler);
    }
  }

  /**
   * Adds global click handler to detect clicks outside of annotations for deselection.
   */
  private _addGlobalClickHandler(selectionManager: SelectionManager) {
    const container = document.querySelector(`#${this._viewerOptions.containerId}`);
    if (!container) return;

    const handleGlobalClick = (event: Event) => {
      // Check if the click target is part of an annotation
      const target = event.target as HTMLElement;
      const isAnnotationClick =
        target.closest('[annotation-id]') ||
        target.closest('.a-annotation-layer') ||
        target.closest('.a-annotation-toolbar-container') ||
        target.closest('svg') ||
        target.tagName === 'svg' ||
        target.hasAttribute('annotation-id') ||
        // Check if target is a resizer handle or overlay
        target.hasAttribute('data-resizer-handle') ||
        target.closest('[data-resizer-overlay]');

      // If click is not on an annotation and we have a selection, deselect
      // But only if we're not in the middle of drawing
      if (!isAnnotationClick && selectionManager.getSelected() && !selectionManager.isDrawingActive()) {
        selectionManager.setSelected(null);
      }
    };

    // Use bubble phase instead of capture to run after other handlers
    // This prevents the race condition where deselection happens before selection is set
    container.addEventListener('click', handleGlobalClick, false);

    // Store the handler for cleanup
    this._globalClickHandler = handleGlobalClick;
  }

  private _onScroll = debounce((event: Event) => {
    this._syncThumbnailScrollWithMainPageContainer();
  }, 120);

  /**
   * Synchronizes the thumbnail sidebar scroll position with the currently viewed page.
   */
  private _syncThumbnailScrollWithMainPageContainer() {
    const pageNumber = this.currentPageNumber;
    const previousActiveThumbnail = document.querySelector(`#${this._viewerOptions.containerId} .thumbnail.thumbnail-active`);
    if (previousActiveThumbnail) {
      previousActiveThumbnail.classList.remove(`thumbnail-active`);
    }
    const thumbnailToBeActive = document.querySelector(`#${this._viewerOptions.containerId} .thumbnail[data-page-number="${pageNumber}"]`);
    if (thumbnailToBeActive) {
      thumbnailToBeActive.classList.add('thumbnail-active');
      thumbnailToBeActive.scrollIntoView({ block: 'center', behavior: 'smooth' });
    }
  }

  /**
   * @returns {AnnotationService} The annotation service instance.
   * This service is responsible for managing annotations in the PDF viewer.
   */
  get annotation() {
    return this._annotationService;
  }

  /**
   * @returnss visible page numbers in the PDF viewer.
   */
  get visiblePageNumbers() {
    return this._pageVirtualization.currentlyVisiblePages;
  }

  /** @returns {number} The currently active page number. */
  get currentPageNumber(): number {
    return this._pdfState.currentPage;
  }

  /** @returns {number} The total number of pages in the PDF document. */
  get totalPages(): number {
    return this._pdfState.pdfInstance?.numPages;
  }

  /** @returns {number} The current zoom scale of the PDF viewer. */
  get currentScale(): number {
    return this._pdfState.scale;
  }

  /** @returns {PDFDocumentProxy} The PDF.js document instance. */
  get pdfInstance(): PDFDocumentProxy {
    return this._pdfInstance;
  }

  /**
   * Toggles the thumbnail viewer sidebar.
   */
  public toogleThumbnailViewer() {
    const thumbnailSidebarElement = document.querySelector(`#${this._viewerOptions.containerId} .${PDF_VIEWER_CLASSNAMES['A_SIDEBAR_CONTAINER']}`);

    if (!thumbnailSidebarElement) {
      console.error(`Invalid sidebar container element ${thumbnailSidebarElement}.`);
      return;
    }

    if (thumbnailSidebarElement.classList.contains('active')) {
      thumbnailSidebarElement.classList.remove('active');
    } else {
      thumbnailSidebarElement.classList.add('active');
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

  /**
   * Downloads the PDF with embedded annotations.
   * Shows progress indication during the download process.
   *
   * @param filename Optional filename for the download
   */
  public async downloadPdf(filename?: string): Promise<void> {
    // Create a simple progress indicator
    const progressElement = this._createProgressIndicator();

    try {
      await this._downloadManager.download(filename, (progress) => {
        this._updateProgressIndicator(progressElement, progress);
      });
    } catch (error) {
      console.error('Download failed:', error);
      this._showDownloadError(progressElement, error as Error);
    } finally {
      // Clean up progress indicator after a short delay
      setTimeout(() => {
        progressElement?.remove();
      }, 2000);
    }
  }

  /**
   * Creates a progress indicator for download operations.
   */
  private _createProgressIndicator(): HTMLElement {
    const existing = document.getElementById('pdf-download-progress');
    if (existing) {
      existing.remove();
    }

    const progressContainer = document.createElement('div');
    progressContainer.id = 'pdf-download-progress';
    progressContainer.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: rgba(0, 0, 0, 0.8);
      color: white;
      padding: 12px 20px;
      border-radius: 6px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-size: 14px;
      z-index: 10000;
      min-width: 200px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    `;

    const statusText = document.createElement('div');
    statusText.id = 'download-status';
    statusText.textContent = 'Preparing download...';
    statusText.style.marginBottom = '8px';

    const progressBar = document.createElement('div');
    progressBar.style.cssText = `
      width: 100%;
      height: 4px;
      background: rgba(255, 255, 255, 0.3);
      border-radius: 2px;
      overflow: hidden;
    `;

    const progressFill = document.createElement('div');
    progressFill.id = 'progress-fill';
    progressFill.style.cssText = `
      width: 0%;
      height: 100%;
      background: #4CAF50;
      transition: width 0.3s ease;
    `;

    progressBar.appendChild(progressFill);
    progressContainer.appendChild(statusText);
    progressContainer.appendChild(progressBar);
    document.body.appendChild(progressContainer);

    return progressContainer;
  }

  /**
   * Updates the progress indicator with current progress.
   */
  private _updateProgressIndicator(progressElement: HTMLElement, progress: number): void {
    const statusText = progressElement.querySelector('#download-status');
    const progressFill = progressElement.querySelector('#progress-fill') as HTMLElement;

    if (statusText && progressFill) {
      const percentage = Math.round(progress * 100);
      progressFill.style.width = `${percentage}%`;

      if (progress < 0.1) {
        statusText.textContent = 'Preparing download...';
      } else if (progress < 0.4) {
        statusText.textContent = 'Loading PDF data...';
      } else if (progress < 0.6) {
        statusText.textContent = 'Processing annotations...';
      } else if (progress < 0.9) {
        statusText.textContent = 'Building PDF...';
      } else if (progress < 1.0) {
        statusText.textContent = 'Finalizing download...';
      } else {
        statusText.textContent = 'Download complete!';
        progressFill.style.background = '#4CAF50';
      }
    }
  }

  /**
   * Shows an error message in the progress indicator.
   */
  private _showDownloadError(progressElement: HTMLElement, error: Error): void {
    const statusText = progressElement.querySelector('#download-status');
    const progressFill = progressElement.querySelector('#progress-fill') as HTMLElement;

    if (statusText && progressFill) {
      statusText.textContent = `Download failed: ${error.message}`;
      progressFill.style.background = '#f44336';
      progressFill.style.width = '100%';
    }
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
      const pagePosition = this._pageVirtualization.pagePositions.get(pageNumber);
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
    // Remove event listeners
    if (this._globalClickHandler) {
      const container = document.querySelector(`#${this._viewerOptions.containerId}`);
      if (container) {
        container.removeEventListener('click', this._globalClickHandler);
      }
    }

    // Remove scroll handler
    if (this._boundScrollHandler) {
      const mainViewer = document.querySelector(`#${this._viewerOptions.containerId} #${PDF_VIEWER_IDS['MAIN_VIEWER_CONTAINER']}`);
      if (mainViewer) {
        mainViewer.removeEventListener('scroll', this._boundScrollHandler);
      }
    }

    // Clean up intersection observer
    if (this._intersectionObserver) {
      this._intersectionObserver.disconnect();
    }

    // Destroy components
    if (this._toolbar) {
      this._toolbar.destroy();
    }

    if (this._pageVirtualization) {
      this._pageVirtualization.destroy();
    }

    if (this._annotationService) {
      this._annotationService.destroy();
    }

    if (this._zoomHandler) {
      this._zoomHandler.destroy();
    }
  }
}

export default WebViewer;
