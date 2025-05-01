import { LineConfig } from '../../types/geometry.types';
import PdfState from '../ui/PDFState';
import { Annotation } from './Annotation';
/**
 * Annotation that renders and manages a line (<line> SVG element) on the PDF.
 * Supports both programmatic drawing and interactive mouse‐driven drawing,
 * selection, deletion, zoom rescaling, and hit‐testing.
 */
export declare class LineAnnotation extends Annotation {
    /** Discriminator used when serializing annotations. */
    readonly type = "line";
    /** Unique identifier, inherited from Annotation. */
    get id(): string;
    private _opacity;
    private _strokeColor;
    private _strokeWidth;
    private _strokeStyle;
    private _resizer;
    private _constraints;
    private _origX1;
    private _origY1;
    private _origX2;
    private _origY2;
    private _shapeInfo;
    private _pageNumber?;
    private _pdfState;
    private _onDeleteKeyBound;
    private _bindOnScaleChange;
    /**
     * @param container   HTML element into which the annotation SVG is inserted
     * @param pdfState    Shared PdfState, emits 'scaleChange' events
     * @param strokeColor CSS color for the visible line stroke
     * @param strokeWidth Width (in CSS px) of the visible line stroke
     * @param strokeStyle 'solid' | 'dashed' | 'dotted'
     * @param opacity     Opacity for line
     * @param id          Optional annotation ID
     */
    constructor(container: HTMLElement, pdfState: PdfState, strokeColor: string, strokeWidth: number, strokeStyle: string, opacity: number, id?: string);
    /**
     * Responds to PdfState scaleChange: update constraints and rescale.
     * @param _ Ignored event payload
     */
    private _onScaleChange;
    /**
     * Draw a line programmatically using absolute page coordinates.
     * @param x1         Page‐space X of the first endpoint
     * @param y1         Page‐space Y of the first endpoint
     * @param x2         Page‐space X of the second endpoint
     * @param y2         Page‐space Y of the second endpoint
     * @param pageNumber Index of the PDF page
     */
    draw(x1: number, y1: number, x2: number, y2: number, pageNumber: number): void;
    /**
     * Begin interactive drawing at the given page‐space point.
     * @param x          X coordinate relative to container
     * @param y          Y coordinate relative to container
     * @param pageNumber Index of the PDF page
     */
    startDrawing(x: number, y: number, pageNumber: number): void;
    /**
     * Update the interactive drawing as the pointer moves.
     * @param x X coordinate relative to container
     * @param y Y coordinate relative to container
     */
    updateDrawing(x: number, y: number): void;
    /**
     * Finish interactive drawing, optionally select and emit event.
     * @param opts.select       Automatically select the shape
     * @param opts.shapeUpdate  Emit ANNOTATION_CREATED event
     */
    stopDrawing(opts?: {
        select: boolean;
        shapeUpdate: boolean;
    }): void;
    /**
     * Select this annotation, adding resize handles and delete‐key listener.
     */
    select(): void;
    /**
     * Deselect this annotation, removing handles and delete‐key listener.
     */
    deselect(): void;
    /**
     * Delete this annotation from DOM and emit deletion event.
     * @param suppressEvent If true, skip ANNOTATION_DELETED
     */
    deleteAnnotation(suppressEvent?: boolean): void;
    /** Restore default cursor on hit‐test line. */
    revokeSelection(): void;
    /** Scroll annotation into center of view. */
    scrollToView(): void;
    /** Return current annotation config for serialization or events. */
    getConfig(): Partial<LineConfig>;
    /**
     * Create both the visible <line> and an invisible, thicker hit‐test <line>.
     * @param x1 First endpoint X inside SVG
     * @param y1 First endpoint Y inside SVG
     * @param x2 Second endpoint X inside SVG
     * @param y2 Second endpoint Y inside SVG
     */
    private createSvgLine;
    /** Handle Delete/Backspace key to remove annotation. */
    private _onDeleteKey;
    /** Capture logical (unscaled) endpoints for later zoom updates. */
    private _captureOriginal;
    /**
     * Recompute SVG position, size, and line endpoints for new zoom level.
     * @param scale Current PdfState.scale value
     */
    private _updateZoom;
    /**
     * Compute logical (unscaled) endpoints by combining SVG container
     * position and in-SVG line coordinates.
     */
    private _logicalCoords;
    /** Populate `_shapeInfo` from logical endpoints and style. */
    private _setLineInfo;
    /** Called after any resize or drag to emit creation/update event. */
    private _onShapeUpdate;
}
//# sourceMappingURL=LineAnnotation.d.ts.map