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

import { IPDFViewerInstance, IPDFViewerEvents, IPDFViewerAnnotations, IPDFViewerSearch, PublicEvents, EventListener } from './interfaces';
import { PDFDocumentProxy } from 'pdfjs-dist';

/**
 * Runtime-protected facade for PDF viewer instances.
 * This class ensures that only public API methods and properties
 * are accessible, even in JavaScript environments.
 */
export class PDFViewerInstanceFacade implements IPDFViewerInstance {
  private readonly _instance: any; // Internal instance
  private readonly _events: PDFViewerEventsFacade;
  private readonly _annotations: PDFViewerAnnotationsFacade;
  private readonly _search: PDFViewerSearchFacade;

  constructor(instance: any) {
    this._instance = instance;

    // Create protected facades for sub-components
    this._events = new PDFViewerEventsFacade(instance.events);
    this._annotations = new PDFViewerAnnotationsFacade(instance);
    this._search = new PDFViewerSearchFacade(instance);

    // Freeze this object to prevent property addition/modification
    Object.freeze(this);
  }

  // Public properties - readonly accessors
  get instanceId(): string {
    return this._instance.instanceId;
  }

  get containerId(): string {
    return this._instance.containerId;
  }

  get isDestroyed(): boolean {
    return this._instance.isDestroyed;
  }

  get isReady(): boolean {
    return this._instance.webViewer !== null;
  }

  get currentPage(): number {
    return this._instance.webViewer?.currentPageNumber || 1;
  }

  get totalPages(): number {
    return this._instance.webViewer?.totalPages || 0;
  }

  get currentScale(): number {
    return this._instance.webViewer?.currentScale || 1;
  }

  get pdfDocument(): PDFDocumentProxy | null {
    return this._instance.pdfDocument;
  }

  get events(): IPDFViewerEvents {
    return this._events;
  }

  get annotations(): IPDFViewerAnnotations {
    return this._annotations;
  }

  get search(): IPDFViewerSearch {
    return this._search;
  }

  // Public methods - delegate to internal webViewer
  goToPage(pageNumber: number): void {
    if (this._instance.webViewer) {
      return this._instance.webViewer.goToPage(pageNumber);
    }
    throw new Error('PDF viewer not yet initialized');
  }

  nextPage(): void {
    if (this._instance.webViewer) {
      return this._instance.webViewer.nextPage();
    }
    throw new Error('PDF viewer not yet initialized');
  }

  previousPage(): void {
    if (this._instance.webViewer) {
      return this._instance.webViewer.previousPage();
    }
    throw new Error('PDF viewer not yet initialized');
  }

  firstPage(): void {
    if (this._instance.webViewer) {
      return this._instance.webViewer.firstPage();
    }
    throw new Error('PDF viewer not yet initialized');
  }

  lastPage(): void {
    if (this._instance.webViewer) {
      return this._instance.webViewer.lastPage();
    }
    throw new Error('PDF viewer not yet initialized');
  }

  async zoomIn(): Promise<void> {
    if (this._instance.webViewer) {
      return this._instance.webViewer.zoomIn();
    }
    throw new Error('PDF viewer not yet initialized');
  }

  async zoomOut(): Promise<void> {
    if (this._instance.webViewer) {
      return this._instance.webViewer.zoomOut();
    }
    throw new Error('PDF viewer not yet initialized');
  }

  async setZoom(scale: number): Promise<void> {
    if (this._instance.webViewer) {
      // Note: WebViewer might not have setZoom, so we'll use zoomIn/zoomOut
      const currentScale = this._instance.webViewer.currentScale || 1;
      if (scale > currentScale) {
        while (this._instance.webViewer.currentScale < scale) {
          await this._instance.webViewer.zoomIn();
        }
      } else if (scale < currentScale) {
        while (this._instance.webViewer.currentScale > scale) {
          await this._instance.webViewer.zoomOut();
        }
      }
      return;
    }
    throw new Error('PDF viewer not yet initialized');
  }

  async download(filename?: string): Promise<void> {
    if (this._instance.webViewer) {
      // WebViewer might not have download method, implement if needed
      throw new Error('Download functionality not yet implemented');
    }
    throw new Error('PDF viewer not yet initialized');
  }

  async destroy(): Promise<void> {
    return this._instance.destroy();
  }
}

/**
 * Runtime-protected facade for PDF viewer events.
 */
class PDFViewerEventsFacade implements IPDFViewerEvents {
  private readonly _events: any;

  constructor(events: any) {
    this._events = events;
    Object.freeze(this);
  }

  on(event: PublicEvents, listener: EventListener): void {
    return this._events.on(event, listener);
  }

  off(event: PublicEvents, listener: EventListener): void {
    return this._events.off(event, listener);
  }

  removeAllListeners(event?: PublicEvents): void {
    return this._events.removeAllListeners(event);
  }
}

/**
 * Runtime-protected facade for PDF viewer annotations.
 * Users can create, modify, and delete annotations.
 */
class PDFViewerAnnotationsFacade implements IPDFViewerAnnotations {
  private readonly _instance: any;

  constructor(instance: any) {
    this._instance = instance;
    Object.freeze(this);
  }

