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
 * Represents a pooled image bitmap with metadata
 */
interface PooledImageBitmap {
  bitmap: ImageBitmap;
  width: number;
  height: number;
  inUse: boolean;
  lastUsed: number;
  createdAt: number;
  instanceId: string;
}

/**
 * Image bitmap pool that is completely isolated to a single PDF instance.
 * Each instance has its own pool of image bitmaps, preventing resource conflicts.
 */
export class InstanceImageBitmapPool {
  private readonly _instanceId: string;
  private readonly _pool: PooledImageBitmap[] = [];
  private readonly _maxPoolSize: number;
  private readonly _maxBitmapAge: number = 30000; // 30 seconds max age
  private readonly _sizeBucketThreshold: number = 128; // Pixels threshold for size bucketing
  private _isDestroyed = false;

  constructor(instanceId: string, maxPoolSize: number = 8) {
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
   * Gets an image bitmap from the pool or creates a new one
   */
  async getImageBitmap(canvas: HTMLCanvasElement, targetWidth?: number, targetHeight?: number): Promise<ImageBitmap> {
    if (this._isDestroyed) {
      throw new Error(`Cannot get image bitmap from destroyed pool for instance ${this._instanceId}`);
    }

    const width = targetWidth || canvas.width;
    const height = targetHeight || canvas.height;

    // Try to find an available bitmap of the right size
    const availableBitmap = this._findAvailableBitmap(width, height);
    if (availableBitmap) {
      availableBitmap.inUse = true;
      availableBitmap.lastUsed = Date.now();
      return availableBitmap.bitmap;
    }

    // Create a new bitmap if pool isn't full
    if (this._pool.length < this._maxPoolSize) {
      const newBitmap = await this._createNewBitmap(canvas, width, height);
      this._pool.push(newBitmap);
      return newBitmap.bitmap;
    }

    // Reuse the least recently used bitmap
    const lruBitmap = this._findLRUBitmap();
    if (lruBitmap) {
      // Clean up old bitmap
      lruBitmap.bitmap.close();

      // Create new bitmap with same dimensions
      const newBitmap = await this._createNewBitmap(canvas, width, height);
      lruBitmap.bitmap = newBitmap.bitmap;
      lruBitmap.width = width;
      lruBitmap.height = height;
      lruBitmap.inUse = true;
      lruBitmap.lastUsed = Date.now();
      lruBitmap.createdAt = Date.now();

      return lruBitmap.bitmap;
    }

    // Fallback: create a new bitmap anyway
    const fallbackBitmap = await this._createNewBitmap(canvas, width, height);
    this._pool.push(fallbackBitmap);
    return fallbackBitmap.bitmap;
  }

  /**
   * Returns an image bitmap to the pool
   */
  releaseImageBitmap(bitmap: ImageBitmap): void {
    if (this._isDestroyed) {
      return;
    }

    const pooledBitmap = this._pool.find((pb) => pb.bitmap === bitmap);
    if (pooledBitmap) {
      pooledBitmap.inUse = false;
      pooledBitmap.lastUsed = Date.now();
    }
  }

  /**
   * Cleans up old bitmaps to free memory
   */
  cleanup(maxAge?: number): void {
    if (this._isDestroyed) {
      return;
    }

    const age = maxAge || this._maxBitmapAge;
    const now = Date.now();

    // Remove old unused bitmaps
    for (let i = this._pool.length - 1; i >= 0; i--) {
      const pooledBitmap = this._pool[i];
      if (!pooledBitmap.inUse && now - pooledBitmap.createdAt > age) {
        pooledBitmap.bitmap.close();
        this._pool.splice(i, 1);
      }
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

    // Remove unused bitmaps beyond target size
    while (this._pool.length > targetSize) {
      const bitmap = this._pool.shift();
      if (bitmap && !bitmap.inUse) {
        bitmap.bitmap.close();
      }
    }
  }

  /**
   * Sets up periodic cleanup to prevent memory leaks
   */
  setupPeriodicCleanup(): void {
    if (this._isDestroyed) {
      return;
    }

    // Clean up every 15 seconds
    setInterval(() => {
      if (!this._isDestroyed) {
        this.cleanup();
      }
    }, 15000);
  }

  /**
   * Handles memory pressure by aggressively cleaning up
   */
  handleMemoryPressure(): void {
    if (this._isDestroyed) {
      return;
    }

    // Release all unused bitmaps
    this._pool.forEach((pooledBitmap) => {
      if (!pooledBitmap.inUse) {
        pooledBitmap.bitmap.close();
      }
    });

    // Shrink pool aggressively
    this.shrinkPool(Math.floor(this._maxPoolSize / 4));
  }

  /**
   * Gets pool statistics
   */
  getPoolStats(): {
    totalBitmaps: number;
    inUseBitmaps: number;
    availableBitmaps: number;
    estimatedMemoryMB: number;
    averageAge: number;
    instanceId: string;
  } {
    const totalBitmaps = this._pool.length;
    const inUseBitmaps = this._pool.filter((pb) => pb.inUse).length;
    const availableBitmaps = totalBitmaps - inUseBitmaps;

    // Estimate memory usage
    const totalPixels = this._pool.reduce((sum, pb) => sum + pb.width * pb.height, 0);
    const memoryBytes = totalPixels * 4; // 4 bytes per pixel (RGBA)
    const memoryMB = (memoryBytes / (1024 * 1024)).toFixed(2);

    // Calculate average age
    const now = Date.now();
    const totalAge = this._pool.reduce((sum, pb) => sum + (now - pb.createdAt), 0);
    const averageAge = totalBitmaps > 0 ? Math.round(totalAge / totalBitmaps) : 0;

    return {
      totalBitmaps,
      inUseBitmaps,
      availableBitmaps,
      estimatedMemoryMB: parseFloat(memoryMB),
      averageAge,
      instanceId: this._instanceId,
    };
  }

  /**
   * Destroys this image bitmap pool and cleans up all resources
   */
  destroy(): void {
    if (this._isDestroyed) {
      return;
    }

    this._isDestroyed = true;

    // Clean up all bitmaps
    this._pool.forEach((pooledBitmap) => {
      pooledBitmap.bitmap.close();
    });

    this._pool.length = 0;
  }

  /**
   * Finds an available bitmap of the right size
   */
  private _findAvailableBitmap(width: number, height: number): PooledImageBitmap | null {
    return this._pool.find((pb) => !pb.inUse && this._canReuseBitmap(pb, width, height)) || null;
  }

  /**
   * Finds the least recently used bitmap
   */
  private _findLRUBitmap(): PooledImageBitmap | null {
    if (this._pool.length === 0) return null;

    return this._pool.reduce((lru, current) => (current.lastUsed < lru.lastUsed ? current : lru));
  }

  /**
   * Checks if a bitmap can be reused for the given dimensions
   */
  private _canReuseBitmap(pooledItem: PooledImageBitmap, requiredWidth: number, requiredHeight: number): boolean {
    // For small bitmaps, allow reuse if dimensions are close
    if (requiredWidth <= this._sizeBucketThreshold && requiredHeight <= this._sizeBucketThreshold) {
      const widthDiff = Math.abs(pooledItem.width - requiredWidth);
      const heightDiff = Math.abs(pooledItem.height - requiredHeight);
      return widthDiff <= 32 && heightDiff <= 32; // Allow 32px tolerance
    }

    // For larger bitmaps, require exact match
    return pooledItem.width === requiredWidth && pooledItem.height === requiredHeight;
  }

  /**
   * Creates a new image bitmap for the pool
   */
  private async _createNewBitmap(canvas: HTMLCanvasElement, width: number, height: number): Promise<PooledImageBitmap> {
    // Create a temporary canvas with the target dimensions
    const tempCanvas = document.createElement('canvas');
    const tempContext = tempCanvas.getContext('2d')!;

    tempCanvas.width = width;
    tempCanvas.height = height;

    // Draw the source canvas onto the temp canvas
    tempContext.drawImage(canvas, 0, 0, width, height);

    // Create image bitmap from the temp canvas
    const bitmap = await createImageBitmap(tempCanvas);

    return {
      bitmap,
      width,
      height,
      inUse: true,
      lastUsed: Date.now(),
      createdAt: Date.now(),
      instanceId: this._instanceId,
    };
  }
}
