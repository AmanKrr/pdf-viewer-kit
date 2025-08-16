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

import { LoadOptions } from '../types/webpdf.types';
import { PDFViewerInstance } from './viewer-instance.core';

/**
 * Manages multiple PDF viewer instances with complete isolation.
 *
 * Each instance has its own state, resources, and event system,
 * providing a centralized management layer for multi-instance PDF viewing.
 * Implements singleton pattern to ensure global coordination.
 */
export class PDFViewerManager {
  private static _instance: PDFViewerManager;
  private readonly _instances: Map<string, PDFViewerInstance> = new Map();
  private readonly _containerToInstance: Map<string, string> = new Map();
  private _isDestroyed = false;

  private constructor() {}

  /**
   * Gets the singleton instance of PDFViewerManager.
   *
   * Creates a new instance if one doesn't exist, ensuring
   * only one manager exists throughout the application lifecycle.
   *
   * @returns The singleton PDFViewerManager instance
   */
  public static getInstance(): PDFViewerManager {
    if (!PDFViewerManager._instance) {
      PDFViewerManager._instance = new PDFViewerManager();
    }
    return PDFViewerManager._instance;
  }

  /**
   * Loads a PDF document into a new isolated instance.
   *
   * Creates a completely isolated PDF viewer instance for the specified
   * container, ensuring no resource conflicts with existing instances.
   * Automatically handles container conflict resolution and cleanup.
   *
   * @param options - Configuration options for loading the PDF document
   * @returns Promise that resolves to the new PDFViewerInstance
   * @throws Error if the manager is destroyed or container conflicts exist
   */
  async load(options: LoadOptions): Promise<PDFViewerInstance> {
    if (this._isDestroyed) {
      throw new Error('PDFViewerManager has been destroyed');
    }

    if (this._containerToInstance.has(options.containerId)) {
      const existingInstanceId = this._containerToInstance.get(options.containerId)!;
      const existingInstance = this._instances.get(existingInstanceId);

      if (existingInstance && !existingInstance.isDestroyed) {
        throw new Error(`Container ${options.containerId} is already in use by instance ${existingInstanceId}`);
      } else {
        this._containerToInstance.delete(options.containerId);
        this._instances.delete(existingInstanceId);
      }
    }

    try {
      const instance = new PDFViewerInstance(options.containerId, options);

      this._instances.set(instance.instanceId, instance);
      this._containerToInstance.set(options.containerId, instance.instanceId);

      instance.events.on('instanceDestroyed', () => {
        this._cleanupInstance(instance.instanceId);
      });

      console.log(`PDF instance ${instance.instanceId} created for container ${options.containerId}`);

      return instance;
    } catch (error) {
      console.error(`Failed to create PDF instance for container ${options.containerId}:`, error);
      throw error;
    }
  }

  /**
   * Gets an instance by its unique identifier.
   *
   * @param instanceId - The unique identifier of the instance
   * @returns The PDFViewerInstance if found, undefined otherwise
   */
  getInstance(instanceId: string): PDFViewerInstance | undefined {
    return this._instances.get(instanceId);
  }

  /**
   * Gets an instance by its container ID.
   *
   * @param containerId - The DOM container ID where the instance is rendered
   * @returns The PDFViewerInstance if found, undefined otherwise
   */
  getInstanceByContainer(containerId: string): PDFViewerInstance | undefined {
    const instanceId = this._containerToInstance.get(containerId);
    if (instanceId) {
      return this._instances.get(instanceId);
    }
    return undefined;
  }

  /**
   * Gets all active instances.
   *
   * @returns An array of PDFViewerInstance objects that are not destroyed.
   */
  getAllInstances(): PDFViewerInstance[] {
    return Array.from(this._instances.values()).filter((instance) => !instance.isDestroyed);
  }

  /**
   * Gets all instance IDs.
   *
   * @returns An array of unique identifiers for all instances.
   */
  getAllInstanceIds(): string[] {
    return Array.from(this._instances.keys());
  }

  /**
   * Gets all container IDs.
   *
   * @returns An array of DOM container IDs that are currently in use.
   */
  getAllContainerIds(): string[] {
    return Array.from(this._containerToInstance.keys());
  }

  /**
   * Gets the total number of active instances.
   *
   * @returns The count of instances that are not destroyed.
   */
  getInstanceCount(): number {
    return this.getAllInstances().length;
  }

  /**
   * Unloads a specific instance.
   *
   * Destroys the instance and removes it from the manager's state.
   *
   * @param instanceId - The unique identifier of the instance to unload.
   * @returns Promise that resolves when the instance is unloaded.
   * @throws Error if the instance is not found or is already destroyed.
   */
  async unload(instanceId: string): Promise<void> {
    const instance = this._instances.get(instanceId);
    if (instance) {
      try {
        await instance.destroy();
        this._cleanupInstance(instanceId);
        console.log(`PDF instance ${instanceId} unloaded successfully`);
      } catch (error) {
        console.error(`Error unloading PDF instance ${instanceId}:`, error);
        throw error;
      }
    }
  }

