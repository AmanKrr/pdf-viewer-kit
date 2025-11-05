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
import { PasswordManagerService } from '../viewer/services/password-manager.service';
import { ErrorHandlerService } from '../viewer/services/error-handler.service';

/**
 * Manages a single, completely isolated PDF viewer instance.
 *
 * Each instance has its own state, resources, and event system,
 * providing complete isolation for multi-instance PDF viewing scenarios.
 * This class orchestrates the lifecycle of a PDF viewer from creation
 * to destruction, managing all associated resources and services.
 */
export class PDFViewerInstance {
  private readonly _instanceId: string;
  private readonly _containerId: string;
  private readonly _options: LoadOptions;

  private readonly _state: InstanceState;
  private readonly _events: InstanceEventEmitter;
  private readonly _canvasPool: InstanceCanvasPool;

  private _pdfDocument: PDFDocumentProxy | null = null;
  private _webViewer: InstanceWebViewer | null = null;
  private _loadingTask: PDFDocumentLoadingTask | null = null;
  private _isDestroyed = false;
  private _passwordManagerService: PasswordManagerService | null = null;
  private _errorHandlerService: ErrorHandlerService | null = null;

  /**
   * Creates a new PDF viewer instance.
   *
   * @param containerId - DOM container ID where the PDF viewer will be rendered
   * @param options - Configuration options for loading the PDF document
   */
  constructor(containerId: string, options: LoadOptions) {
    this._instanceId = this._generateInstanceId();
    this._containerId = containerId;
    this._options = { ...options };

    this._state = new InstanceState(this._instanceId, containerId);
    this._events = new InstanceEventEmitter(this._instanceId);
    this._canvasPool = new InstanceCanvasPool(this._instanceId);
    this._ensureGlobalWorkerSetup();
  }

  /**
   * Gets the unique identifier for this instance.
   *
   * @returns The unique identifier string for this PDF viewer instance
   */
  get instanceId(): string {
    return this._instanceId;
  }

  /**
   * Gets the container ID this instance is bound to.
   *
   * @returns The DOM container ID where this instance is rendered
   */
  get containerId(): string {
    return this._containerId;
  }

  /**
   * Gets the instance state manager.
   *
   * @returns The state manager for this PDF viewer instance
   */
  get state(): InstanceState {
    return this._state;
  }

  /**
   * Gets the instance event emitter.
   *
   * @returns The event emitter for this PDF viewer instance
   */
  get events(): InstanceEventEmitter {
    return this._events;
  }

  /**
   * Gets the instance canvas pool.
   *
   * @returns The canvas pool for this PDF viewer instance
   */
  get canvasPool(): InstanceCanvasPool {
    return this._canvasPool;
  }

  /**
   * Gets the PDF document instance.
   *
   * @returns The PDF.js document proxy, or null if not yet loaded
   */
  get pdfDocument(): PDFDocumentProxy | null {
    return this._pdfDocument;
  }

  /**
   * Gets the web viewer instance.
   *
   * @returns The web viewer instance, or null if not yet initialized
   */
  get webViewer(): InstanceWebViewer | null {
    return this._webViewer;
  }

  /**
   * Checks if this instance has been destroyed.
   *
   * @returns True if the instance has been destroyed, false otherwise
   */
  get isDestroyed(): boolean {
    return this._isDestroyed;
  }

  /**
   * Ensures the global PDF.js worker is properly configured.
   *
   * Sets up the worker source if not already configured,
   * ensuring PDF.js can function properly.
   */
  private _ensureGlobalWorkerSetup(): void {
    if (!GlobalWorkerOptions.workerSrc) {
      GlobalWorkerOptions.workerSrc = getPdfWorkerSrc();
    }
  }

  /**
   * Loads a PDF document into this instance.
   *
   * Performs the complete PDF loading process including:
   * - Container creation and setup
   * - PDF document loading via PDF.js
   * - Web viewer initialization
   * - Loading UI management
   * - Event emission for success/failure
   *
   * @returns Promise that resolves to the initialized web viewer
   * @throws Error if the instance is destroyed or loading fails
   */
  async load(): Promise<InstanceWebViewer> {
    if (this._isDestroyed) {
      throw new Error('Cannot load PDF into destroyed instance');
    }

    try {
      const internalContainers: {
        parent: HTMLDivElement;
        viewerContainer: HTMLDivElement;
        pagesContainer: HTMLDivElement;
        injectElementId: string;
        shadowRoot: ShadowRoot;
      } = PageElement.containerCreation(this._containerId, this._state.scale, this._instanceId);

      if (!internalContainers.parent || !internalContainers.pagesContainer) {
        throw new Error('Failed to create container structure');
      }

      this._showInstanceLoading(internalContainers.parent);

      // Initialize password manager service
      this._passwordManagerService = new PasswordManagerService(internalContainers.parent, this._instanceId);

      // Initialize error handler service
      this._errorHandlerService = new ErrorHandlerService(internalContainers.parent, this._instanceId, () => this.retryLoad());

      this._pdfDocument = await this._loadPDFDocument();

      this._loadingTask = null;

      this._webViewer = new InstanceWebViewer(this._pdfDocument, this._options, this._containerId, this, internalContainers.shadowRoot);

      await this._webViewer.initialize(internalContainers);

      this._hideInstanceLoading();

      // Clean up password manager after successful load
      if (this._passwordManagerService) {
        this._passwordManagerService.cleanupAfterSuccess();
      }

      this._events.emit('pdfLoaded', { instanceId: this._instanceId });

      return this._webViewer;
    } catch (error) {
      if (this._loadingTask) {
        try {
          await this._loadingTask.destroy();
        } catch (cleanupError) {
          console.warn(`Error cleaning up loading task for instance ${this._instanceId}:`, cleanupError);
        }
        this._loadingTask = null;
      }

      this._hideInstanceLoading();

      // Show user-friendly error message
      if (this._errorHandlerService) {
        this._errorHandlerService.showError(error as Error, 'PDF Loading Error');
      }

      this._events.emit('pdfLoadError', {
        instanceId: this._instanceId,
        error: error as Error,
      });
      throw error;
    }
  }

