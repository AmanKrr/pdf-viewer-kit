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
import { RectangleConfig } from '../../types/geometry.types';
import PdfState from '../ui/PDFState';
import { Annotation } from './Annotation';
import { Resizer } from './Resizer';

/**
 * Rectangle annotation supporting interactive drawing, programmatic creation,
 * selection, deletion, and automatic zoom synchronization.
 */
export class RectangleAnnotation extends Annotation {
  private _interactive = true;
  private _fillColor: string;
  private _strokeColor: string;
  private _strokeWidth: number;
  private _strokeStyle: string;
  private _opacity: number;
  private _resizer: Resizer | null = null;
  private _originalLeft = 0;
  private _originalTop = 0;
  private _originalWidth = 0;
  private _originalHeight = 0;
  private _shapeInfo: RectangleConfig | null = null;
  private _pageNumber?: number;
  private _constraints: DOMRect;
  private _pdfState: PdfState;
  private _onDeleteKeyBound = this._onDeleteKey.bind(this);
  private _bindOnScaleChange = this._onScaleChange.bind(this);

  /** Unique identifier of this annotation. */
  public get id(): string {
    return this.annotationId;
  }

  /** Discriminator for serialization. */
  public readonly type = 'rectangle';

  /**
   * @param container   Host element for the annotation SVG
   * @param pdfState    Viewer state, emits 'scaleChange' events
   * @param fillColor   SVG fill color
   * @param strokeColor SVG stroke color
   * @param strokeWidth Stroke width in CSS pixels
   * @param strokeStyle 'solid' | 'dashed' | 'dotted'
   * @param opacity     Opacity for rectangle
   * @param id          Optional annotation ID
   */
  constructor(container: HTMLElement, pdfState: PdfState, fillColor: string, strokeColor: string, strokeWidth: number, strokeStyle: string, opacity: number, id?: string) {
    super(container, pdfState, id);
    this._pdfState = pdfState;
    this._constraints = container.getBoundingClientRect();
    this._fillColor = fillColor;
    this._strokeColor = strokeColor;
    this._strokeWidth = strokeWidth;
    this._strokeStyle = strokeStyle;
    this._opacity = opacity;

    pdfState.on('scaleChange', this._bindOnScaleChange);
  }

  private _onScaleChange(event: any) {
    this._constraints = this.__annotationDrawerContainer.getBoundingClientRect();
    this._updateZoom(this._pdfState.scale);
  }

  /**
   * Programmatically draws a rectangle without user interaction.
   * @param x0         X-coordinate of top-left corner
   * @param x1         Width of the rectangle
   * @param y0         Y-coordinate of top-left corner
   * @param y1         Height of the rectangle
   * @param pageNumber PDF page index
   */
  public draw(x0: number, y0: number, width: number, height: number, pageNumber: number, interactive: boolean): void {
    this._interactive = interactive;
    this.__startX = x0;
    this.__startY = y0;
    this.isDrawing = false;

    this.__svg.style.left = `${x0}px`;
    this.__svg.style.top = `${y0}px`;
    this.__svg.setAttribute('width', `${width}`);
    this.__svg.setAttribute('height', `${height}`);
    this._pageNumber = pageNumber;

    this._createSvgRect(INNER_PADDING_PX.toString(), height, width);
    this._maintainOriginalBounding(1);
    this._updateZoom(this.__pdfState!.scale);
    this._setRectInfo();
  }

  /** @inheritdoc */
  public startDrawing(x: number, y: number, pageNumber: number): void {
    super.startDrawing(x, y, pageNumber);
    this.__svg.style.left = `${x}px`;
    this.__svg.style.top = `${y}px`;
    this._createSvgRect();
    this._pageNumber = pageNumber;
  }

  /** @inheritdoc */
  public updateDrawing(x: number, y: number): void {
    if (!this.isDrawing || !this.__element || !this.__hitElementRect) return;

    const maxX = this._constraints.width - INNER_PADDING_PX;
    const maxY = this._constraints.height - INNER_PADDING_PX;
    const clampedX = Math.min(Math.max(x, 0), maxX);
    const clampedY = Math.min(Math.max(y, 0), maxY);
    const width = clampedX - this.__startX;
    const height = clampedY - this.__startY;

    this.__svg.setAttribute('width', `${Math.abs(width) + INNER_PADDING_PX * 2}`);
    this.__svg.setAttribute('height', `${Math.abs(height) + INNER_PADDING_PX * 2}`);

    this.__element.setAttribute('x', `${INNER_PADDING_PX}`);
    this.__element.setAttribute('y', `${INNER_PADDING_PX}`);
    this.__element.setAttribute('width', `${Math.abs(width)}`);
    this.__element.setAttribute('height', `${Math.abs(height)}`);

    this.__hitElementRect.setAttribute('x', `${INNER_PADDING_PX}`);
    this.__hitElementRect.setAttribute('y', `${INNER_PADDING_PX}`);
    this.__hitElementRect.setAttribute('width', `${Math.abs(width)}`);
    this.__hitElementRect.setAttribute('height', `${Math.abs(height)}`);

    if (width < 0) this.__svg.style.left = `${clampedX - INNER_PADDING_PX}px`;
    if (height < 0) this.__svg.style.top = `${clampedY - INNER_PADDING_PX}px`;
  }

