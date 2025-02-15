import { RectConfig } from '../../types/geometry';
import PdfState from '../components/PdfState';
import WebViewer from '../components/WebViewer';
import { AnnotationManager } from '../manager/AnnotationManager';
export declare class AnnotationService {
    private annotations;
    private annotationManagers;
    private goTo;
    constructor(pdfState: PdfState, pdfViewer: WebViewer);
    isAnnotationManagerRegistered(page: number): AnnotationManager | undefined;
    /**
     * Registers an AnnotationManager for a given page.
     * When a manager registers, all saved annotations for that page are rendered.
     */
    registerAnnotationManager(page: number, manager: AnnotationManager): void;
    /**
     * Unregisters the AnnotationManager for a page.
     */
    unregisterAnnotationManager(page: number): void;
    /**
     * Adds an annotation. The annotation is saved in the map and, if its page's
     * AnnotationManager is registered, it is rendered immediately.
     *
     * @param annotationInput The annotation data (without an id)
     * @returns The generated annotation id.
     */
    addAnnotation(annotationInput: Omit<RectConfig, 'id'>): string;
    /**
     * Updates an existing annotation.
     *
     * @param annotationId The annotation id.
     * @param updatedData The updated data to merge.
     */
    updateAnnotation(annotationId: string, updatedData: Partial<RectConfig>): void;
    /**
     * Deletes an annotation.
     *
     * @param annotationId The annotation id to delete.
     */
    deleteAnnotation(annotationId: string): void;
    /**
     * Generates a unique id string.
     */
    private generateUniqueId;
    private updateAnnotationMap;
}
