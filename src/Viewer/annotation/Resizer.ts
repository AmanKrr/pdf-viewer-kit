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

export class Resizer {
  private svg: SVGSVGElement; // The annotation’s container
  private element: SVGRectElement; // The inner rect
  private overlaySvg!: SVGSVGElement; // The overlay (positioned absolutely)
  private overlayRect!: SVGRectElement; // The dashed outline drawn in the overlay
  private resizers: SVGCircleElement[] = [];
  private isResizing: boolean = false;
  private activeResizerIndex: number = -1;
  private isDragging: boolean = false;

  // These values store the original margins of the rect inside the svg.
  private marginLeft: number;
  private marginTop: number;
  private marginRight: number;
  private marginBottom: number;

  constructor(svg: SVGSVGElement, element: SVGRectElement) {
    this.svg = svg;
    this.element = element;

    // Compute the margins from the inner rect relative to the svg.
    const svgWidth = parseFloat(this.svg.getAttribute('width') || '0');
    const svgHeight = parseFloat(this.svg.getAttribute('height') || '0');
    const rectX = parseFloat(this.element.getAttribute('x') || '0');
    const rectY = parseFloat(this.element.getAttribute('y') || '0');
    const rectWidth = parseFloat(this.element.getAttribute('width') || '0');
    const rectHeight = parseFloat(this.element.getAttribute('height') || '0');

    // For example, if the rect sits at (10,10) inside an 180×77 svg,
    // then the margins are 10 on the top/left and 10 on the right/bottom.
    this.marginLeft = rectX;
    this.marginTop = rectY;
    this.marginRight = svgWidth - (rectX + rectWidth);
    this.marginBottom = svgHeight - (rectY + rectHeight);

    // Create an overlay that will allow the user to drag/resize the svg.
    this.createOverlay();
    this.createResizerHandles();
    // Sync the overlay to the svg’s current absolute position and dimensions.
    this.syncOverlayToSvg();
  }

  /**
   * Creates an overlay SVG element that sits on top of the annotation svg.
   * (It’s appended as a sibling so that its coordinates are in the document space.)
   */
  private createOverlay(): void {
    this.overlaySvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    // Position it absolutely.
    this.overlaySvg.style.position = 'absolute';
    // Allow children (like the handle circles) to render outside the overlay bounds.
    this.overlaySvg.style.overflow = 'visible';
    // We set pointer events to none on the container so that its children can handle events.
    this.overlaySvg.style.pointerEvents = 'none';

    // Append the overlay to the same parent as the annotation svg.
    if (this.svg.parentElement) {
      this.svg.parentElement.appendChild(this.overlaySvg);
    }

    // Create a dashed outline (rect) that will be used for dragging.
    this.overlayRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    this.overlayRect.setAttribute('fill', 'none');
    this.overlayRect.setAttribute('stroke', 'red');
    this.overlayRect.setAttribute('stroke-dasharray', '4');
    // Enable pointer events on the outline so the user can drag the entire annotation.
    this.overlayRect.style.pointerEvents = 'fill';
    // Clicking on the outline (but not on a handle) starts a drag.
    this.overlayRect.addEventListener('mousedown', (e) => this.onDragStart(e));
    this.overlaySvg.appendChild(this.overlayRect);
  }

  /**
   * Creates eight circular handles for resizing.
   */
  private createResizerHandles(): void {
    for (let i = 0; i < 8; i++) {
      const handle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      handle.setAttribute('r', '5');
      handle.setAttribute('fill', 'blue');
      handle.setAttribute('stroke', 'white');
      handle.setAttribute('stroke-width', '1');
      handle.dataset.index = i.toString();
      handle.style.cursor = this.cursorForHandle(i);
      // Enable pointer events on handles.
      handle.style.pointerEvents = 'all';
      handle.addEventListener('mousedown', (e) => this.onHandleMouseDown(e, i));
      this.overlaySvg.appendChild(handle);
      this.resizers.push(handle);
    }
  }

