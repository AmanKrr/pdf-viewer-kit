import WebViewer from './WebViewer';
import { ViewerLoadOptions } from '../../types/webpdf.types';
import { SelectionManager } from '../manager/SelectionManager';
import SearchHighlighter from '../manager/SearchHighlighter';
/**
 * Handles virtualization of PDF pages, rendering only those visible within the viewport.
 */
declare class PageVirtualization {
    private options;
    private parentContainer;
    private container;
    private pageBuffer;
    private totalPages;
    private pdf;
    private renderedPages;
    private lastScrollTop;
    private pagePosition;
    private pdfState;
    private pdfViewer;
    private selectionManager;
    private searchHighlighter;
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
    constructor(options: ViewerLoadOptions, parentContainer: HTMLElement, container: HTMLElement, totalPages: number, pdfViewer: WebViewer, selectionManager: SelectionManager, searchHighlighter: typeof SearchHighlighter, pageBuffer?: number);
    /**
     * Checks if a specific page has been designated for rendering.
     *
     * @returns {number | undefined} The page number to be rendered if specified, otherwise `undefined` or `null`.
     */
    get isThereSpecificPageToRender(): number | undefined | null;
    /**
     * Getter for cached page positions.
     *
     * @returns {Map<number, number>} A map storing page positions.
     */
    get cachedPagePosition(): Map<number, number>;
    /**
     * Attach a scroll listener to dynamically load/unload pages based on the viewport.
     */
    private attachScrollListener;
    private debouncedScrollHandler;
    /**
     * Calculate the number of pages required to fill the viewport.
     *
     * @returns {Promise<number>} Number of pages needed to render initially.
     */
    private calculatePagesToFillViewport;
    /**
     * Render pages visible in the initial viewport.
     */
    private renderInitialPages;
    /**
     * Generates thumbnails for the document.
     */
    generateThumbnail(): Promise<void>;
    /**
     * Precalculates page positions and sets the container dimensions.
     * This helps in efficiently determining which pages should be rendered based on scrolling.
     *
     * @returns {Promise<Map<number, number>>} A map storing page positions with their page numbers.
     */
    calculatePagePositioning(): Promise<Map<number, number>>;
    /**
     * Sets the height of the container based on the total page height.
     *
     * @param {number} height - The computed height to be set.
     */
    private setContainerHeight;
    /**
     * Sets the width of the container based on the widest page.
     *
     * @param {number} width - The computed width to be set.
     */
    private setContainerWidth;
    /**
     * Determines the page number corresponding to a given scrollTop position.
     * Uses a binary search on the cached page positions for efficiency.
     *
     * @param {number} scrollTop - The scroll position in pixels.
     * @returns {number} The page number that is currently in view.
     */
    private calculatePageFromScroll;
    /**
     * Updates the pages visible within the viewport dynamically based on scrolling.
     * Removes pages that are outside the buffer zone and loads new ones as needed.
     *
     * @param {boolean} isScrollingDown - Direction of scrolling.
     * @param {number} targetPage - The current page in view.
     */
    private updateVisiblePages;
    /**
     * Gets the page numbers that should be rendered within the buffer range.
     *
     * @param {number} targetPage - The current page in view.
     * @returns {number[]} An array of page numbers that should be visible in the viewport.
     */
    private getPagesInBuffer;
    /**
     * Renders a specific page onto the canvas within the viewport.
     *
     * @param {number} pageNumber - The page number to render.
     */
    private renderPage;
    /**
     * Removes pages from the DOM that are outside the buffer zone.
     *
     * @param {number[]} visiblePages - An array of currently visible pages.
     */
    private cleanupOutOfBufferPages;
    /**
     * Retrieves the viewport of a specific page for rendering purposes.
     *
     * @param {number} pageNumber - The page number.
     * @returns {Promise<PageViewport>} The viewport object of the specified page.
     */
    private getViewport;
    /**
     * Removes a specific page element from the DOM.
     *
     * @param {number} pageNumber - The number of the page to be removed.
     */
    private removePage;
    /**
     * Redraws all visible pages based on the updated buffer and scale.
     *
     * @param {number} targetPage - The page number used to determine the visible buffer range.
     * @returns {Promise<void>} A promise that resolves when all visible pages are rendered.
     */
    redrawVisiblePages(targetPage: number): Promise<void>;
    /**
     * Updates the style and dimensions of all page buffers in the container.
     * Iterates over every element with the class 'a-page-view' and adjusts its position,
     * width, and height based on the corresponding PDF page's viewport.
     *
     * @returns A promise that resolves once all page buffers have been updated.
     */
    updatePageBuffers(pageNumber?: number | null): Promise<void>;
    /**
     * Renders a high-resolution version of the specified PDF page as an image and appends it
     * to the page container. The rendered image is wrapped inside a container div which is then
     * appended to the element with the ID 'canva-presentation' within the corresponding page container.
     *
     * @param pageNumber - The number of the page to process.
     * @returns A promise that resolves once the high-resolution image container has been appended.
     */
    appendHighResImageToPageContainer(pageNumber: number): Promise<void>;
    /**
     * Renders a high-resolution image of a PDF page onto a canvas and returns the image as a data URL.
     * The rendered image is generated using the provided viewport and PDF page. The method returns a tuple
     * containing the data URL of the rendered image (in PNG format) along with the canvas element used for rendering.
     *
     * @param viewport - The PageViewport representing the dimensions and scale of the PDF page.
     * @param page - The PDFPageProxy object representing the PDF page to render.
     * @returns A promise that resolves with a tuple: [dataUrl: string, canvas: HTMLCanvasElement].
     */
    private renderHighResImage;
}
export default PageVirtualization;
