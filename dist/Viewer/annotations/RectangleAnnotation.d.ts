import { RectangleConfig } from '../../types/geometry.types';
import PdfState from '../ui/PDFState';
import { Annotation } from './Annotation';
/**
 * Rectangle annotation supporting interactive drawing, programmatic creation,
 * selection, deletion, and automatic zoom synchronization.
 */
export declare class RectangleAnnotation extends Annotation {
    private _fillColor;
    private _strokeColor;
    private _strokeWidth;
    private _strokeStyle;
    private _opacity;
    private _resizer;
    private _originalLeft;
    private _originalTop;
    private _originalWidth;
    private _originalHeight;
    private _shapeInfo;
    private _pageNumber?;
    private _constraints;
    private _pdfState;
    private _onDeleteKeyBound;
    private _bindOnScaleChange;
    /** Unique identifier of this annotation. */
    get id(): string;
    /** Discriminator for serialization. */
    readonly type = "rectangle";
    /**
     * @param container   Host element for the annotation SVG
     * @param pdfState    Viewer state, emits 'scaleChange' events
     * @param fillColor   SVG fill color
     * @param strokeColor SVG stroke color
     * @param strokeWidth Stroke width in CSS pixels
     * @param strokeStyle 'solid' | 'dashed' | 'dotted'
     * @param opacity     Opacity for rectangle
     * @param id          Optional annotation ID
     */
    constructor(container: HTMLElement, pdfState: PdfState, fillColor: string, strokeColor: string, strokeWidth: number, strokeStyle: string, opacity: number, id?: string);
    private _onScaleChange;
    /**
     * Programmatically draws a rectangle without user interaction.
     * @param x0         X-coordinate of top-left corner
     * @param x1         Width of the rectangle
     * @param y0         Y-coordinate of top-left corner
     * @param y1         Height of the rectangle
     * @param pageNumber PDF page index
     */
    draw(x0: number, x1: number, y0: number, y1: number, pageNumber: number): void;
    /** @inheritdoc */
    startDrawing(x: number, y: number, pageNumber: number): void;
    /** @inheritdoc */
    updateDrawing(x: number, y: number): void;
    /**
     * Ends interactive drawing, caches geometry, and optionally selects
     * or emits an update event.
     * @param opts.select       Auto-select after drawing
     * @param opts.shapeUpdate  Emit ANNOTATION_CREATED event
     */
    stopDrawing(opts?: {
        select?: boolean;
        shapeUpdate?: boolean;
    }): void;
    /**
     * Selects this annotation, adding resizers and Delete/Backspace handler.
     */
    select(): void;
    /**
     * Deselects this annotation, removing resizers and keyboard handler.
     */
    deselect(): void;
    /**
     * Deletes this annotation from the DOM.
     * @param suppressEvent If true, skips ANNOTATION_DELETED emission
     */
    deleteAnnotation(suppressEvent?: boolean): void;
    /**
     * Cancels pointer cursor and click handler on the hit-test rectangle.
     */
    revokeSelection(): void;
    /**
     * Scrolls the annotation into view (centered in viewport).
     */
    scrollToView(): void;
    /**
     * Returns a serializable snapshot of this annotation.
     */
    getConfig(): Partial<RectangleConfig>;
    /**
     * Creates the visible <rect> and an invisible hit-test <rect> inside the SVG.
     * @param padding  Optional x/y offset inside the SVG
     * @param height   Rectangle height
     * @param width    Rectangle width
     */
    private _createSvgRect;
    /** Adds keyboard listener for Delete/Backspace. */
    private _addDeleteEvent;
    /** Removes keyboard listener for Delete/Backspace. */
    private _removeDeleteEvent;
    /**
     * Handles Delete or Backspace key to delete the annotation.
     */
    private _onDeleteKey;
    /** Captures current un-scaled position and size for zoom adjustments. */
    private _maintainOriginalBounding;
    /**
     * Re-applies scaled position and size based on captured original values.
     * @param zoomFactor Current viewer scale
     */
    private _updateZoom;
    /**
     * Returns stroke-dasharray string corresponding to the stroke style.
     */
    private _getStrokeDashArray;
    /**
     * Computes current un-scaled coordinates from the SVG element.
     */
    private _getCoordinates;
    /**
     * Computes logical (un-scaled) coordinates, preferring captured originals.
     */
    private _getLogicalCoordinates;
    /** Updates internal shape info for serialization or events. */
    private _setRectInfo;
    /** Emits ANNOTATION_CREATED after geometry changes. */
    private _onShapeUpdate;
}
//# sourceMappingURL=RectangleAnnotation.d.ts.map