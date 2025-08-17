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

import { EllipseConfig } from '../../types/geometry.types';
import { Resizer } from './resizer';
import { Annotation } from './annotation';
import { InstanceEventEmitter } from '../../core/event-emitter.core';
import { InstanceState } from '../../core/viewer-state.core';
import { scrollElementIntoView } from '../../utils/web-ui-utils';

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

    // Update stroke width to maintain visual consistency across zoom levels
    this._updateStrokeWidthForZoom();
  }

  /**
   * Get current stroke padding (half of scaled stroke width)
   */
  private _getStrokePadding(): number {
    const scaledStrokeWidth = this._strokeWidth * (this.state.scale || 1);
    return scaledStrokeWidth / 2;
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

    // Calculate stroke padding
    const strokePadding = this._getStrokePadding();

    // Position SVG to accommodate stroke
    const left = cx - rx - strokePadding;
    const top = cy - ry - strokePadding;
    const width = rx * 2 + strokePadding * 2;
    const height = ry * 2 + strokePadding * 2;

    this.isDrawing = false;
    this.__svg.style.left = `${left}px`;
    this.__svg.style.top = `${top}px`;
    this.__svg.setAttribute('width', `${width}`);
    this.__svg.setAttribute('height', `${height}`);
    this._pageNumber = pageNumber;

    // Create ellipse centered in the SVG with stroke padding
    this.createSvgEllipse(rx + strokePadding, ry + strokePadding, rx, ry);
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

    // Account for scaled stroke width to prevent strokes from being cut off
    const strokePadding = this._getStrokePadding();
    const svgWidth = w + strokePadding * 2;
    const svgHeight = h + strokePadding * 2;

    this.__svg.style.left = `${left - strokePadding}px`;
    this.__svg.style.top = `${top - strokePadding}px`;
    this.__svg.setAttribute('width', svgWidth.toString());
    this.__svg.setAttribute('height', svgHeight.toString());

    const rx = w / 2;
    const ry = h / 2;
    const cx = rx + strokePadding;
    const cy = ry + strokePadding;

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

    // Check if the user actually created a meaningful shape (not just a click)
    const currentRx = parseFloat((this.__element as SVGEllipseElement)?.getAttribute('rx') || '0');
    const currentRy = parseFloat((this.__element as SVGEllipseElement)?.getAttribute('ry') || '0');
    const minSize = 5; // Minimum size in pixels to consider it a valid shape

    if (currentRx < minSize || currentRy < minSize) {
      // User just clicked without dragging - mark this annotation as invalid
      // and remove the DOM elements to clean up the visual artifacts
      this._isValidAnnotation = false;

      // Remove the SVG elements from DOM to clean up visual artifacts
      if (this.__svg && this.__svg.parentElement) {
        this.__svg.remove();
      }

      return;
    }

    this._captureOriginal();
    this._setEllipseInfo();
    this.select();
    this._onShapeUpdate();
  }

  /** Adds resizers. */
  public select(): void {
    if (!this._resizer) {
      this._resizer = new Resizer(this.__svg, this.__element as any, this._onShapeUpdate.bind(this), this._constraints);
      this.__svg.focus();
    }
  }

  /** Removes resizers and key listener. */
  public deselect(): void {
    if (this._resizer) {
      this._resizer.removeResizers();
      this._resizer = null;
    }

    // Emit deselection event
    this.events.emit('ANNOTATION_DESELECT');
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
    if (this.__svg) {
      scrollElementIntoView(this.__svg, { block: 'center' });
    }
  }

  /** Retrieves the current annotation configuration. */
  public getConfig(): Partial<EllipseConfig> {
    return this._shapeInfo ?? {};
  }

  /**
   * Creates the visible ellipse and an invisible, thicker hit-test ellipse.
   */
  private createSvgEllipse(cx = 0, cy = 0, rx = 0, ry = 0): void {
    // Use consistent stroke padding calculation
    const strokePadding = this._getStrokePadding();

    this.__element = document.createElementNS('http://www.w3.org/2000/svg', 'ellipse');
    this.__element.id = this.annotationId;
    this.__element.setAttribute('cx', `${cx || strokePadding}`);
    this.__element.setAttribute('cy', `${cy || strokePadding}`);
    this.__element.setAttribute('rx', `${rx}`);
    this.__element.setAttribute('ry', `${ry}`);
    this.__element.setAttribute('fill', this._fillColor);
    this.__element.setAttribute('stroke', this._strokeColor);
    // Scale stroke width based on current zoom level
    const scaledStrokeWidth = this._strokeWidth * (this.state.scale || 1);
    this.__element.setAttribute('stroke-width', `${scaledStrokeWidth}`);
    this.__element.setAttribute('stroke-dasharray', this._getStrokeDashArray());
    this.__element.setAttribute('opacity', this._opacity.toString());
    this.__svg.appendChild(this.__element);

    this.__hitElementRect = document.createElementNS('http://www.w3.org/2000/svg', 'ellipse');
    this.__hitElementRect.setAttribute('cx', `${cx || strokePadding}`);
    this.__hitElementRect.setAttribute('cy', `${cy || strokePadding}`);
    this.__hitElementRect.setAttribute('rx', `${rx}`);
    this.__hitElementRect.setAttribute('ry', `${ry}`);
    this.__hitElementRect.setAttribute('fill', 'none');
    this.__hitElementRect.setAttribute('stroke', 'transparent');
    // Use thicker stroke width for easier clicking, scaled by zoom level
    const scaledHitStrokeWidth = (this._strokeWidth + 10) * (this.state.scale || 1);
    this.__hitElementRect.style.strokeWidth = `${scaledHitStrokeWidth}`;
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
   * Stores logical geometry for zoom recalculation.
   * @param scale Current scale factor
   */
  private _captureOriginal(scale = 0): void {
    const s = scale || this.state.scale || 1;
    const strokePadding = this._getStrokePadding() / s; // Convert back to logical units

    // Get SVG position and dimensions
    const svgLeft = parseFloat(this.__svg.style.left) / s;
    const svgTop = parseFloat(this.__svg.style.top) / s;
    const svgWidth = parseFloat(this.__svg.getAttribute('width') || '0') / s;
    const svgHeight = parseFloat(this.__svg.getAttribute('height') || '0') / s;

    // Calculate logical center and radii accounting for stroke padding
    this._origRX = (svgWidth - strokePadding * 2) / 2;
    this._origRY = (svgHeight - strokePadding * 2) / 2;
    this._origCX = svgLeft + this._origRX + strokePadding;
    this._origCY = svgTop + this._origRY + strokePadding;
  }

  /**
   * Applies a new zoom level to the SVG and resizer overlay.
   * @param scale New scale factor
   */
  private _updateZoom(scale: number): void {
    const strokePadding = this._getStrokePadding();

    // Calculate scaled dimensions
    const cx = this._origCX * scale;
    const cy = this._origCY * scale;
    const rx = this._origRX * scale;
    const ry = this._origRY * scale;

    // SVG container sized to accommodate scaled stroke width
    const svgWidth = rx * 2 + strokePadding * 2;
    const svgHeight = ry * 2 + strokePadding * 2;

    this.__svg.style.left = `${cx - rx - strokePadding}px`;
    this.__svg.style.top = `${cy - ry - strokePadding}px`;
    this.__svg.setAttribute('width', `${svgWidth}`);
    this.__svg.setAttribute('height', `${svgHeight}`);

    const e = this.__element as SVGEllipseElement;
    const hit = this.__hitElementRect as SVGEllipseElement;

    // Position elements with stroke padding offset
    e.setAttribute('cx', `${rx + strokePadding}`);
    e.setAttribute('cy', `${ry + strokePadding}`);
    e.setAttribute('rx', `${rx}`);
    e.setAttribute('ry', `${ry}`);

    hit.setAttribute('cx', `${rx + strokePadding}`);
    hit.setAttribute('cy', `${ry + strokePadding}`);
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
   * Updates stroke width for current zoom level without changing the base stroke width.
   * This is called when zoom changes to maintain visual consistency.
   */
  private _updateStrokeWidthForZoom(): void {
    if (this.__element) {
      // Scale stroke width based on current zoom level
      const scaledStrokeWidth = this._strokeWidth * (this.state.scale || 1);
      this.__element.setAttribute('stroke-width', scaledStrokeWidth.toString());
    }

    if (this.__hitElementRect) {
      // Scale hit area stroke width as well
      const scaledHitStrokeWidth = (this._strokeWidth + 10) * (this.state.scale || 1);
      this.__hitElementRect.style.strokeWidth = `${scaledHitStrokeWidth}`;
    }

    // Update the entire zoom layout to ensure consistency
    this._updateZoom(this.state.scale || 1);
  }

  /**
   * Computes current logical coordinates from SVG position and size.
   */
  private _logicalCoords(): { cx: number; cy: number; rx: number; ry: number } {
    const s = this.state.scale || 1;
    if (this._origRX && this._origRY) {
      return { cx: this._origCX, cy: this._origCY, rx: this._origRX, ry: this._origRY };
    }

    const strokePadding = this._getStrokePadding() / s; // Convert to logical units
    const svgLeft = parseFloat(this.__svg.style.left) / s;
    const svgTop = parseFloat(this.__svg.style.top) / s;
    const svgWidth = parseFloat(this.__svg.getAttribute('width') || '0') / s;
    const svgHeight = parseFloat(this.__svg.getAttribute('height') || '0') / s;

    const rx = (svgWidth - strokePadding * 2) / 2;
    const ry = (svgHeight - strokePadding * 2) / 2;
    const cx = svgLeft + rx + strokePadding;
    const cy = svgTop + ry + strokePadding;

    return { cx, cy, rx, ry };
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
