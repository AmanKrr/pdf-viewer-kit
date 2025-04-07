export declare class Resizer {
    private svg;
    private element;
    private overlaySvg;
    private overlayRect;
    private resizers;
    private isResizing;
    private activeResizerIndex;
    private isDragging;
    private marginLeft;
    private marginTop;
    private marginRight;
    private marginBottom;
    private onShapeUpdateCallback;
    private constraints;
    constructor(svg: SVGSVGElement, element: SVGRectElement, onShapeUpdate: () => void, constraints: any);
    set constraintsValue(constraints: DOMRect);
    /**
     * Creates an overlay SVG element that sits on top of the annotation svg.
     * (It’s appended as a sibling so that its coordinates are in the document space.)
     */
    private createOverlay;
    /**
     * Creates eight circular handles for resizing.
     */
    private createResizerHandles;
    /**
     * Returns an appropriate CSS cursor for a given handle.
     */
    private cursorForHandle;
    /**
     * Syncs the overlay’s position and size to the annotation svg’s current absolute position and dimensions.
     */
    syncOverlayToSvg(): void;
    /**
     * Updates the overlay outline (rectangle) and repositions the handles.
     * Note that here the overlay’s internal coordinate system has (0,0) at its top‐left.
     */
    private updateOverlayDimensions;
    /**
     * Positions the eight handles at the corners and midpoints of the overlay.
     */
    private updateHandlePositions;
    /**
     * Called when a resize handle is pressed.
     */
    private onHandleMouseDown;
    /**
     * Called when the overlay’s outline is pressed to drag the annotation.
     */
    private onDragStart;
    /**
     * Updates the svg container’s absolute position and size—and then adjusts the inner rect.
     *
     * The inner rect is always placed using the stored margins:
     *   - x = marginLeft
     *   - y = marginTop
     *   - width = (svg width) – (marginLeft + marginRight)
     *   - height = (svg height) – (marginTop + marginBottom)
     */
    private updateSvgAndRect;
    /**
     * Removes the overlay and all its handles.
     */
    removeResizers(): void;
}
