/*
  Copyright 2025 Aman Kumar

  Licensed under the Apache License, Version 2.0 (the "License");
  you may not use this file except in compliance with the License.
  you may obtain a copy of the License at

      http://www.apache.org/licenses/LICENSE-2.0

  Unless required by applicable law or agreed to in writing, software
  distributed under the License is distributed on an "AS IS" BASIS,
  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
  See the License for the specific language governing permissions and
  limitations under the License.
*/

import { IAnnotation } from '../../interface/IAnnotation';
import { DrawConfig, ShapeConfig, ShapeType } from '../../types/geometry.types';
import { normalizeRect, isModernFormat } from '../../utils/annotation-utils';
import { AnnotationFactory } from '../annotations/annotation-factory';
import PageVirtualization from '../ui/page-virtualization.component';
import { ISelectable, SelectionManager } from './selection.manager';

/**
 * Manages lifecycle of annotations: creation, interactive drawing,
 * selection, deselection, serialization, and cleanup.
 */
export class AnnotationManager {
  private readonly _pageVirtualization: PageVirtualization;
  private _annotationDrawerContainer: HTMLElement | null;

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
  private _boundDeleteKey = this._onDeleteKey.bind(this);

  /**
   * @param annotationDrawerContainer The HTML container for drawing annotations
   * @param pdfState                  Shared PdfState instance
   * @param selectionManager          Handles selection events
   */
  constructor(annotationDrawerContainer: HTMLElement, pageVirtualization: PageVirtualization, selectionManager: SelectionManager) {
    this._annotationDrawerContainer = annotationDrawerContainer;
    this._pageVirtualization = pageVirtualization;
    this._selectionManager = selectionManager;

    // Listen for external selection changes
    this._selectionUnsubscribe = selectionManager.onSelectionChange((selectedShape: ISelectable | null) => {
      if (this._selectedAnnotation && (!selectedShape || this._selectedAnnotation.annotationId !== selectedShape.id)) {
        this.deselectAll();
      }
    });

    this.events.on('ANNOTATION_SELECTED', this._boundAnnotationSelection);

    // Add global delete key handler
    this._addGlobalDeleteHandler();
  }

  /**
   * Adds a global delete key handler to the document
   */
  private _addGlobalDeleteHandler(): void {
    document.addEventListener('keydown', this._boundDeleteKey);
  }

  /**
   * Handles delete/backspace key presses globally
   */
  private _onDeleteKey(event: KeyboardEvent): void {
    if (event.key === 'Delete' || event.key === 'Backspace') {
      // Only handle delete if we have a selected annotation and we're not in an input field
      if (this._selectedAnnotation && !this._isInputElement(event.target as Element)) {
        event.preventDefault();
        this._showDeleteConfirmation();
      }
    }
  }

