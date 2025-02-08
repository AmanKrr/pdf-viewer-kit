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

import PdfState from '../components/PdfState';

export class Annotation {
  protected container: HTMLElement;
  protected svg: SVGSVGElement;
  protected element: SVGElement | null = null;
  public isDrawing: boolean = false;
  protected startX: number = 0;
  protected startY: number = 0;
  protected __pdfState: PdfState | null = null;

  constructor(container: HTMLElement, pdfState: PdfState) {
    this.container = container;
    this.__pdfState = pdfState;

    // Create a new SVG instance for this annotation
    this.svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    this.svg.style.position = 'absolute';
    this.svg.setAttribute('tabindex', '0');
    this.svg.style.outline = 'none';
    this.svg.setAttribute('annotation-id', Date.now().toString());
    this.svg.style.pointerEvents = 'none';
    this.container.appendChild(this.svg);
  }

  protected onAnnotationClick(event: MouseEvent, context: any, type: 'rectangle') {
    event.stopPropagation();
    this.__pdfState?.emit('ANNOTATION_SELECTED', context, type);
  }

  protected startDrawing(x: number, y: number): void {
    this.isDrawing = true;
    this.startX = x;
    this.startY = y;
  }

  protected stopDrawing(): void {
    this.isDrawing = false;
    this.svg.style.pointerEvents = 'all';
  }

  protected getCoordinates(): { x0: number; x1: number; y0: number; y1: number } | null {
    if (!this.svg) return null;

    const bbox = (this.svg as any).getBBox();
    return {
      x0: bbox.x,
      x1: bbox.x + bbox.width,
      y0: bbox.y,
      y1: bbox.y + bbox.height,
    };
  }
}
