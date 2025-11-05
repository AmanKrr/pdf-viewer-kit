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
 * Represents a pooled canvas with its context and metadata.
 *
 * Each pooled canvas maintains state information for efficient
 * reuse and memory management.
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
 * Instance-isolated canvas pool with performance optimizations.
 *
 * Each PDF instance gets its own pool to ensure complete isolation.
 * Implements intelligent canvas reuse, memory management, and
 * device pixel ratio handling for optimal rendering performance.
 */
export class InstanceCanvasPool {
  private readonly _instanceId: string;
  private readonly _pool: PooledCanvas[] = [];
  private _maxPoolSize: number;
  private _isDestroyed = false;
  private _memoryPressureInterval: NodeJS.Timeout | null = null;

  /**
   * Creates a new canvas pool for a specific PDF instance.
   *
   * @param instanceId - Unique identifier for the PDF instance
   * @param maxPoolSize - Maximum number of canvases to keep in the pool
   */
  constructor(instanceId: string, maxPoolSize: number = 10) {
    this._instanceId = instanceId;
    this._maxPoolSize = maxPoolSize;

    this._setupInstanceMemoryPressureHandling();
  }

  /**
   * Gets the instance ID this pool belongs to.
   *
   * @returns The unique identifier of the PDF instance
   */
  get instanceId(): string {
    return this._instanceId;
  }

  /**
   * Sets the maximum pool size for memory management.
   *
   * @param poolSize - New maximum number of canvases in the pool
   */
  set maxPoolSize(poolSize: number) {
    this._maxPoolSize = poolSize;
  }

  /**
   * Rounds up dimension to the nearest power of 2 for bucketing.
   *
   * This improves canvas reuse rates by standardizing sizes and
   * reducing the number of unique canvas dimensions in the pool.
   *
   * @param size - The dimension to bucket
   * @returns The bucketed size (power of 2)
   */
  private _getBucketSize(size: number): number {
    if (size <= 64) return 64;
    return Math.pow(2, Math.ceil(Math.log2(size)));
  }

  /**
   * Resets canvas context to a clean, predictable state.
   *
   * This ensures consistent rendering between canvas reuses by
   * clearing all drawing state and reapplying device pixel ratio scaling.
   *
   * @param context - The canvas context to reset
   * @param ratio - The device pixel ratio to apply
   */
  private _resetContextState(context: CanvasRenderingContext2D, ratio: number): void {
    context.setTransform(1, 0, 0, 1, 0, 0);

    context.globalAlpha = 1.0;
    context.globalCompositeOperation = 'source-over';
    context.fillStyle = '#000000';
    context.strokeStyle = '#000000';
    context.lineWidth = 1;
    context.lineCap = 'butt';
    context.lineJoin = 'miter';
    context.miterLimit = 10;
    context.shadowColor = 'rgba(0, 0, 0, 0)';
    context.shadowBlur = 0;
    context.shadowOffsetX = 0;
    context.shadowOffsetY = 0;
    context.font = '10px sans-serif';
    context.textAlign = 'start';
    context.textBaseline = 'alphabetic';

    context.beginPath();

    context.scale(ratio, ratio);
  }

