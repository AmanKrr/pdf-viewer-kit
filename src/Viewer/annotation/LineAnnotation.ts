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

import { INNER_PADDING_PX } from '../../constants/geometry-constants';
import { LineConfig } from '../../types/geometry';
import PdfState from '../ui/PDFState';
import { Annotation } from './Annotation';
import { Resizer } from './Resizer';

/**
 * Annotation that renders and manages a line (<line> SVG element) on the PDF.
 * Supports both programmatic drawing and interactive mouse‐driven drawing,
 * selection, deletion, zoom rescaling, and hit‐testing.
 */
export class LineAnnotation extends Annotation {
  /** Discriminator used when serializing annotations. */
  public readonly type = 'line';

  /** Unique identifier, inherited from Annotation. */
  public get id(): string {
    return this.annotationId;
  }

  private _opacity: number;
  private _strokeColor: string;
  private _strokeWidth: number;
  private _strokeStyle: string;
  private _resizer: Resizer | null = null;
  private _constraints!: DOMRect;
  private _origX1 = 0;
  private _origY1 = 0;
  private _origX2 = 0;
  private _origY2 = 0;
  private _shapeInfo: LineConfig | null = null;
  private _pageNumber?: number;
  private _pdfState: PdfState;
  private _onDeleteKeyBound = this._onDeleteKey.bind(this);
  private _bindOnScaleChange = this._onScaleChange.bind(this);

  /**
   * @param container   HTML element into which the annotation SVG is inserted
   * @param pdfState    Shared PdfState, emits 'scaleChange' events
   * @param strokeColor CSS color for the visible line stroke
   * @param strokeWidth Width (in CSS px) of the visible line stroke
   * @param strokeStyle 'solid' | 'dashed' | 'dotted'
   * @param opacity     Opacity for line
   * @param id          Optional annotation ID
   */
  constructor(container: HTMLElement, pdfState: PdfState, strokeColor: string, strokeWidth: number, strokeStyle: string, opacity: number, id?: string) {
    super(container, pdfState, id);
    this._pdfState = pdfState;
    this._strokeColor = strokeColor;
    this._strokeWidth = strokeWidth;
    this._strokeStyle = strokeStyle;
    this._opacity = opacity;
    this._constraints = container.getBoundingClientRect();
    pdfState.on('scaleChange', this._bindOnScaleChange);
  }

  /**
   * Responds to PdfState scaleChange: update constraints and rescale.
   * @param _ Ignored event payload
   */
  private _onScaleChange(_: any): void {
    this._constraints = this.__annotationDrawerContainer.getBoundingClientRect();
    this._updateZoom(this._pdfState.scale);
  }

  /**
   * Draw a line programmatically using absolute page coordinates.
   * @param x1         Page‐space X of the first endpoint
   * @param y1         Page‐space Y of the first endpoint
   * @param x2         Page‐space X of the second endpoint
   * @param y2         Page‐space Y of the second endpoint
   * @param pageNumber Index of the PDF page
   */
  public draw(x1: number, y1: number, x2: number, y2: number, pageNumber: number): void {
    const pad = INNER_PADDING_PX;
    const minX = Math.min(x1, x2),
      minY = Math.min(y1, y2);
    const dx = Math.abs(x2 - x1),
      dy = Math.abs(y2 - y1);

    this.isDrawing = false;
    this.__svg.style.left = `${minX - pad}px`;
    this.__svg.style.top = `${minY - pad}px`;
    this.__svg.setAttribute('width', `${dx + pad * 2}`);
    this.__svg.setAttribute('height', `${dy + pad * 2}`);
    this._pageNumber = pageNumber;

    this.createSvgLine(x1 - minX + pad, y1 - minY + pad, x2 - minX + pad, y2 - minY + pad);

    this._captureOriginal();
    this._updateZoom(this._pdfState.scale);
    this._setLineInfo();
  }

  /**
   * Begin interactive drawing at the given page‐space point.
   * @param x          X coordinate relative to container
   * @param y          Y coordinate relative to container
   * @param pageNumber Index of the PDF page
   */
  public startDrawing(x: number, y: number, pageNumber: number): void {
    super.startDrawing(x, y, pageNumber);
    this.__svg.style.left = `${x}px`;
    this.__svg.style.top = `${y}px`;
    this.createSvgLine();
    this._pageNumber = pageNumber;
  }

