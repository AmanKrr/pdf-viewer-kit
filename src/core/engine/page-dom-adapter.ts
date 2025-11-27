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

import type { PageDimensions } from './virtualization-engine';

/**
 * PageDomAdapter - DOM Manipulation Layer
 *
 * This module is the ONLY place that touches the DOM for page rendering.
 * It handles creating, updating, and removing page elements from the DOM.
 *
 * Responsibilities:
 * - Page wrapper creation/pooling/recycling
 * - Applying styles (width, height, transform, position)
 * - Appending/removing page elements
 * - Canvas/image element management
 * - Text layer DOM creation
 * - Annotation layer DOM creation
 *
 * This module abstracts all DOM operations, making the rest of the code testable.
 */

/**
 * Configuration for page DOM adapter
 */
export interface PageDomAdapterConfig {
  /** Instance ID for unique element IDs */
  instanceId: string;

  /** Container ID for the viewer */
  containerId: string;

  /** Gap between pages in pixels */
  pageGap: number;

  /** Maximum number of page wrappers to pool */
  maxPooledWrappers: number;

  /** CSS class prefix for page elements */
  classPrefix?: string;
}

/**
 * Represents a page wrapper element in the DOM
 */
export interface PageWrapperElement {
  /** The page number this wrapper represents */
  pageNumber: number;

  /** The actual HTMLDivElement wrapper */
  element: HTMLDivElement;

  /** Canvas element for rendering (if present) */
  canvas?: HTMLCanvasElement;

  /** High-res image element (if present) */
  image?: HTMLImageElement;

  /** Text layer container (if present) */
  textLayer?: HTMLDivElement;

  /** Annotation layer container (if present) */
  annotationLayer?: HTMLDivElement;

  /** Whether this wrapper is currently in use */
  inUse: boolean;
}

/**
 * Options for creating or updating a page wrapper
 */
export interface PageWrapperOptions {
  pageNumber: number;
  width: number;
  height: number;
  top: number;
  left: number;
  scale: number;
}

/**
 * PageDomAdapter
 *
 * Manages all DOM operations for page rendering.
 * Implements object pooling for page wrapper elements.
 */
export class PageDomAdapter {
  private config: PageDomAdapterConfig;
  private wrapperPool: PageWrapperElement[] = [];
  private activeWrappers = new Map<number, PageWrapperElement>();
  private pagesParentDiv: HTMLElement;
  private scrollableContainer: HTMLElement;

  constructor(
    pagesParentDiv: HTMLElement,
    scrollableContainer: HTMLElement,
    config: PageDomAdapterConfig
  ) {
    this.pagesParentDiv = pagesParentDiv;
    this.scrollableContainer = scrollableContainer;
    this.config = {
      classPrefix: 'pdf-page',
      ...config,
    };

    this.initializePool();
  }

  /**
   * Initialize the wrapper pool
   */
  private initializePool(): void {
    for (let i = 0; i < this.config.maxPooledWrappers; i++) {
      const wrapper = this.createFreshWrapper();
      // Append to DOM with display: none (original behavior)
      wrapper.element.style.display = 'none';
      wrapper.element.classList.add('recycled-page-wrapper');
      this.pagesParentDiv.appendChild(wrapper.element);
      this.wrapperPool.push(wrapper);
    }
  }

  /**
   * Create a new page wrapper element
   */
  private createFreshWrapper(): PageWrapperElement {
    const element = document.createElement('div');
    element.className = `${this.config.classPrefix}-wrapper`;
    element.style.position = 'absolute';
    element.style.boxSizing = 'border-box';

    return {
      pageNumber: -1,
      element,
      inUse: false,
    };
  }

  /**
   * Get or create a page wrapper for a specific page
   *
   * @param options Page wrapper options
   * @returns Page wrapper element
   */
  getOrCreateWrapper(options: PageWrapperOptions): PageWrapperElement {
    // Check if wrapper already exists for this page
    const existing = this.activeWrappers.get(options.pageNumber);
    if (existing) {
      this.updateWrapper(existing, options);
      return existing;
    }

    // Get wrapper from pool or create new one
    let wrapper = this.wrapperPool.find((w) => !w.inUse);

    if (!wrapper) {
      // Pool exhausted, create new transient wrapper
      wrapper = this.createFreshWrapper();
      wrapper.element.classList.add('transient-page-wrapper');
      // Transient wrappers need to be appended
      this.pagesParentDiv.appendChild(wrapper.element);
    }

    // Configure wrapper
    wrapper.pageNumber = options.pageNumber;
    wrapper.inUse = true;

    // Update wrapper properties
    this.updateWrapper(wrapper, options);

    // Add to active wrappers
    this.activeWrappers.set(options.pageNumber, wrapper);

    // Make wrapper visible (toggle display)
    wrapper.element.style.display = '';
    wrapper.element.classList.remove('recycled-page-wrapper');
    wrapper.element.classList.add('pooled-page-wrapper');

    return wrapper;
  }

