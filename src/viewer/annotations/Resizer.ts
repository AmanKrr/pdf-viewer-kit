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
import { MIN_SHAPE_SIZE } from '../../constants/geometry-constants';
import PdfState from '../ui/PDFState';

type Kind = 'rect' | 'ellipse' | 'line';

/**
 * Provides draggable and resizable handles for an SVG annotation.
 * Supports both <rect> and <ellipse> elements.
 */
export class Resizer {
  private _svg: SVGSVGElement;
  private _element: SVGGraphicsElement;
  private _overlaySvg!: SVGSVGElement;
  private _overlayRect!: SVGRectElement;
  private _resizers: SVGCircleElement[] = [];
  private _isResizing = false;
  private _activeResizerIndex = -1;
  private _isDragging = false;

  private _marginLeft = 0;
  private _marginTop = 0;
  private _marginRight = 0;
  private _marginBottom = 0;

  private _onShapeUpdateCallback: () => void;
  private _constraints: DOMRect;

  private _origCX = 0;
  private _origCY = 0;
  private _origRX = 0;
  private _origRY = 0;

  private readonly _kind: Kind;
  private _overlayLine!: SVGLineElement;

  /**
   * @param svg The annotation’s SVG container.
   * @param element The inner <rect> or <ellipse> element to be resized.
   * @param onShapeUpdate Callback invoked after resize or drag completes.
   * @param constraints Bounding rectangle for drag/resize constraints.
   */
  constructor(svg: SVGSVGElement, element: SVGGraphicsElement, onShapeUpdate: () => void, constraints: any) {
    this._svg = svg;
    this._element = element;
    this._onShapeUpdateCallback = onShapeUpdate;
    this._constraints = constraints;
    this._kind = element.tagName.toLowerCase() as Kind;

    if (this._kind === 'rect') {
      // Compute the margins from the inner rect relative to the svg.
      const svgWidth = parseFloat(this._svg.getAttribute('width') || '0');
      const svgHeight = parseFloat(this._svg.getAttribute('height') || '0');
      const rectX = parseFloat(this._element.getAttribute('x') || '0');
      const rectY = parseFloat(this._element.getAttribute('y') || '0');
      const rectWidth = parseFloat(this._element.getAttribute('width') || '0');
      const rectHeight = parseFloat(this._element.getAttribute('height') || '0');

      this._marginLeft = rectX;
      this._marginTop = rectY;
      this._marginRight = svgWidth - (rectX + rectWidth);
      this._marginBottom = svgHeight - (rectY + rectHeight);
    }

    if (this._kind === 'ellipse') {
      const el = element as SVGEllipseElement;
      this._origCX = +el.getAttribute('cx')!;
      this._origCY = +el.getAttribute('cy')!;
      this._origRX = +el.getAttribute('rx')!;
      this._origRY = +el.getAttribute('ry')!;
      this._marginLeft = this._marginTop = this._marginRight = this._marginBottom = 0;
    }

    this._createOverlay();
    this._createResizerHandles();
    this.syncOverlayToSvg();
  }

  set constraintsValue(constraints: DOMRect) {
    this._constraints = constraints;
  }

