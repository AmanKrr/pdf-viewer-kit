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

import { GlobalWorkerOptions, PDFDocumentLoadingTask, PDFDocumentProxy } from 'pdfjs-dist';
import { LoadOptions } from '../types/webpdf.types';
import { InstanceState } from './viewer-state.core';
import { InstanceEventEmitter } from './event-emitter.core';
import { InstanceCanvasPool } from './canvas-pool.core';
import { InstanceWebViewer } from './viewer.core';
import { getPdfWorkerSrc } from '../utils/worker-factory';
import PageElement from '../viewer/ui/page-element.component';
import { InstanceWebUiUtils } from '../utils/web-ui-utils';

/**
 * Manages a single, completely isolated PDF viewer instance.
 * Each instance has its own state, resources, and event system.
 */
export class PDFViewerInstance {
  private readonly _instanceId: string;
  private readonly _containerId: string;
  private readonly _options: LoadOptions;

  // Instance-specific services
  private readonly _state: InstanceState;
  private readonly _events: InstanceEventEmitter;
  private readonly _canvasPool: InstanceCanvasPool;

  // PDF instance
  private _pdfDocument: PDFDocumentProxy | null = null;
  private _webViewer: InstanceWebViewer | null = null;
  private _loadingTask: PDFDocumentLoadingTask | null = null;
  private _isDestroyed = false;

  constructor(containerId: string, options: LoadOptions) {
    this._instanceId = this._generateInstanceId();
    this._containerId = containerId;
    this._options = { ...options };

    // Initialize instance-specific services
    this._state = new InstanceState(this._instanceId, containerId);
    this._events = new InstanceEventEmitter(this._instanceId);
    this._canvasPool = new InstanceCanvasPool(this._instanceId);
    this._ensureGlobalWorkerSetup();
  }

  /**
   * Gets the unique identifier for this instance
   */
  get instanceId(): string {
    return this._instanceId;
  }

  /**
   * Gets the container ID this instance is bound to
   */
  get containerId(): string {
    return this._containerId;
  }

  /**
   * Gets the instance state manager
   */
  get state(): InstanceState {
    return this._state;
  }

  /**
   * Gets the instance event emitter
   */
  get events(): InstanceEventEmitter {
    return this._events;
  }

  /**
   * Gets the instance canvas pool
   */
  get canvasPool(): InstanceCanvasPool {
    return this._canvasPool;
  }

  /**
   * Gets the PDF document instance
   */
  get pdfDocument(): PDFDocumentProxy | null {
    return this._pdfDocument;
  }

  /**
   * Gets the web viewer instance
   */
  get webViewer(): InstanceWebViewer | null {
    return this._webViewer;
  }

  /**
   * Checks if this instance has been destroyed
   */
  get isDestroyed(): boolean {
    return this._isDestroyed;
  }

  /**
   * Ensures the global PDF.js worker is properly configured
   */
  private _ensureGlobalWorkerSetup(): void {
    if (!GlobalWorkerOptions.workerSrc) {
      GlobalWorkerOptions.workerSrc = getPdfWorkerSrc();
    }
  }

  /**
   * Loads a PDF document into this instance
   */
  async load(): Promise<InstanceWebViewer> {
    if (this._isDestroyed) {
      throw new Error('Cannot load PDF into destroyed instance');
    }

    try {
      const internalContainers = PageElement.containerCreation(this._containerId, this._state.scale, this._instanceId);

      if (!internalContainers.parent || !internalContainers.pagesContainer) {
        throw new Error('Failed to create container structure');
      }

      this._showInstanceLoading(internalContainers.parent);

      this._pdfDocument = await this._loadPDFDocument();

      // Clear loading task reference after successful load
      this._loadingTask = null;

      this._webViewer = new InstanceWebViewer(this._pdfDocument, this._options, this._containerId, this);

      await this._webViewer.initialize(internalContainers);

      this._hideInstanceLoading();

      // Emit load complete event
      this._events.emit('pdfLoaded', { instanceId: this._instanceId });

      return this._webViewer;
    } catch (error) {
      // Clean up loading task on error
      if (this._loadingTask) {
        try {
          await this._loadingTask.destroy();
        } catch (cleanupError) {
          console.warn(`Error cleaning up loading task for instance ${this._instanceId}:`, cleanupError);
        }
        this._loadingTask = null;
      }

      // Hide loading UI on error
      this._hideInstanceLoading();

      this._events.emit('pdfLoadError', {
        instanceId: this._instanceId,
        error: error as Error,
      });
      throw error;
    }
  }

