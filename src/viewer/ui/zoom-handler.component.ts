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

import PageVirtualization from './page-virtualization.component';
import { PDF_VIEWER_CLASSNAMES, PDF_VIEWER_IDS } from '../../constants/pdf-viewer-selectors';
import { debounce } from 'lodash';
import WebViewer from './web-viewer.component';

interface ZoomOptions {
  /** Minimum permitted scale. */
  minScale: number;
  /** Maximum permitted scale. */
  maxScale: number;
  /** Increment for each zoom step. */
  zoomStep: number;
}

/**
 * Handles zooming and panning operations for the PDF viewer.
 * Debounces window resize to auto–fit width.
 */
export default class ZoomHandler {
  private _webViewer: WebViewer;
  private _pageVirtualization: PageVirtualization;
  private _options: ZoomOptions;
  private _scrollableContainerElement: HTMLElement | null;
  // private _onWindowResize;

  /**
   * @param pdfState           Shared PDF state (scale, currentPage, etc.).
   * @param pageVirtualization Manages page measurements and rendering.
   * @param options            Optional zoom limits and step size.
   */
  constructor(webViewer: WebViewer, pageVirtualization: PageVirtualization, options?: ZoomOptions) {
    this._webViewer = webViewer;
    this._pageVirtualization = pageVirtualization;
    this._options = options ?? {
      minScale: 0.25,
      maxScale: 5.0,
      zoomStep: 0.25,
    };

    // Cache the main scrollable container for performance
    this._scrollableContainerElement = document
      .getElementById(this._webViewer.containerId)!
      .shadowRoot!.querySelector<HTMLElement>(`#${PDF_VIEWER_IDS.MAIN_VIEWER_CONTAINER}-${this._webViewer.instanceId}`);

    // On window resize, refit width (debounced)
    // this._onWindowResize = debounce(() => this.fitWidth(), 100);
    // window.addEventListener('resize', this._onWindowResize);
  }

  private _snapToStep(scale: number): number {
    const { zoomStep } = this._options;
    return Math.round(scale / zoomStep) * zoomStep;
  }

  /**
   * Increase zoom by one step, up to the maximum scale.
   */
  public async zoomIn(): Promise<void> {
    if (this._webViewer.state.scale >= this._options.maxScale) return;
    const currentScale = this._webViewer.state.scale;
    const base = this._snapToStep(currentScale);
    const target = Math.min(base + this._options.zoomStep, this._options.maxScale);
    await this.applyZoom(target);
  }

  /**
   * Decrease zoom by one step, down to the minimum scale.
   */
  public async zoomOut(): Promise<void> {
    if (this._webViewer.state.scale <= this._options.minScale) return;
    const currentScale = this._webViewer.state.scale;
    const base = this._snapToStep(currentScale);
    const target = Math.max(base - this._options.zoomStep, this._options.minScale);
    await this.applyZoom(target);
  }

  /**
   * Apply a specific zoom level:
   * - Clamp to [minScale, maxScale]
   * - Preserve scroll position relative to current page
   * - Recalculate page positions
   * - Emit scaleChange
   *
   * @param newScaleInput Desired scale value
   */
  public async applyZoom(newScaleInput: number): Promise<void> {
    const oldScale = this._webViewer.state.scale;

    const page = this._webViewer.state.currentPage;
    const offset = this._getScrollOffsetRelativeToPage(page);

    this._webViewer.state.scale = newScaleInput;
    this._applyCssScale(newScaleInput);

    await this._pageVirtualization.calculatePagePositions();
    this._adjustScrollPosition(page, offset, oldScale, newScaleInput);

    this._webViewer.events.emit('scaleChange');
  }

  /**
   * Pan the viewer by the given pixel offsets.
   *
   * @param deltaX Horizontal pan in pixels.
   * @param deltaY Vertical pan in pixels.
   */
  public pan(deltaX: number, deltaY: number): void {
    if (this._scrollableContainerElement) {
      this._scrollableContainerElement.scrollLeft += deltaX;
      this._scrollableContainerElement.scrollTop += deltaY;
    }
  }

  /**
   * Zoom so that the widest page fits the container width.
   */
  public async fitWidth(): Promise<void> {
    const { minScale, maxScale, zoomStep } = this._options;
    const currScale = this._webViewer.state.scale;

    const container = document
      .getElementById(this._webViewer.containerId)
      ?.shadowRoot?.querySelector<HTMLElement>(`.${PDF_VIEWER_CLASSNAMES.A_PDF_VIEWER}-${this._webViewer.instanceId}`)!;
    const containerWidth = container.getBoundingClientRect().width;

    const pageCount = this._webViewer.pdfDocument.numPages;
    let maxOrigWidth = 0;
    for (let i = 1; i <= pageCount; i++) {
      const page = await this._webViewer.pdfDocument.getPage(i);
      const vpAtCurr = page.getViewport({ scale: currScale });
      const origWidth = vpAtCurr.width / currScale;
      maxOrigWidth = Math.max(maxOrigWidth, origWidth);
    }

    const rawScale = containerWidth / maxOrigWidth;
    let snapped = Math.round(rawScale / zoomStep) * zoomStep;

    snapped = Math.max(minScale, Math.min(maxScale, snapped));

    if (Math.abs(snapped - currScale) < 1e-6) {
      return;
    }
    await this.applyZoom(snapped);
  }

  /**
   * Reset zoom to 100% (scale = 1.0).
   */
  public async fitPage(): Promise<void> {
    await this.applyZoom(1.0);
  }

  /**
   * Clean up resources and event listeners.
   */
  public destroy(): void {
    // this._onWindowResize.cancel();
    // window.removeEventListener('resize', this._onWindowResize);
    this._scrollableContainerElement = null;
  }

  /**
   * Compute scrollTop minus the top position of the target page.
   *
   * @param targetPage 1-based page number.
   * @returns Vertical offset in pixels within the page.
   */
  private _getScrollOffsetRelativeToPage(targetPage: number): number {
    const pageTop = this._pageVirtualization.pagePositionsMap.get(targetPage) ?? 0;
    return this._scrollableContainerElement ? this._scrollableContainerElement.scrollTop - pageTop : 0;
  }

  /**
   * After zoom change, adjust scrollTop so that the same point remains in view.
   *
   * @param targetPage             Page number to keep in view.
   * @param previousOffset         Offset before zoom.
   * @param previousScale          Scale before zoom.
   * @param newScale               Scale after zoom.
   */
  private _adjustScrollPosition(targetPage: number, previousOffset: number, previousScale: number, newScale: number): void {
    const pageTop = this._pageVirtualization.pagePositionsMap.get(targetPage) ?? 0;
    const scaledOffset = previousOffset * (newScale / previousScale);
    const newScrollTop = pageTop + scaledOffset;

    if (this._scrollableContainerElement) {
      this._scrollableContainerElement.scrollTop = newScrollTop;
    }
  }

  /**
   * Apply CSS scaling via a --scale-factor CSS variable
   * on the main page viewer container.
   *
   * @param scaleFactor New scale value.
   */
  private _applyCssScale(scaleFactor: number): void {
    const container = document
      .getElementById(this._webViewer.containerId)
      ?.shadowRoot?.querySelector<HTMLElement>(`#${PDF_VIEWER_IDS.MAIN_PAGE_VIEWER_CONTAINER}-${this._webViewer.instanceId}`);
    if (container) {
      container.style.setProperty('--scale-factor', String(scaleFactor));
    }
  }
}
