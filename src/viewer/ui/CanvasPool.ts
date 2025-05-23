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
  width: number; // Physical pixel width
  height: number; // Physical pixel height
}

/**
 * Manages a pool of reusable HTMLCanvasElement objects to reduce
 * the overhead of creating and destroying canvases frequently.
 */
class CanvasPool {
  private _pool: PooledCanvas[] = [];
  private _maxPoolSize: number;

  constructor(maxPoolSize: number = 10) {
    this._maxPoolSize = maxPoolSize;
  }

  /**
   * Acquires a canvas from the pool or creates a new one if none are suitable.
   * @param {number} cssWidth - Desired CSS width of the canvas.
   * @param {number} cssHeight - Desired CSS height of the canvas.
   * @returns {[HTMLCanvasElement, CanvasRenderingContext2D]} The canvas and its 2D rendering context.
   */
  getCanvas(cssWidth: number, cssHeight: number): [HTMLCanvasElement, CanvasRenderingContext2D] {
    const ratio = window.devicePixelRatio || 1;
    const physicalWidth = Math.ceil(cssWidth * ratio);
    const physicalHeight = Math.ceil(cssHeight * ratio);

    for (const pooledItem of this._pool) {
      if (!pooledItem.inUse && pooledItem.width >= physicalWidth && pooledItem.height >= physicalHeight) {
        pooledItem.inUse = true;
        // Resize if necessary, but only if dimensions have changed significantly or are too small
        if (pooledItem.canvas.width !== physicalWidth || pooledItem.canvas.height !== physicalHeight) {
          pooledItem.canvas.width = physicalWidth;
          pooledItem.canvas.height = physicalHeight;
        }
        pooledItem.canvas.style.width = `${cssWidth}px`;
        pooledItem.canvas.style.height = `${cssHeight}px`;

        // Reset transform and re-apply scale for fresh rendering state
        pooledItem.context.setTransform(1, 0, 0, 1, 0, 0);
        pooledItem.context.scale(ratio, ratio);
        return [pooledItem.canvas, pooledItem.context];
      }
    }

    const canvas = document.createElement('canvas');
    // Using { alpha: false } can improve rendering performance for opaque content
    const context = canvas.getContext('2d')!;

    canvas.width = physicalWidth;
    canvas.height = physicalHeight;
    canvas.style.width = `${cssWidth}px`;
    canvas.style.height = `${cssHeight}px`;
    context.scale(ratio, ratio);

    if (this._pool.length < this._maxPoolSize) {
      this._pool.push({ canvas, context, inUse: true, width: physicalWidth, height: physicalHeight });
    } else {
      // If pool is full, this canvas is transient and won't be pooled.
      // It should be explicitly destroyed by the caller if not returned via release.
      // However, our releaseCanvas logic can handle non-pooled items too.
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
      // The physical width/height are used for clearRect
      pooledItem.context.setTransform(1, 0, 0, 1, 0, 0); // Reset transform before clearing
      pooledItem.context.clearRect(0, 0, pooledItem.canvas.width, pooledItem.canvas.height);
    }
    // If canvas was not from pool (e.g., pool was full), it's not added.
    // It will be garbage collected if no other references exist.
  }

  /**
   * Clears the entire pool and removes all canvases.
   * Should be called when the PDF viewer is destroyed.
   */
  destroy(): void {
    this._pool.forEach((pooledItem) => {
      // Explicitly nullify to help GC, though removing from array is key
      (pooledItem.canvas as any) = null;
      (pooledItem.context as any) = null;
    });
    this._pool = [];
  }
}

export default CanvasPool;