  /**
   * Cancels the current loading operation if in progress.
   *
   * Safely terminates any ongoing PDF loading process and
   * cleans up associated resources.
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
   * Retries loading the PDF document.
   *
   * This method can be called when the user wants to retry after an error.
   * It will attempt to load the PDF again with the same options.
   *
   * @returns Promise that resolves to the initialized web viewer
   * @throws Error if the instance is destroyed or loading fails
   */
  async retryLoad(): Promise<InstanceWebViewer> {
    if (this._isDestroyed) {
      throw new Error('Cannot retry loading into destroyed instance');
    }

    // Hide any existing error messages
    if (this._errorHandlerService) {
      this._errorHandlerService.hideError();
    }

    // Attempt to load the PDF again
    return this.load();
  }

  /**
   * Destroys this instance and cleans up all resources.
   *
   * Performs complete cleanup including:
   * - Web viewer destruction
   * - PDF document cleanup
   * - Loading task cancellation
   * - Service cleanup (canvas pool, state, events)
   * - Event emission for destruction
   */
  async destroy(): Promise<void> {
    if (this._isDestroyed) {
      return;
    }

    this._isDestroyed = true;

    try {
      if (this._webViewer) {
        await this._webViewer.destroy();
        this._webViewer = null;
      }

      if (this._pdfDocument) {
        await this._pdfDocument.destroy();
        this._pdfDocument = null;
        console.log(`PDF document destroyed for instance ${this._instanceId}`);
      } else if (this._loadingTask) {
        await this._loadingTask.destroy();
        this._loadingTask = null;
        console.log(`Loading task destroyed for instance ${this._instanceId}`);
      }

      // Clean up password manager service
      if (this._passwordManagerService) {
        this._passwordManagerService.destroy();
        this._passwordManagerService = null;
      }

      // Clean up error handler service
      if (this._errorHandlerService) {
        this._errorHandlerService.destroy();
        this._errorHandlerService = null;
      }

      this._canvasPool.destroy();
      this._state.destroy();

      this._events.emit('instanceDestroyed', { instanceId: this._instanceId });

      this._events.destroy();

      console.log(`PDF instance ${this._instanceId} fully destroyed`);
    } catch (error) {
      console.error(`Error destroying PDF instance ${this._instanceId}:`, error);
      throw error;
    }
  }

  /**
   * Loads the PDF document using the global worker.
   *
   * Configures PDF.js loading options and handles password protection
   * and progress tracking during the loading process.
   *
   * @returns Promise that resolves to the loaded PDF document
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

    this._loadingTask = getDocument(loadOptions as any);

    this._loadingTask.onPassword = (updatePassword: (pass: string) => void, reason: any) => {
      if (this._passwordManagerService) {
        this._passwordManagerService.handlePasswordRequired(updatePassword, reason);
      }
    };

    this._loadingTask.onProgress = (progressData: any) => {
      const percent = Math.round((progressData.loaded / progressData.total) * 100);
      this._updateInstanceLoadingProgress(this._instanceId, percent);
    };

    return await this._loadingTask.promise;
  }

  /**
   * Generates a unique instance ID.
   *
   * Creates a timestamp-based identifier with random suffix
   * to ensure uniqueness across multiple instances.
   *
   * @returns Unique identifier string for this instance
   */
  private _generateInstanceId(): string {
    return `pdf-instance-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Shows the loading UI for the instance.
   *
   * Creates and displays the loading overlay with progress tracking
   * to provide visual feedback during PDF loading.
   *
   * @param parent - Parent container to prepend the loading UI to
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
   * Updates the loading progress display.
   *
   * Updates the visual progress indicator to show current
   * loading progress to the user.
   *
   * @param instanceId - ID of the instance being loaded
   * @param percent - Loading progress percentage (0-100)
   */
  private _updateInstanceLoadingProgress(instanceId: string, percent: number): void {
    const loadingElement = this._state.uiLoading;
    if (loadingElement) {
      InstanceWebUiUtils.updateLoadingProgress(loadingElement, this._containerId, percent, instanceId);
    }
  }

  /**
   * Hides the loading UI for the instance.
   *
   * Removes the loading overlay and cleans up loading state
   * after PDF loading is complete or fails.
   */
  private async _hideInstanceLoading(): Promise<void> {
    const loadingElement = this._state.uiLoading;
    if (loadingElement) {
      InstanceWebUiUtils.hideLoading(loadingElement, this._containerId, this._instanceId);
    }
    this._state.uiLoading = null;
  }
}
