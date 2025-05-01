import { IAnnotation } from '../../interface/IAnnotation';
import { EllipseConfig, RectangleConfig } from '../../types/geometry.types';
import PdfState from '../ui/PDFState';
/**
 * Abstract base class for handling annotations in a PDF viewer.
 * Provides shared logic for creating an SVG container, tracking drawing state, etc.
 */
export declare abstract class Annotation implements IAnnotation {
    readonly annotationId: string;
    abstract readonly type: string;
    protected __annotationDrawerContainer: HTMLElement;
    protected __svg: SVGSVGElement;
    protected __element: SVGElement | null;
    protected __hitElementRect: SVGElement | null;
    isDrawing: boolean;
    protected __startX: number;
    protected __startY: number;
    protected __pdfState: PdfState | null;
    /**
     * Creates a new annotation instance.
     *
     * @param {HTMLElement} annotationDrawerContainer - The container where the annotation is placed.
     * @param {PdfState} pdfState - The PdfState instance to manage annotation state.
     */
    constructor(annotationDrawerContainer: HTMLElement, pdfState: PdfState, id?: string);
    /**
     * Begins the drawing process for the annotation.
     * @param x - The starting X-coordinate.
     * @param y - The starting Y-coordinate.
     */
    startDrawing(x: number, y: number, pageNumber: number): void;
    /**
     * Updates the drawing of the annotation as the pointer moves.
     * @param x - The current X-coordinate.
     * @param y - The current Y-coordinate.
     */
    abstract updateDrawing(x: number, y: number): void;
    /**
     * Stops the drawing process for the annotation.
     */
    stopDrawing(): void;
    /**
     * Selects the annotation.
     */
    abstract select(): void;
    /**
     * Deselects the annotation.
     */
    abstract deselect(): void;
    /**
     * Removes the annotation from the DOM.
     */
    abstract deleteAnnotation(suppressEvent: boolean): void;
    /**
     * Returns the configuration data for the annotation.
     * @returns A record representing the annotation configuration.
     */
    abstract getConfig(): Record<string, any>;
    /**
     * Optionally scrolls to the annotation's position in the PDF view.
     * This can be implemented in derived classes if needed.
     */
    scrollToView?(): void;
    /**
     * Emits an event when the annotation is clicked, indicating it's selected.
     * @param event - The MouseEvent triggering the click.
     * @param annotationData - Data describing the annotation.
     */
    protected __onAnnotationClick(event: MouseEvent | null, annotationData: Partial<RectangleConfig | EllipseConfig>): void;
    /**
     * Generates a unique ID for the annotation.
     * @returns A unique string ID.
     */
    protected __generateUniqueId(): string;
}
//# sourceMappingURL=Annotation.d.ts.map