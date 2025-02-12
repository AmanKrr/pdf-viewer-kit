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
import { Annotation } from './Annotation';
import { Resizer } from './Resizer';

export class RectangleAnnotation extends Annotation {
  private fillColor: string;
  private strokeColor: string;
  private strokeWidth: number;
  private strokeStyle: string;
  private resizer: Resizer | null = null;
  private onDeleteBind = this.onDeleteKey.bind(this);
  private isDragging: boolean = false;
  private offsetX: number = 0;
  private offsetY: number = 0;
  private originalLeft: number = 0;
  private originalTop: number = 0;
  private originalWidth: number = 0;
  private originalHeight: number = 0;
  private shapeInfo: {
    id: string;
    fillColor: string;
    strokeColor: string;
    strokeWidth: number;
    strokeStyle: string;
    x0?: number | undefined;
    x1?: number | undefined;
    y0?: number | undefined;
    y1?: number | undefined;
    type: 'rectangle';
    pageNumber: number | undefined;
  } | null = null;
  private pageNumber: number | undefined;

  constructor(container: HTMLElement, pdfState: PdfState, fillColor: string, strokeColor: string, strokeWidth: number, strokeStyle: string) {
    super(container, pdfState);
    this.fillColor = fillColor;
    this.strokeColor = strokeColor;
    this.strokeWidth = strokeWidth;
    this.strokeStyle = strokeStyle;
    this.__pdfState?.on('scaleChange', () => this.updateZoom(this.__pdfState?.scale!));
  }

  get getId() {
    return this.element?.id;
  }

  get rectInfo() {
    return this.shapeInfo;
  }

  private addDeleteEvent(): void {
    if (this.resizer) {
      this.svg.addEventListener('keydown', this.onDeleteBind);
    }
  }

  private removeDeleteEvent(): void {
    if (!this.resizer) {
      this.svg.removeEventListener('keydown', this.onDeleteBind);
    }
  }

  private onDeleteKey(event: KeyboardEvent) {
    if (event.key === 'Delete' || event.key === 'Backspace') {
      this.deletAnnotation();
    }
  }

  private createSvgRect(padding: string = '0', height: number = 0, width: number = 0) {
    this.element = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    this.element.id = this.svg.getAttribute('annotation-id')!;
    this.element.setAttribute('x', padding);
    this.element.setAttribute('y', padding);
    this.element.setAttribute('width', Math.abs(width).toString());
    this.element.setAttribute('height', Math.abs(height).toString());
    this.element.setAttribute('fill', this.fillColor);
    this.element.setAttribute('stroke', this.strokeColor);
    this.element.setAttribute('stroke-width', this.strokeWidth.toString());
    this.element.setAttribute('stroke-dasharray', this.getStrokeDashArray());

    this.svg.appendChild(this.element);

    // The invisible (hit test) rect
    this.hitElementRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    this.hitElementRect.setAttribute('x', padding);
    this.hitElementRect.setAttribute('y', padding);
    this.hitElementRect.setAttribute('width', Math.abs(width).toString());
    this.hitElementRect.setAttribute('height', Math.abs(height).toString());
    this.hitElementRect.setAttribute('fill', 'none');
    this.hitElementRect.setAttribute('stroke', 'transparent');
    this.hitElementRect.style.strokeWidth = (this.strokeWidth + 10).toString(); // increase if needed
    this.hitElementRect.style.cursor = 'pointer';
    // Make sure it receives pointer events even if the container is not interactive
    this.hitElementRect.style.pointerEvents = 'auto';
    this.hitElementRect.onclick = (event: MouseEvent) => this.onAnnotationClick(event, this.rectInfo!);
    // Append the hit test rect above or after the visible rect
    this.svg.appendChild(this.hitElementRect);
  }

  public startDrawing(x: number, y: number): void {
    super.startDrawing(x, y);
    this.svg.style.left = `${x}px`;
    this.svg.style.top = `${y}px`;
    this.createSvgRect();
    this.pageNumber = this.__pdfState?.currentPage;
  }

  public updateDrawing(x: number, y: number): void {
    if (!this.isDrawing || !this.element || !this.hitElementRect) return;

    const width = x - this.startX;
    const height = y - this.startY;

    const padding = 10;
    this.svg.setAttribute('width', (Math.abs(width) + padding * 2).toString());
    this.svg.setAttribute('height', (Math.abs(height) + padding * 2).toString());

    this.element.setAttribute('x', padding.toString());
    this.element.setAttribute('y', padding.toString());
    this.element.setAttribute('width', Math.abs(width).toString());
    this.element.setAttribute('height', Math.abs(height).toString());
    this.hitElementRect.setAttribute('x', padding.toString());
    this.hitElementRect.setAttribute('y', padding.toString());
    this.hitElementRect.setAttribute('width', Math.abs(width).toString());
    this.hitElementRect.setAttribute('height', Math.abs(height).toString());

    if (width < 0) this.svg.style.left = `${x - padding}px`;
    if (height < 0) this.svg.style.top = `${y - padding}px`;
  }

