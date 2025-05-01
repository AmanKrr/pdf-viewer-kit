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

import { IAnnotation } from '../../interface/IAnnotation';
import { DrawConfig, ShapeConfig, ShapeType } from '../../types/geometry';
import { AnnotationFactory } from '../annotations/PDFAnnotationFactory';
import PdfState from '../ui/PDFState';
import { ISelectable, SelectionManager } from './SelectionManager';

/**
 * Manages lifecycle of annotations: creation, interactive drawing,
 * selection, deselection, serialization, and cleanup.
 */
export class AnnotationManager {
  private _annotationDrawerContainer: HTMLElement | null;
  private _pdfState: PdfState | null = null;

  private _annotations: IAnnotation[] = [];
  private _activeAnnotation: IAnnotation | null = null;
  private _selectedAnnotation: IAnnotation | null = null;

  private _selectionUnsubscribe: () => void;
  private _selectionManager: SelectionManager;

  private _drawConfig: DrawConfig & { type: ShapeType } = {
    fillColor: 'transparent',
    strokeColor: 'red',
    strokeWidth: 2,
    strokeStyle: 'solid',
    opacity: 1,
    type: 'rectangle',
  };

  private _boundMouseDown = this._onMouseDown.bind(this);
  private _boundMouseMove = this._onMouseMove.bind(this);
  private _boundMouseUp = this._onMouseUp.bind(this);
  private _boundInitMouseDown = this._initMouseDown.bind(this);
  private _boundAnnotationSelection = this._onAnnotationSelection.bind(this);

  /**
   * @param annotationDrawerContainer The HTML container for drawing annotations
   * @param pdfState                  Shared PdfState instance
   * @param selectionManager          Handles selection events
   */
  constructor(annotationDrawerContainer: HTMLElement, pdfState: PdfState, selectionManager: SelectionManager) {
    this._annotationDrawerContainer = annotationDrawerContainer;
    this._pdfState = pdfState;
    this._selectionManager = selectionManager;

    // Listen for external selection changes
    this._selectionUnsubscribe = selectionManager.onSelectionChange((selectedShape: ISelectable | null) => {
      if (this._selectedAnnotation && (!selectedShape || this._selectedAnnotation.annotationId !== selectedShape.id)) {
        this.deselectAll();
      }
    });

    this._pdfState.on('ANNOTATION_SELECTED', this._boundAnnotationSelection);
  }

  /**
   * Update default drawing configuration.
   */
  set drawConfig(config: DrawConfig & { type: ShapeType }) {
    this._drawConfig = {
      ...config,
    };
  }

  /**
   * Update the PdfState instance used by this manager.
   */
  set pdfState(pdfState: PdfState) {
    this._pdfState = pdfState;
  }

  /**
   * Returns all shapes managed by this class
   */
  get getAnnotations(): IAnnotation[] {
    return this._annotations;
  }

  /**
   * Returns the currently active shape
   */
  get getActiveAnnotation(): IAnnotation | null {
    return this._activeAnnotation;
  }

  /**
   * Returns the currently selected shape
   */
  get getSelectedAnnoation(): IAnnotation | null {
    return this._selectedAnnotation;
  }

  /**
   * Begin listening for the initial mouse-down to start a new annotation.
   */
  public _initAnnotation() {
    if (!this._annotationDrawerContainer) return;
    this._annotationDrawerContainer.addEventListener('mousedown', this._boundInitMouseDown);
  }

  /**
   * Stop listening for the initial mouse-down.
   */
  public _initAnnotationCleanup() {
    if (!this._annotationDrawerContainer) return;
    this._annotationDrawerContainer.removeEventListener('mousedown', this._boundInitMouseDown);
  }

  /**
   * Add event listeners to track drawing
   */
  private _addListeners() {
    if (!this._annotationDrawerContainer) return;
    if (!this._annotationDrawerContainer.parentElement) return;
    if (!this._annotationDrawerContainer.parentElement.parentElement) return;
    this._annotationDrawerContainer.parentElement.parentElement.addEventListener('mousedown', this._boundMouseDown);
    this._annotationDrawerContainer.parentElement.parentElement.addEventListener('mousemove', this._boundMouseMove);
    this._annotationDrawerContainer.parentElement.parentElement.addEventListener('mouseup', this._boundMouseUp);
  }

