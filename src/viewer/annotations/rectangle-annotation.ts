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

import { RectangleConfig } from '../../types/geometry.types';
import { Resizer } from './resizer';
import { Annotation } from './annotation';
import { InstanceEventEmitter } from '../../core/event/event-emitter.core';
import { InstanceState } from '../../core/viewer-core/viewer-state.core';
import { scrollElementIntoView } from '../../utils/web-ui-utils';

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
  private _instances: {
    events: InstanceEventEmitter;
    state: InstanceState;
    instanceId: string;
    containerId: string;
  };
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
    this._constraints = container.getBoundingClientRect();
    this._fillColor = fillColor;
    this._strokeColor = strokeColor;
    this._strokeWidth = strokeWidth;
    this._strokeStyle = strokeStyle;
    this._opacity = opacity;

    this.events.on('scaleChange', this._bindOnScaleChange);
  }

  private _onScaleChange(event: any) {
    this._constraints = this.__annotationDrawerContainer.getBoundingClientRect();
    this._updateZoom(this.state.scale);

    // Update stroke width to maintain visual consistency across zoom levels
    this._updateStrokeWidthForZoom();
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
    // Treat inputs as SHAPE coordinates (top-left and dimensions at current viewport),
    // not as SVG container coordinates. Adjust SVG to include stroke padding.
    this._interactive = interactive;
    this.__startX = x0;
    this.__startY = y0;
    this.isDrawing = false;

    const currentScale = this.state.scale || 1;
    const scaledStrokeWidth = this._strokeWidth * currentScale;
    const strokePadding = scaledStrokeWidth / 2;

    // Position SVG so that its inner rect (offset by strokePadding) aligns at shape-left/top
    this.__svg.style.left = `${x0 - strokePadding}px`;
    this.__svg.style.top = `${y0 - strokePadding}px`;
    this.__svg.setAttribute('width', `${width + scaledStrokeWidth}`);
    this.__svg.setAttribute('height', `${height + scaledStrokeWidth}`);
    this._pageNumber = pageNumber;

    this._createSvgRect(width, height);
    this._maintainOriginalBounding(1);
    this._updateZoom(this.state.scale);
    this._setRectInfo();
  }

  /**
   * Begins the drawing process for the annotation.
   * @param x - The starting X-coordinate.
   * @param y - The starting Y-coordinate.
   */
  public startDrawing(x: number, y: number, pageNumber: number): void {
    super.startDrawing(x, y, pageNumber);
    this.__svg.style.left = `${x}px`;
    this.__svg.style.top = `${y}px`;
    this._createSvgRect();
    this._pageNumber = pageNumber;

    // Temporarily disable text selection during drawing
    this._disableTextSelection();
  }

  /**
   * Updates the drawing of the annotation as the pointer moves.
   */
  public updateDrawing(x: number, y: number): void {
    if (!this.isDrawing || !this.__element || !this.__hitElementRect) return;

    const maxX = this._constraints.width;
    const maxY = this._constraints.height;
    const clampedX = Math.min(Math.max(x, 0), maxX);
    const clampedY = Math.min(Math.max(y, 0), maxY);
    const width = clampedX - this.__startX;
    const height = clampedY - this.__startY;

    // Account for scaled stroke width to prevent strokes from being cut off
    const scaledStrokeWidth = this._strokeWidth * (this.state.scale || 1);
    const strokePadding = scaledStrokeWidth / 2;
    const svgWidth = Math.abs(width) + scaledStrokeWidth;
    const svgHeight = Math.abs(height) + scaledStrokeWidth;

    this.__svg.setAttribute('width', svgWidth.toString());
    this.__svg.setAttribute('height', svgHeight.toString());

    // Position the shape element with stroke offset to center it in the expanded SVG
    const strokeOffset = strokePadding;
    this.__element.setAttribute('x', strokeOffset.toString());
    this.__element.setAttribute('y', strokeOffset.toString());
    this.__element.setAttribute('width', `${Math.abs(width)}`);
    this.__element.setAttribute('height', `${Math.abs(height)}`);

    // Position the hit element to match the shape
    this.__hitElementRect.setAttribute('x', strokeOffset.toString());
    this.__hitElementRect.setAttribute('y', strokeOffset.toString());
    this.__hitElementRect.setAttribute('width', `${Math.abs(width)}`);
    this.__hitElementRect.setAttribute('height', `${Math.abs(height)}`);

    if (width < 0) this.__svg.style.left = `${clampedX - strokeOffset}px`;
    if (height < 0) this.__svg.style.top = `${clampedY - strokeOffset}px`;
  }

  /**
   * Ends interactive drawing, caches geometry, and optionally selects
   * or emits an update event.
   * @param opts.select       Auto-select after drawing
   * @param opts.shapeUpdate  Emit ANNOTATION_CREATED event
   */
  public stopDrawing(): void {
    super.stopDrawing();

    // Check if the user actually created a meaningful shape (not just a click)
    const currentWidth = parseFloat(this.__element?.getAttribute('width') || '0');
    const currentHeight = parseFloat(this.__element?.getAttribute('height') || '0');
    const minSize = 5; // Minimum size in pixels to consider it a valid shape

    if (currentWidth < minSize || currentHeight < minSize) {
      // User just clicked without dragging - mark this annotation as invalid
      // and remove the DOM elements to clean up the visual artifacts
      this._isValidAnnotation = false;

      // Remove the SVG elements from DOM to clean up visual artifacts
      if (this.__svg && this.__svg.parentElement) {
        this.__svg.remove();
      }

      this._enableTextSelection();
      return;
    }

    this._isValidAnnotation = true;
    this._maintainOriginalBounding();
    this._setRectInfo();
    this.select();
    this._onShapeUpdate();

    // Re-enable text selection after drawing
    this._enableTextSelection();
  }

  /**
   * Selects this annotation, adding resizers.
   */
  public select(): void {
    if (!this._resizer) {
      this._resizer = new Resizer(this.__svg, this.__element as SVGGraphicsElement, this._onShapeUpdate.bind(this), this._constraints);
      this.__svg.focus();
    }
  }

  /**
   * Deselects this annotation, removing resizers.
   */
  public deselect(): void {
    if (this._resizer) {
      this._resizer.removeResizers();
      this._resizer = null;
    }

    // Emit deselection event
    this.events.emit('ANNOTATION_DESELECT');
  }

  /**
   * Deletes this annotation from the DOM.
   * @param suppressEvent If true, skips ANNOTATION_DELETED emission
   */
  public deleteAnnotation(suppressEvent = false): void {
    if (this.__svg) {
      if (this._resizer) {
        this._resizer.removeResizers();
        this._resizer = null;
      }
      this.__svg.remove();
    }
    if (!suppressEvent) {
      this.events.emit('ANNOTATION_DELETED', this.id);
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
    if (this.__svg) {
      scrollElementIntoView(this.__svg, { block: 'center' });
    }
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
  private _createSvgRect(width: number = 0, height: number = 0): void {
    // Account for scaled stroke width to prevent strokes from being cut off
    const initialScaledStrokeWidth = this._strokeWidth * (this.state.scale || 1);
    const strokePadding = initialScaledStrokeWidth / 2;
    const svgWidth = Math.abs(width) + initialScaledStrokeWidth;
    const svgHeight = Math.abs(height) + initialScaledStrokeWidth;
    const strokeOffset = strokePadding;

    this.__element = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    this.__element.id = this.annotationId;
    this.__element.setAttribute('x', strokeOffset.toString());
    this.__element.setAttribute('y', strokeOffset.toString());
    this.__element.setAttribute('width', Math.abs(width).toString());
    this.__element.setAttribute('height', Math.abs(height).toString());
    this.__element.setAttribute('fill', this._fillColor);
    this.__element.setAttribute('stroke', this._strokeColor);
    // Scale stroke width based on current zoom level
    const scaledStrokeWidth = this._strokeWidth * (this.state.scale || 1);
    this.__element.setAttribute('stroke-width', `${scaledStrokeWidth}`);
    this.__element.setAttribute('stroke-dasharray', this._getStrokeDashArray());
    this.__element.setAttribute('opacity', this._opacity.toString());
    this.__element.style.pointerEvents = 'none';

    this.__hitElementRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    this.__hitElementRect.setAttribute('x', strokeOffset.toString());
    this.__hitElementRect.setAttribute('y', strokeOffset.toString());
    this.__hitElementRect.setAttribute('width', Math.abs(width).toString());
    this.__hitElementRect.setAttribute('height', Math.abs(height).toString());
    this.__hitElementRect.setAttribute('fill', 'none');
    this.__hitElementRect.setAttribute('stroke', 'transparent');
    // Use thicker stroke width for easier clicking, scaled by zoom level
    const scaledHitStrokeWidth = (this._strokeWidth + 10) * (this.state.scale || 1);
    this.__hitElementRect.setAttribute('stroke-width', `${scaledHitStrokeWidth}`);
    this.__hitElementRect.style.cursor = 'pointer';
    this.__hitElementRect.style.pointerEvents = 'auto';
    this.__svg.appendChild(this.__element);

    this.__hitElementRect.onclick = (event) => {
      event.stopPropagation();
      event.preventDefault();
      this.__onAnnotationClick(event, this.getConfig());
    };
    this.__svg.appendChild(this.__hitElementRect);
  }

  /**
   * Updates the hit area size based on selection state and transparency
   * - Unselected + transparent: minimal hit area (just stroke width)
   * - Selected: full shape area for better interaction
   * - Unselected + opaque: minimal hit area (just stroke width)
   */
  private _updateHitAreaSize(): void {
    if (!this.__hitElementRect) return;

    const isTransparent = this._fillColor === 'transparent' || this._fillColor === 'rgba(0,0,0,0)' || this._opacity === 0;

    if (isTransparent && !this._resizer) {
      // Unselected transparent shape: minimal hit area (just scaled stroke width)
      // This minimizes interference with text selection while keeping it clickable
      const scaledStrokeWidth = this._strokeWidth * (this.state.scale || 1);
      const strokeOffset = scaledStrokeWidth / 2;

      // For unselected transparent shapes, create a hit area that covers just the stroke boundary
      // This ensures it's clickable while minimizing text interference
      this.__hitElementRect.setAttribute('x', `${strokeOffset}`);
      this.__hitElementRect.setAttribute('y', `${strokeOffset}`);

      const currentWidth = parseFloat(this.__svg.getAttribute('width') || '0');
      const currentHeight = parseFloat(this.__svg.getAttribute('height') || '0');

      // Ensure the hit area covers the stroke boundary
      const hitWidth = Math.max(scaledStrokeWidth, currentWidth - scaledStrokeWidth);
      const hitHeight = Math.max(scaledStrokeWidth, currentHeight - scaledStrokeWidth);

      this.__hitElementRect.setAttribute('width', `${hitWidth}`);
      this.__hitElementRect.setAttribute('height', `${hitHeight}`);

      // Make sure pointer events are enabled
      this.__hitElementRect.style.pointerEvents = 'auto';
    } else {
      // Selected shape or opaque shape: full area for better interaction
      this.__hitElementRect.setAttribute('x', '0');
      this.__hitElementRect.setAttribute('y', '0');
      this.__hitElementRect.setAttribute('width', this.__svg.getAttribute('width') || '0');
      this.__hitElementRect.setAttribute('height', this.__svg.getAttribute('height') || '0');

      // Make sure pointer events are enabled
      this.__hitElementRect.style.pointerEvents = 'auto';
    }
  }

  /** Captures current un-scaled position and size for zoom adjustments. */
  private _maintainOriginalBounding(zoomLevel = 1): void {
    // Always normalize to scale=1 for consistency, regardless of current zoom
    const currentScale = this.state.scale || 1;

    // Extract actual shape coordinates (not SVG container coordinates)
    const svgLeft = parseFloat(this.__svg.style.left) || 0;
    const svgTop = parseFloat(this.__svg.style.top) || 0;
    const shapeWidth = parseFloat(this.__element?.getAttribute('width') || '0');
    const shapeHeight = parseFloat(this.__element?.getAttribute('height') || '0');

    // Calculate stroke padding at current scale
    const currentStrokePadding = (this._strokeWidth * currentScale) / 2;

    // Store actual shape coordinates at scale=1 (shape is inset by stroke padding from SVG)
    this._originalLeft = (svgLeft + currentStrokePadding) / currentScale;
    this._originalTop = (svgTop + currentStrokePadding) / currentScale;
    this._originalWidth = shapeWidth / currentScale;
    this._originalHeight = shapeHeight / currentScale;
  }

  /**
   * Re-applies scaled position and size based on captured original values.
   * @param zoomFactor Current viewer scale
   */
  private _updateZoom(zoomFactor: number): void {
    // Original coordinates represent actual shape position/size at scale=1
    const shapeLeft = this._originalLeft * zoomFactor;
    const shapeTop = this._originalTop * zoomFactor;
    const shapeWidth = this._originalWidth * zoomFactor;
    const shapeHeight = this._originalHeight * zoomFactor;

    // Calculate scaled stroke width to prevent clipping
    const scaledStrokeWidth = this._strokeWidth * zoomFactor;
    const strokePadding = scaledStrokeWidth / 2;

    // SVG container sized to accommodate scaled stroke width
    const svgWidth = shapeWidth + scaledStrokeWidth;
    const svgHeight = shapeHeight + scaledStrokeWidth;

    // SVG container positioned to accommodate stroke padding
    this.__svg.style.left = `${shapeLeft - strokePadding}px`;
    this.__svg.style.top = `${shapeTop - strokePadding}px`;
    this.__svg.setAttribute('width', `${svgWidth}`);
    this.__svg.setAttribute('height', `${svgHeight}`);

    if (this.__element) {
      // Shape element positioned at stroke padding offset within SVG
      this.__element.setAttribute('x', `${strokePadding}`);
      this.__element.setAttribute('y', `${strokePadding}`);
      this.__element.setAttribute('width', `${shapeWidth}`);
      this.__element.setAttribute('height', `${shapeHeight}`);
    }

    if (this.__hitElementRect) {
      // Hit element matches shape element exactly
      this.__hitElementRect.setAttribute('x', `${strokePadding}`);
      this.__hitElementRect.setAttribute('y', `${strokePadding}`);
      this.__hitElementRect.setAttribute('width', `${shapeWidth}`);
      this.__hitElementRect.setAttribute('height', `${shapeHeight}`);
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

    // Update SVG container size to accommodate scaled stroke width
    if (this._originalWidth && this._originalHeight) {
      const currentScale = this.state.scale || 1;
      const scaledStrokeWidth = this._strokeWidth * currentScale;
      const strokePadding = scaledStrokeWidth / 2;

      const shapeWidth = this._originalWidth * currentScale;
      const shapeHeight = this._originalHeight * currentScale;

      const svgWidth = shapeWidth + scaledStrokeWidth;
      const svgHeight = shapeHeight + scaledStrokeWidth;

      this.__svg.setAttribute('width', `${svgWidth}`);
      this.__svg.setAttribute('height', `${svgHeight}`);

      // Update shape positioning within the expanded SVG
      if (this.__element) {
        this.__element.setAttribute('x', `${strokePadding}`);
        this.__element.setAttribute('y', `${strokePadding}`);
      }

      if (this.__hitElementRect) {
        this.__hitElementRect.setAttribute('x', `${strokePadding}`);
        this.__hitElementRect.setAttribute('y', `${strokePadding}`);
      }
    }
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
   * Computes logical (un-scaled) coordinates of the actual shape (not SVG container).
   * Returns coordinates of the visible shape at scale=1.
   */
  private _getLogicalCoordinates(): { x0: number; y0: number; x1: number; y1: number } {
    const scale = this.state.scale || 1;

    if (this._originalWidth) {
      // Use captured original shape coordinates (already at scale=1)
      return {
        x0: this._originalLeft,
        y0: this._originalTop,
        x1: this._originalLeft + this._originalWidth,
        y1: this._originalTop + this._originalHeight,
      };
    }

    // Fallback: Extract shape coordinates from current SVG state
    const svgLeft = parseFloat(this.__svg.style.left) / scale;
    const svgTop = parseFloat(this.__svg.style.top) / scale;
    const shapeWidth = parseFloat(this.__element?.getAttribute('width') || '0') / scale;
    const shapeHeight = parseFloat(this.__element?.getAttribute('height') || '0') / scale;
    const scaledStrokeWidth = this._strokeWidth; // At scale=1
    const strokePadding = scaledStrokeWidth / 2;

    return {
      x0: svgLeft + strokePadding, // Shape left = SVG left + stroke padding
      y0: svgTop + strokePadding, // Shape top = SVG top + stroke padding
      x1: svgLeft + strokePadding + shapeWidth, // Shape right
      y1: svgTop + strokePadding + shapeHeight, // Shape bottom
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
    this.events.emit('ANNOTATION_CREATED', this.getConfig());
  }

  /**
   * Updates the stroke style of the existing shape.
   * This is called when the user changes stroke style in the toolbar.
   */
  public updateStrokeStyle(newStyle: string): void {
    this._strokeStyle = newStyle;

    // Update the SVG element with new stroke dash array
    if (this.__element) {
      this.__element.setAttribute('stroke-dasharray', this._getStrokeDashArray());
    }

    // Update the hit element too
    if (this.__hitElementRect) {
      this.__hitElementRect.setAttribute('stroke-dasharray', this._getStrokeDashArray());
    }

    // Update internal state
    this._setRectInfo();
  }

  /**
   * Updates the stroke width of the existing shape.
   */
  public updateStrokeWidth(newWidth: number): void {
    this._strokeWidth = newWidth;

    if (this.__element) {
      // Scale stroke width based on current zoom level
      const scaledStrokeWidth = newWidth * (this.state.scale || 1);
      this.__element.setAttribute('stroke-width', scaledStrokeWidth.toString());
    }

    if (this.__hitElementRect) {
      // Scale hit area stroke width as well
      const scaledHitStrokeWidth = (newWidth + 10) * (this.state.scale || 1);
      this.__hitElementRect.style.strokeWidth = `${scaledHitStrokeWidth}`;
    }

    this._setRectInfo();
  }

  /**
   * Updates the stroke color of the existing shape.
   */
  public updateStrokeColor(newColor: string): void {
    this._strokeColor = newColor;

    if (this.__element) {
      this.__element.setAttribute('stroke', newColor);
    }

    this._setRectInfo();
  }

  /**
   * Updates the fill color of the existing shape.
   */
  public updateFillColor(newColor: string): void {
    this._fillColor = newColor;

    if (this.__element) {
      this.__element.setAttribute('fill', newColor);
    }

    this._setRectInfo();
  }

  /**
   * Updates the opacity of the existing shape.
   */
  public updateOpacity(newOpacity: number): void {
    this._opacity = newOpacity;

    if (this.__element) {
      this.__element.setAttribute('opacity', newOpacity.toString());
    }

    this._setRectInfo();
  }

  /**
   * Temporarily disables text selection to improve drawing experience.
   */
  private _disableTextSelection(): void {
    const textLayer = this.__annotationDrawerContainer.parentElement?.querySelector('.a-text-layer') as HTMLElement;
    if (textLayer) {
      textLayer.style.userSelect = 'none';
      textLayer.style.webkitUserSelect = 'none';
    }
  }

  /**
   * Re-enables text selection after drawing is complete.
   */
  private _enableTextSelection(): void {
    const textLayer = this.__annotationDrawerContainer.parentElement?.querySelector('.a-text-layer') as HTMLElement;
    if (textLayer) {
      textLayer.style.userSelect = 'text';
      textLayer.style.webkitUserSelect = 'text';
    }
  }
}