  /**
   * Syncs the overlay's position and size to the annotation svg's current absolute position and dimensions.
   */
  public syncOverlayToSvg(): void {
    const svgWidth = parseFloat(this._svg.getAttribute('width') || '0');
    const svgHeight = parseFloat(this._svg.getAttribute('height') || '0');

    if (this._kind === 'rect') {
      const rectX = parseFloat(this._element.getAttribute('x') || '0');
      const rectY = parseFloat(this._element.getAttribute('y') || '0');
      const rectWidth = parseFloat(this._element.getAttribute('width') || '0');
      const rectHeight = parseFloat(this._element.getAttribute('height') || '0');

      // Update margins so that they match the current zoomed values.
      this._marginLeft = rectX;
      this._marginTop = rectY;
      this._marginRight = svgWidth - (rectX + rectWidth);
      this._marginBottom = svgHeight - (rectY + rectHeight);
    }

    const left = parseFloat(this._svg.style.left) || 0;
    const top = parseFloat(this._svg.style.top) || 0;
    const width = svgWidth;
    const height = svgHeight;

    if (this._kind !== 'line') {
      // For shapes, expand the overlay to accommodate handles positioned outside
      const offset = 8; // Same offset as used in handle positioning
      const expandedWidth = width + offset * 2;
      const expandedHeight = height + offset * 2;

      // Position overlay container so that the expanded overlay is centered over the shape
      const overlayLeft = left - offset;
      const overlayTop = top - offset;

      this._overlaySvg.style.left = overlayLeft + 'px';
      this._overlaySvg.style.top = overlayTop + 'px';
      this._overlaySvg.setAttribute('width', expandedWidth.toString());
      this._overlaySvg.setAttribute('height', expandedHeight.toString());
    } else {
      // For lines, keep original positioning
      this._overlaySvg.style.left = left + 'px';
      this._overlaySvg.style.top = top + 'px';
      this._overlaySvg.setAttribute('width', width.toString());
      this._overlaySvg.setAttribute('height', height.toString());
    }

    if (this._kind === 'line') {
      // mirror the annotation's current endpoints
      const x1 = this._element.getAttribute('x1')!;
      const y1 = this._element.getAttribute('y1')!;
      const x2 = this._element.getAttribute('x2')!;
      const y2 = this._element.getAttribute('y2')!;
      this._overlayLine.setAttribute('x1', x1);
      this._overlayLine.setAttribute('y1', y1);
      this._overlayLine.setAttribute('x2', x2);
      this._overlayLine.setAttribute('y2', y2);
      +(
        // position the two handles:
        this._resizers.forEach((h, i) => {
          h.setAttribute('cx', i === 0 ? x1 : x2);
          h.setAttribute('cy', i === 0 ? y1 : y2);
        })
      );
      return;
    }

    this._updateOverlayDimensions(0, 0, width, height);
  }

  /**
   * Removes the overlay and all its handles.
   */
  public removeResizers(): void {
    if (this._overlaySvg && this._overlaySvg.parentElement) {
      this._overlaySvg.parentElement.removeChild(this._overlaySvg);
    }
    this._resizers = [];
  }

  /**
   * Creates an overlay SVG element with a dashed outline for dragging.
   */
  private _createOverlay(): void {
    this._overlaySvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    this._overlaySvg.style.position = 'absolute';
    this._overlaySvg.style.overflow = 'visible';
    this._overlaySvg.style.pointerEvents = 'none';
    this._overlaySvg.setAttribute('data-resizer-overlay', 'true');
    this._svg.parentElement?.appendChild(this._overlaySvg);

    if (this._kind === 'line') {
      // overlay is a dashed line matching the annotation
      this._overlayLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      this._overlayLine.setAttribute('stroke-width', String(parseFloat(this._element.getAttribute('stroke-width') || '1') + 10));
      this._overlayLine.style.pointerEvents = 'stroke';
      this._overlayLine.addEventListener('mousedown', (e) => this._onLineDragStart(e));
      this._overlaySvg.appendChild(this._overlayLine);
    } else {
      this._overlayRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      this._overlayRect.setAttribute('fill', 'none');
      this._overlayRect.setAttribute('stroke', 'red');
      this._overlayRect.setAttribute('stroke-dasharray', '4');
      this._overlayRect.style.pointerEvents = 'fill';
      this._overlayRect.addEventListener('mousedown', (e) => this._onDragStart(e));
      this._overlaySvg.appendChild(this._overlayRect);
    }
  }

  /**
   * Creates eight circular handles for resizing.
   */
  private _createResizerHandles(): void {
    if (this._kind === 'line') {
      // only two endpoint handles
      [0, 1].forEach((idx) => {
        const c = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        c.setAttribute('r', '6');
        c.setAttribute('fill', 'white');
        c.setAttribute('stroke', 'blue');
        c.style.cursor = 'move';
        c.style.pointerEvents = 'all';
        c.dataset.idx = String(idx);
        c.setAttribute('data-resizer-handle', 'true');
        c.addEventListener('mousedown', (e) => this._onLineMouseDown(e, idx));
        this._overlaySvg.appendChild(c);
        this._resizers.push(c);
      });
      return;
    }
    for (let i = 0; i < 8; i++) {
      const handle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      handle.setAttribute('r', '5');
      handle.setAttribute('fill', 'blue');
      handle.setAttribute('stroke', 'white');
      handle.setAttribute('stroke-width', '1');
      handle.dataset.index = i.toString();
      handle.setAttribute('data-resizer-handle', 'true');
      handle.style.cursor = this._cursorForHandle(i);
      handle.style.pointerEvents = 'all';
      handle.addEventListener('mousedown', (e) => this._onHandleMouseDown(e, i));
      this._overlaySvg.appendChild(handle);
      this._resizers.push(handle);
    }
  }

