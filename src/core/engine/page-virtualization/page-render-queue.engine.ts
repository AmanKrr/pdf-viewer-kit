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

import { CachedPageInfo, RenderQueueItem } from './types';

type ProcessPageFn = (pageInfo: CachedPageInfo) => Promise<void>;
type ShouldSkipFn = (pageInfo: CachedPageInfo) => boolean;

/**
 * Dedicated queue responsible for ordering and processing page renders.
 * Keeps the PageVirtualizationEngine focused on orchestration logic.
 */
export class PageRenderQueue {
  private _queue: RenderQueueItem[] = [];
  private _isProcessing = false;
  private _currentRenderPromise: Promise<void> | null = null;

  constructor(
    private readonly _processPage: ProcessPageFn,
    private readonly _shouldSkipPage: ShouldSkipFn,
    private readonly _onPageProcessed: () => Promise<void> | void = () => {},
  ) {}

  get currentRenderPromise(): Promise<void> | null {
    return this._currentRenderPromise;
  }

  set currentRenderPromise(promise: Promise<void> | null) {
    this._currentRenderPromise = promise;
  }

  get isProcessing(): boolean {
    return this._isProcessing;
  }

  get size(): number {
    return this._queue.length;
  }

  clear(): void {
    this._queue = [];
  }

  remove(pageNumber: number): boolean {
    const initialLength = this._queue.length;
    this._queue = this._queue.filter((item) => item.pageInfo.pageNumber !== pageNumber);
    return this._queue.length < initialLength;
  }

  filter(predicate: (item: RenderQueueItem) => boolean): void {
    this._queue = this._queue.filter(predicate);
  }

  enqueue(pageInfo: CachedPageInfo, priority: number = 1): void {
    this._queue = this._queue.filter((item) => item.pageInfo.pageNumber !== pageInfo.pageNumber);
    this._queue.push({
      pageInfo,
      priority,
      timestamp: Date.now(),
    });
    this._queue.sort((a, b) => {
      if (a.priority !== b.priority) return a.priority - b.priority;
      return a.timestamp - b.timestamp;
    });
    this._processQueue();
  }

  private async _processQueue(): Promise<void> {
    if (this._isProcessing || this._queue.length === 0) {
      return;
    }
    this._isProcessing = true;
    try {
      while (this._queue.length > 0) {
        const queueItem = this._queue.shift();
        if (!queueItem) continue;
        const { pageInfo } = queueItem;

        if (this._shouldSkipPage(pageInfo)) {
          continue;
        }

        this._currentRenderPromise = this._processPage(pageInfo);
        await this._currentRenderPromise;
        this._currentRenderPromise = null;

        await this._onPageProcessed();
        await new Promise((resolve) => setTimeout(resolve, 5));
      }
    } finally {
      this._isProcessing = false;
      this._currentRenderPromise = null;
    }
  }
}

export default PageRenderQueue;
