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
import { EllipseConfig } from '../../types/geometry.types';
import PdfState from '../ui/PDFState';
import { Resizer } from './Resizer';
import { Annotation } from './Annotation';
import { InstanceEventEmitter } from '../../core/InstanceEventEmitter';
import { InstanceState } from '../../core/InstanceState';

/**
 * An SVG ellipse annotation. Supports interactive drawing, programmatic creation,
 * selection, deletion, and automatic zoom updates from PdfState.
 */
export class EllipseAnnotation extends Annotation {
  /** Discriminator for serialization. */
  public readonly type = 'ellipse';

  /** Alias for `annotationId`. */
  public get id(): string {
    return this.annotationId;
  }

  private _interactive = true;
  private _fillColor: string;
  private _strokeColor: string;
  private _strokeWidth: number;
  private _strokeStyle: string;
  private _opacity: number;
  private _resizer: Resizer | null = null;
  private _constraints!: DOMRect;
  private _origCX = 0;
  private _origCY = 0;
  private _origRX = 0;
  private _origRY = 0;
  private _shapeInfo: EllipseConfig | null = null;
  private _pageNumber?: number;
  private _instances: {
    events: InstanceEventEmitter;
    state: InstanceState;
    instanceId: string;
    containerId: string;
  };
  private _onDeleteKeyBound = this._onDeleteKey.bind(this);
  private _bindOnScaleChange = this._onScaleChange.bind(this);

  /**
   * @param container  Element into which the SVG will be injected
   * @param pdfState   Viewer state that emits scaleChange events
   * @param fillColor  SVG fill color
   * @param strokeColor SVG stroke color
   * @param strokeWidth Stroke width in px
   * @param strokeStyle One of "solid" | "dashed" | "dotted"
   * @param id         Optional identifier
   */
  constructor(
    container: HTMLElement,
    instances: {
      events: InstanceEventEmitter;
      state: InstanceState;
      instanceId: string;
      containerId: string;
    },
    fillColor: string,
    strokeColor: string,
    strokeWidth: number,
    strokeStyle: string,
    opacity: number,
    id?: string,
  ) {
    super(container, instances, id);
    this._instances = instances;
    this._fillColor = fillColor;
    this._strokeColor = strokeColor;
    this._strokeWidth = strokeWidth;
    this._strokeStyle = strokeStyle;
    this._opacity = opacity;
    this._constraints = container.getBoundingClientRect();

    this.events.on('scaleChange', this._bindOnScaleChange);
  }

  private _onScaleChange(event: any) {
    this._constraints = this.__annotationDrawerContainer.getBoundingClientRect();
    this._updateZoom(this.state.scale);
  }

  /**
   * Programmatically draws an ellipse (no pointer events).
   * @param cx         Logical center-x
   * @param cy         Logical center-y
   * @param rx         Logical horizontal radius
   * @param ry         Logical vertical radius
   * @param pageNumber Page index for this annotation
   */
  public draw(cx: number, cy: number, rx: number, ry: number, pageNumber: number, interactive: boolean): void {
    this._interactive = interactive;
    const left = cx - rx;
    const top = cy - ry;
    const width = rx * 2;
    const height = ry * 2;

    this.isDrawing = false;
    this.__svg.style.left = `${left}px`;
    this.__svg.style.top = `${top}px`;
    this.__svg.setAttribute('width', `${width}`);
    this.__svg.setAttribute('height', `${height}`);
    this._pageNumber = pageNumber;

    this.createSvgEllipse(rx, ry, rx, ry);
    this._captureOriginal(1);
    this._updateZoom(this.state.scale);
    this._setEllipseInfo();
  }

  /** @inheritdoc */
  public startDrawing(x: number, y: number, pageNumber: number): void {
    super.startDrawing(x, y, pageNumber);
    this.__svg.style.left = `${x}px`;
    this.__svg.style.top = `${y}px`;
    this.createSvgEllipse();
    this._pageNumber = pageNumber;
  }

