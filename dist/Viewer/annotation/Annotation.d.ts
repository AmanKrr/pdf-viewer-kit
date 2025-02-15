import { RectConfig } from '../../types/geometry';
import PdfState from '../components/PdfState';
/**
 * Base class for handling annotations in a PDF viewer.
 * Responsible for managing annotation elements, interactions, and coordinates.
 */
export declare class Annotation {
    /** The container element where the annotation SVG is placed */
    protected container: HTMLElement;
    /** The SVG element that represents the annotation */
    protected svg: SVGSVGElement;
    /** The actual annotation element inside the SVG (e.g., rectangle, line) */
    protected element: SVGElement | null;
    /** An invisible hit-area rectangle for interaction */
    protected hitElementRect: SVGElement | null;
    /** Flag to indicate if the annotation is being drawn */
    isDrawing: boolean;
    /** Starting X-coordinate of the annotation */
    protected startX: number;
    /** Starting Y-coordinate of the annotation */
    protected startY: number;
    /** Reference to the PdfState instance for event handling */
    protected __pdfState: PdfState | null;
    /**
     * Creates a new annotation instance.
     *
     * @param {HTMLElement} container - The container where the annotation is placed.
     * @param {PdfState} pdfState - The PdfState instance to manage annotation state.
     */
    constructor(container: HTMLElement, pdfState: PdfState);
    /**
     * Handles click events on an annotation.
     * Emits an event when an annotation is selected.
     *
     * @param {MouseEvent} event - The mouse event triggering the click.
     * @param {any} context - The context object associated with the annotation.
     * @param {'rectangle'} type - The type of annotation clicked.
     */
    protected onAnnotationClick(event: MouseEvent | null, annotationData: Partial<RectConfig>): void;
    /**
     * Starts drawing the annotation.
     *
     * @param {number} x - The X-coordinate where drawing starts.
     * @param {number} y - The Y-coordinate where drawing starts.
     */
    protected startDrawing(x: number, y: number): void;
    /**
     * Stops drawing the annotation and logs its coordinates.
     */
    protected stopDrawing(): void;
    /**
     * Retrieves the coordinates of the annotation.
     *
     * @returns {{ x0: number; x1: number; y0: number; y1: number } | null}
     * An object containing the annotation's top-left (x0, y0)
     * and its width (x1) and height (y1), or `null` if the SVG is not available.
     */
    protected getCoordinates(): {
        x0: number;
        x1: number;
        y0: number;
        y1: number;
    } | null;
    /**
     * Generates a unique id string.
     */
    private generateUniqueId;
}