  /**
   * Remove event listeners to stop tracking drawing
   */
  private _removeListeners() {
    if (!this._annotationDrawerContainer) return;
    if (!this._annotationDrawerContainer.parentElement) return;
    if (!this._annotationDrawerContainer.parentElement.parentElement) return;
    this._annotationDrawerContainer.parentElement.parentElement.removeEventListener('mousedown', this._boundMouseDown);
    this._annotationDrawerContainer.parentElement.parentElement.removeEventListener('mousemove', this._boundMouseMove);
    this._annotationDrawerContainer.parentElement.parentElement.removeEventListener('mouseup', this._boundMouseUp);
  }

  /**
   * Handler for initial mouse-down: creates the new shape instance.
   */
  private _initMouseDown() {
    const { type, ...rest } = this._drawConfig;
    this.createShape(type, rest);
  }

  /**
   * Handler for mouse up (stop drawing).
   */
  private _onMouseDown(event: MouseEvent) {
    if (!this._annotationDrawerContainer || !this._activeAnnotation || !this._pdfState) return;
    if (!event.target) {
      console.error('Failed to draw annotation. Target not found.');
      return;
    }
    event.preventDefault();

    const rect = this._annotationDrawerContainer.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    const pageNumber = (event?.target as HTMLElement | null)?.parentElement?.id?.split('-')?.[1];
    this._activeAnnotation.startDrawing(x, y, pageNumber ? parseInt(pageNumber) : this._pdfState.currentPage);
  }

  /**
   * Handler for mouse move (update drawing).
   */
  private _onMouseMove(event: MouseEvent) {
    if (!this._annotationDrawerContainer || !this._activeAnnotation) return;
    if (!this._activeAnnotation.isDrawing) return;
    event.preventDefault();

    const rect = this._annotationDrawerContainer.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    this._activeAnnotation.updateDrawing(x, y);
  }

  /**
   * Handler for mouse up (stop drawing).
   */
  private _onMouseUp() {
    if (!this._activeAnnotation) return;
    this._activeAnnotation.stopDrawing();
    this._removeListeners();
    this._onAnnotationSelection(this._activeAnnotation.getConfig());
    this._activeAnnotation = null; // Reset so another shape can be drawn next time
    this.setPointerEvent('none');
  }

  /**
   * Enable or disable pointer events on the drawing container.
   */
  public setPointerEvent(pointerEvent: 'all' | 'none') {
    if (!this._annotationDrawerContainer) return;
    this._annotationDrawerContainer.style.pointerEvents = pointerEvent;
  }

  /**
   * Create a new annotation of the given type and config, then begin drawing.
   *
   * @param type   The shape type ('rectangle' | 'ellipse', etc.)
   * @param config Optional override of drawConfig properties
   */
  public createShape(
    type: ShapeType,
    config: {
      fillColor?: string;
      strokeColor?: string;
      strokeWidth?: number;
      strokeStyle?: string;
      opacity?: number;
      id?: string;
    } = {},
  ): void {
    if (!this._annotationDrawerContainer || !this._pdfState) return;

    // Deselect all so we start fresh
    this.deselectAll();
    this._addListeners();

    // Use the factory to create the shape
    this._activeAnnotation = AnnotationFactory.createAnnotation({
      type,
      annotationDrawerContainer: this._annotationDrawerContainer,
      pdfState: this._pdfState,
      fillColor: config.fillColor ?? this._drawConfig.fillColor!,
      strokeColor: config.strokeColor ?? this._drawConfig.strokeColor!,
      strokeWidth: config.strokeWidth ?? this._drawConfig.strokeWidth!,
      strokeStyle: config.strokeStyle ?? this._drawConfig.strokeStyle!,
      opacity: config.opacity ?? this._drawConfig.opacity!,
      id: config?.id,
    });

    this._annotations.push(this._activeAnnotation);
  }

