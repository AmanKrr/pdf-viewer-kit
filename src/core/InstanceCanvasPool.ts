/*
  Copyright 2025 Aman Kumar
  Licensed under the Apache License, Version 2.0
*/

/**
 * Represents a pooled canvas with its context and metadata
 */
interface PooledCanvas {
  canvas: HTMLCanvasElement;
  context: CanvasRenderingContext2D;
  inUse: boolean;
  width: number; // Physical pixel width (bucketed)
  height: number; // Physical pixel height (bucketed)
  lastUsed: number; // Timestamp for LRU cleanup
  instanceId: string; // Instance isolation tracking
}

/**
 * Instance-isolated canvas pool with all the performance optimizations
 * from the original implementation. Each PDF instance gets its own pool.
 */
export class InstanceCanvasPool {
  private readonly _instanceId: string;
  private readonly _pool: PooledCanvas[] = [];
  private _maxPoolSize: number;
  private _isDestroyed = false;
  private _memoryPressureInterval: NodeJS.Timeout | null = null;

  constructor(instanceId: string, maxPoolSize: number = 10) {
    this._instanceId = instanceId;
    this._maxPoolSize = maxPoolSize;

    // Set up instance-specific memory pressure handling
    this._setupInstanceMemoryPressureHandling();
  }

  /**
   * Gets the instance ID this pool belongs to
   */
  get instanceId(): string {
    return this._instanceId;
  }

  set maxPoolSize(poolSize: number) {
    this._maxPoolSize = poolSize;
  }

  /**
   * Rounds up dimension to the nearest power of 2 for bucketing.
   * This improves canvas reuse rates by standardizing sizes.
   */
  private _getBucketSize(size: number): number {
    // Minimum bucket size to avoid tiny canvases
    if (size <= 64) return 64;
    return Math.pow(2, Math.ceil(Math.log2(size)));
  }

  /**
   * Resets canvas context to a clean, predictable state.
   * This ensures consistent rendering between canvas reuses.
   */
  private _resetContextState(context: CanvasRenderingContext2D, ratio: number): void {
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

    // 🔥 CRITICAL: Reapply device pixel ratio scaling
    context.scale(ratio, ratio);
  }

