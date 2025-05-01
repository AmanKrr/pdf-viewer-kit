import { EllipseConfig } from '../../types/geometry.types';
import PdfState from '../ui/PDFState';
import { Annotation } from './Annotation';
/**
 * An SVG ellipse annotation. Supports interactive drawing, programmatic creation,
 * selection, deletion, and automatic zoom updates from PdfState.
 */
export declare class EllipseAnnotation extends Annotation {
    /** Discriminator for serialization. */
    readonly type = "ellipse";
    /** Alias for `annotationId`. */
    get id(): string;
    private _fillColor;
    private _strokeColor;
    private _strokeWidth;
    private _strokeStyle;
    private _opacity;
    private _resizer;
    private _constraints;
    private _origCX;
    private _origCY;
    private _origRX;
    private _origRY;
    private _shapeInfo;
    private _pageNumber?;
    private _pdfState;
    private _onDeleteKeyBound;
    private _bindOnScaleChange;
    /**
     * @param container  Element into which the SVG will be injected
     * @param pdfState   Viewer state that emits scaleChange events
     * @param fillColor  SVG fill color
     * @param strokeColor SVG stroke color
     * @param strokeWidth Stroke width in px
     * @param strokeStyle One of "solid" | "dashed" | "dotted"
     * @param id         Optional identifier
     */
    constructor(container: HTMLElement, pdfState: PdfState, fillColor: string, strokeColor: string, strokeWidth: number, strokeStyle: string, opacity: number, id?: string);
    private _onScaleChange;
    /**
     * Programmatically draws an ellipse (no pointer events).
     * @param cx         Logical center-x
     * @param cy         Logical center-y
     * @param rx         Logical horizontal radius
     * @param ry         Logical vertical radius
     * @param pageNumber Page index for this annotation
     */
    draw(cx: number, cy: number, rx: number, ry: number, pageNumber: number): void;
    /** @inheritdoc */
    startDrawing(x: number, y: number, pageNumber: number): void;
    /** @inheritdoc */
    updateDrawing(x: number, y: number): void;
    /**
     * Ends drawing mode, captures geometry, and optionally selects or emits update.
     * @param opts.select      If true, the ellipse is auto-selected
     * @param opts.shapeUpdate If true, fires ANNOTATION_CREATED
     */
    stopDrawing(opts?: {
        select: boolean;
        shapeUpdate: boolean;
    }): void;
    /** Adds resizers and listens for Delete/Backspace. */
    select(): void;
    /** Removes resizers and key listener. */
    deselect(): void;
    /**
     * Deletes the annotation from DOM.
     * @param suppressEvent If true, skips emitting ANNOTATION_DELETED
     */
    deleteAnnotation(suppressEvent?: boolean): void;
    /** Cancels the pointer cursor on the hit-test ellipse. */
    revokeSelection(): void;
    /** Scrolls this annotation into view (centered). */
    scrollToView(): void;
    /** Retrieves the current annotation configuration. */
    getConfig(): Partial<EllipseConfig>;
    /**
     * Creates the visible ellipse and an invisible, thicker hit-test ellipse.
     */
    private createSvgEllipse;
    /**
     * Handles Delete/Backspace key to remove the annotation.
     * @param e Keyboard event
     */
    private _onDeleteKey;
    /**
     * Stores logical geometry for zoom recalculation.
     * @param scale Current scale factor
     */
    private _captureOriginal;
    /**
     * Applies a new zoom level to the SVG and resizer overlay.
     * @param scale New scale factor
     */
    private _updateZoom;
    /** Returns the SVG `stroke-dasharray` based on style. */
    private _getStrokeDashArray;
    /**
     * Computes current logical coordinates from SVG position and size.
     */
    private _logicalCoords;
    /** Updates `_shapeInfo` for serialization or event emission. */
    private _setEllipseInfo;
    /** Emits an update event after shape changes. */
    private _onShapeUpdate;
}
//# sourceMappingURL=EllipseAnnotation.d.ts.map