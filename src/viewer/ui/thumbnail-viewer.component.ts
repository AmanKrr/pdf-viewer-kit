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

import { PDFDocumentProxy, PDFPageProxy } from 'pdfjs-dist';
import { PDF_VIEWER_CLASSNAMES } from '../../constants/pdf-viewer-selectors';
import { PDFThumbnailViewOptions } from '../../types/thumbnail.types';
import { PDFLinkService } from '../services/link.service';

/**
 * Manages the creation, rendering, and interaction of PDF thumbnails in the sidebar.
 * Optimized for minimal memory footprint using Blob URLs and canvas pooling.
 */
class ThumbnailViewer {
  private _container: HTMLElement;
  private _pdfDocument: PDFDocumentProxy;
  private _pageNumber: number;
  private _linkService: PDFLinkService | null;

  private _canvas: HTMLCanvasElement | null = null;
  private _thumbnailDiv: HTMLElement | null = null;
  private _clickHandler: ((e: MouseEvent) => void) | null = null;
  private _imageUrl: string | null = null; // Blob URL for cleanup

  // Static canvas pool for reuse across all thumbnails
  private static _canvasPool: HTMLCanvasElement[] = [];
  private static readonly MAX_POOL_SIZE = 10;

  /**
   * Constructs a `ThumbnailViewer` instance.
   *
   * @param {PDFThumbnailViewOptions} options - Configuration options for the thumbnail.
   */
  constructor(options: PDFThumbnailViewOptions) {
    const { container, pdfDocument, pageNumber, linkService } = options;
    this._container = container;
    this._pdfDocument = pdfDocument;
    this._pageNumber = pageNumber;
    this._linkService = linkService ?? null;
  }

  /**
   * Creates the thumbnail sidebar container and attaches it to the PDF viewer.
   *
   * @param {string} parentContainerId - The ID of the parent PDF viewer container.
   * @returns {HTMLElement | undefined} The created inner thumbnail container.
   */
  static createThumbnailContainer(parentContainerId: string): HTMLElement | undefined {
    const thumbnailContainer = document.createElement('div');
    thumbnailContainer.classList.add(PDF_VIEWER_CLASSNAMES.A_SIDEBAR_CONTAINER);

    const inner = document.createElement('div');
    inner.classList.add(PDF_VIEWER_CLASSNAMES.A_INNER_SIDEBAR_CONTAINER_CONTENT);
    thumbnailContainer.appendChild(inner);

    const shadowRoot = document.getElementById(parentContainerId)?.shadowRoot as ShadowRoot | null;
    const pdfViewer = shadowRoot?.querySelector(`.${PDF_VIEWER_CLASSNAMES.A_VIEWER_WRAPPER}`);
    if (!pdfViewer) {
      console.error(`Viewer not found!`);
      return;
    }

    pdfViewer.prepend(thumbnailContainer);
    return inner;
  }

  /**
   * Retrieves the total number of pages in the PDF document.
   *
   * @returns {number} The total number of pages.
   */
  get totalPages(): number {
    return this._pdfDocument.numPages;
  }

  /**
   * Initializes and renders the thumbnail for the current page.
   */
  public async initThumbnail(): Promise<void> {
    const thumb = document.createElement('div');
    thumb.className = 'thumbnail';
    thumb.dataset.pageNumber = String(this._pageNumber);
    this._container.appendChild(thumb);

    this._thumbnailDiv = thumb;
    this._clickHandler = () => this._thumbnailDestination(thumb);

    await this._renderThumbnail(thumb);
    thumb.addEventListener('click', this._clickHandler);
  }

  /**
   * Sets the active thumbnail and navigates to the corresponding page in the PDF viewer.
   *
   * @param {number} pageNumber - The page number to be set as active.
   */
  set activeThumbnail(pageNumber: number) {
    if (pageNumber < 1 || pageNumber > this.totalPages) {
      console.error(`${pageNumber} is invalid.`);
      return;
    }
    if (!this._linkService) {
      console.log(`no linkService`);
      return;
    }
    const toActivate = this._container.querySelector<HTMLElement>(`[data-page-number="${pageNumber}"]`);
    if (toActivate) {
      this._thumbnailDestination(toActivate, pageNumber);
    }
  }

