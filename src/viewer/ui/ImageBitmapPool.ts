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

import Logger from '../../utils/logger-utils';

interface PooledImageBitmap {
  bitmap: ImageBitmap;
  width: number;
  height: number;
  inUse: boolean;
  lastUsed: number;
  createdAt: number;
}

/**
 * Manages a pool of reusable ImageBitmap objects to reduce
 * the overhead of creating and destroying ImageBitmaps during zoom operations.
 */
class ImageBitmapPool {
  private _pool: PooledImageBitmap[] = [];
  private _maxPoolSize: number;
  private _maxBitmapAge: number = 30000; // 30 seconds max age
  private _sizeBucketThreshold: number = 128; // Pixels threshold for size bucketing

  constructor(maxPoolSize: number = 8) {
    this._maxPoolSize = maxPoolSize;

    // Setup periodic cleanup
    this._setupPeriodicCleanup();
  }

  /**
   * Gets a bucketed size for better reuse (similar to canvas bucketing).
   * @param size The original size
   * @returns Bucketed size
   */
  private _getBucketSize(size: number): number {
    if (size <= 256) return 256;
    if (size <= 512) return 512;
    if (size <= 1024) return 1024;
    if (size <= 2048) return 2048;
    if (size <= 4096) return 4096;
    return Math.ceil(size / 512) * 512; // Round up to nearest 512 for very large sizes
  }

  /**
   * Checks if an existing bitmap can be reused for the given dimensions.
   * @param pooledItem The pooled bitmap to check
   * @param requiredWidth Required width
   * @param requiredHeight Required height
   * @returns True if the bitmap can be reused
   */
  private _canReuseBitmap(pooledItem: PooledImageBitmap, requiredWidth: number, requiredHeight: number): boolean {
    const bucketedWidth = this._getBucketSize(requiredWidth);
    const bucketedHeight = this._getBucketSize(requiredHeight);

    return !pooledItem.inUse && pooledItem.width >= bucketedWidth && pooledItem.height >= bucketedHeight && Date.now() - pooledItem.createdAt < this._maxBitmapAge;
  }

  /**
   * Creates an ImageBitmap from a canvas preserving original quality.
   * @param canvas The source canvas (high DPI rendered)
   * @param targetWidth Target CSS width for display
   * @param targetHeight Target CSS height for display
   * @returns Promise<ImageBitmap> The created ImageBitmap
   */
  async getImageBitmap(canvas: HTMLCanvasElement, targetWidth?: number, targetHeight?: number): Promise<ImageBitmap> {
    const devicePixelRatio = window.devicePixelRatio || 1;

    // If no target dimensions provided, use canvas dimensions
    const cssWidth = targetWidth || canvas.width / devicePixelRatio;
    const cssHeight = targetHeight || canvas.height / devicePixelRatio;

    // Calculate required physical pixels for crisp display
    const requiredWidth = Math.ceil(cssWidth * devicePixelRatio);
    const requiredHeight = Math.ceil(cssHeight * devicePixelRatio);

    // Try to find a reusable bitmap
    const reusableItem = this._pool.find((item) => this._canReuseBitmap(item, requiredWidth, requiredHeight));

    if (reusableItem) {
      reusableItem.inUse = true;
      reusableItem.lastUsed = Date.now();
      return reusableItem.bitmap;
    }

    try {
      // Create ImageBitmap WITHOUT resizing to preserve quality
      // Let the display canvas handle the scaling instead
      const bitmap = await createImageBitmap(canvas, {
        // Do NOT resize here - preserve original canvas quality
        imageOrientation: 'from-image',
        premultiplyAlpha: 'default',
        colorSpaceConversion: 'default',
      });

      // Store with bucketed dimensions for matching
      const bucketedWidth = this._getBucketSize(requiredWidth);
      const bucketedHeight = this._getBucketSize(requiredHeight);

      if (this._pool.length < this._maxPoolSize) {
        const pooledItem: PooledImageBitmap = {
          bitmap,
          width: bucketedWidth,
          height: bucketedHeight,
          inUse: true,
          lastUsed: Date.now(),
          createdAt: Date.now(),
        };

        this._pool.push(pooledItem);
      }

      Logger.info(`Created high-quality ImageBitmap`, {
        canvasSize: `${canvas.width}x${canvas.height}`,
        targetSize: `${cssWidth}x${cssHeight}`,
        devicePixelRatio,
      });

      return bitmap;
    } catch (error) {
      Logger.error('Failed to create ImageBitmap', error);
      throw error;
    }
  }

