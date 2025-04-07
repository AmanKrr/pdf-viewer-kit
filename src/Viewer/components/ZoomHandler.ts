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

import PdfState from './PdfState';
import PageVirtualization from './PageVirtualization';
import { aPdfViewerIds } from '../../constant/ElementIdClass';

interface ZoomOptions {
  minScale: number;
  maxScale: number;
  zoomStep: number;
  // Optionally add debounce durations, etc.
}

export default class ZoomHandler {
  private pdfState: PdfState;
  private pageVirtualization: PageVirtualization;
  private options: ZoomOptions;

  constructor(pdfState: PdfState, pageVirtualization: PageVirtualization, options?: ZoomOptions) {
    this.pdfState = pdfState;
    this.pageVirtualization = pageVirtualization;
    this.options = options || {
      minScale: 0.5,
      maxScale: 4.0,
      zoomStep: 0.5,
    };
  }

  public async zoomIn(): Promise<void> {
    const currentScale = this.pdfState.scale;
    if (currentScale < this.options.maxScale) {
      const newScale = currentScale + this.options.zoomStep;
      await this.applyZoom(newScale);
    }
  }

  public async zoomOut(): Promise<void> {
    const currentScale = this.pdfState.scale;
    if (currentScale > this.options.minScale) {
      const newScale = currentScale - this.options.zoomStep;
      await this.applyZoom(newScale);
    }
  }

  /**
   * Sets the zoom level, updates the pdfState, applies CSS changes,
   * and triggers a re-render of visible pages.
   */
  public async applyZoom(newScale: number): Promise<void> {
    const currentScale = this.pdfState.scale;
    const currentPage = this.pdfState.currentPage;

    // 1. Get the current scroll offset relative to the top of the current page.
    const relativeScrollOffset = this.getScrollOffsetRelativeToPage(currentPage);

    // 2. Update the scale.
    this.pdfState.scale = newScale;
    this.applyCssScale(newScale);

    // 3. Recalculate page positions and redraw visible pages.
    await this.pageVirtualization.calculatePagePositioning();

    // 4. Adjust the scroll position so that the same relative point is visible.
    requestAnimationFrame(() => {
      this.adjustScrollPosition(currentPage, relativeScrollOffset, currentScale, newScale);
    });

    await this.pageVirtualization.updatePageBuffers();
    this.pdfState.emit('scaleChange');
    await this.pageVirtualization.redrawVisiblePages(currentPage);
  }

  /**
   * Returns the scroll offset relative to the top of the specified page.
   */
  private getScrollOffsetRelativeToPage(targetPage: number): number {
    // Assume that your PageVirtualization class stores the page positions in a map.
    const pageTop = this.pageVirtualization.cachedPagePosition.get(targetPage) || 0;
    const scrollElement = document.querySelector(`#${this.pdfState.containerId} #${aPdfViewerIds['_MAIN_VIEWER_CONTAINER']}`) as HTMLElement;
    return scrollElement ? scrollElement.scrollTop - pageTop : 0;
  }

  /**
   * Adjusts the scroll position after zoom so that the same point on the page remains in view.
   *
   * @param targetPage - The page number whose relative position is maintained.
   * @param relativeScrollOffset - The offset from the top of the page before zoom.
   * @param previousScale - The zoom scale before applying the new scale.
   * @param newScale - The new zoom scale.
   */
  private adjustScrollPosition(targetPage: number, relativeScrollOffset: number, previousScale: number, newScale: number): void {
    const pageTop = this.pageVirtualization.cachedPagePosition.get(targetPage) || 0;
    // Compute a scaled offset. The ratio (newScale / previousScale) gives the factor by which the offset should change.
    const scaledOffset = relativeScrollOffset * (newScale / previousScale);
    const newScrollTop = pageTop + scaledOffset;
    const scrollElement = document.querySelector(`#${this.pdfState.containerId} #${aPdfViewerIds['_MAIN_VIEWER_CONTAINER']}`) as HTMLElement;
    if (scrollElement) {
      scrollElement.scrollTop = newScrollTop;
    }
  }

  private applyCssScale(scaleFactor: number): void {
    // Example: update a CSS variable on the main viewer container.
    const container = document.querySelector(`#${this.pdfState.containerId} #${aPdfViewerIds['_MAIN_PAGE_VIEWER_CONTAINER']}`) as HTMLElement;
    if (container) {
      container.style.setProperty('--scale-factor', String(scaleFactor));
    }
  }

  // Optionally, add methods to handle panning:
  public pan(deltaX: number, deltaY: number): void {
    // For example, update the scroll position of the container.
    const container = document.querySelector(`#${this.pdfState.containerId} .main-viewer-container`) as HTMLElement;
    if (container) {
      container.scrollLeft += deltaX;
      container.scrollTop += deltaY;
    }
  }
}