  /**
   * @param index Handle index (0–7)
   * @returns CSS cursor for the given handle
   */
  private _cursorForHandle(index: number): string {
    switch (index) {
      case 0:
        return 'nwse-resize';
      case 1:
        return 'ns-resize';
      case 2:
        return 'nesw-resize';
      case 3:
        return 'ew-resize';
      case 4:
        return 'nwse-resize';
      case 5:
        return 'ns-resize';
      case 6:
        return 'nesw-resize';
      case 7:
        return 'ew-resize';
      default:
        return 'default';
    }
  }

  /**
   * Updates the overlay outline and repositions the handles.
   * The overlay covers the shape plus offset space for handles.
   */
  private _updateOverlayDimensions(x: number, y: number, width: number, height: number): void {
    const offset = 8; // Same offset as used in handle positioning

    // Expand overlay to accommodate handles positioned outside the shape
    const expandedWidth = width + offset * 2;
    const expandedHeight = height + offset * 2;

    // Position overlay at (0,0) and expand it to accommodate handles
    this._overlayRect.setAttribute('x', '0');
    this._overlayRect.setAttribute('y', '0');
    this._overlayRect.setAttribute('width', expandedWidth.toString());
    this._overlayRect.setAttribute('height', expandedHeight.toString());

    // Pass the original shape dimensions and offset for handle positioning
    this._updateHandlePositions(width, height, offset);
  }

  /**
   * Positions the eight handles at the corners and midpoints of the overlay.
   * Handles are positioned outside the shape with a small offset for better usability.
   */
  private _updateHandlePositions(width: number, height: number, offset: number): void {
    // Since the overlay is expanded by offset*2, we need to position handles
    // relative to the expanded overlay boundaries
    const expandedWidth = width + offset * 2;
    const expandedHeight = height + offset * 2;

    const positions = [
      { x: 0, y: 0 }, // Top-left corner
      { x: expandedWidth / 2, y: 0 }, // Top edge
      { x: expandedWidth, y: 0 }, // Top-right corner
      { x: expandedWidth, y: expandedHeight / 2 }, // Right edge
      { x: expandedWidth, y: expandedHeight }, // Bottom-right corner
      { x: expandedWidth / 2, y: expandedHeight }, // Bottom edge
      { x: 0, y: expandedHeight }, // Bottom-left corner
      { x: 0, y: expandedHeight / 2 }, // Left edge
    ];

    this._resizers.forEach((handle, index) => {
      handle.setAttribute('cx', positions[index].x.toString());
      handle.setAttribute('cy', positions[index].y.toString());
    });
  }

  /**
   * Called when a resize handle is pressed.
   */
  private _onHandleMouseDown(event: MouseEvent, index: number): void {
    event.stopPropagation();
    event.preventDefault();
    this._isResizing = true;
    this._activeResizerIndex = index;

    const startX = event.clientX;
    const startY = event.clientY;

    const initialLeft = parseFloat(this._svg.style.left) || 0;
    const initialTop = parseFloat(this._svg.style.top) || 0;
    const initialWidth = parseFloat(this._svg.getAttribute('width') || '0');
    const initialHeight = parseFloat(this._svg.getAttribute('height') || '0');

    const onMouseMove = (moveEvent: MouseEvent) => {
      const dx = moveEvent.clientX - startX;
      const dy = moveEvent.clientY - startY;
      this._resizeRect(index, initialLeft, initialTop, initialWidth, initialHeight, dx, dy);
      this.syncOverlayToSvg();
    };

    const onMouseUp = () => {
      this._isResizing = false;
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
      this._onShapeUpdateCallback?.();
    };

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  }

