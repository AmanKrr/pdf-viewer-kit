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
 * PDF Rendering Engine
 *
 * Decoupled, testable modules for PDF page rendering.
 *
 * Architecture:
 * - VirtualizationEngine: Pure math logic (no DOM dependencies)
 * - RenderScheduler: Async task management (priority queue, cancellation)
 * - PageDomAdapter: DOM manipulation layer (the only place that touches DOM)
 * - PageRenderer: PDF.js rendering operations (base, high-res, bitmaps)
 * - ScaleManager: Zoom/scale change handling (CSS updates, re-rendering)
 * - MemoryManager: Memory pressure detection and management
 *
 * Benefits:
 * - Each module is independently testable
 * - Clear separation of concerns
 * - Easy to swap rendering strategies
 * - No tight coupling between logic and DOM
 * - Performance optimizations isolated
 */

// VirtualizationEngine exports
export {
  VirtualizationEngine,
  type VirtualizationConfig,
  type PageDimensions,
  type ViewportCalculation,
  type ViewportState,
} from './virtualization-engine';

// RenderScheduler exports
export {
  RenderScheduler,
  debounce,
  throttle,
  type RenderTask,
  type RenderSchedulerConfig,
  type RenderResult,
  type RenderTaskExecutor,
} from './render-scheduler';

// PageDomAdapter exports
export {
  PageDomAdapter,
  type PageDomAdapterConfig,
  type PageWrapperElement,
  type PageWrapperOptions,
} from './page-dom-adapter';

// PageRenderer exports
export {
  PageRenderer,
  type CanvasPool,
  type RenderQuality,
  type BaseRenderOptions,
  type HighResRenderOptions,
  type RenderResult as PageRenderResult,
} from './page-renderer';

// ScaleManager exports
export {
  ScaleManager,
  type PageScaleInfo,
  type ScaleChangeOptions,
  type LayerResizeCallback,
} from './scale-manager';

// MemoryManager exports
export {
  MemoryManager,
  MemoryPressure,
  type MemoryStats,
  type WebGLCapabilities,
  type MemoryManagerConfig,
  type MemoryPressureCallback,
} from './memory-manager';