  /**
   * Cancels the current loading operation if in progress
   */
  async cancelLoading(): Promise<void> {
    if (this._loadingTask && !this._pdfDocument) {
      try {
        await this._loadingTask.destroy();
        console.log(`Loading cancelled for PDF instance ${this._instanceId}`);
      } catch (error) {
        console.error(`Error cancelling loading for instance ${this._instanceId}:`, error);
      }
      this._loadingTask = null;
    }
  }

  /**
   * Destroys this instance and cleans up all resources
   */
  async destroy(): Promise<void> {
    if (this._isDestroyed) {
      return;
    }

    this._isDestroyed = true;

    try {
      // Destroy web viewer first
      if (this._webViewer) {
        await this._webViewer.destroy();
        this._webViewer = null;
      }

      // Handle PDF document cleanup
      if (this._pdfDocument) {
        // pdfDocument.destroy() handles worker cleanup automatically
        await this._pdfDocument.destroy();
        this._pdfDocument = null;
        console.log(`PDF document destroyed for instance ${this._instanceId}`);
      }
      // If still loading, cancel the loading task
      else if (this._loadingTask) {
        await this._loadingTask.destroy();
        this._loadingTask = null;
        console.log(`Loading task destroyed for instance ${this._instanceId}`);
      }

      // Clean up instance services
      this._canvasPool.destroy();
      this._state.destroy();

      // Emit destroy event before cleaning up events
      this._events.emit('instanceDestroyed', { instanceId: this._instanceId });

      // Clean up event system last
      this._events.destroy();

      console.log(`PDF instance ${this._instanceId} fully destroyed`);
    } catch (error) {
      console.error(`Error destroying PDF instance ${this._instanceId}:`, error);
      throw error;
    }
  }

  /**
   * Loads the PDF document using the global worker
   */
  private async _loadPDFDocument(): Promise<PDFDocumentProxy> {
    const { getDocument } = await import('pdfjs-dist');

    const loadOptions = {
      url: this._options.document || this._options.url,
      password: this._options.password,
      withCredentials: this._options.withCredentials,
      data: this._options.data,
      httpHeaders: this._options.httpHeaders,
      disableRange: false,
      disableStream: false,
      cMapUrl: 'https://unpkg.com/pdfjs-dist@5.2.133/cmaps/',
      cMapPacked: true,
      standardFontDataUrl: 'https://unpkg.com/pdfjs-dist@5.2.133/standard_fonts/',
    };

    // Store loading task for potential cleanup
    this._loadingTask = getDocument(loadOptions as any);

    // Handle password protection
    this._loadingTask.onPassword = (updatePassword: (pass: string) => void, reason: any) => {
      this._events.emit('passwordRequired', {
        instanceId: this._instanceId,
        updatePassword,
        reason,
      });
    };

    // Handle progress
    this._loadingTask.onProgress = (progressData: any) => {
      const percent = Math.round((progressData.loaded / progressData.total) * 100);
      // this._events.emit('loadProgress', {
      //   instanceId: this._instanceId,
      //   percent,
      // });
      this._updateInstanceLoadingProgress(this._instanceId, percent);
    };

    return await this._loadingTask.promise;
  }

  /**
   * Generates a unique instance ID
   */
  private _generateInstanceId(): string {
    return `pdf-instance-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Shows the loading UI for the instance.
   * This method is responsible for creating and displaying the loading overlay.
   */
  private async _showInstanceLoading(parent: HTMLDivElement): Promise<void> {
    const uiLoading = InstanceWebUiUtils.showLoading(this._instanceId, this._containerId);
    this._state.uiLoading = uiLoading;
    this._updateInstanceLoadingProgress(this._instanceId, 0);

    if (parent && uiLoading.parentNode) {
      parent.prepend(uiLoading.parentNode);
    }
  }

  /**
   * Updates the loading progress display
   */
  private _updateInstanceLoadingProgress(instanceId: string, percent: number): void {
    const loadingElement = this._state.uiLoading;
    if (loadingElement) {
      InstanceWebUiUtils.updateLoadingProgress(loadingElement, this._containerId, percent, instanceId);
    }
  }

  /**
   * Hides the loading UI for the instance.
   * This method is responsible for removing the loading overlay.
   */
  private async _hideInstanceLoading(): Promise<void> {
    const loadingElement = this._state.uiLoading;
    if (loadingElement) {
      InstanceWebUiUtils.hideLoading(loadingElement, this._containerId, this._instanceId);
    }
    this._state.uiLoading = null;
  }
}
