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
import { LoadOptions } from '../types/webpdf.types';
import { InstanceState } from './InstanceState';
import { InstanceEventEmitter } from './InstanceEventEmitter';
import { InstanceCanvasPool } from './InstanceCanvasPool';
import { InstanceImageBitmapPool } from './InstanceImageBitmapPool';
import { InstanceWorkerManager } from './InstanceWorkerManager';
import { InstanceWebViewer } from './InstanceWebViewer';

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
  private readonly _imageBitmapPool: InstanceImageBitmapPool;
  private readonly _workerManager: InstanceWorkerManager;

  // PDF instance
  private _pdfDocument: PDFDocumentProxy | null = null;
  private _webViewer: InstanceWebViewer | null = null;
  private _isDestroyed = false;

  constructor(containerId: string, options: LoadOptions) {
    this._instanceId = this._generateInstanceId();
    this._containerId = containerId;
    this._options = { ...options };

    // Initialize instance-specific services
    this._state = new InstanceState(this._instanceId, containerId);
    this._events = new InstanceEventEmitter(this._instanceId);
    this._canvasPool = new InstanceCanvasPool(this._instanceId);
    this._imageBitmapPool = new InstanceImageBitmapPool(this._instanceId);
    this._workerManager = new InstanceWorkerManager(this._instanceId);
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
   * Gets the instance image bitmap pool
   */
  get imageBitmapPool(): InstanceImageBitmapPool {
    return this._imageBitmapPool;
  }

  /**
   * Gets the instance worker manager
   */
  get workerManager(): InstanceWorkerManager {
    return this._workerManager;
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
   * Loads a PDF document into this instance
   */
  async load(): Promise<InstanceWebViewer> {
    if (this._isDestroyed) {
      throw new Error('Cannot load PDF into destroyed instance');
    }

    try {
      // Initialize worker for this instance
      await this._workerManager.initialize();

      // Load PDF document
      this._pdfDocument = await this._loadPDFDocument();

      // Create web viewer
      this._webViewer = new InstanceWebViewer(this._pdfDocument, this._options, this._containerId, this);

      // Initialize the viewer
      await this._webViewer.initialize();

      // Emit load complete event
      this._events.emit('pdfLoaded', { instanceId: this._instanceId });

      return this._webViewer;
    } catch (error) {
      this._events.emit('pdfLoadError', {
        instanceId: this._instanceId,
        error: error as Error,
      });
      throw error;
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
      // Destroy web viewer
      if (this._webViewer) {
        await this._webViewer.destroy();
        this._webViewer = null;
      }

      // Destroy PDF document
      if (this._pdfDocument) {
        this._pdfDocument.destroy();
        this._pdfDocument = null;
      }

      // Clean up instance services
      await this._workerManager.destroy();
      this._canvasPool.destroy();
      this._imageBitmapPool.destroy();
      this._state.destroy();
      this._events.destroy();

      // Emit destroy event
      this._events.emit('instanceDestroyed', { instanceId: this._instanceId });
    } catch (error) {
      console.error(`Error destroying PDF instance ${this._instanceId}:`, error);
    }
  }

  /**
   * Loads the PDF document using the instance-specific worker
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
      // Don't pass custom worker - let PDF.js use global worker configuration
    };

    const loadingTask = getDocument(loadOptions as any);

    // Handle password protection
    loadingTask.onPassword = (updatePassword: (pass: string) => void, reason: any) => {
      this._events.emit('passwordRequired', {
        instanceId: this._instanceId,
        updatePassword,
        reason,
      });
    };

    // Handle progress
    loadingTask.onProgress = (progressData: any) => {
      const percent = Math.round((progressData.loaded / progressData.total) * 100);
      this._events.emit('loadProgress', {
        instanceId: this._instanceId,
        percent,
      });
    };

    return await loadingTask.promise;
  }

  /**
   * Generates a unique instance ID
   */
  private _generateInstanceId(): string {
    return `pdf-instance-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}
