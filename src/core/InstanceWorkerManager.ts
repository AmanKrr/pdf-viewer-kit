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
   * Sets up PDF.js worker options for this specific instance
   */
  private async _setupPDFWorkerOptions(): Promise<void> {
    // Don't modify global worker options - create instance-specific worker
    // This prevents conflicts between multiple PDF instances
    console.log(`Setting up instance-specific worker for ${this._instanceId}`);
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
      // Create a completely isolated worker for this instance
      const { getDocument } = await import('pdfjs-dist');

      // Create worker with instance-specific configuration
      const workerSrc = 'https://unpkg.com/pdfjs-dist@5.2.133/build/pdf.worker.min.mjs';

      // Create a new worker instance that won't interfere with others
      const worker = new Worker(workerSrc, { type: 'module' });

      console.log(`Created isolated worker for instance ${this._instanceId}`);
      return worker;
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