  /**
   * Ends interactive drawing, caches geometry, and optionally selects
   * or emits an update event.
   * @param opts.select       Auto-select after drawing
   * @param opts.shapeUpdate  Emit ANNOTATION_CREATED event
   */
  public stopDrawing(): void {
    super.stopDrawing();
    this._maintainOriginalBounding();
    this._setRectInfo();
    this.select();
    this._onShapeUpdate();
  }

  /**
   * Selects this annotation, adding resizers and Delete/Backspace handler.
   */
  public select(): void {
    if (!this._resizer) {
      this._resizer = new Resizer(this.__svg, this.__element as SVGGraphicsElement, this._onShapeUpdate.bind(this), this._constraints);
      this.__svg.focus();
      this._addDeleteEvent();
    }
  }

  /**
   * Deselects this annotation, removing resizers and keyboard handler.
   */
  public deselect(): void {
    if (this._resizer) {
      this._removeDeleteEvent();
      this._resizer.removeResizers();
      this._resizer = null;
    }
  }

  /**
   * Deletes this annotation from the DOM.
   * @param suppressEvent If true, skips ANNOTATION_DELETED emission
   */
  public deleteAnnotation(suppressEvent = false): void {
    if (this.__svg) {
      if (this._resizer) {
        this._removeDeleteEvent();
        this._resizer.removeResizers();
        this._resizer = null;
      }
      this.__svg.remove();
    }
    if (!suppressEvent) {
      this.__pdfState?.emit('ANNOTATION_DELETED', this.id);
    }
  }

  /**
   * Cancels pointer cursor and click handler on the hit-test rectangle.
   */
  public revokeSelection(): void {
    if (this.__hitElementRect) {
      this.__hitElementRect.style.cursor = 'default';
      this.__hitElementRect.onclick = null;
    }
  }

  /**
   * Scrolls the annotation into view (centered in viewport).
   */
  public scrollToView(): void {
    this.__svg?.scrollIntoView({ block: 'center' });
  }

  /**
   * Returns a serializable snapshot of this annotation.
   */
  public getConfig(): Partial<RectangleConfig> {
    return this._shapeInfo ?? {};
  }

  /**
   * Creates the visible <rect> and an invisible hit-test <rect> inside the SVG.
   * @param padding  Optional x/y offset inside the SVG
   * @param height   Rectangle height
   * @param width    Rectangle width
   */
  private _createSvgRect(padding: string = '0', height: number = 0, width: number = 0): void {
    this.__element = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    this.__element.id = this.annotationId;
    this.__element.setAttribute('x', padding);
    this.__element.setAttribute('y', padding);
    this.__element.setAttribute('width', Math.abs(width).toString());
    this.__element.setAttribute('height', Math.abs(height).toString());
    this.__element.setAttribute('fill', this._fillColor);
    this.__element.setAttribute('stroke', this._strokeColor);
    this.__element.setAttribute('stroke-width', this._strokeWidth.toString());
    this.__element.setAttribute('stroke-dasharray', this._getStrokeDashArray());
    this.__element.setAttribute('opacity', this._opacity.toString());
    this.__svg.appendChild(this.__element);

    this.__hitElementRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    this.__hitElementRect.setAttribute('x', padding);
    this.__hitElementRect.setAttribute('y', padding);
    this.__hitElementRect.setAttribute('width', Math.abs(width).toString());
    this.__hitElementRect.setAttribute('height', Math.abs(height).toString());
    this.__hitElementRect.setAttribute('fill', 'none');
    this.__hitElementRect.setAttribute('stroke', 'transparent');
    this.__hitElementRect.style.strokeWidth = (this._strokeWidth + 10).toString();
    this.__hitElementRect.style.cursor = 'pointer';
    this.__hitElementRect.style.pointerEvents = 'auto';
    this.__hitElementRect.onclick = (event) => {
      event.stopPropagation();
      event.preventDefault();
      this.__onAnnotationClick(event, this.getConfig());
    };
    this.__svg.appendChild(this.__hitElementRect);
  }

  /** Adds keyboard listener for Delete/Backspace. */
  private _addDeleteEvent(): void {
    this.__svg.addEventListener('keydown', this._onDeleteKeyBound);
  }

  /** Removes keyboard listener for Delete/Backspace. */
  private _removeDeleteEvent(): void {
    this.__svg.removeEventListener('keydown', this._onDeleteKeyBound);
  }