  /**
   * Shows a confirmation popup before deleting the selected annotation
   */
  private _showDeleteConfirmation(): void {
    if (!this._selectedAnnotation) return;

    // Create confirmation popup
    const popup = document.createElement('div');
    popup.className = 'a-delete-confirmation-popup';
    popup.innerHTML = `
      <div class="a-popup-content">
        <div class="a-popup-header">
          <h3>Delete Annotation</h3>
        </div>
        <div class="a-popup-body">
          <p>Are you sure you want to delete this annotation?</p>
          <p class="a-annotation-type">Type: ${this._selectedAnnotation.type}</p>
        </div>
        <div class="a-popup-actions">
          <button class="a-btn a-btn-cancel" type="button">Cancel</button>
          <button class="a-btn a-btn-delete" type="button">Delete</button>
        </div>
      </div>
    `;

    // Add event listeners
    const cancelBtn = popup.querySelector('.a-btn-cancel') as HTMLButtonElement;
    const deleteBtn = popup.querySelector('.a-btn-delete') as HTMLButtonElement;

    cancelBtn.addEventListener('click', () => {
      document.body.removeChild(popup);
    });

    deleteBtn.addEventListener('click', () => {
      this.deleteSelectedAnnotation();
      document.body.removeChild(popup);
    });

    // Close on backdrop click
    popup.addEventListener('click', (e) => {
      if (e.target === popup) {
        document.body.removeChild(popup);
      }
    });

    // Close on Escape key
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        document.body.removeChild(popup);
        document.removeEventListener('keydown', handleEscape);
      }
    };
    document.addEventListener('keydown', handleEscape);

    // Add to DOM
    document.body.appendChild(popup);

    // Focus the delete button for better accessibility
    deleteBtn.focus();
  }

  /**
   * Checks if the target element is an input field where we shouldn't handle delete
   */
  private _isInputElement(element: Element): boolean {
    if (!element) return false;

    const tagName = element.tagName.toLowerCase();
    const inputTypes = ['input', 'textarea', 'select'];

    if (inputTypes.includes(tagName)) return true;

    // Check if element has contenteditable attribute
    if (element.hasAttribute('contenteditable')) return true;

    // Check if element is inside an input field
    const closestInput = element.closest('input, textarea, select, [contenteditable]');
    return !!closestInput;
  }

  /**
   * Deletes the currently selected annotation
   */
  public deleteSelectedAnnotation(): void {
    if (this._selectedAnnotation) {
      const annotationId = this._selectedAnnotation.annotationId;
      this.deleteAnnotation(annotationId);
      this._selectedAnnotation = null;
    }
  }

  /**
   * Shows delete confirmation popup for the currently selected annotation
   * This can be called programmatically from other parts of the application
   */
  public showDeleteConfirmation(): void {
    if (this._selectedAnnotation) {
      this._showDeleteConfirmation();
    }
  }

  get instanceId(): string {
    return this._pageVirtualization.instanceId;
  }

  get containerId(): string {
    return this._pageVirtualization.containerId;
  }

  get state() {
    return this._pageVirtualization.state;
  }

  get events() {
    return this._pageVirtualization.events;
  }

  /**
   * Updates the drawing configuration and applies it to existing selected annotations.
   */
  set drawConfig(config: DrawConfig & { type: ShapeType }) {
    this._drawConfig = { ...config };

    // Update the selected annotation if it exists
    if (this._selectedAnnotation) {
      this._updateSelectedAnnotationStyle(config);
    }
  }

  private _updateSelectedAnnotationStyle(config: DrawConfig & { type: ShapeType }): void {
    if (!this._selectedAnnotation) return;

    // Update the selected annotation with new style
    if (config.strokeStyle !== undefined) {
      (this._selectedAnnotation as any).updateStrokeStyle?.(config.strokeStyle);
    }
    if (config.strokeWidth !== undefined) {
      (this._selectedAnnotation as any).updateStrokeWidth?.(config.strokeWidth);
    }
    if (config.strokeColor !== undefined) {
      (this._selectedAnnotation as any).updateStrokeColor?.(config.strokeColor);
    }
    if (config.fillColor !== undefined) {
      (this._selectedAnnotation as any).updateFillColor?.(config.fillColor);
    }
    if (config.opacity !== undefined) {
      (this._selectedAnnotation as any).updateOpacity?.(config.opacity);
    }
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
   * Returns the currently selected annotation
   */
  get getSelectedAnnotation(): IAnnotation | null {
    return this._selectedAnnotation;
  }

  /**
   * Checks if there's currently a selected annotation
   */
  public hasSelectedAnnotation(): boolean {
    return this._selectedAnnotation !== null;
  }

  /**
   * Gets the type of the currently selected annotation
   */
  public getSelectedAnnotationType(): string | null {
    return this._selectedAnnotation?.type || null;
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

    // Emit drawing started event
    this.events.emit('DRAWING_STARTED');
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

    // Emit drawing finished event
    this.events.emit('DRAWING_FINISHED');
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
    if (!this._annotationDrawerContainer || !this._activeAnnotation) return;
    if (!event.target) {
      console.error('Failed to draw annotation. Target not found.');
      return;
    }
    event.preventDefault();

    const rect = this._annotationDrawerContainer.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    const pageNumber = (event?.target as HTMLElement | null)?.parentElement?.getAttribute('data-page-number');
    this._activeAnnotation.startDrawing(x, y, pageNumber ? parseInt(pageNumber) : this.state.currentPage);
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

    // Check if the annotation is valid before processing it
    if (this._activeAnnotation.isValidAnnotation) {
      this._onAnnotationSelection(this._activeAnnotation.getConfig());
    } else {
      // Remove invalid annotation from the annotations array
      const index = this._annotations.indexOf(this._activeAnnotation);
      if (index > -1) {
        this._annotations.splice(index, 1);
      }
    }

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
    if (!this._annotationDrawerContainer) return;

    // Deselect all so we start fresh
    this.deselectAll();
    this._addListeners();

    // Use the factory to create the shape
    this._activeAnnotation = AnnotationFactory.createAnnotation({
      type,
      annotationDrawerContainer: this._annotationDrawerContainer,
      instances: {
        events: this._pageVirtualization.events,
        state: this._pageVirtualization.state,
        instanceId: this._pageVirtualization.instanceId,
        containerId: this._pageVirtualization.containerId,
      },
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
    if (!this._annotationDrawerContainer) return;

    // Create the shape
    const shape = AnnotationFactory.createAnnotation({
      type: shapeConfig.type,
      annotationDrawerContainer: this._annotationDrawerContainer,
      instances: {
        events: this._pageVirtualization.events,
        state: this._pageVirtualization.state,
        instanceId: this._pageVirtualization.instanceId,
        containerId: this._pageVirtualization.containerId,
      },
      fillColor: shapeConfig.fillColor ?? this._drawConfig.fillColor!,
      strokeColor: shapeConfig.strokeColor ?? this._drawConfig.strokeColor!,
      strokeWidth: shapeConfig.strokeWidth ?? this._drawConfig.strokeWidth!,
      strokeStyle: shapeConfig.strokeStyle ?? this._drawConfig.strokeStyle!,
      opacity: shapeConfig.opacity ?? this._drawConfig.opacity!,
      id: shapeConfig.id,
    });

    if (shapeConfig.type === 'rectangle') {
      // For modern format, x0,y0 are position, x1,y1 are width,height
      // For legacy format, x0,y0,x1,y1 are corner coordinates
      let x0, y0, x1, y1;

      if (isModernFormat(shapeConfig)) {
        // Modern format: left,top are position, width,height are dimensions
        x0 = (shapeConfig as any).left;
        y0 = (shapeConfig as any).top;
        x1 = (shapeConfig as any).left + (shapeConfig as any).width;
        y1 = (shapeConfig as any).top + (shapeConfig as any).height;
      } else {
        // Legacy format: x0,y0,x1,y1 are corner coordinates
        x0 = (shapeConfig as any).x0;
        y0 = (shapeConfig as any).y0;
        x1 = (shapeConfig as any).x1;
        y1 = (shapeConfig as any).y1;
      }

      // Now normalize to get top-left position and dimensions
      const { top, left, width, height } = normalizeRect(x0, y0, x1, y1);
      (shape as any).draw(left, top, width, height, shapeConfig.pageNumber, shapeConfig.interactive);
    } else if (shapeConfig.type === 'ellipse') {
      (shape as any).draw(
        (shapeConfig as any).cx ?? 0,
        (shapeConfig as any).cy ?? 0,
        (shapeConfig as any).rx ?? 0,
        (shapeConfig as any).ry ?? 0,
        shapeConfig.pageNumber,
        shapeConfig.interactive,
      );
    } else if (shapeConfig.type === 'line') {
      (shape as any).draw(
        (shapeConfig as any).x1 ?? 0,
        (shapeConfig as any).y1 ?? 0,
        (shapeConfig as any).x2 ?? 0,
        (shapeConfig as any).y2 ?? 0,
        shapeConfig.pageNumber,
        shapeConfig.interactive,
      );
    }

    if (!revokeSelection) {
      (shape as any).revokeSelection();
    }

    this._annotations.push(shape);
    this._activeAnnotation = null;
    this.setPointerEvent('none');
    return shape;
  }

  /**
   * Add an annotation to the viewer. Supports both modern and legacy coordinate formats.
   * @param shapeConfig The configuration for the shape (modern or legacy format).
   */
  public addAnnotation(shapeConfig: any): void {
    // Normalize coordinates to legacy format for internal compatibility
    let normalizedConfig = { ...shapeConfig };

    // Handle modern coordinate format for rectangles
    if (shapeConfig.type === 'rectangle' && isModernFormat(shapeConfig)) {
      // Convert modern format to legacy format (viewport coordinates)
      const legacyCoords = {
        x0: shapeConfig.left,
        y0: shapeConfig.top,
        x1: shapeConfig.left + shapeConfig.width,
        y1: shapeConfig.top + shapeConfig.height,
      };

      normalizedConfig = {
        ...shapeConfig,
        x0: legacyCoords.x0,
        y0: legacyCoords.y0,
        x1: legacyCoords.x1,
        y1: legacyCoords.y1,
        // Remove modern format properties
        left: undefined,
        top: undefined,
        width: undefined,
        height: undefined,
      };
    }

    // Process the annotation
    this._processAnnotation(normalizedConfig);
  }

  /**
   * Process annotation after coordinate conversion
   */
  private _processAnnotation(normalizedConfig: any): void {
    if (this._annotations.some((a) => a.annotationId === normalizedConfig.id)) return;
    const shape = this._drawShape(normalizedConfig as ShapeConfig, normalizedConfig.interactive);
    if (!shape) {
      console.error('Failed to create annotation');
      return;
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
    this.events.off('ANNOTATION_SELECTED', this._boundAnnotationSelection);

    // Remove global delete key handler
    document.removeEventListener('keydown', this._boundDeleteKey);

    // Optionally remove all shapes from DOM:
    // this._annotations.forEach(a => a.deleteAnnotation(true));
    // this._annotations = [];
    this._annotationDrawerContainer = null;
    this._activeAnnotation = null;
    this._selectedAnnotation = null;
  }
}