  /**
   * Acquires a canvas from the pool with full optimization.
   *
   * Searches for an available canvas of appropriate size, or creates
   * a new one if none is available. Implements intelligent sizing
   * and device pixel ratio handling.
   *
   * @param cssWidth - CSS width in pixels
   * @param cssHeight - CSS height in pixels
   * @returns Tuple of [canvas, context] ready for use
   * @throws Error if the pool has been destroyed
   */
  getCanvas(cssWidth: number, cssHeight: number): [HTMLCanvasElement, CanvasRenderingContext2D] {
    if (this._isDestroyed) {
      throw new Error(`Cannot get canvas from destroyed pool for instance ${this._instanceId}`);
    }

    const ratio = window.devicePixelRatio || 1;
    const requiredWidth = Math.ceil(cssWidth * ratio);
    const requiredHeight = Math.ceil(cssHeight * ratio);

    const bucketedWidth = this._getBucketSize(requiredWidth);
    const bucketedHeight = this._getBucketSize(requiredHeight);

    for (const pooledItem of this._pool) {
      if (!pooledItem.inUse && pooledItem.width >= bucketedWidth && pooledItem.height >= bucketedHeight && pooledItem.instanceId === this._instanceId) {
        pooledItem.inUse = true;
        pooledItem.lastUsed = Date.now();

        pooledItem.canvas.width = requiredWidth;
        pooledItem.canvas.height = requiredHeight;
        pooledItem.canvas.style.width = `${cssWidth}px`;
        pooledItem.canvas.style.height = `${cssHeight}px`;

        this._resetContextState(pooledItem.context, ratio);
        return [pooledItem.canvas, pooledItem.context];
      }
    }

    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d')!;

    canvas.width = requiredWidth;
    canvas.height = requiredHeight;
    canvas.style.width = `${cssWidth}px`;
    canvas.style.height = `${cssHeight}px`;

    this._resetContextState(context, ratio);

    if (this._pool.length < this._maxPoolSize) {
      this._pool.push({
        canvas,
        context,
        inUse: true,
        width: bucketedWidth,
        height: bucketedHeight,
        lastUsed: Date.now(),
        instanceId: this._instanceId,
      });
    }

    return [canvas, context];
  }

  /**
   * Releases a canvas back to the pool for reuse.
   *
   * Marks the canvas as available and clears its content to prevent
   * stale data from appearing in subsequent uses.
   *
   * @param canvas - The canvas element to release
   */
  releaseCanvas(canvas: HTMLCanvasElement): void {
    if (this._isDestroyed) {
      return;
    }

    const pooledItem = this._pool.find((item) => item.canvas === canvas && item.instanceId === this._instanceId);

    if (pooledItem) {
      pooledItem.inUse = false;
      pooledItem.lastUsed = Date.now();
      pooledItem.context.setTransform(1, 0, 0, 1, 0, 0);
      pooledItem.context.clearRect(0, 0, pooledItem.canvas.width, pooledItem.canvas.height);
    }
  }

  /**
   * Shrinks the pool by removing unused canvases.
   *
   * Uses LRU (Least Recently Used) strategy for removal to ensure
   * the most recently used canvases are kept in the pool.
   *
   * @param targetSize - Target size for the pool (defaults to half the max size)
   */
  shrinkPool(targetSize: number = Math.floor(this._maxPoolSize / 2)): void {
    if (this._isDestroyed || targetSize >= this._pool.length) {
      return;
    }

    const unusedCanvases = this._pool.filter((item) => !item.inUse && item.instanceId === this._instanceId).sort((a, b) => a.lastUsed - b.lastUsed);

    const canvasesToRemove = Math.max(0, this._pool.length - targetSize);
    const toRemove = unusedCanvases.slice(0, Math.min(canvasesToRemove, unusedCanvases.length));

    toRemove.forEach((item) => {
      const index = this._pool.indexOf(item);
      if (index !== -1) {
        (item.canvas as any) = null;
        (item.context as any) = null;
        this._pool.splice(index, 1);
      }
    });
  }

  /**
   * Automatically shrinks pool when memory pressure is detected.
   *
   * Implements aggressive cleanup strategies to free memory
   * when the system is under pressure.
   */
  handleMemoryPressure(): void {
    if (this._isDestroyed) {
      return;
    }

    const instanceCanvases = this._pool.filter((item) => item.instanceId === this._instanceId);
    const unusedCount = instanceCanvases.filter((item) => !item.inUse).length;

    if (unusedCount > 3) {
      const targetSize = Math.max(2, Math.floor(this._maxPoolSize * 0.3));
      this.shrinkPool(targetSize);
    }

    instanceCanvases.forEach((pooledCanvas) => {
      if (!pooledCanvas.inUse && pooledCanvas.canvas) {
        pooledCanvas.canvas.width = 0;
        pooledCanvas.canvas.height = 0;
      }
    });
  }

