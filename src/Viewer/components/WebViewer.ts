import { PDFDocumentProxy } from "pdfjs-dist";
import WebUiUtils from "../../utils/WebUiUtils";
import { aPdfViewerIds } from "../../constant/ElementIdClass";
import throttle from "lodash/throttle";
import PdfState from "./PdfState";
import Toolbar from "./Toolbar";
// import debounce from "lodash/debounce";

class WebViewer {
  private currentPage: number;
  private totalPages: number;
  private __PDF_INSTANCE: PDFDocumentProxy;
  private __Observer;

  constructor(pdfInstance: PDFDocumentProxy, uiLoading: HTMLElement) {
    // set pdfinstace
    PdfState.getInstance().setPdfInstance(pdfInstance);
    this.__PDF_INSTANCE = PdfState.getInstance()._pdfInstance;
    PdfState.getInstance().setUiLoading(uiLoading);

    this.currentPage = 1;
    this.totalPages = pdfInstance.numPages;
    this.__Observer = throttle(WebUiUtils.Observer, 400);

    new Toolbar("", [], this);
    this.addEvents();
  }

  private addEvents() {
    // window.addEventListener("scroll", WebUiUtils.Observer.bind(WebUiUtils));
    const mainViewer = document.getElementById("mainViewerContainer");
    if (mainViewer) {
      mainViewer.addEventListener("scroll", () => {
        // Define a callback function to update currentPage
        const updateCurrentPage = (pageNumber: number) => {
          this.currentPage = pageNumber;
          this.updateCurrentPageInput();
        };

        // Call Observer with the callback
        this.__Observer(updateCurrentPage);
      });
    }
  }

  // Method to navigate to the next page
  public nextPage() {
    // WebUiUtils.Observer();
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.goToPage(this.currentPage);
    }
  }

  // Method to navigate to the previous page
  public previousPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.goToPage(this.currentPage);
    }
  }

  // Method to navigate to the first page
  public firstPage(): void {
    if (this.currentPage > 1) {
      this.currentPage = 1;
      this.goToPage(this.currentPage);
    }
  }

  // Method to navigate to the last page
  public lastPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage = this.totalPages;
      this.goToPage(this.currentPage);
    }
  }

  // Method to perform search
  public search(query: string): void {
    // Implement search logic here
    console.log(`Performing search for: ${query}`);
  }

  // Method to zoom in
  async zoomIn() {
    // Adjust scale factor for zooming in
    if (PdfState.getInstance()._scale < 3.0) {
      // Adjust the maximum scale factor as needed
      const scale = PdfState.getInstance()._scale + 0.3;
      PdfState.getInstance().setScale(scale); // Increase scale factor by 0.1
      console.log(scale);
      await this.updateScale();
    }
  }

  // Method to zoom out
  async zoomOut() {
    // Adjust scale factor for zooming out
    if (PdfState.getInstance()._scale > 1.5) {
      // Adjust the minimum scale factor as needed
      const scale = PdfState.getInstance()._scale - 0.3;
      PdfState.getInstance().setScale(scale); // Decrease scale factor by 0.1
      await this.updateScale();
    }
  }

  private updateCurrentPageInput() {
    console.log("updated page number", this.currentPage);
    const currentPageInputField = document.getElementById(aPdfViewerIds._CURRENT_PAGE_INPUT);
    if (currentPageInputField) {
      (currentPageInputField as HTMLInputElement).value = String(this.currentPage);
    }
  }

  private async updateScale(): Promise<void> {
    const viewerContainer = document.getElementById("mainViewerContainer");
    const pageViewerContainer = document.getElementById(aPdfViewerIds._MAIN_PAGE_VIEWER_CONTAINER);
    const currentScale = PdfState.getInstance()._scale;
    console.log("Updated scale: ", currentScale);

    if (!viewerContainer || !pageViewerContainer) return;

    // Update CSS scale transformation for immediate feedback
    // pageViewerContainer.style.transform = `scale(${currentScale})`;
    // pageViewerContainer.style.transformOrigin = '0 0';

    const pdfInstance = this.__PDF_INSTANCE;
    const devicePixelRatio = window.devicePixelRatio || 1;

    // Lazy rendering: Only process visible pages
    const visiblePages = WebUiUtils.getVisiblePages(pdfInstance);
    const renderPromises: Promise<void>[] = [];

    for (const pageIndex of visiblePages) {
      renderPromises.push(WebUiUtils.renderPage(pdfInstance, pageIndex, currentScale, devicePixelRatio));
    }

    // if page availabe for zoom
    if (renderPromises.length > 0 && pageViewerContainer) {
      pageViewerContainer.style.setProperty("--scale-factor", String(currentScale));
    }

    // Wait for all visible pages to render
    await Promise.all(renderPromises);
  }

  private goToPage(pageNumber: number) {
    // pageContainer-1
    if (pageNumber >= 1 && pageNumber <= this.totalPages) {
      document.getElementById(`pageContainer-${pageNumber}`)?.scrollIntoView({ behavior: "auto", block: "start" });
    } else {
      console.error("Invalid page number.");
    }
  }

  get currentPageNumber() {
    return this.currentPage;
  }

  // scrollPageIntoView({ pageNumber, destArray = null, allowNegativeOffset = false, ignoreDestinationZoom = false }) {
  //   // this.goToPage(pageNumber);
  // }

  // Method to handle click events for default toolbar items
  async toolbarButtonClick(buttonName: string, event: MouseEvent | Event) {
    switch (buttonName) {
      case "firstPage":
        this.firstPage();
        break;
      case "lastPage":
        this.lastPage();
        break;
      case "previousPage":
        this.previousPage();
        break;
      case "nextPage":
        this.nextPage();
        break;
      case "zoomIn":
        await this.zoomIn();
        break;
      case "zoomOut":
        await this.zoomOut();
        break;
      case "currentPageNumber":
        this.currentPage = parseInt((event.target as HTMLInputElement).value);
        if (event && (event as KeyboardEvent).key === "Enter") {
          (event.target as HTMLInputElement).blur();
          this.goToPage(this.currentPage);
        }
        break;
      case "rotate":
        break;
    }
  }
}

export default WebViewer;
