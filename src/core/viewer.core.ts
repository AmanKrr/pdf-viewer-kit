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

import { PDFDocumentProxy } from 'pdfjs-dist';
import { LoadOptions, ViewerLoadOptions } from '../types/webpdf.types';
import { PDFViewerInstance } from './viewer-instance.core';
import WebViewer from '../viewer/ui/web-viewer';

/**
 * Web viewer instance that integrates with the new multi-instance architecture.
 *
 * This class wraps the existing WebViewer class and provides instance-specific
 * functionality, ensuring complete isolation between PDF viewer instances.
 * Each instance maintains its own state, resources, and event handling.
 */
export class InstanceWebViewer {
  private readonly _pdfDocument: PDFDocumentProxy;
  private readonly _options: LoadOptions;
  private readonly _containerId: string;
  private readonly _instance: PDFViewerInstance;
  private _webViewer: WebViewer | null = null;
  private _isDestroyed = false;

  /**
   * Creates a new web viewer instance for a specific PDF document.
   *
   * @param pdfDocument - The PDF.js document proxy to display
   * @param options - Configuration options for the viewer
   * @param containerId - DOM container ID where the viewer will be rendered
   * @param instance - The parent PDF viewer instance
   */
  constructor(pdfDocument: PDFDocumentProxy, options: LoadOptions, containerId: string, instance: PDFViewerInstance) {
    this._pdfDocument = pdfDocument;
    this._options = options;
    this._containerId = containerId;
    this._instance = instance;
  }

  /**
   * Gets the PDF document instance being displayed.
   *
   * @returns The PDF.js document proxy
   */
  get pdfDocument(): PDFDocumentProxy {
    return this._pdfDocument;
  }

  /**
   * Gets the container ID where this viewer is rendered.
   *
   * @returns The DOM container identifier
   */
  get containerId(): string {
    return this._containerId;
  }

  /**
   * Gets the parent PDF viewer instance.
   *
   * @returns The parent instance that created this viewer
   */
  get instance(): PDFViewerInstance {
    return this._instance;
  }

  /**
   * Gets the underlying WebViewer instance.
   *
   * @returns The WebViewer instance or null if not initialized
   */
  get webViewer(): WebViewer | null {
    return this._webViewer;
  }

  /**
   * Checks if this viewer has been destroyed.
   *
   * @returns True if the viewer has been destroyed, false otherwise
   */
  get isDestroyed(): boolean {
    return this._isDestroyed;
  }

  /**
   * Queries for elements within this viewer's container scope.
   *
   * @param selector - CSS selector to search for
   * @returns The first matching element or null if not found
   */
  private _query(selector: string): Element | null {
    return document.querySelector(`#${this._containerId} ${selector}`);
  }

  /**
   * Queries for all elements within this viewer's container scope.
   *
   * @param selector - CSS selector to search for
   * @returns NodeList of all matching elements
   */
  private _queryAll(selector: string): NodeListOf<Element> {
    return document.querySelectorAll(`#${this._containerId} ${selector}`);
  }

  /**
   * Creates a scoped ID by prefixing with the container ID.
   *
   * @param id - The base identifier
   * @returns Scoped identifier unique to this viewer instance
   */
  private _scopedId(id: string): string {
    return `${this._containerId}-${id}`;
  }

  /**
   * Initializes the web viewer with the PDF document.
   *
   * Sets up the underlying WebViewer instance and configures
   * instance-specific event handling and container management.
   *
   * @param internalContainers - Container structure for the viewer
   * @throws Error if the viewer is destroyed or containers are invalid
   */
  async initialize(internalContainers: { parent: HTMLDivElement; viewerContainer: HTMLDivElement; pagesContainer: HTMLDivElement; injectElementId: string }): Promise<void> {
    if (this._isDestroyed) {
      throw new Error('Cannot initialize destroyed InstanceWebViewer');
    }

    try {
      const container = document.querySelector(`#${this._containerId} #${internalContainers.injectElementId}`)! as HTMLElement;

      if (!container || !internalContainers || !internalContainers.parent) {
        throw new Error('Container not found. PDFViewerInstance should create containers first.');
      }

      const viewerOptions: ViewerLoadOptions = {
        ...this._options,
        containerId: this._containerId,
      };

      this._webViewer = new WebViewer(viewerOptions, this.instance, internalContainers.parent, container);

      await this._webViewer.ready;

      this._setupInstanceEvents();

      console.log(`InstanceWebViewer initialized for container ${this._containerId}`);
    } catch (error) {
      console.error('Error initializing InstanceWebViewer:', error);
      throw error;
    }
  }