  getAnnotations(pageNumber?: number): any[] {
    // Access annotation service through the webViewer
    if (this._instance.webViewer?.annotation) {
      // Collect all annotations from all pages or specific page
      const allAnnotations: any[] = [];
      if (pageNumber) {
        // Get annotations for specific page
        const pageAnnotations = this._instance.webViewer.annotation._annotations.get(pageNumber) || [];
        allAnnotations.push(...pageAnnotations);
      } else {
        // Get all annotations from all pages
        for (const annotations of this._instance.webViewer.annotation._annotations.values()) {
          allAnnotations.push(...annotations);
        }
      }
      return allAnnotations;
    }
    return [];
  }

  async createAnnotation(config: any): Promise<string> {
    if (this._instance.webViewer?.annotation) {
      // Use the actual method: addAnnotation
      const id = this._instance.webViewer.annotation.addAnnotation(config);
      return id;
    }
    throw new Error('Annotation service not available');
  }

  async updateAnnotation(id: string, updates: any): Promise<void> {
    if (this._instance.webViewer?.annotation) {
      return this._instance.webViewer.annotation.updateAnnotation(id, updates);
    }
    throw new Error('Annotation service not available');
  }

  async deleteAnnotation(id: string): Promise<void> {
    if (this._instance.webViewer?.annotation) {
      return this._instance.webViewer.annotation.deleteAnnotation(id);
    }
    throw new Error('Annotation service not available');
  }

  selectAnnotation(id: string): void {
    // The AnnotationService doesn't have selection methods
    // Selection is handled by individual AnnotationManager instances
    console.warn('Selection is handled automatically by the annotation system');
  }

  deselectAll(): void {
    // The AnnotationService doesn't have deselection methods
    // Deselection is handled by individual AnnotationManager instances
    console.warn('Deselection is handled automatically by the annotation system');
  }

  getSelectedAnnotation(): any | null {
    // The AnnotationService doesn't track selection
    // Selection state is managed by individual AnnotationManager instances
    console.warn('Selection state is managed by the annotation system');
    return null;
  }

  get isEnabled(): boolean {
    if (this._instance.webViewer?.annotationState) {
      return this._instance.webViewer.annotationState.state.isAnnotationEnabled;
    }
    return false;
  }

  setEnabled(enabled: boolean): void {
    if (this._instance.webViewer?.annotationState) {
      this._instance.webViewer.annotationState.state.isAnnotationEnabled = enabled;
      // Update all annotation managers
      if (this._instance.webViewer?.annotation) {
        for (const manager of this._instance.webViewer.annotation._annotationManagers.values()) {
          if (enabled) {
            manager._initAnnotation();
          } else {
            manager._destroyAnnotation();
          }
        }
      }
    } else {
      throw new Error('Annotation service not available');
    }
  }

  async getTextInsideRectangle(annotationId: string): Promise<string> {
    if (this._instance.webViewer?.annotation) {
      return this._instance.webViewer.annotation.getTextInsideRectangle(annotationId);
    }
    throw new Error('Annotation service not available');
  }

  getAnnotationShapeConfig(annotationId: string): any {
    if (this._instance.webViewer?.annotation) {
      return this._instance.webViewer.annotation.getAnnotationShapeConfig(annotationId);
    }
    throw new Error('Annotation service not available');
  }

  /**
   * Check if annotation manager is registered for a specific page
   */
  isPageManagerRegistered(pageNumber: number): boolean {
    if (this._instance.webViewer?.annotation) {
      const manager = this._instance.webViewer.annotation._annotationManagers.get(pageNumber);
      return !!manager;
    }
    return false;
  }

  /**
   * Get list of pages with registered annotation managers
   */
  getRegisteredPages(): number[] {
    if (this._instance.webViewer?.annotation) {
      return Array.from(this._instance.webViewer.annotation._annotationManagers.keys());
    }
    return [];
  }
}

/**
 * Runtime-protected facade for PDF viewer search.
 * Text search within PDF content.
 */
class PDFViewerSearchFacade implements IPDFViewerSearch {
  private readonly _instance: any;

  constructor(instance: any) {
    this._instance = instance;
    Object.freeze(this);
  }

  async search(query: string): Promise<any[]> {
    if (this._instance.webViewer?.searchBar) {
      return this._instance.webViewer.searchBar.search(query);
    }
    throw new Error('Search functionality not available');
  }

  clearSearch(): void {
    if (this._instance.webViewer?.searchBar) {
      return this._instance.webViewer.searchBar.clearSearch();
    }
    throw new Error('Search functionality not available');
  }

  nextResult(): void {
    if (this._instance.webViewer?.searchBar) {
      return this._instance.webViewer.searchBar.nextResult();
    }
    throw new Error('Search functionality not available');
  }

  previousResult(): void {
    if (this._instance.webViewer?.searchBar) {
      return this._instance.webViewer.searchBar.previousResult();
    }
    throw new Error('Search functionality not available');
  }

  get currentResults(): any[] {
    if (this._instance.webViewer?.searchBar) {
      return this._instance.webViewer.searchBar.currentResults || [];
    }
    return [];
  }

  get currentResultIndex(): number {
    if (this._instance.webViewer?.searchBar) {
      return this._instance.webViewer.searchBar.currentResultIndex || 0;
    }
    return 0;
  }

  get isActive(): boolean {
    if (this._instance.webViewer?.searchBar) {
      return this._instance.webViewer.searchBar.isActive || false;
    }
    return false;
  }
}
