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

class PdfViewerKit {
  private static _manager: PDFViewerManager;

  /**
   * Initializes the multi-instance PDF viewer system
   */
  static initialize(): void {
    if (!this._manager) {
      this._manager = PDFViewerManager.getInstance();
      this._manager.setupPeriodicCleanup();

      // Set up memory pressure handling
      if ('onmemorypressure' in window) {
        (window as any).addEventListener('memorypressure', () => {
          this._manager.handleMemoryPressure();
        });
      }

      console.log('MultiInstancePDFViewer initialized');
    }
  }

  /**
   * Loads a PDF document into a new isolated instance
   *
   * @param options - Configuration options for loading the document
   * @returns Promise that resolves to a PDFViewerInstance
   */
  static async load(options: LoadOptions): Promise<PDFViewerInstance> {
    this.initialize();
    const instance = await this._manager.load(options);
    await instance.load();
    return instance;
  }

  /**
   * Gets an instance by its ID
   */
  static getInstance(instanceId: string): PDFViewerInstance | undefined {
    return this._manager?.getInstance(instanceId);
  }

  /**
   * Gets an instance by container ID
   */
  static getInstanceByContainer(containerId: string): PDFViewerInstance | undefined {
    return this._manager?.getInstanceByContainer(containerId);
  }

  /**
   * Gets all active instances
   */
  static getAllInstances(): PDFViewerInstance[] {
    return this._manager?.getAllInstances() || [];
  }

  /**
   * Gets the total number of active instances
   */
  static getInstanceCount(): number {
    return this._manager?.getInstanceCount() || 0;
  }

  /**
   * Unloads a specific instance
   */
  static async unload(instanceId: string): Promise<void> {
    await this._manager?.unload(instanceId);
  }

  /**
   * Unloads an instance by container ID
   */
  static async unloadByContainer(containerId: string): Promise<void> {
    await this._manager?.unloadByContainer(containerId);
  }

  /**
   * Unloads all instances
   */
  static async unloadAll(): Promise<void> {
    await this._manager?.unloadAll();
  }

  /**
   * Checks if a container is in use
   */
  static isContainerInUse(containerId: string): boolean {
    return this._manager?.isContainerInUse(containerId) || false;
  }

  /**
   * Gets system statistics
   */
  static getStats() {
    return this._manager?.getStats();
  }

  /**
   * Destroys the entire system and all instances
   */
  static async destroy(): Promise<void> {
    await this._manager?.destroy();
    this._manager = undefined as any;
  }

  /**
   * Handles memory pressure across all instances
   */
  static handleMemoryPressure(): void {
    this._manager?.handleMemoryPressure();
  }
}

export default PdfViewerKit;