  /**
   * Update the interactive drawing as the pointer moves.
   * @param x X coordinate relative to container
   * @param y Y coordinate relative to container
   */
  public updateDrawing(x: number, y: number): void {
    if (!this.isDrawing || !this.__element) return;
    const pad = INNER_PADDING_PX;
    const dx = x - this.__startX,
      dy = y - this.__startY;
    const minX = Math.min(this.__startX, this.__startX + dx);
    const minY = Math.min(this.__startY, this.__startY + dy);
    const w = Math.abs(dx),
      h = Math.abs(dy);

    this.__svg.style.left = `${minX - pad}px`;
    this.__svg.style.top = `${minY - pad}px`;
    this.__svg.setAttribute('width', `${w + pad * 2}`);
    this.__svg.setAttribute('height', `${h + pad * 2}`);

    const x1r = dx >= 0 ? pad : pad + w;
    const y1r = dy >= 0 ? pad : pad + h;
    const x2r = dx >= 0 ? pad + w : pad;
    const y2r = dy >= 0 ? pad + h : pad;

    const el = this.__element as SVGLineElement;
    el.setAttribute('x1', x1r.toString());
    el.setAttribute('y1', y1r.toString());
    el.setAttribute('x2', x2r.toString());
    el.setAttribute('y2', y2r.toString());

    const hit = this.__hitElementRect as SVGLineElement;
    hit.setAttribute('x1', x1r.toString());
    hit.setAttribute('y1', y1r.toString());
    hit.setAttribute('x2', x2r.toString());
    hit.setAttribute('y2', y2r.toString());
  }

  /**
   * Finish interactive drawing, optionally select and emit event.
   * @param opts.select       Automatically select the shape
   * @param opts.shapeUpdate  Emit ANNOTATION_CREATED event
   */
  public stopDrawing(opts = { select: true, shapeUpdate: true }): void {
    super.stopDrawing();
    this._captureOriginal();
    this._setLineInfo();
    if (opts.select) this.select();
    if (opts.shapeUpdate) this._onShapeUpdate();
  }

  /**
   * Select this annotation, adding resize handles and delete‐key listener.
   */
  public select(): void {
    if (!this._resizer) {
      this._resizer = new Resizer(this.__svg, this.__element as SVGGraphicsElement, this._onShapeUpdate.bind(this), this.__annotationDrawerContainer.getBoundingClientRect());
      this.__svg.focus();
      this.__svg.addEventListener('keydown', this._onDeleteKeyBound);
    }
  }

  /**
   * Deselect this annotation, removing handles and delete‐key listener.
   */
  public deselect(): void {
    if (this._resizer) {
      this.__svg.removeEventListener('keydown', this._onDeleteKeyBound);
      this._resizer.removeResizers();
      this._resizer = null;
    }
  }

  /**
   * Delete this annotation from DOM and emit deletion event.
   * @param suppressEvent If true, skip ANNOTATION_DELETED
   */
  public deleteAnnotation(suppressEvent = false): void {
    this.deselect();
    this.__svg.remove();
    if (!suppressEvent) {
      this._pdfState.emit('ANNOTATION_DELETED', this.id);
    }
  }

  /** Restore default cursor on hit‐test line. */
  public revokeSelection(): void {
    if (this.__hitElementRect) {
      this.__hitElementRect.style.cursor = 'default';
      this.__hitElementRect.onclick = null;
    }
  }

  /** Scroll annotation into center of view. */
  public scrollToView(): void {
    this.__svg.scrollIntoView({ block: 'center' });
  }

  /** Return current annotation config for serialization or events. */
  public getConfig(): Partial<LineConfig> {
    return this._shapeInfo ?? {};
  }

  /**
   * Create both the visible <line> and an invisible, thicker hit‐test <line>.
   * @param x1 First endpoint X inside SVG
   * @param y1 First endpoint Y inside SVG
   * @param x2 Second endpoint X inside SVG
   * @param y2 Second endpoint Y inside SVG
   */
  private createSvgLine(x1 = 0, y1 = 0, x2 = 0, y2 = 0): void {
    // visible line
    this.__element = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    this.__element.id = this.annotationId;
    const el = this.__element as SVGLineElement;
    el.setAttribute('x1', x1.toString());
    el.setAttribute('y1', y1.toString());
    el.setAttribute('x2', x2.toString());
    el.setAttribute('y2', y2.toString());
    el.setAttribute('stroke', this._strokeColor);
    el.setAttribute('stroke-width', this._strokeWidth.toString());
    el.setAttribute('opacity', this._opacity.toString());
    if (this._strokeStyle === 'dashed') {
      el.setAttribute('stroke-dasharray', '5,5');
    } else if (this._strokeStyle === 'dotted') {
      el.setAttribute('stroke-dasharray', '2,2');
    }
    el.setAttribute('vector-effect', 'non-scaling-stroke');
    this.__svg.appendChild(el);

    // hit‐test line (transparent but thick)
    this.__hitElementRect = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    const hit = this.__hitElementRect as SVGLineElement;
    hit.setAttribute('x1', x1.toString());
    hit.setAttribute('y1', y1.toString());
    hit.setAttribute('x2', x2.toString());
    hit.setAttribute('y2', y2.toString());
    hit.setAttribute('stroke', 'transparent');
    hit.style.strokeWidth = `${this._strokeWidth + 10}`;
    hit.style.cursor = 'pointer';
    hit.style.pointerEvents = 'auto';
    hit.onclick = (e) => {
      e.stopPropagation();
      e.preventDefault();
      this.__onAnnotationClick(e, this.getConfig() as any);
    };
    this.__svg.appendChild(hit);
  }

