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
import PdfState from '../components/PdfState';

/**
 * Base class for handling annotations in a PDF viewer.
 * Responsible for managing annotation elements, interactions, and coordinates.
 */
export class Annotation {
  /** The container element where the annotation SVG is placed */
  protected container: HTMLElement;

  /** The SVG element that represents the annotation */
  protected svg: SVGSVGElement;

  /** The actual annotation element inside the SVG (e.g., rectangle, line) */
  protected element: SVGElement | null = null;

  /** An invisible hit-area rectangle for interaction */
  protected hitElementRect: SVGElement | null = null;

  /** Flag to indicate if the annotation is being drawn */
  public isDrawing: boolean = false;

  /** Starting X-coordinate of the annotation */
  protected startX: number = 0;

  /** Starting Y-coordinate of the annotation */
  protected startY: number = 0;

  /** Reference to the PdfState instance for event handling */
  protected __pdfState: PdfState | null = null;

  /**
   * Creates a new annotation instance.
   *
   * @param {HTMLElement} container - The container where the annotation is placed.
   * @param {PdfState} pdfState - The PdfState instance to manage annotation state.
   */
  constructor(container: HTMLElement, pdfState: PdfState) {
    this.container = container;
    this.__pdfState = pdfState;

    // Create a new SVG instance for this annotation
    this.svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    this.svg.style.position = 'absolute';
    this.svg.setAttribute('tabindex', '0'); // Enables keyboard focus
    this.svg.style.outline = 'none';
    this.svg.setAttribute('annotation-id', this.generateUniqueId());
    this.svg.style.pointerEvents = 'none'; // Prevents unwanted interactions
    this.container.appendChild(this.svg);
  }

  /**
   * Handles click events on an annotation.
   * Emits an event when an annotation is selected.
   *
   * @param {MouseEvent} event - The mouse event triggering the click.
   * @param {any} context - The context object associated with the annotation.
   * @param {'rectangle'} type - The type of annotation clicked.
   */
  protected onAnnotationClick(event: MouseEvent | null, annotationData: Partial<RectConfig>) {
    if (event) {
      event.stopPropagation();
    }
    this.__pdfState?.emit('ANNOTATION_SELECTED', annotationData);
  }

  /**
   * Starts drawing the annotation.
   *
   * @param {number} x - The X-coordinate where drawing starts.
   * @param {number} y - The Y-coordinate where drawing starts.
   */
  protected startDrawing(x: number, y: number): void {
    this.isDrawing = true;
    this.startX = x;
    this.startY = y;
  }

  /**
   * Stops drawing the annotation and logs its coordinates.
   */
  protected stopDrawing(): void {
    this.isDrawing = false;
    if (this.__pdfState) {
      const button = document.querySelector(`#${this.__pdfState.containerId} .a-annotation-container-icon`) as HTMLElement;
      if (button) {
        button.parentElement!.style.backgroundColor = '';
      }
      (this.container as HTMLElement).style.cursor = 'default';
    }
  }

  /**
   * Retrieves the coordinates of the annotation.
   *
   * @returns {{ x0: number; x1: number; y0: number; y1: number } | null}
   * An object containing the annotation's top-left (x0, y0)
   * and its width (x1) and height (y1), or `null` if the SVG is not available.
   */
  protected getCoordinates(): { x0: number; x1: number; y0: number; y1: number } | null {
    if (!this.svg) return null;

    const bbox = (this.svg as any).getBBox(); // Get bounding box of SVG

    const top = parseInt(this.svg.style.top);
    const left = parseInt(this.svg.style.left);

    const rectInfo = JSON.stringify({
      x0: left, // X-coordinate of the annotation
      x1: bbox.width, // Width of the annotation
      y0: top, // Y-coordinate of the annotation
      y1: bbox.height, // Height of the annotation
    });

    return JSON.parse(rectInfo);
  }

  /**
   * Generates a unique id string.
   */
  private generateUniqueId(): string {
    return 'anno-' + Math.random().toString(36).substr(2, 9) + '-' + Date.now().toString();
  }
}