  /**
   * Acquires a canvas from the pool with full optimization
   */
  getCanvas(cssWidth: number, cssHeight: number): [HTMLCanvasElement, CanvasRenderingContext2D] {
    if (this._isDestroyed) {
      throw new Error(`Cannot get canvas from destroyed pool for instance ${this._instanceId}`);
    }

    const ratio = window.devicePixelRatio || 1;
    const requiredWidth = Math.ceil(cssWidth * ratio);
    const requiredHeight = Math.ceil(cssHeight * ratio);

    // Use bucketed dimensions for better reuse
    const bucketedWidth = this._getBucketSize(requiredWidth);
    const bucketedHeight = this._getBucketSize(requiredHeight);

    // Look for an available canvas that's large enough
    for (const pooledItem of this._pool) {
      if (!pooledItem.inUse && pooledItem.width >= bucketedWidth && pooledItem.height >= bucketedHeight && pooledItem.instanceId === this._instanceId) {
        pooledItem.inUse = true;
        pooledItem.lastUsed = Date.now();

        // Set the canvas to the exact required size for rendering
        pooledItem.canvas.width = requiredWidth;
        pooledItem.canvas.height = requiredHeight;
        pooledItem.canvas.style.width = `${cssWidth}px`;
        pooledItem.canvas.style.height = `${cssHeight}px`;

        // Enhanced context state reset
        this._resetContextState(pooledItem.context, ratio);
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
    this._resetContextState(context, ratio);

    if (this._pool.length < this._maxPoolSize) {
      // Store with bucketed dimensions for future matching
      this._pool.push({
        canvas,
        context,
        inUse: true,
        width: bucketedWidth,
        height: bucketedHeight,
        lastUsed: Date.now(),
        instanceId: this._instanceId, // ✅ Tag with instance ID
      });
    }

    return [canvas, context];
  }

  /**
   * Releases a canvas back to the pool
   */
  releaseCanvas(canvas: HTMLCanvasElement): void {
    if (this._isDestroyed) {
      return;
    }

    const pooledItem = this._pool.find(
      (item) => item.canvas === canvas && item.instanceId === this._instanceId, // ✅ Instance isolation check
    );

    if (pooledItem) {
      pooledItem.inUse = false;
      pooledItem.lastUsed = Date.now();
      // Clear the canvas to free up memory and prevent stale content
      pooledItem.context.setTransform(1, 0, 0, 1, 0, 0); // Reset transform before clearing
      pooledItem.context.clearRect(0, 0, pooledItem.canvas.width, pooledItem.canvas.height);
    }
    // If canvas was not from pool (e.g., pool was full), it will be garbage collected
  }

  /**
   * Shrinks the pool by removing unused canvases
   * Uses LRU (Least Recently Used) strategy for removal.
   */
  shrinkPool(targetSize: number = Math.floor(this._maxPoolSize / 2)): void {
    if (this._isDestroyed || targetSize >= this._pool.length) {
      return;
    }

    // Get unused canvases from this instance sorted by last used time (oldest first)
    const unusedCanvases = this._pool.filter((item) => !item.inUse && item.instanceId === this._instanceId).sort((a, b) => a.lastUsed - b.lastUsed);

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
   * Automatically shrinks pool when memory pressure is detected
   */
  handleMemoryPressure(): void {
    if (this._isDestroyed) {
      return;
    }

    const instanceCanvases = this._pool.filter((item) => item.instanceId === this._instanceId);
    const unusedCount = instanceCanvases.filter((item) => !item.inUse).length;

    if (unusedCount > 3) {
      // Aggressive shrinking under memory pressure for this instance
      const targetSize = Math.max(2, Math.floor(this._maxPoolSize * 0.3));
      this.shrinkPool(targetSize);
    }

    // Also immediately clean unused canvases from this instance
    instanceCanvases.forEach((pooledCanvas) => {
      if (!pooledCanvas.inUse && pooledCanvas.canvas) {
        pooledCanvas.canvas.width = 0;
        pooledCanvas.canvas.height = 0;
      }
    });
  }

  /**
   * Sets up automatic memory pressure detection
   */
  private _setupInstanceMemoryPressureHandling(): void {
    // Modern browsers support memory pressure API
    if ('memory' in performance && 'onmemorywarning' in window) {
      const memoryWarningHandler = () => {
        if (!this._isDestroyed) {
          this.handleMemoryPressure();
        }
      };
      window.addEventListener('memorywarning', memoryWarningHandler);

      // Store handler for cleanup
      (this as any)._memoryWarningHandler = memoryWarningHandler;
    }

    // Fallback: periodic cleanup based on pool size for this instance
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
   * Instance-specific periodic cleanup setup
   */
  setupPeriodicCleanup(): void {
    if (this._isDestroyed) {
      return;
    }

    // Clean up old unused canvases from this instance every 30 seconds
    const cleanupInterval = setInterval(() => {
      if (!this._isDestroyed) {
        this._cleanupOldCanvases();
      } else {
        clearInterval(cleanupInterval);
      }
    }, 30000);
  }

  /**
   * Returns pool statistics
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
    const estimatedMemoryMB = (totalPixels * 4) / (1024 * 1024); // 4 bytes per pixel (RGBA)

    return {
      totalCanvases: instanceCanvases.length,
      inUseCanvases: inUse,
      availableCanvases: instanceCanvases.length - inUse,
      memoryUsage: `~${estimatedMemoryMB.toFixed(1)} MB`,
      instanceId: this._instanceId,
    };
  }

  /**
   * Cleans up old unused canvases
   */
  private _cleanupOldCanvases(): void {
    const now = Date.now();
    const maxAge = 60000; // 1 minute

    // Clean up old canvases from this instance only
    for (let i = this._pool.length - 1; i >= 0; i--) {
      const pooledCanvas = this._pool[i];
      if (pooledCanvas.instanceId === this._instanceId && !pooledCanvas.inUse && now - pooledCanvas.lastUsed > maxAge) {
        // Remove old unused canvas
        pooledCanvas.canvas.width = 0;
        pooledCanvas.canvas.height = 0;
        (pooledCanvas.canvas as any) = null;
        (pooledCanvas.context as any) = null;
        this._pool.splice(i, 1);
      }
    }
  }

  /**
   * cleanup with readonly array handling
   */
  destroy(): void {
    if (this._isDestroyed) {
      return;
    }

    this._isDestroyed = true;

    // Clean up memory pressure interval
    if (this._memoryPressureInterval) {
      clearInterval(this._memoryPressureInterval);
      this._memoryPressureInterval = null;
    }

    // Clean up memory warning handler
    if ((this as any)._memoryWarningHandler) {
      window.removeEventListener('memorywarning', (this as any)._memoryWarningHandler);
    }

    // ✅ FIXED: Clean up all canvases from this instance using splice
    for (let i = this._pool.length - 1; i >= 0; i--) {
      const pooledItem = this._pool[i];
      if (pooledItem.instanceId === this._instanceId) {
        // Clean up the canvas
        pooledItem.canvas.width = 0;
        pooledItem.canvas.height = 0;
        (pooledItem.canvas as any) = null;
        (pooledItem.context as any) = null;

        // Remove from pool array
        this._pool.splice(i, 1);
      }
    }
  }
}
