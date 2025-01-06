import { PDFDocumentProxy } from 'pdfjs-dist';
import WebUiUtils from '../../utils/WebUiUtils';
import { aPdfViewerIds } from '../../constant/ElementIdClass';
import throttle from 'lodash/throttle';
import PdfState from './PdfState';
import Toolbar from './Toolbar';
import PageVirtualization from './PageVirtualization';
import EventEmitter from '../event/EventUtils';

/**
 * A class for managing and interacting with a PDF viewer in the browser.
 */
class WebViewer {
  private __Observer;
  private totalPages: number;
  private pageVirtualization!: PageVirtualization;

  /**
   * Initializes the WebViewer instance.
   * @param pdfInstance - The PDF document instance.
   * @param uiLoading - The loading spinner element.
   * @param pageVirtualization - The instance for page virtualization.
   */
  constructor(pdfInstance: PDFDocumentProxy, uiLoading: HTMLElement, pageVirtualization: PageVirtualization) {
    PdfState.getInstance().setPdfInstance(pdfInstance);
    PdfState.getInstance().setUiLoading(uiLoading);
    this.pageVirtualization = pageVirtualization;

    this.totalPages = pdfInstance.numPages;
    this.__Observer = throttle(WebUiUtils.Observer, 200);

    new Toolbar('', [], this);
    this.addEvents();
  }

  /**
   * Retrieves the current page number being viewed.
   *
   * This getter fetches the current page number from the PdfState singleton,
   * which holds the shared state of the PDF viewer.
   *
   * @returns The current page number.
   */
  get currentPageNumber() {
    return PdfState.getInstance()._currentPage;
  }

  /**
   * Adds event listeners to the viewer for user interactions.
   */
  private addEvents() {
    const mainViewer = document.getElementById(aPdfViewerIds['_MAIN_VIEWER_CONTAINER']);
    if (mainViewer) {
      mainViewer.addEventListener('scroll', () => {
        // Update the current page number on scroll.
        const updateCurrentPage = (pageNumber: number) => {
          PdfState.getInstance().setPageNumber(pageNumber);
          this.updateCurrentPageInput();
        };
        this.__Observer(updateCurrentPage);
      });
    }
  }

  /**
   * Navigates to the next page.
   */
  public nextPage() {
    if (this.currentPageNumber < this.totalPages) {
      PdfState.getInstance().setPageNumber(this.currentPageNumber + 1);
      this.goToPage(this.currentPageNumber);
    }
  }

  /**
   * Navigates to the previous page.
   */
  public previousPage(): void {
    if (this.currentPageNumber > 1) {
      PdfState.getInstance().setPageNumber(this.currentPageNumber - 1);
      this.goToPage(this.currentPageNumber);
    }
  }

  /**
   * Navigates to the first page.
   */
  public firstPage(): void {
    if (this.currentPageNumber > 1) {
      PdfState.getInstance().setPageNumber(1);
      this.goToPage(this.currentPageNumber);
    }
  }

  /**
   * Navigates to the last page.
   */
  public lastPage(): void {
    if (this.currentPageNumber < this.totalPages) {
      PdfState.getInstance().setPageNumber(this.totalPages);
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
    const pdfState = PdfState.getInstance();
    const currentScale = pdfState._scale;
    const currentPage = this.currentPageNumber;

    if (currentScale < 4.0) {
      const newScale = currentScale + 0.5;
      const scrollOffset = this.getScrollOffsetRelativeToPage(currentPage);

      pdfState.setScale(newScale);
      this.applyCssScale(newScale);

      requestAnimationFrame(async () => {
        await this.pageVirtualization.calculatePagePositioning();
        this.adjustScrollPosition(currentPage, scrollOffset, currentScale, newScale);
        await this.pageVirtualization.redrawVisiblePages(currentPage);
      });
    }
  }

  /**
   * Zooms out of the PDF by decrementing the scale.
   */
  async zoomOut() {
    const pdfState = PdfState.getInstance();
    const currentScale = pdfState._scale;
    const currentPage = this.currentPageNumber;

    if (currentScale > 0.5) {
      const newScale = currentScale - 0.5;
      const scrollOffset = this.getScrollOffsetRelativeToPage(currentPage);

      pdfState.setScale(newScale);
      this.applyCssScale(newScale);

      requestAnimationFrame(async () => {
        await this.pageVirtualization.calculatePagePositioning();
        this.adjustScrollPosition(currentPage, scrollOffset, currentScale, newScale);
        await this.pageVirtualization.redrawVisiblePages(currentPage);
      });
    }
  }

  /**
   * Gets the scroll offset relative to the top of a page.
   * @param targetPage - The target page number.
   * @returns The scroll offset from the top of the page.
   */
  private getScrollOffsetRelativeToPage(targetPage: number): number {
    const pageTop = this.pageVirtualization.cachedPagePosition.get(targetPage) || 0;
    const scrollTop = document.getElementById(`${aPdfViewerIds['_MAIN_VIEWER_CONTAINER']}`)!.scrollTop;

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
    const pageTop = this.pageVirtualization.cachedPagePosition.get(targetPage) || 0;
    const scaledOffset = relativeScrollOffset * (newScale / previousScale);
    const newScrollTop = pageTop + scaledOffset;

    document.getElementById(`${aPdfViewerIds['_MAIN_VIEWER_CONTAINER']}`)!.scrollTop = newScrollTop;
  }

  /**
   * Updates the current page number input field.
   */
  private updateCurrentPageInput() {
    const currentPageInputField = document.getElementById(aPdfViewerIds._CURRENT_PAGE_INPUT);
    if (currentPageInputField) {
      (currentPageInputField as HTMLInputElement).value = String(this.currentPageNumber);
    }
  }

  /**
   * Navigates to a specific page by number.
   * @param pageNumber - The target page number.
   */
  private goToPage(pageNumber: number) {
    // pageContainer-1
    if (pageNumber >= 1 && pageNumber <= this.totalPages) {
      const pagePosition = this.pageVirtualization.cachedPagePosition;
      const position = pagePosition?.get(pageNumber);
      if (position != undefined && position >= 0) {
        const scrollElement = document.querySelector(`#${aPdfViewerIds['_MAIN_VIEWER_CONTAINER']}`);
        if (scrollElement) {
          scrollElement.scrollTop = position;
        }
      }
    } else {
      console.error('Invalid page number.');
    }
  }

  // scrollPageIntoView({ pageNumber, destArray = null, allowNegativeOffset = false, ignoreDestinationZoom = false }) {
  //   // this.goToPage(pageNumber);
  // }

  /**
   * Applies CSS scaling to the viewer.
   * @param scaleFactor - The scale factor to apply.
   */
  private applyCssScale(scaleFactor: number): void {
    const pageViewerContainer = document.getElementById(aPdfViewerIds._MAIN_PAGE_VIEWER_CONTAINER);
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
        PdfState.getInstance().setPageNumber(parseInt((event.target as HTMLInputElement).value));
        if (event && (event as KeyboardEvent).key === 'Enter') {
          (event.target as HTMLInputElement).blur();
          this.goToPage(this.currentPageNumber);
        }
        break;
      case 'rotate':
        break;
    }
  }
}

export default WebViewer;
