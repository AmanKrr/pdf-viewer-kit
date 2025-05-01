import { IAnnotation } from '../../interface/IAnnotation';
import { DrawConfig, ShapeConfig, ShapeType } from '../../types/geometry.types';
import PdfState from '../ui/PDFState';
import { SelectionManager } from './SelectionManager';
/**
 * Manages lifecycle of annotations: creation, interactive drawing,
 * selection, deselection, serialization, and cleanup.
 */
export declare class AnnotationManager {
    private _annotationDrawerContainer;
    private _pdfState;
    private _annotations;
    private _activeAnnotation;
    private _selectedAnnotation;
    private _selectionUnsubscribe;
    private _selectionManager;
    private _drawConfig;
    private _boundMouseDown;
    private _boundMouseMove;
    private _boundMouseUp;
    private _boundInitMouseDown;
    private _boundAnnotationSelection;
    /**
     * @param annotationDrawerContainer The HTML container for drawing annotations
     * @param pdfState                  Shared PdfState instance
     * @param selectionManager          Handles selection events
     */
    constructor(annotationDrawerContainer: HTMLElement, pdfState: PdfState, selectionManager: SelectionManager);
    /**
     * Update default drawing configuration.
     */
    set drawConfig(config: DrawConfig & {
        type: ShapeType;
    });
    /**
     * Update the PdfState instance used by this manager.
     */
    set pdfState(pdfState: PdfState);
    /**
     * Returns all shapes managed by this class
     */
    get getAnnotations(): IAnnotation[];
    /**
     * Returns the currently active shape
     */
    get getActiveAnnotation(): IAnnotation | null;
    /**
     * Returns the currently selected shape
     */
    get getSelectedAnnoation(): IAnnotation | null;
    /**
     * Begin listening for the initial mouse-down to start a new annotation.
     */
    _initAnnotation(): void;
    /**
     * Stop listening for the initial mouse-down.
     */
    _initAnnotationCleanup(): void;
    /**
     * Add event listeners to track drawing
     */
    private _addListeners;
    /**
     * Remove event listeners to stop tracking drawing
     */
    private _removeListeners;
    /**
     * Handler for initial mouse-down: creates the new shape instance.
     */
    private _initMouseDown;
    /**
     * Handler for mouse up (stop drawing).
     */
    private _onMouseDown;
    /**
     * Handler for mouse move (update drawing).
     */
    private _onMouseMove;
    /**
     * Handler for mouse up (stop drawing).
     */
    private _onMouseUp;
    /**
     * Enable or disable pointer events on the drawing container.
     */
    setPointerEvent(pointerEvent: 'all' | 'none'): void;
    /**
     * Create a new annotation of the given type and config, then begin drawing.
     *
     * @param type   The shape type ('rectangle' | 'ellipse', etc.)
     * @param config Optional override of drawConfig properties
     */
    createShape(type: ShapeType, config?: {
        fillColor?: string;
        strokeColor?: string;
        strokeWidth?: number;
        strokeStyle?: string;
        opacity?: number;
        id?: string;
    }): void;
    /**
     * Internal helper to draw an existing ShapeConfig programmatically
     * (e.g., loading saved annotations).
     */
    private _drawShape;
    /**
     * Add an annotation to the viewer. This is a wrapper around drawShape.
     * @param shapeConfig The configuration for the shape.
     * @param scrollIntoView Whether to scroll the annotation into view.
     */
    addAnnotation(shapeConfig: ShapeConfig, scrollIntoView?: boolean, revokeSelection?: boolean): void;
    /**
     * Update an existing annotation. This is a placeholder and should be
     * implemented in subclasses or specific managers.
     * @param annotation The annotation to update.
     */
    updateAnnotation(annotation: ShapeConfig): void;
    /**
     * Delete an annotation by its ID.
     * @param annotationId The ID of the annotation to delete.
     */
    deleteAnnotation(annotationId: string): void;
    /**
     * Select an annotation and notify the selection manager.
     * @param annotation The annotation to select.
     */
    selectAnnotation(annotation: IAnnotation): void;
    /**
     * Deselect all annotations.
     */
    deselectAll(): void;
    /**
     * Handle annotation selection from external events.
     * @param annotationData The data of the selected annotation.
     */
    private _onAnnotationSelection;
    /**
     * Cleanup resources, event handlers, subscriptions
     */
    destroy(): void;
}
//# sourceMappingURL=AnnotationManager.d.ts.map