  private _onLineMouseDown(event: any, index: number) {
    event.stopPropagation();
    event.preventDefault();

    this._isResizing = true;
    this._activeResizerIndex = index;
    const target = event.target as SVGElement;

    // 1) record initial drag info
    const startX = event.clientX,
      startY = event.clientY;
    const origX1 = parseFloat(this._element.getAttribute('x1')!);
    const origY1 = parseFloat(this._element.getAttribute('y1')!);
    const origX2 = parseFloat(this._element.getAttribute('x2')!);
    const origY2 = parseFloat(this._element.getAttribute('y2')!);

    // container’s absolute position on the page
    const initialLeft = parseFloat(this._svg.style.left) || 0;
    const initialTop = parseFloat(this._svg.style.top) || 0;

    // compute absolute endpoints
    const abs1 = { x: initialLeft + origX1, y: initialTop + origY1 };
    const abs2 = { x: initialLeft + origX2, y: initialTop + origY2 };

    // attach move/up to document
    const onMove = (moveEvt: MouseEvent) => {
      // 2) delta
      const dx = moveEvt.clientX - startX;
      const dy = moveEvt.clientY - startY;

      // 3) proposed absolute endpoints
      let new1 = index === 0 ? { x: abs1.x + dx, y: abs1.y + dy } : { ...abs1 };
      let new2 = index === 1 ? { x: abs2.x + dx, y: abs2.y + dy } : { ...abs2 };

      // ↓↓↓  CLAMP EACH ENDPOINT TO YOUR CONSTRAINTS  ↓↓↓
      if (this._constraints) {
        const { width: W, height: H } = this._constraints;
        new1.x = Math.min(Math.max(new1.x, 0), W);
        new1.y = Math.min(Math.max(new1.y, 0), H);
        new2.x = Math.min(Math.max(new2.x, 0), W);
        new2.y = Math.min(Math.max(new2.y, 0), H);
      }

      // 4) compute raw spans and square size
      const spanX = new2.x - new1.x;
      const spanY = new2.y - new1.y;
      const absX = Math.abs(spanX),
        absY = Math.abs(spanY);
      const side = Math.max(absX, absY, MIN_SHAPE_SIZE);
      const padX = (side - absX) / 2;
      const padY = (side - absY) / 2;

      // 5) position the SVG
      const minX = Math.min(new1.x, new2.x) - padX;
      const minY = Math.min(new1.y, new2.y) - padY;
      this._svg.style.left = `${minX}px`;
      this._svg.style.top = `${minY}px`;
      this._svg.setAttribute('width', `${side}`);
      this._svg.setAttribute('height', `${side}`);

      // 6) re-anchor visible + hit lines inside that square
      const rel1 = { x: new1.x - minX, y: new1.y - minY };
      const rel2 = { x: new2.x - minX, y: new2.y - minY };
      (this._element as SVGLineElement).setAttribute('x1', `${rel1.x}`);
      (this._element as SVGLineElement).setAttribute('y1', `${rel1.y}`);
      (this._element as SVGLineElement).setAttribute('x2', `${rel2.x}`);
      (this._element as SVGLineElement).setAttribute('y2', `${rel2.y}`);

      const hit = this._element.nextElementSibling as SVGLineElement;
      if (hit && hit.getAttribute('stroke') === 'transparent') {
        hit.setAttribute('x1', `${rel1.x}`);
        hit.setAttribute('y1', `${rel1.y}`);
        hit.setAttribute('x2', `${rel2.x}`);
        hit.setAttribute('y2', `${rel2.y}`);
      }

      // 7) finally, sync overlay & handles
      this.syncOverlayToSvg();
    };

    const onUp = (upEvt: MouseEvent) => {
      this._isResizing = false;
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
      this._onShapeUpdateCallback();
    };

    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  }

