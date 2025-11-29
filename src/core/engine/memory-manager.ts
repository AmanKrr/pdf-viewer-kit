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
 * MemoryManager - Memory and Performance Management
 *
 * Handles memory-related concerns:
 * - Memory pressure detection
 * - Browser memory API monitoring
 * - WebGL capability detection
 * - Performance heuristics
 * - Memory usage recommendations
 *
 * This module provides cross-cutting memory management
 * that affects rendering, caching, and resource allocation.
 */

/**
 * Memory pressure levels
 */
export enum MemoryPressure {
  NONE = 'none',
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

/**
 * Memory stats from browser API
 */
export interface MemoryStats {
  usedJSHeapSize: number;
  totalJSHeapSize: number;
  jsHeapSizeLimit: number;
  usedPercent: number;
}

/**
 * WebGL capabilities
 */
export interface WebGLCapabilities {
  supported: boolean;
  renderer?: string;
  vendor?: string;
  maxTextureSize?: number;
  recommended: boolean;
  reason?: string;
}

/**
 * Memory manager configuration
 */
export interface MemoryManagerConfig {
  /** Memory pressure threshold (% of heap used) */
  pressureThreshold: number;

  /** Check interval in milliseconds */
  checkInterval: number;

  /** Enable WebGL detection */
  detectWebGL: boolean;

  /** Fallback memory limit (MB) if browser API unavailable */
  fallbackMemoryLimit: number;
}

/**
 * Memory pressure callback
 */
export type MemoryPressureCallback = (pressure: MemoryPressure, stats?: MemoryStats) => void;

/**
 * MemoryManager
 *
 * Monitors and manages memory usage across the application.
 */
export class MemoryManager {
  private config: MemoryManagerConfig;
  private pressureCallbacks: MemoryPressureCallback[] = [];
  private monitoringInterval?: ReturnType<typeof setInterval>;
  private lastPressureLevel: MemoryPressure = MemoryPressure.NONE;
  private webglCapabilities?: WebGLCapabilities;

  constructor(config: Partial<MemoryManagerConfig> = {}) {
    this.config = {
      pressureThreshold: 0.75, // 75%
      checkInterval: 5000, // 5 seconds
      detectWebGL: true,
      fallbackMemoryLimit: 100, // 100MB
      ...config,
    };

    // Detect WebGL on initialization
    if (this.config.detectWebGL) {
      this.webglCapabilities = this.detectWebGLCapabilities();
    }
  }

  /**
   * Start monitoring memory pressure
   *
   * Periodically checks memory and invokes callbacks when pressure changes
   */
  startMonitoring(): void {
    if (this.monitoringInterval) {
      return;
    }

    this.monitoringInterval = setInterval(() => {
      const pressure = this.getCurrentPressure();

      // Invoke callbacks if pressure level changed
      if (pressure !== this.lastPressureLevel) {
        this.lastPressureLevel = pressure;

        const stats = this.getMemoryStats();
        this.pressureCallbacks.forEach((callback) => {
          try {
            callback(pressure, stats);
          } catch (error) {
            // Ignore callback errors
          }
        });
      }
    }, this.config.checkInterval);
  }