  private onShapeUpdate() {
    this.__pdfState?.emit('ANNOTATION_CREATED', this.rectInfo);
  }

  public stopDrawing(select = true): void {
    super.stopDrawing();
    this.maintainOriginalBounding();
    this.setRectInfo();
    if (select) {
      this.select();
      this.onAnnotationClick(null, this.rectInfo!);
    }
    this.onShapeUpdate();
  }

  private maintainOriginalBounding(zoomLevel = 0) {
    // Get the current zoom factor (defaulting to 1 if not set)
    const currentZoom = zoomLevel || this.__pdfState?.scale || 1;

    // Capture the current values—but convert them back to base coordinates.
    this.originalLeft = (parseFloat(this.svg.style.left) || 0) / currentZoom;
    this.originalTop = (parseFloat(this.svg.style.top) || 0) / currentZoom;
    this.originalWidth = parseFloat(this.svg.getAttribute('width') || '0') / currentZoom;
    this.originalHeight = parseFloat(this.svg.getAttribute('height') || '0') / currentZoom;
  }

  public select(): void {
    // ✅ Show resizers when the rectangle is selected
    if (!this.resizer) {
      this.resizer = new Resizer(this.svg, this.element! as any, this.onShapeUpdate.bind(this));
      this.svg.focus();
      this.addDeleteEvent();
    }
  }

  public deselect(): void {
    // ✅ Remove resizers when another shape is selected
    if (this.resizer) {
      this.resizer.removeResizers();
      this.resizer = null;
      this.removeDeleteEvent();
    }
  }

  private getStrokeDashArray(): string {
    return this.strokeStyle === 'dashed' ? '5,5' : this.strokeStyle === 'dotted' ? '2,2' : '0';
  }

  public deletAnnotation(): void {
    if (this.svg) {
      if (this.resizer) {
        this.resizer.removeResizers();
        this.resizer = null;
      }
      this.svg.remove();
    }
  }

  private updateZoom(zoomFactor: number): void {
    // Calculate new values based on the stored original values.
    const newLeft = this.originalLeft * zoomFactor;
    const newTop = this.originalTop * zoomFactor;
    const newWidth = this.originalWidth * zoomFactor;
    const newHeight = this.originalHeight * zoomFactor;

    // Update the annotation's SVG container.
    this.svg.style.left = newLeft + 'px';
    this.svg.style.top = newTop + 'px';
    this.svg.setAttribute('width', newWidth.toString());
    this.svg.setAttribute('height', newHeight.toString());

    // If you update internal elements (like the inner rect or hit test rect),
    // you may need to adjust those as well.
    if (this.element) {
      // Assuming a fixed padding of 10 was used during drawing:
      const padding = 10 * zoomFactor;
      this.element.setAttribute('x', padding.toString());
      this.element.setAttribute('y', padding.toString());
      this.element.setAttribute('width', (newWidth - padding * 2).toString());
      this.element.setAttribute('height', (newHeight - padding * 2).toString());
    }
    if (this.hitElementRect) {
      const padding = 10 * zoomFactor;
      this.hitElementRect.setAttribute('x', padding.toString());
      this.hitElementRect.setAttribute('y', padding.toString());
      this.hitElementRect.setAttribute('width', (newWidth - padding * 2).toString());
      this.hitElementRect.setAttribute('height', (newHeight - padding * 2).toString());
    }

    // Tell the resizer to re-sync its overlay and handles.
    if (this.resizer) {
      this.resizer.syncOverlayToSvg();
    }
  }

  public draw(x0: number, x1: number, y0: number, y1: number, pageNumber: number) {
    const padding = 10;

    this.startX = x0;
    this.startY = y0;
    this.isDrawing = false;

    this.svg.style.left = x0 + 'px';
    this.svg.style.top = y0 + 'px';
    this.svg.setAttribute('width', (x1 + padding * 2).toString());
    this.svg.setAttribute('height', (y1 + padding * 2).toString());
    this.pageNumber = pageNumber;

    this.createSvgRect('10', y1, x1);
    this.maintainOriginalBounding(1);
    this.updateZoom(this.__pdfState?.scale!);
  }

  private setRectInfo() {
    const info = {
      ...this.getCoordinates(),
      id: this.element!.id,
      pageNumber: this.pageNumber,
      fillColor: this.fillColor,
      strokeColor: this.strokeColor,
      strokeWidth: this.strokeWidth,
      strokeStyle: this.strokeStyle,
      type: 'rectangle',
    };
    this.shapeInfo = info as any;
  }

  public revokeSelection() {
    if (this.hitElementRect) {
      this.hitElementRect.style.cursor = 'default';
      this.hitElementRect.onclick = null;
    }
  }

  public scrollToView() {
    if (this.svg) {
      this.svg.scrollIntoView({ block: 'center' });
    }
  }
}