  /**
   * Sets up instance-specific event handling.
   *
   * Configures event forwarding from the underlying WebViewer
   * to the instance event system for proper isolation.
   */
  private _setupInstanceEvents(): void {
    if (!this._webViewer || this._isDestroyed) return;

    // Event forwarding setup for instance isolation
    // Example: Forward scale changes
    // this._webViewer.on('scaleChange', (data) => {
    //   this._instance.events.emit('scaleChange', data);
    // });
  }

  /**
   * Gets the current page number being displayed.
   *
   * @returns Current page number (1-based) or 1 if not available
   */
  get currentPageNumber(): number {
    return this._webViewer?.currentPageNumber || 1;
  }

  /**
   * Gets the total number of pages in the PDF document.
   *
   * @returns Total page count or 0 if not available
   */
  get totalPages(): number {
    return this._webViewer?.totalPages || 0;
  }

  /**
   * Gets the current zoom scale factor.
   *
   * @returns Current scale factor or 1.0 if not available
   */
  get currentScale(): number {
    return this._webViewer?.currentScale || 1.0;
  }

  /**
   * Gets the currently visible page numbers.
   *
   * @returns Array of visible page numbers
   */
  get visiblePageNumbers(): number[] {
    const visiblePages = this._webViewer?.visiblePageNumbers;
    if (Array.isArray(visiblePages)) {
      return visiblePages;
    }
    if (visiblePages instanceof Set) {
      return Array.from(visiblePages);
    }
    return [];
  }

  /**
   * Gets the annotation service for this viewer.
   *
   * @returns The annotation service instance
   */
  get annotation() {
    return this._webViewer?.annotation;
  }

  /**
   * Navigate to the next page in the document.
   */
  nextPage(): void {
    this._webViewer?.nextPage();
  }

  /**
   * Navigate to the previous page in the document.
   */
  previousPage(): void {
    this._webViewer?.previousPage();
  }

  /**
   * Navigate to the first page of the document.
   */
  firstPage(): void {
    this._webViewer?.firstPage();
  }

  /**
   * Navigate to the last page of the document.
   */
  lastPage(): void {
    this._webViewer?.lastPage();
  }

  /**
   * Navigate to a specific page number.
   *
   * @param pageNumber - The target page number (1-based)
   */
  goToPage(pageNumber: number): void {
    this._webViewer?.goToPage(pageNumber);
  }

  /**
   * Increase the zoom level by one step.
   */
  async zoomIn(): Promise<void> {
    await this._webViewer?.zoomIn();
  }

  /**
   * Decrease the zoom level by one step.
   */
  async zoomOut(): Promise<void> {
    await this._webViewer?.zoomOut();
  }

  /**
   * Toggle the thumbnail viewer sidebar.
   */
  toggleThumbnailViewer(): void {
    this._webViewer?.toogleThumbnailViewer();
  }

  /**
   * Open the search functionality.
   */
  search(): void {
    this._webViewer?.search();
  }

  /**
   * Download the PDF with current annotations.
   *
   * @param filename - Optional filename for the download
   */
  async downloadPdf(filename?: string): Promise<void> {
    await this._webViewer?.downloadPdf(filename);
  }

  /**
   * Destroys this viewer instance and cleans up all resources.
   *
   * Performs complete cleanup including:
   * - Destroying the underlying WebViewer
   * - Clearing the container content
   * - Marking the instance as destroyed
   */
  destroy(): void {
    if (this._isDestroyed) return;

    this._isDestroyed = true;

    if (this._webViewer) {
      this._webViewer.destroy();
      this._webViewer = null;
    }

    const root = document.getElementById(this._containerId);
    if (root) {
      root.innerHTML = '';
    }

    console.log(`InstanceWebViewer destroyed for container ${this._containerId}`);
  }
}
