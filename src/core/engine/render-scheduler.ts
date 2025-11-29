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
 * RenderScheduler - Async Task Management
 *
 * This module handles the complexity of scheduling and managing render tasks.
 * It implements priority queuing, aggressive cancellation, and debouncing.
 *
 * Responsibilities:
 * - Priority queue management (high priority for visible pages)
 * - Task cancellation logic (cancel far-away pages during rapid scroll)
 * - Debouncing/throttling scroll events
 * - Render task orchestration
 *
 * This module knows nothing about DOM - it only manages async workflows.
 */

/**
 * Represents a render task in the queue
 */
export interface RenderTask<T = any> {
  /** Unique identifier for the page */
  pageNumber: number;

  /** Priority (0 = highest, higher numbers = lower priority) */
  priority: number;

  /** Timestamp when task was created */
  timestamp: number;

  /** Optional task-specific data */
  data?: T;

  /** Abort controller for cancellation */
  abortController?: AbortController;
}

/**
 * Configuration for the render scheduler
 */
export interface RenderSchedulerConfig {
  /** Maximum number of concurrent renders */
  maxConcurrentRenders: number;

  /** Interval for checking if tasks should be cancelled (ms) */
  cancelCheckInterval: number;

  /** Distance in pages beyond which tasks are cancelled during rapid scroll */
  aggressiveCancelDistance: number;

  /** Threshold for detecting rapid scrolling (ms between scroll events) */
  rapidScrollThreshold: number;

  /** Enable debug logging */
  debug?: boolean;
}

/**
 * Result of a render task
 */
export interface RenderResult<T = any> {
  pageNumber: number;
  success: boolean;
  cancelled?: boolean;
  error?: Error;
  data?: T;
}

/**
 * Callback type for executing a render task
 */
export type RenderTaskExecutor<T = any> = (
  task: RenderTask<T>,
  signal: AbortSignal
) => Promise<RenderResult<T>>;

/**
 * RenderScheduler
 *
 * Manages the async rendering pipeline with priority queuing and cancellation.
 */
export class RenderScheduler<T = any> {
  private config: RenderSchedulerConfig;
  private renderQueue: RenderTask<T>[] = [];
  private activeTasks = new Map<number, RenderTask<T>>();
  private isProcessingQueue = false;
  private currentRenderPromise: Promise<void> | null = null;

  // Cancellation tracking
  private lastCancelCheck = 0;
  private isRapidScrolling = false;
  private lastScrollTime = 0;

  // Task executor
  private taskExecutor?: RenderTaskExecutor<T>;

  constructor(config: Partial<RenderSchedulerConfig> = {}) {
    this.config = {
      maxConcurrentRenders: 2,
      cancelCheckInterval: 100,
      aggressiveCancelDistance: 8,
      rapidScrollThreshold: 500,
      debug: false,
      ...config,
    };
  }

  /**
   * Set the task executor function
   */
  setExecutor(executor: RenderTaskExecutor<T>): void {
    this.taskExecutor = executor;
  }

  /**
   * Add a render task to the queue
   *
   * @param task Task to add
   * @returns True if task was added, false if already queued
   */
  enqueueTask(task: Omit<RenderTask<T>, 'timestamp' | 'abortController'>): boolean {
    // Check if page is already being rendered or queued
    if (this.isTaskActive(task.pageNumber) || this.isTaskQueued(task.pageNumber)) {
      this.log(`Task for page ${task.pageNumber} already active or queued`);
      return false;
    }

    const renderTask: RenderTask<T> = {
      ...task,
      timestamp: Date.now(),
      abortController: new AbortController(),
    };

    this.renderQueue.push(renderTask);
    this.sortQueue();

    this.log(`Enqueued task for page ${task.pageNumber} (priority: ${task.priority})`);
    return true;
  }

