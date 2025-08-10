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

interface PooledCanvas {
  canvas: HTMLCanvasElement;
  context: CanvasRenderingContext2D;
  inUse: boolean;
  width: number; // Physical pixel width (bucketed)
  height: number; // Physical pixel height (bucketed)
  lastUsed: number; // Timestamp for LRU cleanup
}

/**
 * Manages a pool of reusable HTMLCanvasElement objects to reduce
 * the overhead of creating and destroying canvases frequently.
 * Uses size bucketing to improve canvas reuse rates.
 */
class CanvasPool {
  private _pool: PooledCanvas[] = [];
  private _maxPoolSize: number;

  constructor(maxPoolSize: number = 10) {
    this._maxPoolSize = maxPoolSize;
  }

  /**
   * Rounds up dimension to the nearest power of 2 for bucketing.
   * This improves canvas reuse rates by standardizing sizes.
   * @param {number} size - The dimension to bucket
   * @returns {number} The bucketed size (power of 2)
   */
  private getBucketSize(size: number): number {
    // Minimum bucket size to avoid tiny canvases
    if (size <= 64) return 64;
    return Math.pow(2, Math.ceil(Math.log2(size)));
  }

  /**
   * Resets canvas context to a clean, predictable state.
   * This ensures consistent rendering between canvas reuses.
   * @param {CanvasRenderingContext2D} context - The context to reset
   * @param {number} ratio - Device pixel ratio for scaling
   */
  private resetContextState(context: CanvasRenderingContext2D, ratio: number): void {
    // Reset transformation matrix
    context.setTransform(1, 0, 0, 1, 0, 0);

    // Reset drawing state properties
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

    // Clear any existing paths
    context.beginPath();

    // Reapply device pixel ratio scaling
    context.scale(ratio, ratio);
  }

  /**
   * Acquires a canvas from the pool or creates a new one if none are suitable.
   * @param {number} cssWidth - Desired CSS width of the canvas.
   * @param {number} cssHeight - Desired CSS height of the canvas.
   * @returns {[HTMLCanvasElement, CanvasRenderingContext2D]} The canvas and its 2D rendering context.
   */
  getCanvas(cssWidth: number, cssHeight: number): [HTMLCanvasElement, CanvasRenderingContext2D] {
    const ratio = window.devicePixelRatio || 1;
    const requiredWidth = Math.ceil(cssWidth * ratio);
    const requiredHeight = Math.ceil(cssHeight * ratio);

    // Use bucketed dimensions for better reuse
    const bucketedWidth = this.getBucketSize(requiredWidth);
    const bucketedHeight = this.getBucketSize(requiredHeight);

    // Look for an available canvas that's large enough
    for (const pooledItem of this._pool) {
      if (!pooledItem.inUse && pooledItem.width >= bucketedWidth && pooledItem.height >= bucketedHeight) {
        pooledItem.inUse = true;
        pooledItem.lastUsed = Date.now();

        // Set the canvas to the exact required size for rendering
        pooledItem.canvas.width = requiredWidth;
        pooledItem.canvas.height = requiredHeight;
        pooledItem.canvas.style.width = `${cssWidth}px`;
        pooledItem.canvas.style.height = `${cssHeight}px`;

        // Enhanced context state reset
        this.resetContextState(pooledItem.context, ratio);
        return [pooledItem.canvas, pooledItem.context];
      }
    }

    // No suitable canvas found, create a new one with bucketed dimensions
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d')!;

    // Create canvas with bucketed dimensions but set actual required size
    canvas.width = requiredWidth;
    canvas.height = requiredHeight;
    canvas.style.width = `${cssWidth}px`;
    canvas.style.height = `${cssHeight}px`;

    // Apply initial context state
    this.resetContextState(context, ratio);

    if (this._pool.length < this._maxPoolSize) {
      // Store with bucketed dimensions for future matching
      this._pool.push({
        canvas,
        context,
        inUse: true,
        width: bucketedWidth,
        height: bucketedHeight,
        lastUsed: Date.now(),
      });
    }

    return [canvas, context];
  }

