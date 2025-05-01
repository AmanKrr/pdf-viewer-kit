/*
  Copyright 2025 Aman Kumar

  Licensed under the Apache License, Version 2.0 (the "License");
  you may not use this file except in compliance with the License.
  You may obtain a copy of the License at

      http://www.apache.org/licenses/LICENSE-2.0

  Unless required by applicable law or agreed to in writing, software
  distributed under the License is distributed on an "AS IS" BASIS,
  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
  See the License for the specific language governing permissions and
  limitations under the License.
*/

import { EllipseConfig, LineConfig, RectangleConfig, ShapeConfig } from '../../types/geometry.types';
import PdfState from '../ui/PDFState';
import WebViewer from '../ui/WebViewer';
import { AnnotationManager } from '../manager/AnnotationManager';
import { ShapeAnno } from './AnnotationExportService';
import { toShapeAnnos } from '../../utils/annotation-utils';

/**
 * Service to manage annotations across pages.
 * Listens for creation/deletion events and keeps per-page annotations synchronized.
 */
export class AnnotationService {
  private _annotations: Map<number, ShapeConfig[]> = new Map();
  private _annotationManagers: Map<number, AnnotationManager> = new Map();
  private _goTo: (pageNumber: number) => void;
  private _pdfState: PdfState;
  private _onCreated = (annotationData: ShapeConfig) => this._updateAnnotationMap(annotationData);
  private _onDeleted = (id: string) => this._deleteAnnotation(id);

  /**
   * @param pdfState  Shared PDF state, emits ANNOTATION_CREATED/DELETED events.
   * @param pdfViewer WebViewer for navigation (goToPage).
   */
  constructor(pdfState: PdfState, pdfViewer: WebViewer) {
    this._pdfState = pdfState;
    this._goTo = pdfViewer.goToPage.bind(pdfViewer);

    pdfState.on('ANNOTATION_CREATED', this._onCreated);
    pdfState.on('ANNOTATION_DELETED', this._onDeleted);
  }

  /**
   * Checks if an AnnotationManager is registered for the given page.
   *
   * @param page  Page number to check.
   * @returns The AnnotationManager instance or undefined.
   */
  public isAnnotationManagerRegistered(page: number): AnnotationManager | undefined {
    return this._annotationManagers.get(page);
  }

  /**
   * Registers an AnnotationManager for a page.
   * Renders any existing annotations for that page immediately.
   *
   * @param page     Page number.
   * @param manager  AnnotationManager instance.
   */
  public registerAnnotationManager(page: number, manager: AnnotationManager): void {
    this._annotationManagers.set(page, manager);

    if (this._pdfState.isAnnotationEnabled && this._pdfState.isAnnotationConfigurationPropertiesEnabled) {
      manager._initAnnotation();
    }

    const pageAnnotations = this._annotations.get(page);
    if (pageAnnotations) {
      for (const annotation of pageAnnotations) {
        // interactive=false renders without user drag
        manager.addAnnotation(annotation, false, (annotation as any).interactive === false);
      }
    }
  }

  /**
   * Unregisters the AnnotationManager for a page and cleans up.
   *
   * @param page  Page number.
   */
  public unregisterAnnotationManager(page: number): void {
    const manager = this._annotationManagers.get(page);
    manager?.destroy();
    this._annotationManagers.delete(page);

    if (this._pdfState.isAnnotationEnabled && this._pdfState.isAnnotationConfigurationPropertiesEnabled) {
      manager?._initAnnotationCleanup();
    }
  }

