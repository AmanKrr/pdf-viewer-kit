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

import PdfState from './PDFState';
import PageVirtualization from './PDFPageVirtualization';
import { PDF_VIEWER_CLASSNAMES, PDF_VIEWER_IDS } from '../../constants/pdf-viewer-selectors';
import { debounce } from 'lodash';

interface ZoomOptions {
  minScale: number;
  maxScale: number;
  zoomStep: number;
  // Optionally add debounce durations, etc.
}

/**
 * Handles zooming operations (in, out, fit width, fit page) for the PDF viewer.
 * Updates PdfState, applies CSS transforms, preserves scroll position,
 * and coordinates with PageVirtualization for rendering.
 */
export default class ZoomHandler {
  private _pdfState: PdfState;
  private _pageVirtualization: PageVirtualization;
  private _options: ZoomOptions;

  private _onWindowResize: () => void;

  /**
   * @param pdfState           Shared PdfState instance for scale and page info.
   * @param pageVirtualization Manages page measurements and rendering buffers.
   * @param options            Optional zoom limits and step size.
   */
  constructor(pdfState: PdfState, pageVirtualization: PageVirtualization, options?: ZoomOptions) {
    this._pdfState = pdfState;
    this._pageVirtualization = pageVirtualization;
    this._options = options || {
      minScale: 0.5,
      maxScale: 4.0,
      zoomStep: 0.5,
    };

    this._onWindowResize = debounce(() => {
      this.fitWidth();
    }, 40);

    window.addEventListener('resize', this._onWindowResize);
  }

  private _snapToStep(scale: number): number {
    const { zoomStep } = this._options;
    return Math.round(scale / zoomStep) * zoomStep;
  }

  /**
   * Increase zoom by one step, up to the maximum scale.
   */
  public async zoomIn(): Promise<void> {
    if (this._pdfState.scale >= this._options.maxScale) return;
    const currentScale = this._pdfState.scale;
    const base = this._snapToStep(currentScale);
    const target = Math.min(base + this._options.zoomStep, this._options.maxScale);
    await this.applyZoom(target);
  }

  /**
   * Decrease zoom by one step, down to the minimum scale.
   */
  public async zoomOut(): Promise<void> {
    if (this._pdfState.scale <= this._options.minScale) return;
    const currentScale = this._pdfState.scale;
    const base = this._snapToStep(currentScale);
    const target = Math.max(base - this._options.zoomStep, this._options.minScale);
    await this.applyZoom(target);
  }

  /**
   * Apply a specific zoom level:
   * 1. Calculate scroll offset relative to current page
   * 2. Update PdfState.scale and CSS variables
   * 3. Recompute page layout and buffers
   * 4. Restore scroll to keep the same point in view
   * 5. Emit scaleChange and redraw visible pages
   *
   * @param newScale Desired scale factor
   */
  public async applyZoom(newScale: number): Promise<void> {
    const currentScale = this._pdfState.scale;
    const currentPage = this._pdfState.currentPage;

    // Preserve scroll position relative to the top of the current page
    const relativeScrollOffset = this._getScrollOffsetRelativeToPage(currentPage);

    // Update scale state and CSS
    this._pdfState.scale = newScale;
    this._applyCssScale(newScale);

    // Recalculate page layout
    await this._pageVirtualization.calculatePagePositioning();

    // Adjust scroll on next frame for smooth update
    requestAnimationFrame(() => {
      this._adjustScrollPosition(currentPage, relativeScrollOffset, currentScale, newScale);
    });

    // Update buffers and emit events
    await this._pageVirtualization.updatePageBuffers();
    this._pdfState.emit('scaleChange');
    await this._pageVirtualization.redrawVisiblePages(currentPage);
  }

  /**
   * Compute scrollTop minus the top coordinate of the target page,
   * giving the offset within that page.
   *
   * @param targetPage Page index to calculate relative scroll for
   */
  private _getScrollOffsetRelativeToPage(targetPage: number): number {
    const pageTop = this._pageVirtualization.cachedPagePosition.get(targetPage) || 0;
    const scrollElement = document.querySelector<HTMLElement>(`#${this._pdfState.containerId} #${PDF_VIEWER_IDS.MAIN_VIEWER_CONTAINER}`);
    return scrollElement ? scrollElement.scrollTop - pageTop : 0;
  }

  /**
   * After zoom, reposition scrollTop so that the same logical point
   * on the page remains visible.
   *
   * @param targetPage            Page index being held constant
   * @param relativeScrollOffset  Offset within page before zoom
   * @param previousScale         Scale before zoom
   * @param newScale              Scale after zoom
   */
  private _adjustScrollPosition(targetPage: number, relativeScrollOffset: number, previousScale: number, newScale: number): void {
    const pageTop = this._pageVirtualization.cachedPagePosition.get(targetPage) || 0;
    const scaledOffset = relativeScrollOffset * (newScale / previousScale);
    const newScrollTop = pageTop + scaledOffset;
    const scrollElement = document.querySelector<HTMLElement>(`#${this._pdfState.containerId} #${PDF_VIEWER_IDS.MAIN_VIEWER_CONTAINER}`);
    if (scrollElement) {
      scrollElement.scrollTop = newScrollTop;
    }
  }

  /**
   * Apply CSS scaling by setting a custom property on the main page container.
   *
   * @param scaleFactor The new zoom factor
   */
  private _applyCssScale(scaleFactor: number): void {
    const container = document.querySelector<HTMLElement>(`#${this._pdfState.containerId} #${PDF_VIEWER_IDS.MAIN_PAGE_VIEWER_CONTAINER}`);
    if (container) {
      container.style.setProperty('--scale-factor', String(scaleFactor));
    }
  }

  /**
   * Pan the view by adjusting scrollLeft/scrollTop.
   *
   * @param deltaX Horizontal pan in pixels
   * @param deltaY Vertical pan in pixels
   */
  public pan(deltaX: number, deltaY: number): void {
    const container = document.querySelector<HTMLElement>(`#${this._pdfState.containerId} .main-viewer-container`);
    if (container) {
      container.scrollLeft += deltaX;
      container.scrollTop += deltaY;
    }
  }

  /**
   * Zoom to fit the width of the widest page into the container.
   * Calculates original page widths and sets scale accordingly.
   */
  public async fitWidth(): Promise<void> {
    const currScale = this._pdfState.scale;
    const container = document.querySelector(`.${PDF_VIEWER_CLASSNAMES.A_PDF_VIEWER}`)!;
    const containerWidth = container.getBoundingClientRect().width;

    const pageCount = this._pdfState.pdfInstance.numPages;
    let maxOrigWidth = 0;
    for (let i = 1; i <= pageCount; i++) {
      const page = await this._pdfState.pdfInstance.getPage(i);
      const wAtCurrScale = page.getViewport({ scale: currScale }).width;
      const origWidth = wAtCurrScale / currScale;
      maxOrigWidth = Math.max(maxOrigWidth, origWidth);
    }

    const newScale = containerWidth / maxOrigWidth;
    await this.applyZoom(newScale);
  }

  /**
   * Reset zoom to 1:1 (original size).
   */
  public async fitPage(): Promise<void> {
    await this.applyZoom(1);
  }

  public destroy(): void {
    window.removeEventListener('resize', this._onWindowResize);
  }
}
