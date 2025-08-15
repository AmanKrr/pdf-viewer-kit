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
import { PDFViewerInstance } from './PDFViewerInstance';
import WebViewer from '../viewer/ui/WebViewer';

/**
 * Web viewer instance that integrates with the new multi-instance architecture.
 * This wraps the existing WebViewer class and provides instance-specific functionality.
 */
export class InstanceWebViewer {
  private readonly _pdfDocument: PDFDocumentProxy;
  private readonly _options: LoadOptions;
  private readonly _containerId: string;
  private readonly _instance: PDFViewerInstance;
  private _webViewer: WebViewer | null = null;
  private _isDestroyed = false;

  constructor(pdfDocument: PDFDocumentProxy, options: LoadOptions, containerId: string, instance: PDFViewerInstance) {
    this._pdfDocument = pdfDocument;
    this._options = options;
    this._containerId = containerId;
    this._instance = instance;
  }

  /**
   * Gets the PDF document instance
   */
  get pdfDocument(): PDFDocumentProxy {
    return this._pdfDocument;
  }

  /**
   * Gets the container ID
   */
  get containerId(): string {
    return this._containerId;
  }

  /**
   * Gets the parent instance
   */
  get instance(): PDFViewerInstance {
    return this._instance;
  }

  /**
   * Gets the underlying WebViewer instance
   */
  get webViewer(): WebViewer | null {
    return this._webViewer;
  }

  /**
   * Gets whether this viewer has been destroyed
   */
  get isDestroyed(): boolean {
    return this._isDestroyed;
  }

  private _query(selector: string): Element | null {
    return document.querySelector(`#${this._containerId} ${selector}`);
  }

  private _queryAll(selector: string): NodeListOf<Element> {
    return document.querySelectorAll(`#${this._containerId} ${selector}`);
  }

  private _scopedId(id: string): string {
    return `${this._containerId}-${id}`;
  }

  /**
   * Initializes the web viewer with the PDF document
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

      // Convert LoadOptions to ViewerLoadOptions (remove password-related fields)
      const viewerOptions: ViewerLoadOptions = {
        ...this._options,
        containerId: this._containerId,
      };

      // Initialize the WebViewer instance with the loaded PDF
      this._webViewer = new WebViewer(viewerOptions, this.instance, internalContainers.parent, container);

      // Wait for the viewer to be ready
      await this._webViewer.ready;

      // Set up instance-specific event handling
      this._setupInstanceEvents();

      console.log(`InstanceWebViewer initialized for container ${this._containerId}`);
    } catch (error) {
      console.error('Error initializing InstanceWebViewer:', error);
      throw error;
    }
  }

  /**
   * Sets up instance-specific event handling
   */
  private _setupInstanceEvents(): void {
    if (!this._webViewer || this._isDestroyed) return;

    // Listen to WebViewer events and forward them to the instance event system
    // This maintains compatibility while providing instance isolation

    // Example: Forward scale changes
    // this._webViewer.on('scaleChange', (data) => {
    //   this._instance.events.emit('scaleChange', data);
    // });
  }

  /**
   * Gets the current page number
   */
  get currentPageNumber(): number {
    return this._webViewer?.currentPageNumber || 1;
  }

  /**
   * Gets the total number of pages
   */
  get totalPages(): number {
    return this._webViewer?.totalPages || 0;
  }

  /**
   * Gets the current scale
   */
  get currentScale(): number {
    return this._webViewer?.currentScale || 1.0;
  }

  /**
   * Gets the visible page numbers
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
   * Gets the annotation service
   */
  get annotation() {
    return this._webViewer?.annotation;
  }

  /**
   * Navigate to the next page
   */
  nextPage(): void {
    this._webViewer?.nextPage();
  }

  /**
   * Navigate to the previous page
   */
  previousPage(): void {
    this._webViewer?.previousPage();
  }

  /**
   * Navigate to the first page
   */
  firstPage(): void {
    this._webViewer?.firstPage();
  }

  /**
   * Navigate to the last page
   */
  lastPage(): void {
    this._webViewer?.lastPage();
  }

  /**
   * Navigate to a specific page
   */
  goToPage(pageNumber: number): void {
    this._webViewer?.goToPage(pageNumber);
  }

  /**
   * Zoom in
   */
  async zoomIn(): Promise<void> {
    await this._webViewer?.zoomIn();
  }

  /**
   * Zoom out
   */
  async zoomOut(): Promise<void> {
    await this._webViewer?.zoomOut();
  }

  /**
   * Toggle thumbnail viewer
   */
  toggleThumbnailViewer(): void {
    this._webViewer?.toogleThumbnailViewer();
  }

  /**
   * Search functionality
   */
  search(): void {
    this._webViewer?.search();
  }

  /**
   * Download PDF with annotations
   */
  async downloadPdf(filename?: string): Promise<void> {
    await this._webViewer?.downloadPdf(filename);
  }

  /**
   * Destroys this instance and cleans up all resources
   */
  destroy(): void {
    if (this._isDestroyed) return;

    this._isDestroyed = true;

    // Destroy the underlying WebViewer
    if (this._webViewer) {
      this._webViewer.destroy();
      this._webViewer = null;
    }

    // Clear the container
    const root = document.getElementById(this._containerId);
    if (root) {
      root.innerHTML = '';
    }

    console.log(`InstanceWebViewer destroyed for container ${this._containerId}`);
  }
}