  /**
   * Start processing the render queue
   */
  async startProcessing(): Promise<void> {
    if (this.isProcessingQueue) {
      this.log('Queue already processing');
      return;
    }

    if (!this.taskExecutor) {
      throw new Error('Task executor not set. Call setExecutor() first.');
    }

    this.isProcessingQueue = true;
    this.currentRenderPromise = this.processQueue();

    try {
      await this.currentRenderPromise;
    } finally {
      this.isProcessingQueue = false;
      this.currentRenderPromise = null;
    }
  }

  /**
   * Stop processing the queue and cancel all tasks
   */
  async stopProcessing(): Promise<void> {
    this.isProcessingQueue = false;
    this.cancelAllTasks();

    if (this.currentRenderPromise) {
      await this.currentRenderPromise;
    }
  }

  /**
   * Mark that scrolling is happening (for rapid scroll detection)
   */
  onScroll(): void {
    const now = Date.now();
    const timeSinceLastScroll = now - this.lastScrollTime;

    this.isRapidScrolling = timeSinceLastScroll < this.config.rapidScrollThreshold;
    this.lastScrollTime = now;

    this.log(`Scroll detected, rapid: ${this.isRapidScrolling}`);
  }

  /**
   * Cancel tasks for pages beyond a certain distance
   *
   * @param centerPage Current center page
   */
  cancelDistantTasks(centerPage: number): void {
    const now = Date.now();

    // Throttle cancel checks
    if (now - this.lastCancelCheck < this.config.cancelCheckInterval) {
      return;
    }

    this.lastCancelCheck = now;

    let cancelledCount = 0;

    // Cancel active tasks
    this.activeTasks.forEach((task, pageNumber) => {
      const distance = Math.abs(pageNumber - centerPage);

      if (distance > this.config.aggressiveCancelDistance) {
        this.log(`Cancelling active task for page ${pageNumber} (distance: ${distance})`);
        task.abortController?.abort();
        this.activeTasks.delete(pageNumber);
        cancelledCount++;
      }
    });

    // Remove distant tasks from queue
    const initialQueueLength = this.renderQueue.length;
    this.renderQueue = this.renderQueue.filter((task) => {
      const distance = Math.abs(task.pageNumber - centerPage);

      if (distance > this.config.aggressiveCancelDistance) {
        this.log(`Removing queued task for page ${task.pageNumber} (distance: ${distance})`);
        task.abortController?.abort();
        return false;
      }

      return true;
    });

    cancelledCount += initialQueueLength - this.renderQueue.length;

    if (cancelledCount > 0) {
      this.log(`Cancelled ${cancelledCount} distant tasks`);
    }
  }

  /**
   * Cancel a specific task by page number
   */
  cancelTask(pageNumber: number): boolean {
    // Cancel active task
    const activeTask = this.activeTasks.get(pageNumber);
    if (activeTask) {
      this.log(`Cancelling active task for page ${pageNumber}`);
      activeTask.abortController?.abort();
      this.activeTasks.delete(pageNumber);
      return true;
    }

    // Remove from queue
    const index = this.renderQueue.findIndex((t) => t.pageNumber === pageNumber);
    if (index !== -1) {
      const task = this.renderQueue[index];
      this.log(`Removing queued task for page ${pageNumber}`);
      task.abortController?.abort();
      this.renderQueue.splice(index, 1);
      return true;
    }

    return false;
  }

  /**
   * Cancel all tasks
   */
  cancelAllTasks(): void {
    this.log('Cancelling all tasks');

    // Cancel active tasks
    this.activeTasks.forEach((task) => {
      task.abortController?.abort();
    });
    this.activeTasks.clear();

    // Cancel queued tasks
    this.renderQueue.forEach((task) => {
      task.abortController?.abort();
    });
    this.renderQueue = [];
  }

  /**
   * Check if a task for a page is currently active
   */
  isTaskActive(pageNumber: number): boolean {
    return this.activeTasks.has(pageNumber);
  }