  private _onLineDragStart(event: MouseEvent): void {
    if (this._isResizing) return;
    event.stopPropagation();
    event.preventDefault();
    this._isDragging = true;

    // 1) Remember where the pointer started:
    const startX = event.clientX;
    const startY = event.clientY;

    // 2) Read the SVG’s current translate:
    const initialLeft = parseFloat(this._svg.style.left) || 0;
    const initialTop = parseFloat(this._svg.style.top) || 0;
    const currentWidth = parseFloat(this._svg.getAttribute('width') || '0')!;
    const currentHeight = parseFloat(this._svg.getAttribute('height') || '0')!;

    // 3) Absolute page positions of the two endpoints:
    const origX1 = parseFloat((this._element as SVGLineElement).getAttribute('x1')!);
    const origY1 = parseFloat((this._element as SVGLineElement).getAttribute('y1')!);
    const origX2 = parseFloat((this._element as SVGLineElement).getAttribute('x2')!);
    const origY2 = parseFloat((this._element as SVGLineElement).getAttribute('y2')!);
    const abs1 = { x: initialLeft + origX1, y: initialTop + origY1 };
    const abs2 = { x: initialLeft + origX2, y: initialTop + origY2 };

    const onMouseMove = (moveEvt: MouseEvent) => {
      // a) raw delta
      let dx = moveEvt.clientX - startX;
      let dy = moveEvt.clientY - startY;

      // b) compute the allowable dx so both abs1.x+dx and abs2.x+dx ∈ [0, constraints.width]
      const dxMin = Math.max(-abs1.x, -abs2.x);
      const dxMax = Math.min(this._constraints.width - abs1.x, this._constraints.width - abs2.x);
      dx = Math.min(Math.max(dx, dxMin), dxMax);

      // c) same for dy
      const dyMin = Math.max(-abs1.y, -abs2.y);
      const dyMax = Math.min(this._constraints.height - abs1.y, this._constraints.height - abs2.y);
      dy = Math.min(Math.max(dy, dyMin), dyMax);

      // d) apply translate to the SVG container
      const newLeft = initialLeft + dx;
      const newTop = initialTop + dy;
      this._updateSvgAndRect(newLeft, newTop, currentWidth, currentHeight);

      // e) re‐sync overlay handles/line
      this.syncOverlayToSvg();
    };

    const onMouseUp = () => {
      this._isDragging = false;
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
      this._onShapeUpdateCallback();
    };

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  }

