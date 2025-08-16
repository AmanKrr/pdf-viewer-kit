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

import { PDF_VIEWER_CLASSNAMES } from '../../../constants/pdf-viewer-selectors';

/**
 * Base class for all toolbar components
 * Provides consistent lifecycle management and DOM operations
 */
export abstract class ToolbarComponent {
  protected element!: HTMLElement;
  protected isVisible = false;
  protected isDestroyed = false;

  constructor() {}

  /**
   * Create the component's DOM element
   */
  protected abstract createElement(): HTMLElement;

  /**
   * Initialize the component after DOM creation
   */
  protected abstract initialize(): void;

  /**
   * Render the component into a container
   */
  render(container: HTMLElement): void {
    if (this.isDestroyed) {
      throw new Error('Cannot render destroyed component');
    }

    // Create element if it doesn't exist
    if (!this.element) {
      this.element = this.createElement();
    }

    if (!this.element.parentElement) {
      container.appendChild(this.element);
      this.initialize();
    }
  }

  /**
   * Show the component
   */
  show(): void {
    if (this.isDestroyed) return;
    this.element.style.display = 'block';
    this.isVisible = true;
  }

  /**
   * Hide the component
   */
  hide(): void {
    if (this.isDestroyed) return;
    this.element.style.display = 'none';
    this.isVisible = false;
  }

  /**
   * Toggle component visibility
   */
  toggle(): void {
    if (this.isVisible) {
      this.hide();
    } else {
      this.show();
    }
  }

  /**
   * Get the component's DOM element
   */
  getElement(): HTMLElement {
    if (!this.element) {
      this.element = this.createElement();
    }
    return this.element;
  }

  /**
   * Check if component is visible
   */
  getVisible(): boolean {
    return this.isVisible;
  }

  /**
   * Add CSS classes to the component
   */
  addClass(...classes: string[]): void {
    this.element.classList.add(...classes);
  }

  /**
   * Remove CSS classes from the component
   */
  removeClass(...classes: string[]): void {
    this.element.classList.remove(...classes);
  }

  /**
   * Check if component has a specific class
   */
  hasClass(className: string): boolean {
    return this.element.classList.contains(className);
  }

  /**
   * Set component attributes
   */
  setAttribute(name: string, value: string): void {
    this.element.setAttribute(name, value);
  }

  /**
   * Get component attribute value
   */
  getAttribute(name: string): string | null {
    return this.element.getAttribute(name);
  }

  /**
   * Remove component attribute
   */
  removeAttribute(name: string): void {
    this.element.removeAttribute(name);
  }

  /**
   * Set component styles
   */
  setStyle(property: string, value: string): void {
    (this.element.style as any)[property] = value;
  }

  /**
   * Get component style value
   */
  getStyle(property: string): string {
    return (this.element.style as any)[property];
  }

  /**
   * Remove component style
   */
  removeStyle(property: string): void {
    this.element.style.removeProperty(property);
  }

  /**
   * Add event listener to component
   */
  addEventListener(type: string, listener: EventListener, options?: AddEventListenerOptions): void {
    this.element.addEventListener(type, listener, options);
  }

  /**
   * Remove event listener from component
   */
  removeEventListener(type: string, listener: EventListener, options?: EventListenerOptions): void {
    this.element.removeEventListener(type, listener, options);
  }

  /**
   * Destroy the component and clean up resources
   */
  destroy(): void {
    if (this.isDestroyed) return;

    this.isDestroyed = true;
    this.element.remove();
    this.onDestroy();
  }

  /**
   * Override this method to add custom cleanup logic
   */
  protected onDestroy(): void {
    // Override in subclasses
  }

  /**
   * Create a wrapper element with consistent styling
   */
  protected createWrapper(className?: string): HTMLDivElement {
    const wrapper = document.createElement('div');
    wrapper.classList.add(PDF_VIEWER_CLASSNAMES.A_TOOLBAR_ITEM);
    if (className) {
      wrapper.classList.add(className);
    }
    return wrapper;
  }

  /**
   * Add a visual separator
   */
  addSeparator(): HTMLElement {
    const separator = document.createElement('div');
    separator.classList.add('a-toolbar-separator');
    separator.style.width = '1px';
    separator.style.height = '20px';
    separator.style.background = '#ccc';
    separator.style.margin = '0 8px';
    return separator;
  }
}