  /**
   * Releases an ImageBitmap back to the pool.
   * @param bitmap The ImageBitmap to release
   */
  releaseImageBitmap(bitmap: ImageBitmap): void {
    const pooledItem = this._pool.find((item) => item.bitmap === bitmap);

    if (pooledItem) {
      pooledItem.inUse = false;
      pooledItem.lastUsed = Date.now();

      Logger.info(`Released ImageBitmap back to pool`, {
        poolSize: this._pool.length,
        availableItems: this._pool.filter((item) => !item.inUse).length,
      });
    } else {
      // Transient bitmap not in pool - close it immediately
      bitmap.close();
      Logger.info('Closed transient ImageBitmap');
    }
  }

  /**
   * Forces cleanup of old or unused bitmaps.
   * @param maxAge Maximum age in milliseconds (optional)
   */
  cleanup(maxAge?: number): void {
    const ageThreshold = maxAge || this._maxBitmapAge;
    const now = Date.now();
    let cleanedCount = 0;

    // Remove old or unused bitmaps
    this._pool = this._pool.filter((item) => {
      const isOld = now - item.createdAt > ageThreshold;
      const shouldRemove = isOld && !item.inUse;

      if (shouldRemove) {
        item.bitmap.close();
        cleanedCount++;
        return false;
      }
      return true;
    });

    if (cleanedCount > 0) {
      Logger.info(`ImageBitmap pool cleanup completed`, {
        cleanedCount,
        remainingPoolSize: this._pool.length,
      });
    }
  }

  /**
   * Shrinks the pool to the target size by removing least recently used items.
   * @param targetSize Target pool size
   */
  shrinkPool(targetSize: number = Math.floor(this._maxPoolSize / 2)): void {
    if (targetSize >= this._pool.length) return;

    // Sort by last used time (oldest first) and remove unused items
    const unusedItems = this._pool.filter((item) => !item.inUse).sort((a, b) => a.lastUsed - b.lastUsed);

    const itemsToRemove = Math.min(unusedItems.length, this._pool.length - targetSize);
    const toRemove = unusedItems.slice(0, itemsToRemove);

    toRemove.forEach((item) => {
      const index = this._pool.indexOf(item);
      if (index !== -1) {
        item.bitmap.close();
        this._pool.splice(index, 1);
      }
    });

    Logger.info(`ImageBitmap pool shrunk`, {
      removedItems: toRemove.length,
      newPoolSize: this._pool.length,
      targetSize,
    });
  }

  /**
   * Sets up periodic cleanup of old ImageBitmaps.
   */
  private _setupPeriodicCleanup(): void {
    // Cleanup every 30 seconds
    setInterval(() => {
      this.cleanup();
    }, 30000);
  }

  /**
   * Handles memory pressure by aggressively shrinking the pool.
   */
  handleMemoryPressure(): void {
    Logger.warn('ImageBitmap pool handling memory pressure');

    // Close all unused bitmaps immediately
    const unusedItems = this._pool.filter((item) => !item.inUse);
    unusedItems.forEach((item) => {
      const index = this._pool.indexOf(item);
      if (index !== -1) {
        item.bitmap.close();
        this._pool.splice(index, 1);
      }
    });

    Logger.warn(`Memory pressure cleanup: removed ${unusedItems.length} unused ImageBitmaps`);
  }

  /**
   * Gets pool statistics for monitoring.
   */
  getPoolStats(): {
    totalBitmaps: number;
    inUseBitmaps: number;
    availableBitmaps: number;
    estimatedMemoryMB: number;
    averageAge: number;
  } {
    const now = Date.now();
    const inUse = this._pool.filter((item) => item.inUse).length;

    // Estimate memory usage (rough calculation)
    const totalPixels = this._pool.reduce((sum, item) => sum + item.width * item.height, 0);
    const estimatedMemoryMB = (totalPixels * 4) / (1024 * 1024); // 4 bytes per pixel (RGBA)

    const averageAge = this._pool.length > 0 ? this._pool.reduce((sum, item) => sum + (now - item.createdAt), 0) / this._pool.length / 1000 : 0;

    return {
      totalBitmaps: this._pool.length,
      inUseBitmaps: inUse,
      availableBitmaps: this._pool.length - inUse,
      estimatedMemoryMB: parseFloat(estimatedMemoryMB.toFixed(1)),
      averageAge: parseFloat(averageAge.toFixed(1)),
    };
  }

  /**
   * Destroys the pool and closes all ImageBitmaps.
   */
  destroy(): void {
    Logger.info(`Destroying ImageBitmap pool with ${this._pool.length} items`);

    this._pool.forEach((item) => {
      item.bitmap.close();
    });

    this._pool = [];
  }
}

export default ImageBitmapPool;