  /**
   * Unloads an instance by container ID.
   *
   * Finds the instance by its container ID and unloads it.
   *
   * @param containerId - The DOM container ID where the instance is rendered.
   * @returns Promise that resolves when the instance is unloaded.
   * @throws Error if the container ID is not found.
   */
  async unloadByContainer(containerId: string): Promise<void> {
    const instanceId = this._containerToInstance.get(containerId);
    if (instanceId) {
      await this.unload(instanceId);
    }
  }

  /**
   * Unloads all instances.
   *
   * Iterates through all instances and unloads them.
   *
   * @returns Promise that resolves when all instances are unloaded.
   */
  async unloadAll(): Promise<void> {
    const instanceIds = Array.from(this._instances.keys());

    for (const instanceId of instanceIds) {
      try {
        await this.unload(instanceId);
      } catch (error) {
        console.error(`Error unloading instance ${instanceId}:`, error);
        // Continue with other instances
      }
    }
  }

  /**
   * Checks if a container is in use.
   *
   * @param containerId - The DOM container ID to check.
   * @returns True if the container is currently mapped to an instance, false otherwise.
   */
  isContainerInUse(containerId: string): boolean {
    return this._containerToInstance.has(containerId);
  }

  /**
   * Gets instance statistics.
   *
   * @returns An object containing various statistics about the manager's state.
   */
  getStats(): {
    instanceCount: number;
    memoryUsage: number;
    workerCount: number;
    canvasCount: number;
    totalInstances: number;
    activeInstances: number;
    destroyedInstances: number;
    containersInUse: number;
    detailedMemoryUsage: {
      totalCanvases: number;
      estimatedMemoryMB: number;
    };
  } {
    const allInstances = Array.from(this._instances.values());
    const activeInstances = allInstances.filter((instance) => !instance.isDestroyed);
    const destroyedInstances = allInstances.filter((instance) => instance.isDestroyed);

    // Calculate memory usage across all instances
    let totalCanvases = 0;
    let totalMemoryMB = 0;

    activeInstances.forEach((instance) => {
      const canvasStats = instance.canvasPool.getPoolStats();

      totalCanvases += canvasStats.totalCanvases;
      totalMemoryMB += parseFloat(canvasStats.memoryUsage.replace(' MB', ''));
    });

    return {
      instanceCount: activeInstances.length,
      memoryUsage: totalMemoryMB * 1024 * 1024, // Convert to bytes for the example
      workerCount: activeInstances.length, // Each instance has its own worker
      canvasCount: totalCanvases,
      totalInstances: allInstances.length,
      activeInstances: activeInstances.length,
      destroyedInstances: destroyedInstances.length,
      containersInUse: this._containerToInstance.size,
      detailedMemoryUsage: {
        totalCanvases,
        estimatedMemoryMB: parseFloat(totalMemoryMB.toFixed(2)),
      },
    };
  }

  /**
   * Destroys the manager and all instances.
   *
   * Unloads all instances and clears all internal state.
   *
   * @returns Promise that resolves when the manager is destroyed.
   */
  async destroy(): Promise<void> {
    if (this._isDestroyed) {
      return;
    }

    this._isDestroyed = true;

    try {
      await this.unloadAll();
      this._instances.clear();
      this._containerToInstance.clear();

      console.log('PDFViewerManager destroyed successfully');
    } catch (error) {
      console.error('Error destroying PDFViewerManager:', error);
      throw error;
    }
  }

  /**
   * Cleans up a destroyed instance.
   *
   * Removes the instance from the instances map and its container mapping.
   *
   * @param instanceId - The unique identifier of the destroyed instance.
   */
  private _cleanupInstance(instanceId: string): void {
    const instance = this._instances.get(instanceId);
    if (instance) {
      // Remove from container mapping
      this._containerToInstance.delete(instance.containerId);

      // Remove from instances map
      this._instances.delete(instanceId);

      console.log(`Instance ${instanceId} cleaned up from manager`);
    }
  }

  /**
   * Handles memory pressure by cleaning up all instances.
   *
   * Iterates through all active instances and calls their memory pressure handlers.
   */
  handleMemoryPressure(): void {
    console.log('Handling memory pressure in PDFViewerManager');

    this.getAllInstances().forEach((instance) => {
      try {
        instance.canvasPool.handleMemoryPressure();
      } catch (error) {
        console.error(`Error handling memory pressure for instance ${instance.instanceId}:`, error);
      }
    });
  }

  /**
   * Sets up periodic cleanup to prevent memory leaks.
   *
   * Runs a cleanup task every minute to ensure periodic resource cleanup.
   */
  setupPeriodicCleanup(): void {
    // Clean up every minute
    setInterval(() => {
      if (!this._isDestroyed) {
        this.getAllInstances().forEach((instance) => {
          try {
            instance.canvasPool.setupPeriodicCleanup();
          } catch (error) {
            console.error(`Error setting up cleanup for instance ${instance.instanceId}:`, error);
          }
        });
      }
    }, 60000);
  }
}