  /** Handle Delete/Backspace key to remove annotation. */
  private _onDeleteKey(e: KeyboardEvent): void {
    if (e.key === 'Delete' || e.key === 'Backspace') {
      this.deleteAnnotation();
    }
  }

  /** Capture logical (unscaled) endpoints for later zoom updates. */
  private _captureOriginal(): void {
    const { x1, y1, x2, y2 } = this._logicalCoords();
    this._origX1 = x1;
    this._origY1 = y1;
    this._origX2 = x2;
    this._origY2 = y2;
  }

  /**
   * Recompute SVG position, size, and line endpoints for new zoom level.
   * @param scale Current PdfState.scale value
   */
  private _updateZoom(scale: number): void {
    if (!this.__element) return;
    const pad = INNER_PADDING_PX * scale;
    const x1a = this._origX1 * scale;
    const y1a = this._origY1 * scale;
    const x2a = this._origX2 * scale;
    const y2a = this._origY2 * scale;
    const minX = Math.min(x1a, x2a);
    const minY = Math.min(y1a, y2a);
    const w = Math.abs(x2a - x1a);
    const h = Math.abs(y2a - y1a);

    this.__svg.style.left = `${minX - pad}px`;
    this.__svg.style.top = `${minY - pad}px`;
    this.__svg.setAttribute('width', `${w + pad * 2}`);
    this.__svg.setAttribute('height', `${h + pad * 2}`);

    const r1x = x1a - minX + pad;
    const r1y = y1a - minY + pad;
    const r2x = x2a - minX + pad;
    const r2y = y2a - minY + pad;

    const el = this.__element as SVGLineElement;
    el.setAttribute('x1', r1x.toString());
    el.setAttribute('y1', r1y.toString());
    el.setAttribute('x2', r2x.toString());
    el.setAttribute('y2', r2y.toString());

    const hit = this.__hitElementRect as SVGLineElement;
    hit.setAttribute('x1', r1x.toString());
    hit.setAttribute('y1', r1y.toString());
    hit.setAttribute('x2', r2x.toString());
    hit.setAttribute('y2', r2y.toString());

    if (this._resizer) {
      this._resizer.constraintsValue = this._constraints;
      this._resizer.syncOverlayToSvg();
    }
  }

  /**
   * Compute logical (unscaled) endpoints by combining SVG container
   * position and in-SVG line coordinates.
   */
  private _logicalCoords(): {
    x1: number;
    y1: number;
    x2: number;
    y2: number;
  } {
    const s = this._pdfState.scale || 1;
    const leftLogical = parseFloat(this.__svg.style.left) / s;
    const topLogical = parseFloat(this.__svg.style.top) / s;

    const el = this.__element as SVGLineElement;
    const lx1 = parseFloat(el.getAttribute('x1')!) / s;
    const ly1 = parseFloat(el.getAttribute('y1')!) / s;
    const lx2 = parseFloat(el.getAttribute('x2')!) / s;
    const ly2 = parseFloat(el.getAttribute('y2')!) / s;

    return {
      x1: leftLogical + lx1,
      y1: topLogical + ly1,
      x2: leftLogical + lx2,
      y2: topLogical + ly2,
    };
  }

  /** Populate `_shapeInfo` from logical endpoints and style. */
  private _setLineInfo(): void {
    const { x1, y1, x2, y2 } = this._logicalCoords();
    this._shapeInfo = {
      id: this.annotationId,
      pageNumber: this._pageNumber!,
      x1,
      y1,
      x2,
      y2,
      strokeColor: this._strokeColor,
      strokeWidth: this._strokeWidth,
      strokeStyle: this._strokeStyle,
      opacity: this._opacity,
      type: 'line',
    };
  }

  /** Called after any resize or drag to emit creation/update event. */
  private _onShapeUpdate(): void {
    this._captureOriginal();
    this._setLineInfo();
    this._pdfState.emit('ANNOTATION_CREATED', this.getConfig());
  }
}