  /**
   * Check if a task for a page is queued
   */
  isTaskQueued(pageNumber: number): boolean {
    return this.renderQueue.some((t) => t.pageNumber === pageNumber);
  }

  /**
   * Get the number of tasks in the queue
   */
  getQueueSize(): number {
    return this.renderQueue.length;
  }

  /**
   * Get the number of active tasks
   */
  getActiveTaskCount(): number {
    return this.activeTasks.size;
  }

  /**
   * Clear the entire queue (without cancelling active tasks)
   */
  clearQueue(): void {
    this.renderQueue.forEach((task) => {
      task.abortController?.abort();
    });
    this.renderQueue = [];
  }

  /**
   * Process the render queue
   */
  private async processQueue(): Promise<void> {
    while (this.isProcessingQueue && (this.renderQueue.length > 0 || this.activeTasks.size > 0)) {
      // Wait if we're at max concurrent renders
      if (this.activeTasks.size >= this.config.maxConcurrentRenders) {
        await this.waitForActiveTask();
        continue;
      }

      // Get next task from queue
      const task = this.renderQueue.shift();
      if (!task) {
        // No more tasks in queue, wait for active tasks to finish
        if (this.activeTasks.size > 0) {
          await this.waitForActiveTask();
        }
        continue;
      }

      // Check if task was cancelled while waiting
      if (task.abortController?.signal.aborted) {
        this.log(`Task for page ${task.pageNumber} was cancelled before execution`);
        continue;
      }

      // Execute task
      this.activeTasks.set(task.pageNumber, task);
      this.executeTask(task);
    }
  }

  /**
   * Execute a render task
   */
  private async executeTask(task: RenderTask<T>): Promise<void> {
    if (!this.taskExecutor) return;

    try {
      this.log(`Executing task for page ${task.pageNumber}`);

      const result = await this.taskExecutor(task, task.abortController!.signal);

      this.log(`Task for page ${result.pageNumber} completed (success: ${result.success})`);
    } catch (error) {
      if ((error as Error).name === 'AbortError') {
        this.log(`Task for page ${task.pageNumber} was aborted`);
      } else {
        this.log(`Task for page ${task.pageNumber} failed: ${error}`);
      }
    } finally {
      this.activeTasks.delete(task.pageNumber);
    }
  }

  /**
   * Wait for at least one active task to complete
   */
  private async waitForActiveTask(): Promise<void> {
    if (this.activeTasks.size === 0) return;

    // Create promises for all active tasks
    const promises = Array.from(this.activeTasks.values()).map(
      (task) =>
        new Promise<void>((resolve) => {
          // Resolve when task is no longer active
          const checkInterval = setInterval(() => {
            if (!this.activeTasks.has(task.pageNumber)) {
              clearInterval(checkInterval);
              resolve();
            }
          }, 50);
        })
    );

    // Wait for first task to complete
    await Promise.race(promises);
  }

  /**
   * Sort the queue by priority (lower = higher priority)
   */
  private sortQueue(): void {
    this.renderQueue.sort((a, b) => {
      // Sort by priority first
      if (a.priority !== b.priority) {
        return a.priority - b.priority;
      }

      // Then by timestamp (older first)
      return a.timestamp - b.timestamp;
    });
  }

  /**
   * Log debug message
   */
  private log(_message: string): void {
    // Debug logging disabled
  }
}

/**
 * Debounce utility for scroll events
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout> | null = null;

  return function (this: any, ...args: Parameters<T>) {
    const context = this;

    if (timeout) {
      clearTimeout(timeout);
    }

    timeout = setTimeout(() => {
      func.apply(context, args);
      timeout = null;
    }, wait);
  };
}

/**
 * Throttle utility for frequent events
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle = false;

  return function (this: any, ...args: Parameters<T>) {
    const context = this;

    if (!inThrottle) {
      func.apply(context, args);
      inThrottle = true;

      setTimeout(() => {
        inThrottle = false;
      }, limit);
    }
  };
}