  /** @inheritdoc */
  public updateDrawing(x: number, y: number): void {
    if (!this.isDrawing || !this.__element) return;
    const dx = x - this.__startX;
    const dy = y - this.__startY;
    const left = Math.min(this.__startX, this.__startX + dx);
    const top = Math.min(this.__startY, this.__startY + dy);
    const w = Math.abs(dx);
    const h = Math.abs(dy);

    // Account for stroke width to prevent strokes from being cut off
    const strokePadding = this._strokeWidth;
    const svgWidth = w + strokePadding;
    const svgHeight = h + strokePadding;
    const strokeOffset = strokePadding / 2;

    this.__svg.style.left = `${left - strokeOffset}px`;
    this.__svg.style.top = `${top - strokeOffset}px`;
    this.__svg.setAttribute('width', svgWidth.toString());
    this.__svg.setAttribute('height', svgHeight.toString());

    const rx = w / 2;
    const ry = h / 2;
    const cx = rx + strokeOffset;
    const cy = ry + strokeOffset;

    (this.__element as SVGEllipseElement).setAttribute('cx', `${cx}`);
    (this.__element as SVGEllipseElement).setAttribute('cy', `${cy}`);
    (this.__element as SVGEllipseElement).setAttribute('rx', `${rx}`);
    (this.__element as SVGEllipseElement).setAttribute('ry', `${ry}`);

    (this.__hitElementRect as SVGEllipseElement).setAttribute('cx', `${cx}`);
    (this.__hitElementRect as SVGEllipseElement).setAttribute('cy', `${cy}`);
    (this.__hitElementRect as SVGEllipseElement).setAttribute('rx', `${rx}`);
    (this.__hitElementRect as SVGEllipseElement).setAttribute('ry', `${ry}`);
  }

  /**
   * Ends drawing mode, captures geometry, and optionally selects or emits update.
   * @param opts.select      If true, the ellipse is auto-selected
   * @param opts.shapeUpdate If true, fires ANNOTATION_CREATED
   */
  public stopDrawing(): void {
    super.stopDrawing();
    this._captureOriginal();
    this._setEllipseInfo();
    this.select();
    this._onShapeUpdate();
  }

  /** Adds resizers and listens for Delete/Backspace. */
  public select(): void {
    if (!this._resizer) {
      this._resizer = new Resizer(this.__svg, this.__element as any, this._onShapeUpdate.bind(this), this._constraints);
      this.__svg.focus();
      this.__svg.addEventListener('keydown', this._onDeleteKeyBound);
    }
  }

  /** Removes resizers and key listener. */
  public deselect(): void {
    if (this._resizer) {
      this.__svg.removeEventListener('keydown', this._onDeleteKeyBound);
      this._resizer.removeResizers();
      this._resizer = null;
    }
  }

  /**
   * Deletes the annotation from DOM.
   * @param suppressEvent If true, skips emitting ANNOTATION_DELETED
   */
  public deleteAnnotation(suppressEvent = false): void {
    if (this.__svg) {
      this.deselect();
      this.__svg.remove();
      if (!suppressEvent) this.events.emit('ANNOTATION_DELETED', this.id);
    }
  }

  /** Cancels the pointer cursor on the hit-test ellipse. */
  public revokeSelection(): void {
    if (this.__hitElementRect) {
      this.__hitElementRect.style.cursor = 'default';
      this.__hitElementRect.onclick = null;
    }
  }

  /** Scrolls this annotation into view (centered). */
  public scrollToView(): void {
    this.__svg?.scrollIntoView({ block: 'center' });
  }

  /** Retrieves the current annotation configuration. */
  public getConfig(): Partial<EllipseConfig> {
    return this._shapeInfo ?? {};
  }

  /**
   * Creates the visible ellipse and an invisible, thicker hit-test ellipse.
   */
  private createSvgEllipse(cx = 0, cy = 0, rx = 0, ry = 0): void {
    // Account for stroke width to prevent strokes from being cut off
    const strokePadding = this._strokeWidth;
    const strokeOffset = strokePadding / 2;

    this.__element = document.createElementNS('http://www.w3.org/2000/svg', 'ellipse');
    this.__element.id = this.annotationId;
    this.__element.setAttribute('cx', `${cx + strokeOffset}`);
    this.__element.setAttribute('cy', `${cy + strokeOffset}`);
    this.__element.setAttribute('rx', `${rx}`);
    this.__element.setAttribute('ry', `${ry}`);
    this.__element.setAttribute('fill', this._fillColor);
    this.__element.setAttribute('stroke', this._strokeColor);
    this.__element.setAttribute('stroke-width', `${this._strokeWidth}`);
    this.__element.setAttribute('stroke-dasharray', this._getStrokeDashArray());
    this.__element.setAttribute('opacity', this._opacity.toString());
    this.__svg.appendChild(this.__element);

    this.__hitElementRect = document.createElementNS('http://www.w3.org/2000/svg', 'ellipse');
    this.__hitElementRect.setAttribute('cx', `${cx + strokeOffset}`);
    this.__hitElementRect.setAttribute('cy', `${cy + strokeOffset}`);
    this.__hitElementRect.setAttribute('rx', `${rx}`);
    this.__hitElementRect.setAttribute('ry', `${ry}`);
    this.__hitElementRect.setAttribute('fill', 'none');
    this.__hitElementRect.setAttribute('stroke', 'transparent');
    // Use thicker stroke width for easier clicking (like the old working code)
    this.__hitElementRect.style.strokeWidth = `${this._strokeWidth + 10}`;
    this.__hitElementRect.style.cursor = 'pointer';
    this.__hitElementRect.style.pointerEvents = 'auto';

    this.__hitElementRect.onclick = (e) => {
      e.stopPropagation();
      e.preventDefault();
      this.__onAnnotationClick(e, this.getConfig());
    };
    this.__svg.appendChild(this.__hitElementRect);
  }

