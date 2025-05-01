/*
  Copyright 2025 Aman Kumar

  Licensed under the Apache License, Version 2.0 (the "License");
  You may not use this file except in compliance with the License.
  You may obtain a copy of the License at

      http://www.apache.org/licenses/LICENSE-2.0

  Unless required by applicable law or agreed to in writing, software
  distributed under the License is distributed on an "AS IS" BASIS,
  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
  See the License for the specific language governing permissions and
  limitations under the License.
*/

import { IAnnotation } from '../../interface/IAnnotation';
import { EllipseConfig, RectangleConfig } from '../../types/geometry';
import PdfState from '../ui/PDFState';

/**
 * Abstract base class for handling annotations in a PDF viewer.
 * Provides shared logic for creating an SVG container, tracking drawing state, etc.
 */
export abstract class Annotation implements IAnnotation {
  public readonly annotationId: string;
  public abstract readonly type: string;

  protected __annotationDrawerContainer: HTMLElement;
  protected __svg: SVGSVGElement;
  protected __element: SVGElement | null = null;
  protected __hitElementRect: SVGElement | null = null;
  public isDrawing: boolean = false;

  protected __startX: number = 0;
  protected __startY: number = 0;
  protected __pdfState: PdfState | null = null;

  /**
   * Creates a new annotation instance.
   *
   * @param {HTMLElement} annotationDrawerContainer - The container where the annotation is placed.
   * @param {PdfState} pdfState - The PdfState instance to manage annotation state.
   */
  constructor(annotationDrawerContainer: HTMLElement, pdfState: PdfState, id?: string) {
    this.annotationId = id ?? this.__generateUniqueId();

    this.__annotationDrawerContainer = annotationDrawerContainer;
    this.__pdfState = pdfState;

    // Create a new SVG instance for this annotation
    this.__svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    this.__svg.style.position = 'absolute';
    this.__svg.setAttribute('tabindex', '0'); // Enables keyboard focus
    this.__svg.style.outline = 'none';

    this.__svg.setAttribute('annotation-id', this.annotationId);

    // By default, pointer events are off. Derived classes can enable if needed
    this.__svg.style.pointerEvents = 'none';

    this.__annotationDrawerContainer.appendChild(this.__svg);
  }

  /**
   * Begins the drawing process for the annotation.
   * @param x - The starting X-coordinate.
   * @param y - The starting Y-coordinate.
   */
  public startDrawing(x: number, y: number, pageNumber: number): void {
    this.isDrawing = true;
    this.__startX = x;
    this.__startY = y;
  }

  /**
   * Updates the drawing of the annotation as the pointer moves.
   * @param x - The current X-coordinate.
   * @param y - The current Y-coordinate.
   */
  public abstract updateDrawing(x: number, y: number): void;

  /**
   * Stops the drawing process for the annotation.
   */
  public stopDrawing(): void {
    this.isDrawing = false;

    if (this.__pdfState) {
      const button = document.querySelector(`#${this.__pdfState.containerId} .a-annotation-container-icon`) as HTMLElement;
      if (button && button.parentElement?.classList.contains('active')) {
        button.parentElement.classList.toggle('active');
      }
      (this.__annotationDrawerContainer as HTMLElement).style.cursor = 'default';
    }
  }

  /**
   * Selects the annotation.
   */
  public abstract select(): void;

  /**
   * Deselects the annotation.
   */
  public abstract deselect(): void;

  /**
   * Removes the annotation from the DOM.
   */
  public abstract deleteAnnotation(suppressEvent: boolean): void;

  /**
   * Returns the configuration data for the annotation.
   * @returns A record representing the annotation configuration.
   */
  public abstract getConfig(): Record<string, any>;

  /**
   * Optionally scrolls to the annotation's position in the PDF view.
   * This can be implemented in derived classes if needed.
   */
  public scrollToView?(): void {}

  /**
   * Emits an event when the annotation is clicked, indicating it's selected.
   * @param event - The MouseEvent triggering the click.
   * @param annotationData - Data describing the annotation.
   */
  protected __onAnnotationClick(event: MouseEvent | null, annotationData: Partial<RectangleConfig | EllipseConfig>) {
    if (event) {
      event.stopPropagation();
    }
    this.__pdfState?.emit('ANNOTATION_SELECTED', annotationData);
  }

  /**
   * Generates a unique ID for the annotation.
   * @returns A unique string ID.
   */
  protected __generateUniqueId(): string {
    return 'anno-' + Math.random().toString(36).substr(2, 9) + '-' + Date.now().toString();
  }
}
