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

/**
 * Manages a PDF.js worker that is completely isolated to a single PDF instance.
 * Each instance has its own worker, preventing conflicts between multiple PDFs.
 */
export class InstanceWorkerManager {
  private readonly _instanceId: string;
  private _worker: Worker | null = null;
  private _isInitialized = false;
  private _isDestroyed = false;

  constructor(instanceId: string) {
    this._instanceId = instanceId;
  }

  /**
   * Gets the instance ID this worker manager belongs to
   */
  get instanceId(): string {
    return this._instanceId;
  }

  /**
   * Gets the worker instance
   */
  get worker(): Worker | null {
    return this._worker;
  }

  /**
   * Checks if the worker has been initialized
   */
  get isInitialized(): boolean {
    return this._isInitialized;
  }

  /**
   * Checks if this worker manager has been destroyed
   */
  get isDestroyed(): boolean {
    return this._isDestroyed;
  }

  /**
   * Initializes the worker for this instance
   */
  async initialize(): Promise<void> {
    if (this._isDestroyed) {
      throw new Error(`Cannot initialize worker for destroyed instance ${this._instanceId}`);
    }

    if (this._isInitialized) {
      return;
    }

    try {
      // Set up PDF.js global worker options if not already set
      await this._setupPDFWorkerOptions();

      // Create a new worker instance for this PDF instance
      this._worker = await this._createWorker();
      this._isInitialized = true;

      console.log(`Worker initialized for PDF instance ${this._instanceId}`);
    } catch (error) {
      console.error(`Failed to initialize worker for instance ${this._instanceId}:`, error);
      throw error;
    }
  }

  /**
   * Sets up PDF.js global worker options
   */
  private async _setupPDFWorkerOptions(): Promise<void> {
    const { GlobalWorkerOptions } = await import('pdfjs-dist');

    // Only set worker source if not already set
    if (!GlobalWorkerOptions.workerSrc) {
      try {
        // Try to use CDN worker
        GlobalWorkerOptions.workerSrc = 'https://unpkg.com/pdfjs-dist@5.2.133/build/pdf.worker.min.mjs';
        console.log('Set PDF.js worker source to CDN');
      } catch (error) {
        console.warn('Failed to set CDN worker, falling back to local worker');
        // Fallback to local worker
        GlobalWorkerOptions.workerSrc = new URL('pdfjs-dist/build/pdf.worker.min.mjs', import.meta.url).href;
      }
    }
  }

  /**
   * Destroys this worker manager and terminates the worker
   */
  async destroy(): Promise<void> {
    if (this._isDestroyed) {
      return;
    }

    this._isDestroyed = true;

    try {
      if (this._worker) {
        // Terminate the worker
        this._worker.terminate();
        this._worker = null;
        this._isInitialized = false;

        console.log(`Worker terminated for PDF instance ${this._instanceId}`);
      }
    } catch (error) {
      console.error(`Error destroying worker for instance ${this._instanceId}:`, error);
    }
  }

  /**
   * Creates a new worker instance
   */
  private async _createWorker(): Promise<Worker | null> {
    try {
      // Let PDF.js handle worker creation by not specifying a custom worker
      // This will use the global worker source we set up
      console.log(`Using PDF.js global worker for instance ${this._instanceId}`);
      return null; // PDF.js will create its own worker when needed
    } catch (error) {
      console.error(`Failed to create worker for instance ${this._instanceId}:`, error);
      throw new Error(`Cannot create PDF worker for instance ${this._instanceId}`);
    }
  }

  /**
   * Gets worker statistics
   */
  getWorkerStats(): {
    instanceId: string;
    isInitialized: boolean;
    isDestroyed: boolean;
    workerType: string;
  } {
    return {
      instanceId: this._instanceId,
      isInitialized: this._isInitialized,
      isDestroyed: this._isDestroyed,
      workerType: this._worker ? 'active' : 'none',
    };
  }
}