  /**
   * Sets up automatic memory pressure detection.
   *
   * Configures both modern browser memory pressure APIs and
   * fallback periodic cleanup mechanisms.
   */
  private _setupInstanceMemoryPressureHandling(): void {
    if ('memory' in performance && 'onmemorywarning' in window) {
      const memoryWarningHandler = () => {
        if (!this._isDestroyed) {
          this.handleMemoryPressure();
        }
      };
      window.addEventListener('memorywarning', memoryWarningHandler);

      (this as any)._memoryWarningHandler = memoryWarningHandler;
    }

    this._memoryPressureInterval = setInterval(() => {
      if (this._isDestroyed) {
        return;
      }

      const instanceCanvases = this._pool.filter((item) => item.instanceId === this._instanceId);
      const unusedCount = instanceCanvases.filter((item) => !item.inUse).length;

      if (unusedCount > this._maxPoolSize * 0.7) {
        this.shrinkPool();
      }
    }, 30000);
  }

  /**
   * Sets up instance-specific periodic cleanup.
   *
   * Runs cleanup every 30 seconds to remove old unused canvases
   * and prevent memory leaks.
   */
  setupPeriodicCleanup(): void {
    if (this._isDestroyed) {
      return;
    }

    const cleanupInterval = setInterval(() => {
      if (!this._isDestroyed) {
        this._cleanupOldCanvases();
      } else {
        clearInterval(cleanupInterval);
      }
    }, 30000);
  }

  /**
   * Returns comprehensive pool statistics.
   *
   * Provides detailed information about canvas usage, memory consumption,
   * and pool status for monitoring and debugging purposes.
   *
   * @returns Object containing pool statistics
   */
  getPoolStats(): {
    totalCanvases: number;
    inUseCanvases: number;
    availableCanvases: number;
    memoryUsage: string;
    instanceId: string;
  } {
    const instanceCanvases = this._pool.filter((item) => item.instanceId === this._instanceId);
    const inUse = instanceCanvases.filter((item) => item.inUse).length;
    const totalPixels = instanceCanvases.reduce((sum, item) => sum + item.width * item.height, 0);
    const estimatedMemoryMB = (totalPixels * 4) / (1024 * 1024);

    return {
      totalCanvases: instanceCanvases.length,
      inUseCanvases: inUse,
      availableCanvases: instanceCanvases.length - inUse,
      memoryUsage: `~${estimatedMemoryMB.toFixed(1)} MB`,
      instanceId: this._instanceId,
    };
  }

  /**
   * Cleans up old unused canvases.
   *
   * Removes canvases that haven't been used for more than 1 minute
   * to prevent memory accumulation from stale resources.
   */
  private _cleanupOldCanvases(): void {
    const now = Date.now();
    const maxAge = 60000;

    for (let i = this._pool.length - 1; i >= 0; i--) {
      const pooledCanvas = this._pool[i];
      if (pooledCanvas.instanceId === this._instanceId && !pooledCanvas.inUse && now - pooledCanvas.lastUsed > maxAge) {
        pooledCanvas.canvas.width = 0;
        pooledCanvas.canvas.height = 0;
        (pooledCanvas.canvas as any) = null;
        (pooledCanvas.context as any) = null;
        this._pool.splice(i, 1);
      }
    }
  }

  /**
   * Destroys the canvas pool and cleans up all resources.
   *
   * Performs complete cleanup including:
   * - Stopping all intervals and event listeners
   * - Clearing all canvas references
   * - Removing all pooled items
   * - Marking the pool as destroyed
   */
  destroy(): void {
    if (this._isDestroyed) {
      return;
    }

    this._isDestroyed = true;

    if (this._memoryPressureInterval) {
      clearInterval(this._memoryPressureInterval);
      this._memoryPressureInterval = null;
    }

    if ((this as any)._memoryWarningHandler) {
      window.removeEventListener('memorywarning', (this as any)._memoryWarningHandler);
    }

    for (let i = this._pool.length - 1; i >= 0; i--) {
      const pooledItem = this._pool[i];
      if (pooledItem.instanceId === this._instanceId) {
        pooledItem.canvas.width = 0;
        pooledItem.canvas.height = 0;
        (pooledItem.canvas as any) = null;
        (pooledItem.context as any) = null;

        this._pool.splice(i, 1);
      }
    }
  }
}
