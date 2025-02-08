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

import { RectangleAnnotation } from '../annotation/RectangleAnnotation';
import PdfState from '../components/PdfState';

export class AnnotationManager {
  private container: HTMLElement;
  private activeAnnotation: RectangleAnnotation | null = null;
  private selectedAnnotation: RectangleAnnotation | null = null;
  private annotations: RectangleAnnotation[] = [];
  private __pdfState: PdfState | null = null;

  // Store references to event handlers
  private boundMouseDown = this.onMouseDown.bind(this);
  private boundMouseMove = this.onMouseMove.bind(this);
  private boundMouseUp = this.onMouseUp.bind(this);

  constructor(container: HTMLElement, pdfState: PdfState) {
    this.container = container;

    this.__pdfState = pdfState;
    pdfState.on('ANNOTATION_SELECTED', this.onAnnotationSelection.bind(this));
  }

  set pdfState(pdfState: PdfState) {
    this.__pdfState = pdfState;
  }

  private addListeners() {
    this.container.addEventListener('mousedown', this.boundMouseDown);
    this.container.addEventListener('mousemove', this.boundMouseMove);
    this.container.addEventListener('mouseup', this.boundMouseUp);
  }

  private removeListeners() {
    this.container.removeEventListener('mousedown', this.boundMouseDown);
    this.container.removeEventListener('mousemove', this.boundMouseMove);
    this.container.removeEventListener('mouseup', this.boundMouseUp);
  }

  public createRectangle(fillColor: string, strokeColor: string, strokeWidth: number, strokeStyle: string) {
    this.deselectAll();
    this.addListeners();
    this.activeAnnotation = new RectangleAnnotation(this.container, this.__pdfState!, fillColor, strokeColor, strokeWidth, strokeStyle);
    this.annotations.push(this.activeAnnotation);
  }

  private onMouseDown(event: MouseEvent) {
    console.log('mouse down');
    if (!this.activeAnnotation) return;

    const rect = this.container.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    this.activeAnnotation.startDrawing(x, y);
  }

  private onMouseMove(event: MouseEvent) {
    if (!this.activeAnnotation || !this.activeAnnotation.isDrawing) return;

    const rect = this.container.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    this.activeAnnotation.updateDrawing(x, y);
  }

  private onMouseUp() {
    if (!this.activeAnnotation) return;

    this.activeAnnotation.stopDrawing();
    this.activeAnnotation = null; // Reset so another shape can be drawn next time
    this.removeListeners();
  }

  get getAnnotations(): RectangleAnnotation[] {
    return this.annotations;
  }

  public deselectAll(): void {
    this.annotations.forEach((annotation) => annotation.deselect());
    this.selectedAnnotation = null;
  }

  public selectAnnotation(annotation: RectangleAnnotation): void {
    this.deselectAll();
    annotation.select();
    this.selectedAnnotation = annotation;
  }

  private onAnnotationSelection(event: any, type: 'rectangle') {
    if (type == 'rectangle') {
      let anntotationData = event as RectangleAnnotation;
      const annotationClicked = this.annotations.filter((annotation) => annotation.getId == anntotationData.getId);
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
      this.__pdfState?.emit('ANNOTATION_DELETED');
    }
  }
}
