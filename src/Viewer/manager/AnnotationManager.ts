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

import { RectConfig } from '../../types/geometry';
import { RectangleAnnotation } from '../annotation/RectangleAnnotation';
import PdfState from '../components/PdfState';
import { ISelectable, SelectionManager } from './SelectionManager';

export class AnnotationManager {
  private container: HTMLElement | null;
  private activeAnnotation: RectangleAnnotation | null = null;
  private selectedAnnotation: RectangleAnnotation | null = null;
  private annotations: RectangleAnnotation[] = [];
  private __pdfState: PdfState | null = null;
  private focusedShape: [number, string] | [] = [];
  private selectionUnsubscribe: () => void;
  private selectionManager: SelectionManager;

  // Store references to event handlers
  private boundMouseDown = this.onMouseDown.bind(this);
  private boundMouseMove = this.onMouseMove.bind(this);
  private boundMouseUp = this.onMouseUp.bind(this);

  constructor(container: HTMLElement, pdfState: PdfState, selectionManager: SelectionManager) {
    this.container = container;
    this.__pdfState = pdfState;
    this.selectionManager = selectionManager;
    this.selectionUnsubscribe = selectionManager.onSelectionChange((selectedShape: ISelectable | null) => {
      if (this.selectedAnnotation && (!selectedShape || this.selectedAnnotation.getId !== selectedShape.id)) {
        this.deselectAll();
      }
    });
    pdfState.on('ANNOTATION_SELECTED', this.onAnnotationSelection.bind(this));
  }

  set pdfState(pdfState: PdfState) {
    this.__pdfState = pdfState;
  }

  public setPointerEvent(pointerEvent: 'all' | 'none') {
    if (!this.container) return;
    this.container.style.pointerEvents = pointerEvent;
  }

  public selectAnnotation(annotation: RectangleAnnotation): void {
    // First, deselect any annotation in this manager
    this.deselectAll();
    // Select the new annotation
    annotation.select();
    this.selectedAnnotation = annotation;
    // Notify the centralized selection manager about the new selection.
    this.selectionManager.setSelected({
      id: annotation.getId!,
      type: 'rectangle', // Adjust if you support other shapes.
    });
  }

  private addListeners() {
    if (!this.container) return;
    this.container.addEventListener('mousedown', this.boundMouseDown);
    this.container.addEventListener('mousemove', this.boundMouseMove);
    this.container.addEventListener('mouseup', this.boundMouseUp);
  }

  private removeListeners() {
    if (!this.container) return;
    this.container.removeEventListener('mousedown', this.boundMouseDown);
    this.container.removeEventListener('mousemove', this.boundMouseMove);
    this.container.removeEventListener('mouseup', this.boundMouseUp);
  }

  public createRectangle(fillColor: string, strokeColor: string, strokeWidth: number, strokeStyle: string) {
    if (!this.container) return;
    this.deselectAll();
    this.addListeners();
    this.activeAnnotation = new RectangleAnnotation(this.container, this.__pdfState!, fillColor, strokeColor, strokeWidth, strokeStyle);
    this.annotations.push(this.activeAnnotation);
  }

  private drawRectangle({
    pageNumber,
    x0,
    y0,
    x1,
    y1,
    fillColor,
    strokeColor,
    strokeWidth,
    strokeStyle,
  }: {
    pageNumber: number;
    x0: number;
    y0: number;
    x1: number;
    y1: number;
    fillColor?: string;
    strokeColor?: string;
    strokeWidth?: number;
    strokeStyle?: string;
  }) {
    if (!this.container) return;
    const fillCol = fillColor ?? 'transparent';
    const strokeCol = strokeColor ?? 'red';
    const strokeWid = strokeWidth ?? 2;
    const strokeSty = strokeStyle ?? 'solid';

    this.deselectAll();
    this.activeAnnotation = new RectangleAnnotation(this.container, this.__pdfState!, fillCol, strokeCol, strokeWid, strokeSty);
    this.activeAnnotation.draw(x0, x1, y0, y1, pageNumber);
    this.activeAnnotation.stopDrawing(false);
    this.annotations.push(this.activeAnnotation);
    this.setPointerEvent('none');
  }

