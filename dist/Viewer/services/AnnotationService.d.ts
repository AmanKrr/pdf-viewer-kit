import { ShapeConfig } from '../../types/geometry.types';
import PdfState from '../ui/PDFState';
import WebViewer from '../ui/WebViewer';
import { AnnotationManager } from '../manager/AnnotationManager';
import { ShapeAnno } from './AnnotationExportService';
/**
 * Service to manage annotations across pages.
 * Listens for creation/deletion events and keeps per-page annotations synchronized.
 */
export declare class AnnotationService {
    private _annotations;
    private _annotationManagers;
    private _goTo;
    private _pdfState;
    private _onCreated;
    private _onDeleted;
    /**
     * @param pdfState  Shared PDF state, emits ANNOTATION_CREATED/DELETED events.
     * @param pdfViewer WebViewer for navigation (goToPage).
     */
    constructor(pdfState: PdfState, pdfViewer: WebViewer);
    /**
     * Checks if an AnnotationManager is registered for the given page.
     *
     * @param page  Page number to check.
     * @returns The AnnotationManager instance or undefined.
     */
    isAnnotationManagerRegistered(page: number): AnnotationManager | undefined;
    /**
     * Registers an AnnotationManager for a page.
     * Renders any existing annotations for that page immediately.
     *
     * @param page     Page number.
     * @param manager  AnnotationManager instance.
     */
    registerAnnotationManager(page: number, manager: AnnotationManager): void;
    /**
     * Unregisters the AnnotationManager for a page and cleans up.
     *
     * @param page  Page number.
     */
    unregisterAnnotationManager(page: number): void;
    /**
     * Creates and saves a new annotation, navigates to its page,
     * and renders it if the page manager is registered.
     *
     * @param annotationInput  Annotation data without 'id'.
     * @returns Generated annotation id.
     */
    addAnnotation(annotationInput: Omit<ShapeConfig, 'id'>): string;
    /**
     * Updates an existing annotation's properties.
     *
     * @param annotationId  ID of the annotation to update.
     * @param updatedData   Partial data to merge into the annotation.
     */
    updateAnnotation(annotationId: string, updatedData: Partial<ShapeConfig>): void;
    /**
     * Deletes an annotation by its ID from storage and view.
     *
     * @param annotationId  ID of the annotation to delete.
     */
    deleteAnnotation(annotationId: string): void;
    /**
     * Exports all current annotations as ShapeAnno objects,
     * applying current PDF scale.
     *
     * @returns Array of ShapeAnno ready for saving or download.
     */
    exportShapes(): ShapeAnno[];
    /**
     * Removes event listeners and destroys all managers.
     */
    destroy(): void;
    /**
     * Internal: delete annotation logic for both storage and manager.
     */
    private _deleteAnnotation;
    /**
     * Internal: updates or adds annotation in the map when created externally.
     */
    private _updateAnnotationMap;
    /**
     * Internal: collect all live ShapeConfig from registered managers.
     */
    private _collectAllConfigs;
    /**
     * Internal: generate a unique identifier for a new annotation.
     */
    private _generateUniqueId;
}
//# sourceMappingURL=AnnotationService.d.ts.map