  /**
   * Internal helper to draw an existing ShapeConfig programmatically
   * (e.g., loading saved annotations).
   */
  private _drawShape(shapeConfig: ShapeConfig, revokeSelection: boolean) {
    if (!this._annotationDrawerContainer || !this._pdfState) return;

    // Create the shape
    const shape = AnnotationFactory.createAnnotation({
      type: shapeConfig.type,
      annotationDrawerContainer: this._annotationDrawerContainer,
      pdfState: this._pdfState,
      fillColor: shapeConfig.fillColor ?? this._drawConfig.fillColor!,
      strokeColor: shapeConfig.strokeColor ?? this._drawConfig.strokeColor!,
      strokeWidth: shapeConfig.strokeWidth ?? this._drawConfig.strokeWidth!,
      strokeStyle: shapeConfig.strokeStyle ?? this._drawConfig.strokeStyle!,
      opacity: shapeConfig.opacity ?? this._drawConfig.opacity!,
      id: shapeConfig.id,
    });

    if (shapeConfig.type === 'rectangle') {
      (shape as any).draw(shapeConfig.x0 ?? 0, shapeConfig.x1 ?? 0, shapeConfig.y0 ?? 0, shapeConfig.y1 ?? 0, shapeConfig.pageNumber);
    } else if (shapeConfig.type === 'ellipse') {
      (shape as any).draw(shapeConfig.cx ?? 0, shapeConfig.cy ?? 0, shapeConfig.rx ?? 0, shapeConfig.ry ?? 0, shapeConfig.pageNumber);
    } else if (shapeConfig.type === 'line') {
      (shape as any).draw(shapeConfig.x1 ?? 0, shapeConfig.y1 ?? 0, shapeConfig.x2 ?? 0, shapeConfig.y2 ?? 0, shapeConfig.pageNumber);
    }

    if (revokeSelection) {
      (shape as any).revokeSelection();
    }

    this._annotations.push(shape);
    this._activeAnnotation = null;
    this.setPointerEvent('none');
    return shape;
  }

  /**
   * Add an annotation to the viewer. This is a wrapper around drawShape.
   * @param shapeConfig The configuration for the shape.
   * @param scrollIntoView Whether to scroll the annotation into view.
   */
  public addAnnotation(shapeConfig: ShapeConfig, scrollIntoView = false, revokeSelection = false): void {
    if (this._annotations.some((a) => a.annotationId === shapeConfig.id)) return;
    const shape = this._drawShape(shapeConfig, revokeSelection);
    if (!shape) {
      console.error('Failed to create annotation');
      return;
    }

    if (scrollIntoView && shape.scrollToView) {
      shape.scrollToView();
    }
    shape.deselect();
  }

  /**
   * Update an existing annotation. This is a placeholder and should be
   * implemented in subclasses or specific managers.
   * @param annotation The annotation to update.
   */
  public updateAnnotation(annotation: ShapeConfig): void {
    console.log('updateAnnotation not implemented in AnnotationManager');
  }

  /**
   * Delete an annotation by its ID.
   * @param annotationId The ID of the annotation to delete.
   */
  public deleteAnnotation(annotationId: string) {
    const idx = this._annotations.findIndex((a) => a.annotationId === annotationId);
    if (idx > -1) {
      this._annotations[idx].deleteAnnotation(true);
      this._annotations.splice(idx, 1);
    }
  }

  /**
   * Select an annotation and notify the selection manager.
   * @param annotation The annotation to select.
   */
  public selectAnnotation(annotation: IAnnotation): void {
    // Deselect all first
    this.deselectAll();
    // Select the new annotation
    annotation.select();
    this._selectedAnnotation = annotation;
    // Notify selection manager
    this._selectionManager.setSelected({
      id: annotation.annotationId,
      type: annotation.type,
    });
  }

  /**
   * Deselect all annotations.
   */
  public deselectAll(): void {
    this._annotations.forEach((annotation) => annotation.deselect());
    this._selectedAnnotation = null;
  }

  /**
   * Handle annotation selection from external events.
   * @param annotationData The data of the selected annotation.
   */
  private _onAnnotationSelection(annotationData: Partial<ShapeConfig>) {
    if (annotationData['id'] == undefined) {
      throw Error('annotation id missing!');
    }
    const found = this._annotations.find((a) => a.annotationId === annotationData.id);
    if (found) {
      this.selectAnnotation(found);
    }
  }

  /**
   * Cleanup resources, event handlers, subscriptions
   */
  public destroy(): void {
    this._removeListeners();
    if (this._selectionUnsubscribe) {
      this._selectionUnsubscribe();
    }
    this._pdfState?.off('ANNOTATION_SELECTED', this._boundAnnotationSelection);
    // Optionally remove all shapes from DOM:
    // this._annotations.forEach(a => a.deleteAnnotation(true));
    // this._annotations = [];
    this._annotationDrawerContainer = null;
    this._activeAnnotation = null;
    this._selectedAnnotation = null;
  }
}
