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
 * Represents a pooled canvas with its context and metadata
 */
interface PooledCanvas {
  canvas: HTMLCanvasElement;
  context: CanvasRenderingContext2D;
  inUse: boolean;
  width: number;
  height: number;
  lastUsed: number;
  instanceId: string;
}

/**
 * Canvas pool that is completely isolated to a single PDF instance.
 * Each instance has its own pool of canvases, preventing resource conflicts.
 */
export class InstanceCanvasPool {
  private readonly _instanceId: string;
  private readonly _pool: PooledCanvas[] = [];
  private readonly _maxPoolSize: number;
  private _isDestroyed = false;

  constructor(instanceId: string, maxPoolSize: number = 10) {
    this._instanceId = instanceId;
    this._maxPoolSize = maxPoolSize;
  }

  /**
   * Gets the instance ID this pool belongs to
   */
  get instanceId(): string {
    return this._instanceId;
  }

  /**
   * Gets a canvas from the pool or creates a new one
   */
  getCanvas(cssWidth: number, cssHeight: number): [HTMLCanvasElement, CanvasRenderingContext2D] {
    if (this._isDestroyed) {
      throw new Error(`Cannot get canvas from destroyed pool for instance ${this._instanceId}`);
    }

    // Try to find an available canvas of the right size
    const availableCanvas = this._findAvailableCanvas(cssWidth, cssHeight);
    if (availableCanvas) {
      availableCanvas.inUse = true;
      availableCanvas.lastUsed = Date.now();
      this._resetContextState(availableCanvas.context, cssWidth, cssHeight);
      return [availableCanvas.canvas, availableCanvas.context];
    }

    // Create a new canvas if pool isn't full
    if (this._pool.length < this._maxPoolSize) {
      const newCanvas = this._createNewCanvas(cssWidth, cssHeight);
      this._pool.push(newCanvas);
      return [newCanvas.canvas, newCanvas.context];
    }

    // Reuse the least recently used canvas
    const lruCanvas = this._findLRUCanvas();
    if (lruCanvas) {
      lruCanvas.inUse = true;
      lruCanvas.lastUsed = Date.now();
      lruCanvas.width = cssWidth;
      lruCanvas.height = cssHeight;
      lruCanvas.canvas.width = cssWidth;
      lruCanvas.canvas.height = cssHeight;
      this._resetContextState(lruCanvas.context, cssWidth, cssHeight);
      return [lruCanvas.canvas, lruCanvas.context];
    }

    // Fallback: create a new canvas anyway
    const fallbackCanvas = this._createNewCanvas(cssWidth, cssHeight);
    this._pool.push(fallbackCanvas);
    return [fallbackCanvas.canvas, fallbackCanvas.context];
  }

  /**
   * Returns a canvas to the pool
   */
  releaseCanvas(canvas: HTMLCanvasElement): void {
    if (this._isDestroyed) {
      return;
    }

    const pooledCanvas = this._pool.find((pc) => pc.canvas === canvas);
    if (pooledCanvas) {
      pooledCanvas.inUse = false;
      pooledCanvas.lastUsed = Date.now();
    }
  }

  /**
   * Shrinks the pool to free memory
   */
  shrinkPool(targetSize: number = Math.floor(this._maxPoolSize / 2)): void {
    if (this._isDestroyed) {
      return;
    }

    // Sort by last used time (oldest first)
    this._pool.sort((a, b) => a.lastUsed - b.lastUsed);

    // Remove unused canvases beyond target size
    while (this._pool.length > targetSize) {
      const canvas = this._pool.shift();
      if (canvas && !canvas.inUse) {
        // Clean up canvas
        canvas.canvas.width = 0;
        canvas.canvas.height = 0;
      }
    }
  }