  /**
   * Handles Delete/Backspace key to remove the annotation.
   * @param e Keyboard event
   */
  private _onDeleteKey(e: KeyboardEvent): void {
    if (e.key === 'Delete' || e.key === 'Backspace') this.deleteAnnotation();
  }

  /**
   * Stores logical geometry for zoom recalculation.
   * @param scale Current scale factor
   */
  private _captureOriginal(scale = 0): void {
    const s = scale || this.state.scale || 1;
    const bbox = (this.__svg as SVGGraphicsElement).getBBox();
    const left = parseFloat(this.__svg.style.left) / s;
    const top = parseFloat(this.__svg.style.top) / s;
    this._origRX = bbox.width / 2 / s;
    this._origRY = bbox.height / 2 / s;
    this._origCX = left + this._origRX + 10;
    this._origCY = top + this._origRY + 10;
  }

  /**
   * Applies a new zoom level to the SVG and resizer overlay.
   * @param scale New scale factor
   */
  private _updateZoom(scale: number): void {
    const cx = this._origCX * scale;
    const cy = this._origCY * scale;
    const rx = this._origRX * scale;
    const ry = this._origRY * scale;

    this.__svg.style.left = `${cx - rx}px`;
    this.__svg.style.top = `${cy - ry}px`;
    this.__svg.setAttribute('width', `${rx * 2}`);
    this.__svg.setAttribute('height', `${ry * 2}`);

    const e = this.__element as SVGEllipseElement;
    const hit = this.__hitElementRect as SVGEllipseElement;

    e.setAttribute('cx', `${rx}`);
    e.setAttribute('cy', `${ry}`);
    e.setAttribute('rx', `${rx}`);
    e.setAttribute('ry', `${ry}`);

    hit.setAttribute('cx', `${rx}`);
    hit.setAttribute('cy', `${ry}`);
    hit.setAttribute('rx', `${rx}`);
    hit.setAttribute('ry', `${ry}`);

    if (this._resizer) {
      this._resizer.constraintsValue = this._constraints;
      this._resizer.syncOverlayToSvg();
    }
  }

  /**
   * Returns stroke-dasharray string corresponding to the stroke style.
   */
  private _getStrokeDashArray(): string {
    // Handle both capitalized and lowercase values from toolbar
    const style = this._strokeStyle.toLowerCase();
    return style === 'dashed' ? '5,5' : style === 'dotted' ? '2,2' : '0';
  }

  /**
   * Computes current logical coordinates from SVG position and size.
   */
  private _logicalCoords(): { cx: number; cy: number; rx: number; ry: number } {
    const s = this.state.scale || 1;
    if (this._origRX) {
      return { cx: this._origCX, cy: this._origCY, rx: this._origRX, ry: this._origRY };
    }
    const bbox = (this.__svg as SVGGraphicsElement).getBBox();
    const left = parseFloat(this.__svg.style.left) / s;
    const top = parseFloat(this.__svg.style.top) / s;
    const rx = bbox.width / 2 / s;
    const ry = bbox.height / 2 / s;
    return { cx: left + rx + 10, cy: top + ry + 10, rx, ry };
  }

  /** Updates `_shapeInfo` for serialization or event emission. */
  private _setEllipseInfo(): void {
    const { cx, cy, rx, ry } = this._logicalCoords();
    this._shapeInfo = {
      id: this.annotationId,
      pageNumber: this._pageNumber!,
      cx,
      cy,
      rx,
      ry,
      fillColor: this._fillColor,
      strokeColor: this._strokeColor,
      strokeWidth: this._strokeWidth,
      strokeStyle: this._strokeStyle,
      opacity: this._opacity,
      type: 'ellipse',
      interactive: this._interactive,
    };
  }

  /** Emits an update event after shape changes. */
  private _onShapeUpdate(): void {
    this._captureOriginal();
    this._setEllipseInfo();
    this.events.emit('ANNOTATION_CREATED', this.getConfig());
  }
}
