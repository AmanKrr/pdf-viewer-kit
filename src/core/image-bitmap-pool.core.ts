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
 * Represents a pooled image bitmap with metadata.
 *
 * Each pooled bitmap maintains state information for efficient
 * reuse and memory management within the pool.
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
 *
 * Each instance has its own pool of image bitmaps, preventing resource
 * conflicts and ensuring complete isolation between PDF viewer instances.
 * Implements intelligent bitmap reuse and memory management strategies.
 */
export class InstanceImageBitmapPool {
  private readonly _instanceId: string;
  private readonly _pool: PooledImageBitmap[] = [];
  private readonly _maxPoolSize: number;
  private readonly _maxBitmapAge: number = 30000;
  private readonly _sizeBucketThreshold: number = 128;
  private _isDestroyed = false;

  /**
   * Creates a new image bitmap pool for a specific PDF instance.
   *
   * @param instanceId - Unique identifier for the PDF instance
   * @param maxPoolSize - Maximum number of bitmaps to keep in the pool
   */
  constructor(instanceId: string, maxPoolSize: number = 8) {
    this._instanceId = instanceId;
    this._maxPoolSize = maxPoolSize;
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
   * Gets an image bitmap from the pool or creates a new one.
   *
   * Implements intelligent bitmap reuse by searching for available
   * bitmaps of appropriate size, or creating new ones when needed.
   * Uses LRU strategy when the pool is full.
   *
   * @param canvas - Source canvas to create bitmap from
   * @param targetWidth - Optional target width for the bitmap
   * @param targetHeight - Optional target height for the bitmap
   * @returns Promise that resolves to an ImageBitmap
   * @throws Error if the pool has been destroyed
   */
  async getImageBitmap(canvas: HTMLCanvasElement, targetWidth?: number, targetHeight?: number): Promise<ImageBitmap> {
    if (this._isDestroyed) {
      throw new Error(`Cannot get image bitmap from destroyed pool for instance ${this._instanceId}`);
    }

    const width = targetWidth || canvas.width;
    const height = targetHeight || canvas.height;

    const availableBitmap = this._findAvailableBitmap(width, height);
    if (availableBitmap) {
      availableBitmap.inUse = true;
      availableBitmap.lastUsed = Date.now();
      return availableBitmap.bitmap;
    }

    if (this._pool.length < this._maxPoolSize) {
      const newBitmap = await this._createNewBitmap(canvas, width, height);
      this._pool.push(newBitmap);
      return newBitmap.bitmap;
    }

    const lruBitmap = this._findLRUBitmap();
    if (lruBitmap) {
      lruBitmap.bitmap.close();

      const newBitmap = await this._createNewBitmap(canvas, width, height);
      lruBitmap.bitmap = newBitmap.bitmap;
      lruBitmap.width = width;
      lruBitmap.height = height;
      lruBitmap.inUse = true;
      lruBitmap.lastUsed = Date.now();
      lruBitmap.createdAt = Date.now();

      return lruBitmap.bitmap;
    }

    const fallbackBitmap = await this._createNewBitmap(canvas, width, height);
    this._pool.push(fallbackBitmap);
    return fallbackBitmap.bitmap;
  }

  /**
   * Returns an image bitmap to the pool for reuse.
   *
   * Marks the bitmap as available and updates its last used timestamp
   * for LRU-based cleanup strategies.
   *
   * @param bitmap - The ImageBitmap to release back to the pool
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
   * Cleans up old bitmaps to free memory.
   *
   * Removes bitmaps that haven't been used for longer than the specified age
   * to prevent memory accumulation from stale resources.
   *
   * @param maxAge - Maximum age in milliseconds before cleanup (defaults to 30 seconds)
   */
  cleanup(maxAge?: number): void {
    if (this._isDestroyed) {
      return;
    }

    const age = maxAge || this._maxBitmapAge;
    const now = Date.now();

    for (let i = this._pool.length - 1; i >= 0; i--) {
      const pooledBitmap = this._pool[i];
      if (!pooledBitmap.inUse && now - pooledBitmap.createdAt > age) {
        pooledBitmap.bitmap.close();
        this._pool.splice(i, 1);
      }
    }
  }

  /**
   * Shrinks the pool to free memory.
   *
   * Uses LRU (Least Recently Used) strategy to remove unused bitmaps
   * beyond the target size, ensuring the most recently used bitmaps
   * are kept in the pool.
   *
   * @param targetSize - Target size for the pool (defaults to half the max size)
   */
  shrinkPool(targetSize: number = Math.floor(this._maxPoolSize / 2)): void {
    if (this._isDestroyed) {
      return;
    }

    this._pool.sort((a, b) => a.lastUsed - b.lastUsed);

    while (this._pool.length > targetSize) {
      const bitmap = this._pool.shift();
      if (bitmap && !bitmap.inUse) {
        bitmap.bitmap.close();
      }
    }
  }

  /**
   * Sets up periodic cleanup to prevent memory leaks.
   *
   * Runs cleanup every 15 seconds to remove old unused bitmaps
   * and maintain optimal memory usage.
   */
  setupPeriodicCleanup(): void {
    if (this._isDestroyed) {
      return;
    }

    setInterval(() => {
      if (!this._isDestroyed) {
        this.cleanup();
      }
    }, 15000);
  }

  /**
   * Handles memory pressure by aggressively cleaning up.
   *
   * Implements emergency cleanup strategies when the system
   * is under memory pressure to free resources immediately.
   */
  handleMemoryPressure(): void {
    if (this._isDestroyed) {
      return;
    }

    this._pool.forEach((pooledBitmap) => {
      if (!pooledBitmap.inUse) {
        pooledBitmap.bitmap.close();
      }
    });

    this.shrinkPool(Math.floor(this._maxPoolSize / 4));
  }

  /**
   * Gets comprehensive pool statistics.
   *
   * Provides detailed information about bitmap usage, memory consumption,
   * and pool status for monitoring and debugging purposes.
   *
   * @returns Object containing pool statistics
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

    const totalPixels = this._pool.reduce((sum, pb) => sum + pb.width * pb.height, 0);
    const memoryBytes = totalPixels * 4;
    const memoryMB = (memoryBytes / (1024 * 1024)).toFixed(2);

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
   * Destroys this image bitmap pool and cleans up all resources.
   *
   * Performs complete cleanup including:
   * - Closing all ImageBitmap resources
   * - Clearing the pool array
   * - Marking the pool as destroyed
   */
  destroy(): void {
    if (this._isDestroyed) {
      return;
    }

    this._isDestroyed = true;

    this._pool.forEach((pooledBitmap) => {
      pooledBitmap.bitmap.close();
    });

    this._pool.length = 0;
  }

  /**
   * Finds an available bitmap of the right size.
   *
   * @param width - Required width for the bitmap
   * @param height - Required height for the bitmap
   * @returns Available bitmap if found, null otherwise
   */
  private _findAvailableBitmap(width: number, height: number): PooledImageBitmap | null {
    return this._pool.find((pb) => !pb.inUse && this._canReuseBitmap(pb, width, height)) || null;
  }

  /**
   * Finds the least recently used bitmap.
   *
   * @returns The bitmap that was used least recently, or null if pool is empty
   */
  private _findLRUBitmap(): PooledImageBitmap | null {
    if (this._pool.length === 0) return null;

    return this._pool.reduce((lru, current) => (current.lastUsed < lru.lastUsed ? current : lru));
  }

  /**
   * Checks if a bitmap can be reused for the given dimensions.
   *
   * Implements intelligent size matching with tolerance for small bitmaps
   * and exact matching for larger ones to optimize reuse rates.
   *
   * @param pooledItem - The pooled bitmap to check
   * @param requiredWidth - Required width
   * @param requiredHeight - Required height
   * @returns True if the bitmap can be reused, false otherwise
   */
  private _canReuseBitmap(pooledItem: PooledImageBitmap, requiredWidth: number, requiredHeight: number): boolean {
    if (requiredWidth <= this._sizeBucketThreshold && requiredHeight <= this._sizeBucketThreshold) {
      const widthDiff = Math.abs(pooledItem.width - requiredWidth);
      const heightDiff = Math.abs(pooledItem.height - requiredHeight);
      return widthDiff <= 32 && heightDiff <= 32;
    }

    return pooledItem.width === requiredWidth && pooledItem.height === requiredHeight;
  }

  /**
   * Creates a new image bitmap for the pool.
   *
   * Creates a temporary canvas with target dimensions, draws the source
   * canvas content, and generates an ImageBitmap from it.
   *
   * @param canvas - Source canvas to create bitmap from
   * @param width - Target width for the bitmap
   * @param height - Target height for the bitmap
   * @returns Promise that resolves to a new PooledImageBitmap
   */
  private async _createNewBitmap(canvas: HTMLCanvasElement, width: number, height: number): Promise<PooledImageBitmap> {
    const tempCanvas = document.createElement('canvas');
    const tempContext = tempCanvas.getContext('2d')!;

    tempCanvas.width = width;
    tempCanvas.height = height;

    tempContext.drawImage(canvas, 0, 0, width, height);

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
