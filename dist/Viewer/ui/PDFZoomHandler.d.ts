import PdfState from './PDFState';
import PageVirtualization from './PDFPageVirtualization';
interface ZoomOptions {
    minScale: number;
    maxScale: number;
    zoomStep: number;
}
/**
 * Handles zooming operations (in, out, fit width, fit page) for the PDF viewer.
 * Updates PdfState, applies CSS transforms, preserves scroll position,
 * and coordinates with PageVirtualization for rendering.
 */
export default class ZoomHandler {
    private _pdfState;
    private _pageVirtualization;
    private _options;
    /**
     * @param pdfState           Shared PdfState instance for scale and page info.
     * @param pageVirtualization Manages page measurements and rendering buffers.
     * @param options            Optional zoom limits and step size.
     */
    constructor(pdfState: PdfState, pageVirtualization: PageVirtualization, options?: ZoomOptions);
    /**
     * Increase zoom by one step, up to the maximum scale.
     */
    zoomIn(): Promise<void>;
    /**
     * Decrease zoom by one step, down to the minimum scale.
     */
    zoomOut(): Promise<void>;
    /**
     * Apply a specific zoom level:
     * 1. Calculate scroll offset relative to current page
     * 2. Update PdfState.scale and CSS variables
     * 3. Recompute page layout and buffers
     * 4. Restore scroll to keep the same point in view
     * 5. Emit scaleChange and redraw visible pages
     *
     * @param newScale Desired scale factor
     */
    applyZoom(newScale: number): Promise<void>;
    /**
     * Compute scrollTop minus the top coordinate of the target page,
     * giving the offset within that page.
     *
     * @param targetPage Page index to calculate relative scroll for
     */
    private _getScrollOffsetRelativeToPage;
    /**
     * After zoom, reposition scrollTop so that the same logical point
     * on the page remains visible.
     *
     * @param targetPage            Page index being held constant
     * @param relativeScrollOffset  Offset within page before zoom
     * @param previousScale         Scale before zoom
     * @param newScale              Scale after zoom
     */
    private _adjustScrollPosition;
    /**
     * Apply CSS scaling by setting a custom property on the main page container.
     *
     * @param scaleFactor The new zoom factor
     */
    private _applyCssScale;
    /**
     * Pan the view by adjusting scrollLeft/scrollTop.
     *
     * @param deltaX Horizontal pan in pixels
     * @param deltaY Vertical pan in pixels
     */
    pan(deltaX: number, deltaY: number): void;
    /**
     * Zoom to fit the width of the widest page into the container.
     * Calculates original page widths and sets scale accordingly.
     */
    fitWidth(): Promise<void>;
    /**
     * Reset zoom to 1:1 (original size).
     */
    fitPage(): Promise<void>;
}
export {};
//# sourceMappingURL=PDFZoomHandler.d.ts.map