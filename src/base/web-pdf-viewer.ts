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

import { PDFViewerInstance } from '../internal';
import { LoadOptions } from '../types/webpdf.types';
import { PDFViewerInstanceFacade } from '../public-api/facade';
import { IPDFViewerInstance } from '../public-api/interfaces';

/**
 * Main entry point for the PDF viewer library.
 * Provides static methods for managing PDF viewer instances.
 */
export default class PdfViewerKit {
  private static _instances = new Map<string, PDFViewerInstance>();
  private static _containerToInstance = new Map<string, string>();
  private static _isDestroyed = false;

  /**
   * Load a PDF document in a specified container.
   * Returns a runtime-protected facade that implements IPDFViewerInstance.
   */
  static async load(options: LoadOptions): Promise<IPDFViewerInstance> {
    if (this._isDestroyed) {
      throw new Error('PdfViewerKit has been destroyed. Cannot create new instances.');
    }

    const { containerId } = options;

    if (this.isContainerInUse(containerId)) {
      throw new Error(`Container '${containerId}' is already in use by another PDF viewer instance.`);
    }

    try {
      const instance = new PDFViewerInstance(containerId, options);
      await instance.load();

      this._instances.set(instance.instanceId, instance);
      this._containerToInstance.set(containerId, instance.instanceId);

      // Return the protected facade instead of the internal instance
      return new PDFViewerInstanceFacade(instance);
    } catch (error) {
      throw new Error(`Failed to load PDF: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Get an existing instance by ID.
   * Returns a runtime-protected facade.
   */
  static getInstance(instanceId: string): IPDFViewerInstance | undefined {
    const instance = this._instances.get(instanceId);
    return instance ? new PDFViewerInstanceFacade(instance) : undefined;
  }

  /**
   * Get an existing instance by container ID.
   * Returns a runtime-protected facade.
   */
  static getInstanceByContainer(containerId: string): IPDFViewerInstance | undefined {
    const instanceId = this._containerToInstance.get(containerId);
    if (!instanceId) return undefined;

    const instance = this._instances.get(instanceId);
    return instance ? new PDFViewerInstanceFacade(instance) : undefined;
  }

  /**
   * Get all active instances.
   * Returns runtime-protected facades.
   */
  static getAllInstances(): IPDFViewerInstance[] {
    return Array.from(this._instances.values()).map((instance) => new PDFViewerInstanceFacade(instance));
  }

  /**
   * Get the count of active instances.
   */
  static getInstanceCount(): number {
    return this._instances.size;
  }

  /**
   * Unload and destroy an instance by ID.
   */
  static async unload(instanceId: string): Promise<void> {
    const instance = this._instances.get(instanceId);
    if (!instance) {
      throw new Error(`Instance '${instanceId}' not found.`);
    }

    try {
      await instance.destroy();
      this._instances.delete(instanceId);
      this._containerToInstance.delete(instance.containerId);
    } catch (error) {
      throw new Error(`Failed to unload instance '${instanceId}': ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Unload and destroy an instance by container ID.
   */
  static async unloadByContainer(containerId: string): Promise<void> {
    const instanceId = this._containerToInstance.get(containerId);
    if (!instanceId) {
      throw new Error(`No instance found for container '${containerId}'.`);
    }

    await this.unload(instanceId);
  }

  /**
   * Unload and destroy all instances.
   */
  static async unloadAll(): Promise<void> {
    const unloadPromises = Array.from(this._instances.keys()).map((id) => this.unload(id));
    await Promise.all(unloadPromises);
  }

  /**
   * Check if a container is in use.
   */
  static isContainerInUse(containerId: string): boolean {
    return this._containerToInstance.has(containerId);
  }

  /**
   * Get system statistics.
   */
  static getStats() {
    return {
      instanceCount: this.getInstanceCount(),
      containersInUse: Array.from(this._containerToInstance.keys()),
      isDestroyed: this._isDestroyed,
      memoryUsage: this._getMemoryUsage(),
    };
  }

  /**
   * Destroy the entire system and all instances.
   */
  static async destroy(): Promise<void> {
    if (this._isDestroyed) return;

    try {
      await this.unloadAll();
      this._isDestroyed = true;
    } catch (error) {
      throw new Error(`Failed to destroy PdfViewerKit: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Get memory usage statistics.
   */
  private static _getMemoryUsage() {
    if (typeof performance !== 'undefined' && 'memory' in performance) {
      const memory = (performance as any).memory;
      return {
        usedJSHeapSize: memory.usedJSHeapSize,
        totalJSHeapSize: memory.totalJSHeapSize,
        jsHeapSizeLimit: memory.jsHeapSizeLimit,
      };
    }
    return null;
  }
}
