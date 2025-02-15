import PdfState from './PdfState';
import PageVirtualization from './PageVirtualization';
interface ZoomOptions {
    minScale: number;
    maxScale: number;
    zoomStep: number;
}
export default class ZoomHandler {
    private pdfState;
    private pageVirtualization;
    private options;
    constructor(pdfState: PdfState, pageVirtualization: PageVirtualization, options?: ZoomOptions);
    zoomIn(): Promise<void>;
    zoomOut(): Promise<void>;
    /**
     * Sets the zoom level, updates the pdfState, applies CSS changes,
     * and triggers a re-render of visible pages.
     */
    applyZoom(newScale: number): Promise<void>;
    /**
     * Returns the scroll offset relative to the top of the specified page.
     */
    private getScrollOffsetRelativeToPage;
    /**
     * Adjusts the scroll position after zoom so that the same point on the page remains in view.
     *
     * @param targetPage - The page number whose relative position is maintained.
     * @param relativeScrollOffset - The offset from the top of the page before zoom.
     * @param previousScale - The zoom scale before applying the new scale.
     * @param newScale - The new zoom scale.
     */
    private adjustScrollPosition;
    private applyCssScale;
    pan(deltaX: number, deltaY: number): void;
}
export {};