  /**
   * Handles Delete or Backspace key to delete the annotation.
   */
  private _onDeleteKey(event: KeyboardEvent): void {
    if (event.key === 'Delete' || event.key === 'Backspace') {
      this.deleteAnnotation();
    }
  }

  /** Captures current un-scaled position and size for zoom adjustments. */
  private _maintainOriginalBounding(zoomLevel = 0): void {
    const scale = zoomLevel || this.__pdfState?.scale || 1;
    this._originalLeft = (parseFloat(this.__svg.style.left) || 0) / scale;
    this._originalTop = (parseFloat(this.__svg.style.top) || 0) / scale;
    this._originalWidth = parseFloat(this.__svg.getAttribute('width') || '0') / scale;
    this._originalHeight = parseFloat(this.__svg.getAttribute('height') || '0') / scale;
  }

  /**
   * Re-applies scaled position and size based on captured original values.
   * @param zoomFactor Current viewer scale
   */
  private _updateZoom(zoomFactor: number): void {
    const left = this._originalLeft * zoomFactor;
    const top = this._originalTop * zoomFactor;
    const width = this._originalWidth * zoomFactor;
    const height = this._originalHeight * zoomFactor;
    const defaultPad = INNER_PADDING_PX * zoomFactor;
    let pad: number;

    // only use padding when both dimensions are big enough
    if (width > defaultPad * 2 && height > defaultPad * 2) {
      pad = defaultPad;
    } else {
      pad = 0;
    }
    const innerW = width - pad * 2;
    const innerH = height - pad * 2;

    this.__svg.style.left = `${left}px`;
    this.__svg.style.top = `${top}px`;
    this.__svg.setAttribute('width', `${width}`);
    this.__svg.setAttribute('height', `${height}`);

    if (this.__element) {
      this.__element.setAttribute('x', `${pad}`);
      this.__element.setAttribute('y', `${pad}`);
      this.__element.setAttribute('width', `${innerW}`);
      this.__element.setAttribute('height', `${innerH}`);
    }

    if (this.__hitElementRect) {
      const pad = INNER_PADDING_PX * zoomFactor;
      this.__hitElementRect.setAttribute('x', `${pad}`);
      this.__hitElementRect.setAttribute('y', `${pad}`);
      this.__hitElementRect.setAttribute('width', `${innerW}`);
      this.__hitElementRect.setAttribute('height', `${innerH}`);
    }

    if (this._resizer) {
      this._resizer.constraintsValue = this._constraints;
      this._resizer.syncOverlayToSvg();
    }
  }

  /**
   * Returns stroke-dasharray string corresponding to the stroke style.
   */
  private _getStrokeDashArray(): string {
    return this._strokeStyle === 'dashed' ? '5,5' : this._strokeStyle === 'dotted' ? '2,2' : '0';
  }

  /**
   * Computes current un-scaled coordinates from the SVG element.
   */
  private _getCoordinates(): { x0: number; x1: number; y0: number; y1: number } {
    const bbox = (this.__svg as SVGGraphicsElement).getBBox();
    const left = parseFloat(this.__svg.style.left);
    const top = parseFloat(this.__svg.style.top);
    return { x0: left, y0: top, x1: bbox.width, y1: bbox.height };
  }

  /**
   * Computes logical (un-scaled) coordinates, preferring captured originals.
   */
  private _getLogicalCoordinates(): { x0: number; y0: number; x1: number; y1: number } {
    const scale = this.__pdfState?.scale || 1;
    if (this._originalWidth) {
      const left = this._originalLeft;
      const top = this._originalTop;
      const w = this._originalWidth;
      const h = this._originalHeight;

      return {
        x0: left,
        y0: top,
        x1: left + w,
        y1: top + h,
      };
    }
    const bbox = (this.__svg as SVGGraphicsElement).getBBox();
    const left = parseFloat(this.__svg.style.left) / scale;
    const top = parseFloat(this.__svg.style.top) / scale;
    return {
      x0: left,
      y0: top,
      x1: left + bbox.width / scale,
      y1: top + bbox.height / scale,
    };
  }

  /** Updates internal shape info for serialization or events. */
  private _setRectInfo(): void {
    const { x0, y0, x1, y1 } = this._getLogicalCoordinates();
    this._shapeInfo = {
      id: this.annotationId,
      pageNumber: this._pageNumber!,
      x0,
      y0,
      x1,
      y1,
      fillColor: this._fillColor,
      strokeColor: this._strokeColor,
      strokeWidth: this._strokeWidth,
      strokeStyle: this._strokeStyle,
      opacity: this._opacity,
      type: 'rectangle',
      interactive: this._interactive,
    };
  }

  /** Emits ANNOTATION_CREATED after geometry changes. */
  private _onShapeUpdate(): void {
    this._maintainOriginalBounding();
    this._setRectInfo();
    this.__pdfState?.emit('ANNOTATION_CREATED', this.getConfig());
  }
}
