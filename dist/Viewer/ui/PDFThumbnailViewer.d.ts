import { PDFThumbnailViewOptions } from '../../types/thumbnail.types';
/**
 * Manages the creation, rendering, and interaction of PDF thumbnails in the sidebar.
 */
declare class ThumbnailViewer {
    private _container;
    private _pdfDocument;
    private _pageNumber;
    private _linkService;
    private _canvas;
    /**
     * Constructs a `ThumbnailViewer` instance.
     *
     * @param {PDFThumbnailViewOptions} options - Configuration options for the thumbnail.
     */
    constructor(options: PDFThumbnailViewOptions);
    /**
     * Creates the thumbnail sidebar container and attaches it to the PDF viewer.
     *
     * @param {string} parentContainerId - The ID of the parent PDF viewer container.
     * @returns {HTMLElement | undefined} The created inner thumbnail container.
     */
    static createThumbnailContainer(parentContainerId: string): HTMLElement | undefined;
    /**
     * Retrieves the total number of pages in the PDF document.
     *
     * @returns {number} The total number of pages.
     */
    get totalPages(): number;
    /**
     * Initializes and renders the thumbnail for the current page.
     */
    initThumbnail(): Promise<void>;
    /**
     * Sets the active thumbnail and navigates to the corresponding page in the PDF viewer.
     *
     * @param {number} pageNumber - The page number to be set as active.
     */
    set activeThumbnail(pageNumber: number);
    /**
     * Renders the thumbnail image for the corresponding PDF page.
     *
     * @param {HTMLElement} thumbnailDiv - The container for the thumbnail.
     */
    private _renderThumbnail;
    /**
     * Navigates to the corresponding page when a thumbnail is clicked.
     *
     * @param {HTMLElement} thumbnailDiv - The clicked thumbnail element.
     * @param {number} [pageNumber=-1] - The page number to navigate to.
     */
    private _thumbnailDestination;
    /**
     * Cleans up resources and removes the canvas to free memory.
     */
    destroy(): void;
}
export default ThumbnailViewer;
//# sourceMappingURL=PDFThumbnailViewer.d.ts.map