  /**
   * Handles memory pressure by aggressively cleaning up
   */
  handleMemoryPressure(): void {
    if (this._isDestroyed) {
      return;
    }

    // Release all unused canvases
    this._pool.forEach((pooledCanvas) => {
      if (!pooledCanvas.inUse) {
        pooledCanvas.canvas.width = 0;
        pooledCanvas.canvas.height = 0;
      }
    });

    // Shrink pool aggressively
    this.shrinkPool(Math.floor(this._maxPoolSize / 4));
  }

  /**
   * Sets up periodic cleanup to prevent memory leaks
   */
  setupPeriodicCleanup(): void {
    if (this._isDestroyed) {
      return;
    }

    // Clean up every 30 seconds
    setInterval(() => {
      if (!this._isDestroyed) {
        this._cleanupOldCanvases();
      }
    }, 30000);
  }

  /**
   * Gets pool statistics
   */
  getPoolStats(): {
    totalCanvases: number;
    inUseCanvases: number;
    availableCanvases: number;
    memoryUsage: string;
    instanceId: string;
  } {
    const totalCanvases = this._pool.length;
    const inUseCanvases = this._pool.filter((pc) => pc.inUse).length;
    const availableCanvases = totalCanvases - inUseCanvases;

    // Estimate memory usage
    const totalPixels = this._pool.reduce((sum, pc) => sum + pc.width * pc.height, 0);
    const memoryBytes = totalPixels * 4; // 4 bytes per pixel (RGBA)
    const memoryMB = (memoryBytes / (1024 * 1024)).toFixed(2);

    return {
      totalCanvases,
      inUseCanvases,
      availableCanvases,
      memoryUsage: `${memoryMB} MB`,
      instanceId: this._instanceId,
    };
  }

  /**
   * Destroys this canvas pool and cleans up all resources
   */
  destroy(): void {
    if (this._isDestroyed) {
      return;
    }

    this._isDestroyed = true;

    // Clean up all canvases
    this._pool.forEach((pooledCanvas) => {
      pooledCanvas.canvas.width = 0;
      pooledCanvas.canvas.height = 0;
    });

    this._pool.length = 0;
  }

  /**
   * Finds an available canvas of the right size
   */
  private _findAvailableCanvas(width: number, height: number): PooledCanvas | null {
    return this._pool.find((pc) => !pc.inUse && pc.width === width && pc.height === height) || null;
  }

  /**
   * Finds the least recently used canvas
   */
  private _findLRUCanvas(): PooledCanvas | null {
    if (this._pool.length === 0) return null;

    return this._pool.reduce((lru, current) => (current.lastUsed < lru.lastUsed ? current : lru));
  }

  /**
   * Creates a new canvas for the pool
   */
  private _createNewCanvas(width: number, height: number): PooledCanvas {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d')!;

    canvas.width = width;
    canvas.height = height;

    return {
      canvas,
      context,
      inUse: true,
      width,
      height,
      lastUsed: Date.now(),
      instanceId: this._instanceId,
    };
  }

  /**
   * Resets the canvas context state
   */
  private _resetContextState(context: CanvasRenderingContext2D, width: number, height: number): void {
    context.setTransform(1, 0, 0, 1, 0, 0);
    context.clearRect(0, 0, width, height);
    context.fillStyle = '#000000';
    context.strokeStyle = '#000000';
    context.lineWidth = 1;
    context.lineCap = 'butt';
    context.lineJoin = 'miter';
    context.miterLimit = 10;
    context.font = '10px sans-serif';
    context.textAlign = 'start';
    context.textBaseline = 'alphabetic';
  }

  /**
   * Cleans up old unused canvases
   */
  private _cleanupOldCanvases(): void {
    const now = Date.now();
    const maxAge = 60000; // 1 minute

    this._pool.forEach((pooledCanvas, index) => {
      if (!pooledCanvas.inUse && now - pooledCanvas.lastUsed > maxAge) {
        // Remove old unused canvas
        pooledCanvas.canvas.width = 0;
        pooledCanvas.canvas.height = 0;
        this._pool.splice(index, 1);
      }
    });
  }
}