  /**
   * Returns an appropriate CSS cursor for a given handle.
   */
  private cursorForHandle(index: number): string {
    switch (index) {
      case 0:
        return 'nwse-resize'; // top-left
      case 1:
        return 'ns-resize'; // top-middle
      case 2:
        return 'nesw-resize'; // top-right
      case 3:
        return 'ew-resize'; // middle-right
      case 4:
        return 'nwse-resize'; // bottom-right
      case 5:
        return 'ns-resize'; // bottom-middle
      case 6:
        return 'nesw-resize'; // bottom-left
      case 7:
        return 'ew-resize'; // middle-left
      default:
        return 'default';
    }
  }

  /**
   * Syncs the overlay’s position and size to the annotation svg’s current absolute position and dimensions.
   */
  private syncOverlayToSvg(): void {
    // The annotation svg is absolutely positioned using its CSS style.
    const left = parseFloat(this.svg.style.left) || 0;
    const top = parseFloat(this.svg.style.top) || 0;
    const width = parseFloat(this.svg.getAttribute('width') || '0');
    const height = parseFloat(this.svg.getAttribute('height') || '0');

    // Update the overlay container to exactly cover the svg.
    this.overlaySvg.style.left = left + 'px';
    this.overlaySvg.style.top = top + 'px';
    this.overlaySvg.setAttribute('width', width.toString());
    this.overlaySvg.setAttribute('height', height.toString());

    // Update the overlay’s outline and handle positions.
    this.updateOverlayDimensions(left, top, width, height);
  }

  /**
   * Updates the overlay outline (rectangle) and repositions the handles.
   * Note that here the overlay’s internal coordinate system has (0,0) at its top‐left.
   */
  private updateOverlayDimensions(x: number, y: number, width: number, height: number): void {
    // The overlay rect always fills the overlay container.
    this.overlayRect.setAttribute('x', '0');
    this.overlayRect.setAttribute('y', '0');
    this.overlayRect.setAttribute('width', width.toString());
    this.overlayRect.setAttribute('height', height.toString());
    this.updateHandlePositions(width, height);
  }

  /**
   * Positions the eight handles at the corners and midpoints of the overlay.
   */
  private updateHandlePositions(width: number, height: number): void {
    const positions = [
      { x: 0, y: 0 }, // top-left
      { x: width / 2, y: 0 }, // top-middle
      { x: width, y: 0 }, // top-right
      { x: width, y: height / 2 }, // middle-right
      { x: width, y: height }, // bottom-right
      { x: width / 2, y: height }, // bottom-middle
      { x: 0, y: height }, // bottom-left
      { x: 0, y: height / 2 }, // middle-left
    ];

    this.resizers.forEach((handle, index) => {
      handle.setAttribute('cx', positions[index].x.toString());
      handle.setAttribute('cy', positions[index].y.toString());
    });
  }

