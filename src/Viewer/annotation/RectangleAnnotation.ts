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

  constructor(container: HTMLElement, pdfState: PdfState, fillColor: string, strokeColor: string, strokeWidth: number, strokeStyle: string) {
    super(container, pdfState);
    this.fillColor = fillColor;
    this.strokeColor = strokeColor;
    this.strokeWidth = strokeWidth;
    this.strokeStyle = strokeStyle;
  }

  get getId() {
    return this.element?.id;
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

  public startDrawing(x: number, y: number): void {
    super.startDrawing(x, y);
    console.log('here i am');
    this.svg.style.left = `${x}px`;
    this.svg.style.top = `${y}px`;
    this.element = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    this.element.id = this.svg.getAttribute('annotation-id')!;
    this.element.onclick = (event: MouseEvent) => this.onAnnotationClick(event, this, 'rectangle');
    this.element.setAttribute('x', '0');
    this.element.setAttribute('y', '0');
    this.element.setAttribute('width', '0');
    this.element.setAttribute('height', '0');
    this.element.setAttribute('fill', this.fillColor);
    this.element.setAttribute('stroke', this.strokeColor);
    this.element.setAttribute('stroke-width', this.strokeWidth.toString());
    this.element.setAttribute('stroke-dasharray', this.getStrokeDashArray());

    this.svg.appendChild(this.element);
  }

  public updateDrawing(x: number, y: number): void {
    if (!this.isDrawing || !this.element) return;

    const width = x - this.startX;
    const height = y - this.startY;

    const padding = 10;
    this.svg.setAttribute('width', (Math.abs(width) + padding * 2).toString());
    this.svg.setAttribute('height', (Math.abs(height) + padding * 2).toString());

    this.element.setAttribute('x', padding.toString());
    this.element.setAttribute('y', padding.toString());
    this.element.setAttribute('width', Math.abs(width).toString());
    this.element.setAttribute('height', Math.abs(height).toString());

    if (width < 0) this.svg.style.left = `${x - padding}px`;
    if (height < 0) this.svg.style.top = `${y - padding}px`;
  }

  public stopDrawing(): void {
    super.stopDrawing();

    if (!this.resizer) {
      this.resizer = new Resizer(this.svg, this.element! as any);
      this.svg.focus();
      this.addDeleteEvent();
    }

    this.__pdfState?.emit('ANNOTATION_CREATED', this);
  }

  public select(): void {
    // ✅ Show resizers when the rectangle is selected
    if (!this.resizer) {
      this.resizer = new Resizer(this.svg, this.element! as any);
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
}