  /**
   * Stop monitoring memory pressure
   */
  stopMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = undefined;
    }
  }

  /**
   * Register callback for memory pressure changes
   *
   * @param callback Callback to invoke on pressure change
   */
  onPressureChange(callback: MemoryPressureCallback): () => void {
    this.pressureCallbacks.push(callback);

    // Return unsubscribe function
    return () => {
      const index = this.pressureCallbacks.indexOf(callback);
      if (index > -1) {
        this.pressureCallbacks.splice(index, 1);
      }
    };
  }

  /**
   * Get current memory pressure level
   *
   * @returns Current pressure level
   */
  getCurrentPressure(): MemoryPressure {
    const stats = this.getMemoryStats();

    if (!stats) {
      // Fallback: use heuristics without browser API
      return this.estimatePressureFromHeuristics();
    }

    const { usedPercent } = stats;

    if (usedPercent >= 0.9) {
      return MemoryPressure.CRITICAL;
    } else if (usedPercent >= 0.8) {
      return MemoryPressure.HIGH;
    } else if (usedPercent >= this.config.pressureThreshold) {
      return MemoryPressure.MEDIUM;
    } else if (usedPercent >= 0.6) {
      return MemoryPressure.LOW;
    }

    return MemoryPressure.NONE;
  }

  /**
   * Get memory statistics from browser API
   *
   * @returns Memory stats or undefined if not available
   */
  getMemoryStats(): MemoryStats | undefined {
    if ('memory' in performance) {
      const memory = (performance as any).memory;

      if (memory.usedJSHeapSize && memory.jsHeapSizeLimit) {
        return {
          usedJSHeapSize: memory.usedJSHeapSize,
          totalJSHeapSize: memory.totalJSHeapSize,
          jsHeapSizeLimit: memory.jsHeapSizeLimit,
          usedPercent: memory.usedJSHeapSize / memory.jsHeapSizeLimit,
        };
      }
    }

    return undefined;
  }

  /**
   * Estimate memory pressure using heuristics when API is unavailable
   *
   * @returns Estimated pressure level
   */
  private estimatePressureFromHeuristics(): MemoryPressure {
    // Use canvas pool or other indicators
    // This is a fallback when performance.memory is not available

    // Check for mobile devices (likely lower memory)
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent
    );

    if (isMobile) {
      return MemoryPressure.LOW; // Be conservative on mobile
    }

    // Check device memory hint if available
    if ('deviceMemory' in navigator) {
      const deviceMemory = (navigator as any).deviceMemory; // GB

      if (deviceMemory <= 2) {
        return MemoryPressure.MEDIUM;
      } else if (deviceMemory <= 4) {
        return MemoryPressure.LOW;
      }
    }

    return MemoryPressure.NONE;
  }

  /**
   * Detect WebGL capabilities
   *
   * @returns WebGL capabilities object
   */
  detectWebGLCapabilities(): WebGLCapabilities {
    try {
      const canvas = document.createElement('canvas');
      const gl =
        canvas.getContext('webgl') ||
        (canvas.getContext('experimental-webgl') as WebGLRenderingContext);

      if (!gl) {
        return {
          supported: false,
          recommended: false,
          reason: 'WebGL not supported',
        };
      }

      // Get renderer info
      const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
      let renderer: string | undefined;
      let vendor: string | undefined;

      if (debugInfo) {
        renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
        vendor = gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL);

        // Check for problematic configurations
        if (renderer && renderer.includes('Intel') && renderer.includes('HD Graphics')) {
          return {
            supported: true,
            renderer,
            vendor,
            recommended: false,
            reason: 'Intel integrated graphics often perform worse with WebGL',
          };
        }

        if (renderer && (renderer.includes('Mali') || renderer.includes('PowerVR'))) {
          return {
            supported: true,
            renderer,
            vendor,
            recommended: false,
            reason: 'Mobile GPUs often have WebGL performance issues',
          };
        }
      }

      // Check texture size support
      const maxTextureSize = gl.getParameter(gl.MAX_TEXTURE_SIZE);

      if (maxTextureSize < 4096) {
        return {
          supported: true,
          renderer,
          vendor,
          maxTextureSize,
          recommended: false,
          reason: 'Low texture size limit indicates weak GPU',
        };
      }

      return {
        supported: true,
        renderer,
        vendor,
        maxTextureSize,
        recommended: true,
      };
    } catch (error) {
      return {
        supported: false,
        recommended: false,
        reason: 'Error detecting WebGL',
      };
    }
  }

  /**
   * Get WebGL capabilities (cached)
   *
   * @returns WebGL capabilities or undefined if not detected
   */
  getWebGLCapabilities(): WebGLCapabilities | undefined {
    return this.webglCapabilities;
  }

  /**
   * Check if WebGL should be used for rendering
   *
   * @returns True if WebGL is recommended
   */
  shouldUseWebGL(): boolean {
    return this.webglCapabilities?.recommended ?? false;
  }

  /**
   * Calculate recommended page buffer based on memory
   *
   * @param defaultBuffer Default buffer size
   * @param pressure Current memory pressure
   * @returns Recommended buffer size
   */
  static getRecommendedBuffer(
    defaultBuffer: number,
    pressure: MemoryPressure
  ): number {
    switch (pressure) {
      case MemoryPressure.CRITICAL:
        return 1; // Minimal buffer
      case MemoryPressure.HIGH:
        return Math.max(1, Math.floor(defaultBuffer * 0.5));
      case MemoryPressure.MEDIUM:
        return Math.max(2, Math.floor(defaultBuffer * 0.75));
      case MemoryPressure.LOW:
        return Math.floor(defaultBuffer * 0.9);
      default:
        return defaultBuffer;
    }
  }

  /**
   * Calculate recommended concurrent renders based on memory
   *
   * @param defaultConcurrent Default concurrent count
   * @param pressure Current memory pressure
   * @returns Recommended concurrent count
   */
  static getRecommendedConcurrentRenders(
    defaultConcurrent: number,
    pressure: MemoryPressure
  ): number {
    switch (pressure) {
      case MemoryPressure.CRITICAL:
      case MemoryPressure.HIGH:
        return 1; // One at a time
      case MemoryPressure.MEDIUM:
        return Math.max(1, Math.floor(defaultConcurrent * 0.5));
      default:
        return defaultConcurrent;
    }
  }

  /**
   * Estimate memory usage for a page
   *
   * @param width Page width in pixels
   * @param height Page height in pixels
   * @param scale Render scale
   * @returns Estimated memory in MB
   */
  static estimatePageMemory(width: number, height: number, scale: number): number {
    const pixels = width * scale * height * scale;
    // 4 bytes per pixel (RGBA) + overhead
    const bytes = pixels * 4 * 1.5; // 1.5x for overhead
    return bytes / (1024 * 1024);
  }

  /**
   * Check if there's enough memory for an operation
   *
   * @param requiredMB Required memory in MB
   * @returns True if operation should proceed
   */
  canAllocate(requiredMB: number): boolean {
    const stats = this.getMemoryStats();

    if (!stats) {
      // Conservative: allow if no stats available and requirement is reasonable
      return requiredMB < this.config.fallbackMemoryLimit;
    }

    const availableMB =
      (stats.jsHeapSizeLimit - stats.usedJSHeapSize) / (1024 * 1024);

    return availableMB >= requiredMB * 1.2; // 20% safety margin
  }

  /**
   * Log current memory status
   */
  logStatus(): void {
    // Method kept for backward compatibility but does nothing
  }

  /**
   * Clean up resources
   */
  destroy(): void {
    this.stopMonitoring();
    this.pressureCallbacks = [];
  }
}