  /**
   * Renders the thumbnail image for the corresponding PDF page.
   * Uses Blob URLs and JPEG compression for optimal memory usage.
   *
   * @param {HTMLElement} thumbnailDiv - The container for the thumbnail.
   */
  private async _renderThumbnail(thumbnailDiv: HTMLElement): Promise<void> {
    const page: PDFPageProxy = await this._pdfDocument.getPage(this._pageNumber);

    // Set thumbnail scale - 0.2 for compact display
    const THUMBNAIL_SCALE = 0.2;
    const viewport = page.getViewport({ scale: THUMBNAIL_SCALE });

    // Create and configure canvas (render at higher resolution for quality)
    const upscaleFactor = 2.0; // Render at 2x resolution for sharp display
    const canvasWidth = viewport.width * upscaleFactor;
    const canvasHeight = viewport.height * upscaleFactor;

    this._canvas = this._getCanvasFromPool();
    this._canvas.width = canvasWidth;
    this._canvas.height = canvasHeight;

    const ctx = this._canvas.getContext('2d', { alpha: false, willReadFrequently: false });
    if (!ctx) {
      throw new Error('Canvas context unavailable');
    }

    const transform = [upscaleFactor, 0, 0, upscaleFactor, 0, 0];

    // Render the page onto the canvas
    await page.render({ canvas: this._canvas, canvasContext: ctx, viewport, transform }).promise;

    // Convert to Blob URL (JPEG for better compression) instead of base64 PNG
    const blob = await this._canvasToBlob(this._canvas);
    this._imageUrl = URL.createObjectURL(blob);

    // Create image element with Blob URL
    const img = document.createElement('img');
    img.src = this._imageUrl;
    img.className = 'thumbnail-image';
    img.style.width = `${viewport.width}px`;
    img.style.height = `${viewport.height}px`;
    thumbnailDiv.appendChild(img);

    const label = document.createElement('div');
    label.classList.add('pagenumber-label');
    label.textContent = String(this._pageNumber);
    thumbnailDiv.appendChild(label);

    // Return canvas to pool for reuse
    this._returnCanvasToPool();
  }

  /**
   * Converts canvas to Blob using JPEG compression
   * Fallback to PNG if JPEG is not supported
   *
   * @param canvas - Canvas element to convert
   * @returns Promise resolving to Blob
   */
  private _canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob> {
    return new Promise((resolve, reject) => {
      // Try JPEG first (better compression)
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            // Fallback to PNG if JPEG fails
            canvas.toBlob(
              (pngBlob) => {
                if (pngBlob) {
                  resolve(pngBlob);
                } else {
                  reject(new Error('Failed to create blob from canvas'));
                }
              },
              'image/png'
            );
          }
        },
        'image/jpeg',
        0.85 // 85% quality - good balance between size and quality
      );
    });
  }

  /**
   * Gets a canvas from the pool or creates a new one
   */
  private _getCanvasFromPool(): HTMLCanvasElement {
    return ThumbnailViewer._canvasPool.pop() || document.createElement('canvas');
  }

  /**
   * Returns canvas to pool for reuse
   */
  private _returnCanvasToPool(): void {
    if (this._canvas && ThumbnailViewer._canvasPool.length < ThumbnailViewer.MAX_POOL_SIZE) {
      // Clear canvas before returning to pool
      const ctx = this._canvas.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, this._canvas.width, this._canvas.height);
      }
      ThumbnailViewer._canvasPool.push(this._canvas);
    }
    this._canvas = null;
  }

  /**
   * Navigates to the corresponding page when a thumbnail is clicked.
   *
   * @param {HTMLElement} thumbnailDiv - The clicked thumbnail element.
   * @param {number} [pageNumber=-1] - The page number to navigate to.
   */
  private _thumbnailDestination(thumbnailDiv: HTMLElement, pageNumber: number = -1): void {
    if (!this._linkService) {
      console.log(`no linkService`);
      return;
    }

    const previousActiveThumbnail = this._container.querySelector(`.thumbnail.thumbnail-active`);
    const pagenumber = pageNumber > 0 ? pageNumber : this._pageNumber;

    if (previousActiveThumbnail) {
      if (previousActiveThumbnail.classList.contains('thumbnail-active')) {
        previousActiveThumbnail.classList.remove('thumbnail-active');
      }
    }

    if (thumbnailDiv) {
      thumbnailDiv.classList.add('thumbnail-active');
      this._linkService?.goToPage(pagenumber);
    }
  }

  /** only remove the canvas bit, keep thumbnail DIV & listener intact */
  private destroyCanvasOnly(): void {
    if (this._canvas) {
      this._returnCanvasToPool();
    }
  }

  /**
   * Cleans up resources and removes the thumbnail to free memory.
   * Revokes Blob URLs to prevent memory leaks.
   */
  public destroy(): void {
    // Revoke Blob URL to free memory
    if (this._imageUrl) {
      URL.revokeObjectURL(this._imageUrl);
      this._imageUrl = null;
    }

    // Remove event listener
    if (this._thumbnailDiv && this._clickHandler) {
      this._thumbnailDiv.removeEventListener('click', this._clickHandler);
    }

    // Remove DOM element
    if (this._thumbnailDiv) {
      this._thumbnailDiv.remove();
      this._thumbnailDiv = null;
    }

    this.destroyCanvasOnly();
  }

  /**
   * Static method to clear the entire canvas pool
   * Call this when destroying all thumbnails or during cleanup
   */
  public static clearCanvasPool(): void {
    ThumbnailViewer._canvasPool = [];
  }
}

export default ThumbnailViewer;
