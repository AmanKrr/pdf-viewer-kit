import { PDFDocumentProxy } from "pdfjs-dist";
declare class WebViewer {
    private currentPage;
    private totalPages;
    private __PDF_INSTANCE;
    private __Observer;
    constructor(pdfInstance: PDFDocumentProxy, uiLoading: HTMLElement);
    private addEvents;
    nextPage(): void;
    previousPage(): void;
    firstPage(): void;
    lastPage(): void;
    search(query: string): void;
    zoomIn(): Promise<void>;
    zoomOut(): Promise<void>;
    private updateCurrentPageInput;
    private updateScale;
    private goToPage;
    get currentPageNumber(): number;
    toolbarButtonClick(buttonName: string, event: MouseEvent | Event): Promise<void>;
}
export default WebViewer;