  /**
   * Update a wrapper's properties
   */
  private updateWrapper(wrapper: PageWrapperElement, options: PageWrapperOptions): void {
    const { element } = wrapper;

    element.setAttribute('data-page-number', String(options.pageNumber));
    element.style.width = `${options.width}px`;
    element.style.height = `${options.height}px`;
    element.style.top = `${options.top}px`;
    // Don't set left - flexbox centering handles horizontal alignment
    // element.style.left = `${options.left}px`;
  }

  /**
   * Remove a page wrapper from the DOM and return it to the pool
   *
   * @param pageNumber Page number to remove
   * @returns True if wrapper was removed
   */
  removeWrapper(pageNumber: number): boolean {
    const wrapper = this.activeWrappers.get(pageNumber);
    if (!wrapper) return false;

    // Clean up wrapper content
    this.cleanupWrapper(wrapper);

    // Check if this is a pooled wrapper or transient
    const isPooled = this.wrapperPool.includes(wrapper);

    if (isPooled) {
      // Pooled wrapper: Hide it (don't remove from DOM)
      wrapper.element.style.display = 'none';
      wrapper.element.classList.remove('pooled-page-wrapper');
      wrapper.element.classList.add('recycled-page-wrapper');
    } else {
      // Transient wrapper: Remove from DOM completely
      if (wrapper.element.parentElement) {
        wrapper.element.parentElement.removeChild(wrapper.element);
      }
    }

    // Mark as available
    wrapper.inUse = false;
    wrapper.pageNumber = -1;

    // Remove from active wrappers
    this.activeWrappers.delete(pageNumber);

    return true;
  }

  /**
   * Clean up all content in a wrapper
   */
  private cleanupWrapper(wrapper: PageWrapperElement): void {
    // Remove all child elements
    while (wrapper.element.firstChild) {
      wrapper.element.removeChild(wrapper.element.firstChild);
    }

    // Clear references
    wrapper.canvas = undefined;
    wrapper.image = undefined;
    wrapper.textLayer = undefined;
    wrapper.annotationLayer = undefined;

    // Reset styles
    wrapper.element.className = `${this.config.classPrefix}-wrapper`;
    wrapper.element.style.backgroundColor = '';
  }

  /**
   * Set a page wrapper as placeholder (low-res state)
   *
   * @param pageNumber Page number
   * @param backgroundColor Background color for placeholder
   */
  setPlaceholder(pageNumber: number, backgroundColor = '#f0f0f0'): void {
    const wrapper = this.activeWrappers.get(pageNumber);
    if (!wrapper) return;

    wrapper.element.classList.add('page-placeholder');
    wrapper.element.style.backgroundColor = backgroundColor;
  }

  /**
   * Remove placeholder state from a wrapper
   *
   * @param pageNumber Page number
   */
  removePlaceholder(pageNumber: number): void {
    const wrapper = this.activeWrappers.get(pageNumber);
    if (!wrapper) return;

    wrapper.element.classList.remove('page-placeholder');
    wrapper.element.style.backgroundColor = '';
  }

  /**
   * Attach a canvas element to a page wrapper
   *
   * @param pageNumber Page number
   * @param canvas Canvas element
   * @param containerId Optional container ID for the canvas
   */
  attachCanvas(pageNumber: number, canvas: HTMLCanvasElement, containerId?: string): void {
    const wrapper = this.activeWrappers.get(pageNumber);
    if (!wrapper) return;

    // Create container div if ID is specified
    if (containerId) {
      const container = document.createElement('div');
      container.id = `${containerId}-${this.config.instanceId}`;
      container.className = `${this.config.classPrefix}-canvas-container`;
      container.style.position = 'relative';
      container.appendChild(canvas);
      wrapper.element.appendChild(container);
    } else {
      wrapper.element.appendChild(canvas);
    }

    wrapper.canvas = canvas;
  }

  /**
   * Attach a high-res image element to a page wrapper
   *
   * @param pageNumber Page number
   * @param image Image element
   * @param containerId Optional container ID for the image
   */
  attachImage(pageNumber: number, image: HTMLImageElement, containerId?: string): void {
    const wrapper = this.activeWrappers.get(pageNumber);
    if (!wrapper) return;

    // Create container div if ID is specified
    if (containerId) {
      const container = document.createElement('div');
      container.id = `${containerId}-${this.config.instanceId}`;
      container.className = `${this.config.classPrefix}-image-container`;
      container.style.position = 'absolute';
      container.style.top = '0';
      container.style.left = '0';
      container.appendChild(image);
      wrapper.element.appendChild(container);
    } else {
      wrapper.element.appendChild(image);
    }

    wrapper.image = image;
  }

