import PdfState from '../ui/PDFState';
import { IAnnotation } from '../../interface/IAnnotation';
import { ShapeType } from '../../types/geometry.types';
/**
 * Options for creating a new annotation via AnnotationFactory.
 */
export interface CreateAnnotationOptions {
    /** The shape type to create ('rectangle', 'ellipse', or 'line') */
    type: ShapeType;
    /** Container element into which the annotation SVG will be inserted */
    annotationDrawerContainer: HTMLElement;
    /** Shared PdfState instance for scale and event handling */
    pdfState: PdfState;
    /** Fill color for shapes (CSS color string) */
    fillColor: string;
    /** Stroke color for shapes (CSS color string) */
    strokeColor: string;
    /** Stroke width in CSS pixels */
    strokeWidth: number;
    /** Opacity of the annotation (0–1) */
    opacity: number;
    /** Stroke style: 'solid' | 'dashed' | 'dotted' */
    strokeStyle: string;
    /** Optional ID to assign to the annotation */
    id?: string;
}
/**
 * Factory class for creating shape annotations.
 */
export declare class AnnotationFactory {
    /**
     * Creates an annotation instance based on the specified options.
     *
     * @param options - Configuration for the annotation to create.
     * @returns An IAnnotation instance corresponding to the requested shape.
     * @throws Error if the specified shape type is not supported.
     */
    static createAnnotation(options: CreateAnnotationOptions): IAnnotation;
}
//# sourceMappingURL=PDFAnnotationFactory.d.ts.map