  /**
   * Called when a resize handle is pressed.
   */
  private onHandleMouseDown(event: MouseEvent, index: number): void {
    event.stopPropagation();
    event.preventDefault();
    this.isResizing = true;
    this.activeResizerIndex = index;

    const startX = event.clientX;
    const startY = event.clientY;

    // Capture the current annotation svg’s position and dimensions.
    const initialLeft = parseFloat(this.svg.style.left) || 0;
    const initialTop = parseFloat(this.svg.style.top) || 0;
    const initialWidth = parseFloat(this.svg.getAttribute('width') || '0');
    const initialHeight = parseFloat(this.svg.getAttribute('height') || '0');

    const onMouseMove = (moveEvent: MouseEvent) => {
      const dx = moveEvent.clientX - startX;
      const dy = moveEvent.clientY - startY;

      let newLeft = initialLeft;
      let newTop = initialTop;
      let newWidth = initialWidth;
      let newHeight = initialHeight;

      // Adjust which edges change based on the handle index.
      switch (index) {
        case 0: // top-left
          newLeft = initialLeft + dx;
          newTop = initialTop + dy;
          newWidth = initialWidth - dx;
          newHeight = initialHeight - dy;
          break;
        case 1: // top-middle
          newTop = initialTop + dy;
          newHeight = initialHeight - dy;
          break;
        case 2: // top-right
          newTop = initialTop + dy;
          newWidth = initialWidth + dx;
          newHeight = initialHeight - dy;
          break;
        case 3: // middle-right
          newWidth = initialWidth + dx;
          break;
        case 4: // bottom-right
          newWidth = initialWidth + dx;
          newHeight = initialHeight + dy;
          break;
        case 5: // bottom-middle
          newHeight = initialHeight + dy;
          break;
        case 6: // bottom-left
          newLeft = initialLeft + dx;
          newWidth = initialWidth - dx;
          newHeight = initialHeight + dy;
          break;
        case 7: // middle-left
          newLeft = initialLeft + dx;
          newWidth = initialWidth - dx;
          break;
      }

      // Enforce a minimum size.
      const minSize = 20;
      if (newWidth < minSize) {
        newWidth = minSize;
        if ([0, 6, 7].includes(index)) {
          newLeft = initialLeft + (initialWidth - minSize);
        }
      }
      if (newHeight < minSize) {
        newHeight = minSize;
        if ([0, 1, 2].includes(index)) {
          newTop = initialTop + (initialHeight - minSize);
        }
      }

      // Update the svg (and inner rect) with the new position/dimensions.
      this.updateSvgAndRect(newLeft, newTop, newWidth, newHeight);
      // Keep the overlay in sync.
      this.syncOverlayToSvg();
    };

    const onMouseUp = () => {
      this.isResizing = false;
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  }

  /**
   * Called when the overlay’s outline is pressed to drag the annotation.
   */
  private onDragStart(event: MouseEvent): void {
    if (this.isResizing) return; // do not start drag if resizing
    event.stopPropagation();
    event.preventDefault();
    this.isDragging = true;

    const startX = event.clientX;
    const startY = event.clientY;
    const initialLeft = parseFloat(this.svg.style.left) || 0;
    const initialTop = parseFloat(this.svg.style.top) || 0;
    const currentWidth = parseFloat(this.svg.getAttribute('width') || '0');
    const currentHeight = parseFloat(this.svg.getAttribute('height') || '0');

    const onMouseMove = (moveEvent: MouseEvent) => {
      const dx = moveEvent.clientX - startX;
      const dy = moveEvent.clientY - startY;
      const newLeft = initialLeft + dx;
      const newTop = initialTop + dy;
      this.updateSvgAndRect(newLeft, newTop, currentWidth, currentHeight);
      this.syncOverlayToSvg();
    };

    const onMouseUp = () => {
      this.isDragging = false;
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
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
  private updateSvgAndRect(newLeft: number, newTop: number, newWidth: number, newHeight: number): void {
    // Update the svg container’s position (via CSS) and its dimensions.
    this.svg.style.left = newLeft + 'px';
    this.svg.style.top = newTop + 'px';
    this.svg.setAttribute('width', newWidth.toString());
    this.svg.setAttribute('height', newHeight.toString());

    // Update the inner rect to maintain its margins.
    const rectX = this.marginLeft;
    const rectY = this.marginTop;
    const rectWidth = newWidth - this.marginLeft - this.marginRight;
    const rectHeight = newHeight - this.marginTop - this.marginBottom;
    this.element.setAttribute('x', rectX.toString());
    this.element.setAttribute('y', rectY.toString());
    this.element.setAttribute('width', rectWidth.toString());
    this.element.setAttribute('height', rectHeight.toString());
    this.element.nextElementSibling?.setAttribute('x', rectX.toString());
    this.element.nextElementSibling?.setAttribute('y', rectY.toString());
    this.element.nextElementSibling?.setAttribute('width', rectWidth.toString());
    this.element.nextElementSibling?.setAttribute('height', rectHeight.toString());
  }

  /**
   * Removes the overlay and all its handles.
   */
  public removeResizers(): void {
    if (this.overlaySvg && this.overlaySvg.parentElement) {
      this.overlaySvg.parentElement.removeChild(this.overlaySvg);
    }
    this.resizers = [];
  }
}
