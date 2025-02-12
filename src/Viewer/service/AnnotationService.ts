// AnnotationService.ts

import { RectConfig } from '../../types/geometry';
import PdfState from '../components/PdfState';
import WebViewer from '../components/WebViewer';
import { AnnotationManager } from '../manager/AnnotationManager';

export class AnnotationService {
  private annotations: Map<number, RectConfig[]> = new Map();
  private annotationManagers: Map<number, AnnotationManager> = new Map();
  private goTo: (pageNumber: number) => void;

  constructor(pdfState: PdfState, pdfViewer: WebViewer) {
    pdfState.on('ANNOTATION_CREATED', (annotationData: RectConfig) => this.updateAnnotationMap(annotationData));
    pdfState.on('ANNOTATION_DELETED', (id: string) => this.deleteAnnotation(id));
    this.goTo = pdfViewer.goToPage.bind(pdfViewer);
  }

  public isAnnotationManagerRegistered(page: number) {
    return this.annotationManagers.get(page);
  }

  /**
   * Registers an AnnotationManager for a given page.
   * When a manager registers, all saved annotations for that page are rendered.
   */
  public registerAnnotationManager(page: number, manager: AnnotationManager): void {
    this.annotationManagers.set(page, manager);
    // If annotations for this page already exist, render them
    const pageAnnotations = this.annotations.get(page);
    if (pageAnnotations) {
      pageAnnotations.forEach((annotation) => {
        manager.addAnnotation(annotation);
      });
    }
  }

  /**
   * Unregisters the AnnotationManager for a page.
   */
  public unregisterAnnotationManager(page: number): void {
    this.annotationManagers.get(page)?.destroy();
    this.annotationManagers.delete(page);
  }

  /**
   * Adds an annotation. The annotation is saved in the map and, if its page's
   * AnnotationManager is registered, it is rendered immediately.
   *
   * @param annotationInput The annotation data (without an id)
   * @returns The generated annotation id.
   */
  public addAnnotation(annotationInput: Omit<RectConfig, 'id'>): string {
    const annotation: RectConfig = {
      ...annotationInput,
      id: this.generateUniqueId(),
    };

    const page = annotation.pageNumber;
    this.goTo(page);
    // Get existing annotations for the page or create a new array
    const pageAnnotations = this.annotations.get(page) || [];
    pageAnnotations.push(annotation);
    this.annotations.set(page, pageAnnotations);

    // If the page is already rendered, immediately add the annotation.
    setTimeout(() => {
      const manager = this.annotationManagers.get(page);
      if (manager) {
        manager.addAnnotation(annotation, true);
      }
    }, 250);
    return annotation.id!;
  }

  /**
   * Updates an existing annotation.
   *
   * @param annotationId The annotation id.
   * @param updatedData The updated data to merge.
   */
  public updateAnnotation(annotationId: string, updatedData: Partial<RectConfig>): void {
    // Find the annotation by iterating over each page's annotations.
    for (const [page, annotations] of this.annotations.entries()) {
      const index = annotations.findIndex((anno) => anno.id === annotationId);
      if (index !== -1) {
        // Merge the new data
        const updatedAnnotation: RectConfig = {
          ...annotations[index],
          ...updatedData,
        };
        annotations[index] = updatedAnnotation;
        // Update via the manager if it exists.
        const manager = this.annotationManagers.get(page);
        if (manager) {
          manager.updateAnnotation(updatedAnnotation);
        }
        return;
      }
    }
    throw new Error('Annotation not found');
  }

  /**
   * Deletes an annotation.
   *
   * @param annotationId The annotation id to delete.
   */
  public deleteAnnotation(annotationId: string): void {
    for (const [page, annotations] of this.annotations.entries()) {
      const index = annotations.findIndex((anno) => anno.id === annotationId);
      if (index !== -1) {
        annotations.splice(index, 1);
        // Update via the manager if it exists.
        const manager = this.annotationManagers.get(page);
        if (manager) {
          manager.deleteAnnotation(annotationId);
        }
        return;
      }
    }
    throw new Error('Annotation not found');
  }

  /**
   * Generates a unique id string.
   */
  private generateUniqueId(): string {
    return 'anno-' + Math.random().toString(36).substr(2, 9);
  }

  private updateAnnotationMap(annotationData: RectConfig): void {
    if (annotationData.pageNumber == undefined) {
      throw Error('Page number not found!');
    }

    const page = annotationData.pageNumber;

    // Get the current list of annotations for the page, or initialize it if not present.
    let pageAnnotations = this.annotations.get(page);
    if (!pageAnnotations) {
      pageAnnotations = [];
    }

    // Check if an annotation with the same id already exists.
    const index = pageAnnotations.findIndex((anno) => anno.id === annotationData.id);

    if (index >= 0) {
      // Update the existing annotation.
      pageAnnotations[index] = annotationData;
    } else {
      // Otherwise, add the new annotation.
      pageAnnotations.push(annotationData);
    }

    // Update the map for the page.
    this.annotations.set(page, pageAnnotations);
    console.log(page, pageAnnotations, annotationData);
  }
}