  /**
   * Create and attach a text layer container
   *
   * @param pageNumber Page number
   * @returns The created text layer div
   */
  createTextLayer(pageNumber: number): HTMLDivElement | null {
    const wrapper = this.activeWrappers.get(pageNumber);
    if (!wrapper) return null;

    const textLayer = document.createElement('div');
    textLayer.className = `${this.config.classPrefix}-text-layer`;
    textLayer.style.position = 'absolute';
    textLayer.style.top = '0';
    textLayer.style.left = '0';
    textLayer.style.right = '0';
    textLayer.style.bottom = '0';
    textLayer.style.overflow = 'hidden';
    textLayer.style.opacity = '0.2';
    textLayer.style.lineHeight = '1.0';

    wrapper.element.appendChild(textLayer);
    wrapper.textLayer = textLayer;

    return textLayer;
  }

  /**
   * Create and attach an annotation layer container
   *
   * @param pageNumber Page number
   * @returns The created annotation layer div
   */
  createAnnotationLayer(pageNumber: number): HTMLDivElement | null {
    const wrapper = this.activeWrappers.get(pageNumber);
    if (!wrapper) return null;

    const annotationLayer = document.createElement('div');
    annotationLayer.className = `${this.config.classPrefix}-annotation-layer`;
    annotationLayer.style.position = 'absolute';
    annotationLayer.style.top = '0';
    annotationLayer.style.left = '0';
    annotationLayer.style.right = '0';
    annotationLayer.style.bottom = '0';
    annotationLayer.style.pointerEvents = 'none';

    wrapper.element.appendChild(annotationLayer);
    wrapper.annotationLayer = annotationLayer;

    return annotationLayer;
  }

  /**
   * Get a wrapper by page number
   *
   * @param pageNumber Page number
   * @returns Wrapper element or undefined
   */
  getWrapper(pageNumber: number): PageWrapperElement | undefined {
    return this.activeWrappers.get(pageNumber);
  }

  /**
   * Check if a wrapper exists for a page
   *
   * @param pageNumber Page number
   * @returns True if wrapper exists
   */
  hasWrapper(pageNumber: number): boolean {
    return this.activeWrappers.has(pageNumber);
  }

  /**
   * Get all active wrapper page numbers
   *
   * @returns Array of page numbers
   */
  getActivePageNumbers(): number[] {
    return Array.from(this.activeWrappers.keys());
  }

  /**
   * Update the total content dimensions
   *
   * @param width Total width in pixels
   * @param height Total height in pixels
   */
  setContentDimensions(width: number, height: number): void {
    this.pagesParentDiv.style.width = `${width}px`;
    this.pagesParentDiv.style.height = `${height}px`;
  }

  /**
   * Get the current scroll position
   *
   * @returns Scroll top position in pixels
   */
  getScrollTop(): number {
    return this.scrollableContainer.scrollTop;
  }

  /**
   * Get the container dimensions
   *
   * @returns Container width and height
   */
  getContainerDimensions(): { width: number; height: number } {
    const rect = this.scrollableContainer.getBoundingClientRect();
    return {
      width: rect.width,
      height: rect.height,
    };
  }

  /**
   * Scroll to a specific page
   *
   * @param pageNumber Page number to scroll to
   * @param pagePositions Map of page positions
   * @param smooth Use smooth scrolling
   */
  scrollToPage(
    pageNumber: number,
    pagePositions: Map<number, PageDimensions>,
    smooth = false
  ): void {
    const position = pagePositions.get(pageNumber);
    if (!position) return;

    this.scrollableContainer.scrollTo({
      top: position.top - this.config.pageGap,
      behavior: smooth ? 'smooth' : 'auto',
    });
  }

  /**
   * Add a CSS class to a wrapper
   *
   * @param pageNumber Page number
   * @param className CSS class name
   */
  addWrapperClass(pageNumber: number, className: string): void {
    const wrapper = this.activeWrappers.get(pageNumber);
    if (wrapper) {
      wrapper.element.classList.add(className);
    }
  }

  /**
   * Remove a CSS class from a wrapper
   *
   * @param pageNumber Page number
   * @param className CSS class name
   */
  removeWrapperClass(pageNumber: number, className: string): void {
    const wrapper = this.activeWrappers.get(pageNumber);
    if (wrapper) {
      wrapper.element.classList.remove(className);
    }
  }

  /**
   * Clean up all wrappers and the pool
   */
  destroy(): void {
    // Remove all active wrappers
    this.activeWrappers.forEach((wrapper) => {
      this.cleanupWrapper(wrapper);
      if (wrapper.element.parentElement) {
        wrapper.element.parentElement.removeChild(wrapper.element);
      }
    });

    this.activeWrappers.clear();
    this.wrapperPool = [];
  }
}
