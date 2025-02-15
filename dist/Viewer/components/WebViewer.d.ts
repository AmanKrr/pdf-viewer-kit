import { PDFDocumentProxy } from 'pdfjs-dist';
import { ViewerLoadOptions } from '../../types/webpdf.types';
import { AnnotationService } from '../service/AnnotationService';
/**
 * Manages the PDF viewer instance and provides various functionalities, including:
 * - Page navigation
 * - Zooming
 * - Searching
 * - Toolbar interactions
 */
declare class WebViewer {
    private __Observer;
    private __pageVirtualization;
    private __viewerOptions;
    private __pdfInstance;
    private __pdfState;
    private __cachedSideBarElement;
    private __zoomHandler;
    private __annotationService;
    /**
     * Initializes the WebViewer instance.
     *
     * @param {PDFDocumentProxy} pdfInstance - The PDF.js document instance.
     * @param {ViewerLoadOptions} viewerOptions - Configuration for the viewer.
     * @param {HTMLElement} parentContainer - The parent container where the viewer is rendered.
     * @param {HTMLElement} pageParentContainer - The container holding the PDF pages.
     */
    constructor(pdfInstance: PDFDocumentProxy, viewerOptions: ViewerLoadOptions, parentContainer: HTMLElement, pageParentContainer: HTMLElement);
    /**
     * Adds event listeners for scrolling and updates page number input dynamically.
     */
    private addEvents;
    /**
     * Synchronizes the thumbnail sidebar scroll position with the currently viewed page.
     */
    private syncThumbnailScrollWithMainPageContainer;
    /** @returns {number} The currently active page number. */
    get currentPageNumber(): number;
    /** @returns {number} The total number of pages in the PDF document. */
    get totalPages(): number;
    get annotation(): AnnotationService;
    /**
     * Toggles the visibility of the thumbnail viewer sidebar.
     */
    toogleThumbnailViewer(): void;
    /**
     * Navigates to the next page in the PDF viewer.
     * If already on the last page, does nothing.
     */
    nextPage(): void;
    /**
     * Navigates to the previous page in the PDF viewer.
     * If already on the first page, does nothing.
     */
    previousPage(): void;
    /**
     * Navigates to the first page of the PDF.
     */
    firstPage(): void;
    /**
     * Navigates to the last page of the PDF.
     */
    lastPage(): void;
    /**
     * Toggles the visibility of the search box in the viewer.
     */
    search(): void;
    /**
     * Zooms into the PDF by increasing the scale.
     * The scale increases by 0.5 per zoom-in action, with a maximum limit of 4.0.
     */
    zoomIn(): Promise<void>;
    /**
     * Zooms out of the PDF by decreasing the scale.
     * The scale decreases by 0.5 per zoom-out action, with a minimum limit of 0.5.
     */
    zoomOut(): Promise<void>;
    /**
     * Navigates to a specific page in the PDF viewer.
     *
     * @param {number} pageNumber - The target page number.
     */
    goToPage(pageNumber: number): void;
    /**
     * Updates the current page number input field in the toolbar.
     */
    private updateCurrentPageInput;
    /**
     * Handles toolbar button clicks and executes corresponding actions.
     *
     * @param {string} buttonName - The name of the toolbar button clicked.
     * @param {MouseEvent | Event} event - The event object associated with the action.
     */
    toolbarButtonClick(buttonName: string, event: MouseEvent | Event): Promise<void>;
}
export default WebViewer;