  get registeredFocus() {
    return this.focusedShape;
  }

  private onMouseDown(event: MouseEvent) {
    if (!this.container) return;
    if (!this.activeAnnotation) return;
    event.preventDefault();

    const rect = this.container.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    this.activeAnnotation.startDrawing(x, y);
  }

  private onMouseMove(event: MouseEvent) {
    if (!this.container) return;
    if (!this.activeAnnotation || !this.activeAnnotation.isDrawing) return;
    event.preventDefault();

    const rect = this.container.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    this.activeAnnotation.updateDrawing(x, y);
  }

  private onMouseUp() {
    if (!this.activeAnnotation) return;

    this.activeAnnotation.stopDrawing();
    this.registerFocus();
    this.activeAnnotation = null; // Reset so another shape can be drawn next time
    this.removeListeners();
    this.setPointerEvent('none');
  }

  private registerFocus(annotationData: RectConfig | undefined = undefined) {
    const info = annotationData ?? this.activeAnnotation?.rectInfo;
    if (info && info['pageNumber'] != undefined && info['id'] != undefined) {
      this.focusedShape = [info['pageNumber'], info['id']];
    }
  }

  get getAnnotations(): RectangleAnnotation[] {
    return this.annotations;
  }

  public deselectAll(): void {
    this.annotations.forEach((annotation) => annotation.deselect());
    this.selectedAnnotation = null;
  }

  // public selectAnnotation(annotation: RectangleAnnotation): void {
  //   this.deselectAll();
  //   annotation.select();
  //   this.selectedAnnotation = annotation;
  // }

  private onAnnotationSelection(annotationData: Partial<RectConfig>) {
    if (annotationData['id'] == undefined) {
      throw Error('annotation id missing!');
    }
    if (annotationData['type'] == 'rectangle') {
      const annotationClicked = this.annotations.filter((annotation) => annotation.getId == annotationData['id']);
      if (annotationClicked && annotationClicked.length == 1) {
        this.selectAnnotation(annotationClicked[0]);
      }
    }
  }

  public deleteAnnotation(annotationId: string) {
    const annotationClicked = this.annotations.filter((annotation) => annotation.getId == annotationId);
    if (annotationClicked && annotationClicked.length == 1) {
      annotationClicked[0].deletAnnotation();
      const annotations = this.annotations.filter((annotation) => annotation.getId != annotationId);
      this.annotations = annotations;
    }
  }

  // public loadAnnotation(pageNumber: number) {
  //   if (!this.__pdfState) {
  //     console.error('Pdf State is not valid.');
  //     return;
  //   }

  //   const annotations = this.__pdfState.annotationInfo(pageNumber);

  //   annotations.forEach((annotation: RectConfig) => {
  //     this.drawRectangle(annotation);
  //   });

  //   if (annotations.length == 0) {
  //     this.setPointerEvent('none');
  //   }
  // }

  public addAnnotation(annotation: RectConfig, scrollIntoView = false): void {
    this.drawRectangle({
      x0: annotation.x0,
      y0: annotation.y0,
      x1: annotation.x1,
      y1: annotation.y1,
      fillColor: annotation.fillColor,
      strokeColor: annotation.strokeColor,
      strokeWidth: annotation.strokeWidth,
      strokeStyle: annotation.strokeStyle,
      pageNumber: annotation.pageNumber,
    });
    if (this.activeAnnotation && scrollIntoView) {
      this.activeAnnotation.scrollToView();
      this.activeAnnotation.revokeSelection();
    }
  }

  public updateAnnotation(annotation: RectConfig): void {
    console.log('updateAnnotation not implemented in AnnotationManager');
  }

  // When cleaning up the AnnotationManager (for example, when the page is removed):
  public destroy(): void {
    // Remove event listeners from the container, etc.
    this.removeListeners();
    // Unsubscribe from the selection manager.
    if (this.selectionUnsubscribe) {
      this.selectionUnsubscribe();
    }
    this.container = null;
    this.activeAnnotation = null;
    this.selectedAnnotation = null;
  }
}