  /**
   * Called when the overlay’s outline is pressed to drag the annotation.
   */
  private _onDragStart(event: MouseEvent): void {
    if (this._isResizing) return;
    event.stopPropagation();
    event.preventDefault();
    this._isDragging = true;

    const startX = event.clientX;
    const startY = event.clientY;
    const initialLeft = parseFloat(this._svg.style.left) || 0;
    const initialTop = parseFloat(this._svg.style.top) || 0;
    const currentWidth = parseFloat(this._svg.getAttribute('width') || '0');
    const currentHeight = parseFloat(this._svg.getAttribute('height') || '0');

    const onMouseMove = (moveEvent: MouseEvent) => {
      const dx = moveEvent.clientX - startX;
      const dy = moveEvent.clientY - startY;
      let newLeft = initialLeft + dx;
      let newTop = initialTop + dy;

      if (this._constraints) {
        if (this._kind === 'line') {
        } else {
          if (newLeft + this._marginLeft < 0) {
            newLeft = -this._marginLeft;
          }
          if (newTop + this._marginTop < 0) {
            newTop = -this._marginTop;
          }
          // Ensure the inner rect's right edge stays within the container.
          if (newLeft + currentWidth - this._marginRight > this._constraints.width) {
            newLeft = this._constraints.width - (currentWidth - this._marginRight);
          }
          // Ensure the inner rect's bottom edge stays within the container.
          if (newTop + currentHeight - this._marginBottom > this._constraints.height) {
            newTop = this._constraints.height - (currentHeight - this._marginBottom);
          }
        }
      }

      this._updateSvgAndRect(newLeft, newTop, currentWidth, currentHeight);
      this.syncOverlayToSvg();
    };

    const onMouseUp = () => {
      this._isDragging = false;
      this._onShapeUpdateCallback?.();
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  }

  /**
   * Handles resizing logic for rectangles and ellipses.
   */
  private _resizeRect(index: number, initialLeft: number, initialTop: number, initialWidth: number, initialHeight: number, dx: number, dy: number) {
    let newLeft = initialLeft;
    let newTop = initialTop;
    let newWidth = initialWidth;
    let newHeight = initialHeight;

    // Adjust which edges change based on the handle index.
    switch (index) {
      case 0:
        newLeft = initialLeft + dx;
        newTop = initialTop + dy;
        newWidth = initialWidth - dx;
        newHeight = initialHeight - dy;
        break;
      case 1:
        newTop = initialTop + dy;
        newHeight = initialHeight - dy;
        break;
      case 2:
        newTop = initialTop + dy;
        newWidth = initialWidth + dx;
        newHeight = initialHeight - dy;
        break;
      case 3:
        newWidth = initialWidth + dx;
        break;
      case 4:
        newWidth = initialWidth + dx;
        newHeight = initialHeight + dy;
        break;
      case 5:
        newHeight = initialHeight + dy;
        break;
      case 6:
        newLeft = initialLeft + dx;
        newWidth = initialWidth - dx;
        newHeight = initialHeight + dy;
        break;
      case 7:
        newLeft = initialLeft + dx;
        newWidth = initialWidth - dx;
        break;
    }

    // Enforce a minimum size.
    if (newWidth < MIN_SHAPE_SIZE) {
      newWidth = MIN_SHAPE_SIZE;
      if ([0, 6, 7].includes(index)) {
        newLeft = initialLeft + (initialWidth - MIN_SHAPE_SIZE);
      }
    }
    if (newHeight < MIN_SHAPE_SIZE) {
      newHeight = MIN_SHAPE_SIZE;
      if ([0, 1, 2].includes(index)) {
        newTop = initialTop + (initialHeight - MIN_SHAPE_SIZE);
      }
    }

    // Constrain left edge:
    if (newLeft + this._marginLeft < 0) {
      const offset = -(newLeft + this._marginLeft);
      newLeft += offset;
      newWidth -= offset;
    }

    // Constrain top edge:
    if (newTop + this._marginTop < 0) {
      const offset = -(newTop + this._marginTop);
      newTop += offset;
      newHeight -= offset;
    }

    if (this._constraints) {
      // Constrain right edge: inner rect's right must be within container width.
      if (newLeft + newWidth - this._marginRight > this._constraints.width) {
        newWidth = this._constraints.width - newLeft + this._marginRight;
      }
      // Constrain bottom edge: inner rect's bottom must be within container height.
      if (newTop + newHeight - this._marginBottom > this._constraints.height) {
        newHeight = this._constraints.height - newTop + this._marginBottom;
      }
    }

    this._updateSvgAndRect(newLeft, newTop, newWidth, newHeight);

    if (this._kind === 'ellipse') {
      this._updateEllipse(newWidth, newHeight);
    }
  }

  /**
   * Adjusts an ellipse’s cx, cy, rx, ry after resize.
   */
  private _updateEllipse(newWidth: number, newHeight: number) {
    const minR = MIN_SHAPE_SIZE / 2;
    const rx = Math.max(newWidth / 2, minR);
    const ry = Math.max(newHeight / 2, minR);
    const cx = rx;
    const cy = ry;

    const ell = this._element as SVGEllipseElement;
    ell.setAttribute('cx', `${cx}`);
    ell.setAttribute('cy', `${cy}`);
    ell.setAttribute('rx', `${rx}`);
    ell.setAttribute('ry', `${ry}`);

    /* hit-area sibling (if any) */
    ell.nextElementSibling?.setAttribute('cx', `${cx}`);
    ell.nextElementSibling?.setAttribute('cy', `${cy}`);
    ell.nextElementSibling?.setAttribute('rx', `${rx}`);
    ell.nextElementSibling?.setAttribute('ry', `${ry}`);
  }

  /**
   * Updates the svg container’s absolute position and size—and then adjusts the inner rect.
   *
   * The inner rect is always placed using the stored margins:
   *   - x = marginLeft
   *   - y = marginTop
   *   - width = (svg width) – (marginLeft + marginRight)
   *   - height = (svg height) – (marginTop + marginBottom)
   */
  private _updateSvgAndRect(newLeft: number, newTop: number, newWidth: number, newHeight: number): void {
    // Update the svg container’s position (via CSS) and its dimensions.
    this._svg.style.left = newLeft + 'px';
    this._svg.style.top = newTop + 'px';
    this._svg.setAttribute('width', newWidth.toString());
    this._svg.setAttribute('height', newHeight.toString());

    // Update the inner rect to maintain its margins.
    if (this._kind === 'rect') {
      const rectX = this._marginLeft;
      const rectY = this._marginTop;
      const rectWidth = newWidth - this._marginLeft - this._marginRight;
      const rectHeight = newHeight - this._marginTop - this._marginBottom;
      this._element.setAttribute('x', rectX.toString());
      this._element.setAttribute('y', rectY.toString());
      this._element.setAttribute('width', rectWidth.toString());
      this._element.setAttribute('height', rectHeight.toString());
      this._element.nextElementSibling?.setAttribute('x', rectX.toString());
      this._element.nextElementSibling?.setAttribute('y', rectY.toString());
      this._element.nextElementSibling?.setAttribute('width', rectWidth.toString());
      this._element.nextElementSibling?.setAttribute('height', rectHeight.toString());
    }
  }
}