  /**
   * Releases a canvas back to the pool.
   * @param {HTMLCanvasElement} canvas - The canvas to release.
   */
  releaseCanvas(canvas: HTMLCanvasElement): void {
    const pooledItem = this._pool.find((item) => item.canvas === canvas);
    if (pooledItem) {
      pooledItem.inUse = false;
      // Clear the canvas to free up memory and prevent stale content
      pooledItem.context.setTransform(1, 0, 0, 1, 0, 0); // Reset transform before clearing
      pooledItem.context.clearRect(0, 0, pooledItem.canvas.width, pooledItem.canvas.height);
    }
    // If canvas was not from pool (e.g., pool was full), it will be garbage collected
  }

  /**
   * Shrinks the pool by removing unused canvases to free memory.
   * Uses LRU (Least Recently Used) strategy for removal.
   * @param {number} targetSize - Target pool size after shrinking
   */
  shrinkPool(targetSize: number = Math.floor(this._maxPoolSize / 2)): void {
    if (targetSize >= this._pool.length) return;

    // Get unused canvases sorted by last used time (oldest first)
    const unusedCanvases = this._pool.filter((item) => !item.inUse).sort((a, b) => a.lastUsed - b.lastUsed);

    const canvasesToRemove = Math.max(0, this._pool.length - targetSize);
    const toRemove = unusedCanvases.slice(0, Math.min(canvasesToRemove, unusedCanvases.length));

    // Remove selected canvases from pool
    toRemove.forEach((item) => {
      const index = this._pool.indexOf(item);
      if (index !== -1) {
        // Help GC by nullifying references
        (item.canvas as any) = null;
        (item.context as any) = null;
        this._pool.splice(index, 1);
      }
    });
  }

  /**
   * Automatically shrinks pool when memory pressure is detected.
   * Call this method periodically or when memory usage is high.
   */
  handleMemoryPressure(): void {
    const unusedCount = this._pool.filter((item) => !item.inUse).length;

    if (unusedCount > 3) {
      // Aggressive shrinking under memory pressure
      const targetSize = Math.max(2, Math.floor(this._maxPoolSize * 0.3));
      this.shrinkPool(targetSize);
    }
  }

  /**
   * Sets up automatic memory pressure detection (if supported by browser).
   * Call this once during initialization.
   */
  setupMemoryPressureHandling(): void {
    // Modern browsers support memory pressure API
    if ('memory' in performance && 'onmemorywarning' in window) {
      window.addEventListener('memorywarning', () => {
        this.handleMemoryPressure();
      });
    }

    // Fallback: periodic cleanup based on pool size
    setInterval(() => {
      const unusedCount = this._pool.filter((item) => !item.inUse).length;
      if (unusedCount > this._maxPoolSize * 0.7) {
        this.shrinkPool();
      }
    }, 30000);
  }

  /**
   * Clears the entire pool and removes all canvases.
   * Should be called when the PDF viewer is destroyed.
   */
  destroy(): void {
    this._pool.forEach((pooledItem) => {
      // Explicitly nullify to help GC
      (pooledItem.canvas as any) = null;
      (pooledItem.context as any) = null;
    });
    this._pool = [];
  }

  /**
   * Returns pool statistics for performance monitoring.
   */
  getPoolStats(): {
    totalCanvases: number;
    inUseCanvases: number;
    availableCanvases: number;
    memoryUsage: string;
  } {
    const inUse = this._pool.filter((item) => item.inUse).length;
    const totalPixels = this._pool.reduce((sum, item) => sum + item.width * item.height, 0);
    const estimatedMemoryMB = (totalPixels * 4) / (1024 * 1024); // 4 bytes per pixel (RGBA)

    return {
      totalCanvases: this._pool.length,
      inUseCanvases: inUse,
      availableCanvases: this._pool.length - inUse,
      memoryUsage: `~${estimatedMemoryMB.toFixed(1)} MB`,
    };
  }
}

export default CanvasPool;
