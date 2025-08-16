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

import { PDFViewerInstance } from '../core/viewer-instance.core';
import { PDFViewerManager } from '../core/viewer-manager.core';
import { LoadOptions } from '../types/webpdf.types';

/**
 * Main entry point class for the PDF viewer library.
 *
 * Provides a static interface for managing multiple PDF viewer instances
 * with complete isolation between them. Each instance has its own state,
 * resources, and event system.
 */
class PdfViewerKit {
  private static _manager: PDFViewerManager;

  /**
   * Initializes the multi-instance PDF viewer system.
   *
   * Sets up the global manager instance and configures memory pressure handling.
   * This method is called automatically when needed, but can be called explicitly
   * for early initialization.
   */
  static initialize(): void {
    if (!this._manager) {
      this._manager = PDFViewerManager.getInstance();
      this._manager.setupPeriodicCleanup();

      if ('onmemorypressure' in window) {
        (window as any).addEventListener('memorypressure', () => {
          this._manager.handleMemoryPressure();
        });
      }

      console.log('MultiInstancePDFViewer initialized');
    }
  }

  /**
   * Loads a PDF document into a new isolated instance.
   *
   * @param options - Configuration options for loading the document including container ID, source URL, and other PDF.js options
   * @returns Promise that resolves to a fully initialized PDFViewerInstance
   */
  static async load(options: LoadOptions): Promise<PDFViewerInstance> {
    this.initialize();
    const instance = await this._manager.load(options);
    await instance.load();
    return instance;
  }

  /**
   * Retrieves a PDF viewer instance by its unique identifier.
   *
   * @param instanceId - The unique identifier of the instance
   * @returns The PDFViewerInstance if found, undefined otherwise
   */
  static getInstance(instanceId: string): PDFViewerInstance | undefined {
    return this._manager?.getInstance(instanceId);
  }

  /**
   * Retrieves a PDF viewer instance by its container ID.
   *
   * @param containerId - The DOM container ID where the instance is rendered
   * @returns The PDFViewerInstance if found, undefined otherwise
   */
  static getInstanceByContainer(containerId: string): PDFViewerInstance | undefined {
    return this._manager?.getInstanceByContainer(containerId);
  }

  /**
   * Gets all currently active PDF viewer instances.
   *
   * @returns Array of all active PDFViewerInstance objects
   */
  static getAllInstances(): PDFViewerInstance[] {
    return this._manager?.getAllInstances() || [];
  }

  /**
   * Gets the total number of currently active instances.
   *
   * @returns The count of active instances
   */
  static getInstanceCount(): number {
    return this._manager?.getInstanceCount() || 0;
  }

  /**
   * Unloads and destroys a specific PDF viewer instance.
   *
   * @param instanceId - The unique identifier of the instance to unload
   */
  static async unload(instanceId: string): Promise<void> {
    await this._manager?.unload(instanceId);
  }

  /**
   * Unloads and destroys an instance by its container ID.
   *
   * @param containerId - The DOM container ID of the instance to unload
   */
  static async unloadByContainer(containerId: string): Promise<void> {
    await this._manager?.unloadByContainer(containerId);
  }

  /**
   * Unloads and destroys all currently active PDF viewer instances.
   *
   * This method performs a complete cleanup of all resources and instances.
   */
  static async unloadAll(): Promise<void> {
    await this._manager?.unloadAll();
  }

  /**
   * Checks if a specific container ID is currently in use by an instance.
   *
   * @param containerId - The DOM container ID to check
   * @returns True if the container is in use, false otherwise
   */
  static isContainerInUse(containerId: string): boolean {
    return this._manager?.isContainerInUse(containerId) || false;
  }

  /**
   * Gets comprehensive system statistics including memory usage, instance counts, and performance metrics.
   *
   * @returns Object containing detailed system statistics
   */
  static getStats() {
    return this._manager?.getStats();
  }

  /**
   * Destroys the entire PDF viewer system and all instances.
   *
   * This method performs a complete cleanup of all resources, instances,
   * and the global manager. After calling this, the system must be
   * re-initialized before use.
   */
  static async destroy(): Promise<void> {
    await this._manager?.destroy();
    this._manager = undefined as any;
  }

  /**
   * Handles memory pressure across all instances.
   *
   * Triggers aggressive cleanup and resource management when the system
   * detects memory pressure. This method is called automatically by
   * the memory pressure event listener.
   */
  static handleMemoryPressure(): void {
    this._manager?.handleMemoryPressure();
  }
}

export default PdfViewerKit;
