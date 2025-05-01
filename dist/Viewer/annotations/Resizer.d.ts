/**
 * Provides draggable and resizable handles for an SVG annotation.
 * Supports both <rect> and <ellipse> elements.
 */
export declare class Resizer {
    private _svg;
    private _element;
    private _overlaySvg;
    private _overlayRect;
    private _resizers;
    private _isResizing;
    private _activeResizerIndex;
    private _isDragging;
    private _marginLeft;
    private _marginTop;
    private _marginRight;
    private _marginBottom;
    private _onShapeUpdateCallback;
    private _constraints;
    private _origCX;
    private _origCY;
    private _origRX;
    private _origRY;
    private readonly _kind;
    private _overlayLine;
    /**
     * @param svg The annotation’s SVG container.
     * @param element The inner <rect> or <ellipse> element to be resized.
     * @param onShapeUpdate Callback invoked after resize or drag completes.
     * @param constraints Bounding rectangle for drag/resize constraints.
     */
    constructor(svg: SVGSVGElement, element: SVGGraphicsElement, onShapeUpdate: () => void, constraints: any);
    set constraintsValue(constraints: DOMRect);
    /**
     * Syncs the overlay’s position and size to the annotation svg’s current absolute position and dimensions.
     */
    syncOverlayToSvg(): void;
    /**
     * Removes the overlay and all its handles.
     */
    removeResizers(): void;
    /**
     * Creates an overlay SVG element with a dashed outline for dragging.
     */
    private _createOverlay;
    /**
     * Creates eight circular handles for resizing.
     */
    private _createResizerHandles;
    /**
     * @param index Handle index (0–7)
     * @returns CSS cursor for the given handle
     */
    private _cursorForHandle;
    /**
     * Updates the overlay outline and repositions the handles.
     * Note that here the overlay’s internal coordinate system has (0,0) at its top‐left.
     */
    private _updateOverlayDimensions;
    /**
     * Positions the eight handles at the corners and midpoints of the overlay.
     */
    private _updateHandlePositions;
    /**
     * Called when a resize handle is pressed.
     */
    private _onHandleMouseDown;
    private _onLineMouseDown;
    private _onLineDragStart;
    /**
     * Called when the overlay’s outline is pressed to drag the annotation.
     */
    private _onDragStart;
    /**
     * Handles resizing logic for rectangles and ellipses.
     */
    private _resizeRect;
    /**
     * Adjusts an ellipse’s cx, cy, rx, ry after resize.
     */
    private _updateEllipse;
    /**
     * Updates the svg container’s absolute position and size—and then adjusts the inner rect.
     *
     * The inner rect is always placed using the stored margins:
     *   - x = marginLeft
     *   - y = marginTop
     *   - width = (svg width) – (marginLeft + marginRight)
     *   - height = (svg height) – (marginTop + marginBottom)
     */
    private _updateSvgAndRect;
}
//# sourceMappingURL=Resizer.d.ts.map