  /**
   * Creates and saves a new annotation, navigates to its page,
   * and renders it if the page manager is registered.
   *
   * @param annotationInput  Annotation data without 'id'.
   * @returns Generated annotation id.
   */
  public addAnnotation(annotationInput: Omit<ShapeConfig, 'id'>): string {
    const annotation = {
      ...annotationInput,
      id: this._generateUniqueId(),
      interactive: false,
    } as ShapeConfig & { interactive: boolean };

    const page = annotation.pageNumber;
    this._goTo(page);

    const pageAnnotations = this._annotations.get(page) ?? [];
    pageAnnotations.push(annotation);
    this._annotations.set(page, pageAnnotations);

    const manager = this._annotationManagers.get(page);
    if (manager) {
      manager.addAnnotation(annotation, true, true);
    }

    return annotation.id;
  }

  /**
   * Updates an existing annotation's properties.
   *
   * @param annotationId  ID of the annotation to update.
   * @param updatedData   Partial data to merge into the annotation.
   */
  public updateAnnotation(annotationId: string, updatedData: Partial<ShapeConfig>): void {
    for (const [page, annotations] of this._annotations.entries()) {
      const idx = annotations.findIndex((anno) => anno.id === annotationId);
      if (idx !== -1) {
        annotations[idx] = { ...annotations[idx], ...updatedData } as ShapeConfig;
        const manager = this._annotationManagers.get(page);
        manager?.updateAnnotation(annotations[idx]);
        return;
      }
    }
    throw new Error('Annotation not found');
  }

  /**
   * Deletes an annotation by its ID from storage and view.
   *
   * @param annotationId  ID of the annotation to delete.
   */
  public deleteAnnotation(annotationId: string): void {
    this._deleteAnnotation(annotationId);
  }

  /**
   * Exports all current annotations as ShapeAnno objects,
   * applying current PDF scale.
   *
   * @returns Array of ShapeAnno ready for saving or download.
   */
  public exportShapes(): ShapeAnno[] {
    const configs = this._collectAllConfigs();
    return toShapeAnnos(configs, this._pdfState.scale);
  }

  /**
   * Removes event listeners and destroys all managers.
   */
  public destroy(): void {
    this._pdfState.off('ANNOTATION_CREATED', this._onCreated);
    this._pdfState.off('ANNOTATION_DELETED', this._onDeleted);

    for (const manager of this._annotationManagers.values()) {
      manager.destroy();
    }
    this._annotationManagers.clear();
    this._annotations.clear();
  }

  /**
   * Internal: delete annotation logic for both storage and manager.
   */
  private _deleteAnnotation(annotationId: string): void {
    for (const [page, annotations] of this._annotations.entries()) {
      const idx = annotations.findIndex((anno) => anno.id === annotationId);
      if (idx !== -1) {
        annotations.splice(idx, 1);
        const manager = this._annotationManagers.get(page);
        manager?.deleteAnnotation(annotationId);
        return;
      }
    }
    throw new Error('Annotation not found');
  }

  /**
   * Internal: updates or adds annotation in the map when created externally.
   */
  private _updateAnnotationMap(annotationData: ShapeConfig): void {
    if (annotationData.pageNumber == null) {
      throw new Error('Page number not found!');
    }
    const page = annotationData.pageNumber;
    const pageAnnotations = this._annotations.get(page) || [];
    const idx = pageAnnotations.findIndex((anno) => anno.id === annotationData.id);

    if (idx >= 0) {
      pageAnnotations[idx] = annotationData;
    } else {
      pageAnnotations.push(annotationData);
    }
    this._annotations.set(page, pageAnnotations);
  }

  /**
   * Internal: collect all live ShapeConfig from registered managers.
   */
  private _collectAllConfigs(): Array<RectangleConfig | EllipseConfig | LineConfig> {
    const all: Array<RectangleConfig | EllipseConfig | LineConfig> = [];
    for (const manager of this._annotationManagers.values()) {
      all.push(...manager.getAnnotations.map((anno) => anno.getConfig() as any));
    }
    return all;
  }

  /**
   * Internal: generate a unique identifier for a new annotation.
   */
  private _generateUniqueId(): string {
    return 'anno-' + Math.random().toString(36).substr(2, 9) + '-' + Date.now().toString();
  }
}
