/*
  Copyright 2025 Aman Kumar

  Licensed under the Apache License, Version 2.0 (the "License");
  You may not use this file except in compliance with the License.
  You may obtain a copy of the License at

      http://www.apache.org/licenses/LICENSE-2.0

  Unless required by applicable law or agreed to in writing, software
  distributed under the License is distributed on an "AS IS" BASIS,
  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
  See the License for the specific language governing permissions and
  limitations under the License.
*/

import { PDF_VIEWER_CLASSNAMES, PDF_VIEWER_IDS } from '../constants/pdf-viewer-selectors';

class WebUiUtils {
  static showLoading() {
    // Create loading element
    const loadingElement = document.createElement('div');
    loadingElement.classList.add('loading');

    // Create spinner element
    const spinner = document.createElement('div');
    spinner.classList.add('spinner');

    // Append spinner to loading element
    loadingElement.appendChild(spinner);

    // Append loading element to container
    const container = document.createElement('div');
    container.setAttribute('id', PDF_VIEWER_IDS.LOADING_CONTAINER);
    container.appendChild(loadingElement);

    return loadingElement;
  }

  static hideLoading(loadingElement: HTMLElement, containerId: string) {
    const pdfContainer = document.querySelector(`#${containerId} .${PDF_VIEWER_CLASSNAMES.A_PDF_VIEWER}`);
    if (pdfContainer) {
      pdfContainer.classList.remove(PDF_VIEWER_CLASSNAMES.PDF_LOADING);
    }
    if (loadingElement && loadingElement.parentNode) {
      loadingElement.parentNode.removeChild(loadingElement);
    }
  }

  /**
   * Updates the loading spinner to show real-time progress percentage.
   * @param loadingElement The loading element returned by showLoading().
   * @param containerId The container id where the loading is shown.
   * @param percent The progress percentage (number or string).
   */
  static updateLoadingProgress(loadingElement: HTMLElement, containerId: string, percent: number | string) {
    if (!loadingElement) return;

    // Try to find or create a progress text element inside the loading element
    let progressText = loadingElement.querySelector(`#${containerId} .loading-progress-per`) as HTMLElement;
    if (!progressText) {
      progressText = document.createElement('div');
      progressText.className = 'loading-progress-per';
      // Style for visibility (optional, can be moved to CSS)
      progressText.style.marginTop = '20px';
      progressText.style.fontSize = '16px';
      progressText.style.fontWeight = '600';
      progressText.style.color = '#555';
      progressText.style.textAlign = 'center';
      loadingElement.appendChild(progressText);
    }

    // Clamp percent to [0, 100] and format
    let percentValue = typeof percent === 'string' ? parseFloat(percent) : percent;
    if (isNaN(percentValue)) percentValue = 0;
    percentValue = Math.max(0, Math.min(100, percentValue));
    progressText.textContent = `Loading ${percentValue}%`;
  }

  /**
   * Helper function to parse query string (e.g. ?param1=value&param2=...).
   * @param {string} query
   * @returns {Map}
   */
  static parseQueryString(query: any) {
    const params = new Map();
    for (const [key, value] of new URLSearchParams(query)) {
      params.set(key.toLowerCase(), value);
    }
    return params;
  }
}
class InstanceWebUiUtils {
  /**
   * Creates instance-scoped loading element
   * @param instanceId - The unique instance identifier
   * @param containerId - The container ID where loading will be shown
   */
  static showLoading(instanceId: string, containerId: string) {
    // Create loading element with instance-specific ID
    const loadingElement = document.createElement('div');
    loadingElement.classList.add('loading');
    loadingElement.setAttribute('data-instance', instanceId);

    // Create spinner element
    const spinner = document.createElement('div');
    spinner.classList.add('spinner');
    loadingElement.appendChild(spinner);

    // Create container with instance-specific ID
    const container = document.createElement('div');
    container.setAttribute('id', `${PDF_VIEWER_IDS.LOADING_CONTAINER}-${instanceId}`);
    container.setAttribute('data-instance', instanceId);
    container.classList.add('pdf-loading-overlay');
    container.appendChild(loadingElement);

    return loadingElement;
  }

  /**
   * Hides instance-scoped loading element
   */
  static hideLoading(loadingElement: HTMLElement, containerId: string, instanceId: string) {
    const pdfContainer = document.querySelector(`#${containerId} .${PDF_VIEWER_CLASSNAMES.A_PDF_VIEWER}`);
    if (pdfContainer) {
      pdfContainer.classList.remove(PDF_VIEWER_CLASSNAMES.PDF_LOADING);
    }

    // Remove the loading element
    if (loadingElement && loadingElement.parentNode) {
      loadingElement.parentNode.removeChild(loadingElement);
    }
  }

  /**
   * Updates loading progress for specific instance
   */
  static updateLoadingProgress(loadingElement: HTMLElement, containerId: string, percent: number | string = 0, instanceId: string) {
    if (!loadingElement) return;

    let progressText = loadingElement.querySelector('.loading-progress-per') as HTMLElement;
    if (!progressText) {
      progressText = document.createElement('div');
      progressText.className = 'loading-progress-per';
      progressText.setAttribute('data-instance', instanceId);

      // Style for visibility
      progressText.style.marginTop = '20px';
      progressText.style.fontSize = '16px';
      progressText.style.fontWeight = '600';
      progressText.style.color = '#555';
      progressText.style.textAlign = 'center';

      loadingElement.appendChild(progressText);
    }

    // Update progress
    let percentValue = typeof percent === 'string' ? parseFloat(percent) : percent;
    if (isNaN(percentValue)) percentValue = 0;
    percentValue = Math.max(0, Math.min(100, percentValue));
    progressText.textContent = `Loading ${percentValue}%`;
  }

  /**
   * Creates instance-scoped global UI element (like progress indicators)
   */
  static createGlobalElement(instanceId: string, elementType: string, className?: string): HTMLElement {
    const elementId = `pdf-${elementType}-${instanceId}`;

    // Remove any existing element for this instance
    const existing = document.getElementById(elementId);
    if (existing) {
      existing.remove();
    }

    // Create new scoped element
    const element = document.createElement('div');
    element.id = elementId;
    element.setAttribute('data-instance', instanceId);
    element.setAttribute('data-pdf-element', elementType);

    if (className) {
      element.className = className;
    }

    return element;
  }

  /**
   * Query string parser (no changes needed - doesn't interact with DOM)
   */
  static parseQueryString(query: any) {
    const params = new Map();
    for (const [key, value] of new URLSearchParams(query)) {
      params.set(key.toLowerCase(), value);
    }
    return params;
  }

  /**
   * Clean up all instance-specific UI elements
   */
  static cleanupInstance(instanceId: string): void {
    // Remove all elements belonging to this instance
    const instanceElements = document.querySelectorAll(`[data-instance="${instanceId}"]`);
    instanceElements.forEach((element) => {
      if (element.parentNode) {
        element.parentNode.removeChild(element);
      }
    });
  }
}

/**
 * Scrolls an element into view with better control to prevent unnecessary page jumps.
 * Only scrolls if the element is not fully visible in the viewport.
 * Uses container-aware scrolling to avoid affecting the main page.
 *
 * @param element - The element to scroll into view
 * @param options - Scroll options
 * @param options.block - Vertical alignment: 'start', 'center', 'end', 'nearest'
 * @param options.inline - Horizontal alignment: 'start', 'center', 'end', 'nearest'
 * @param options.force - Whether to force scrolling even if element is already visible
 * @param options.container - Optional container to scroll within (defaults to element's scrollable parent)
 */
export function scrollElementIntoView(
  element: Element,
  options: {
    block?: 'start' | 'center' | 'end' | 'nearest';
    inline?: 'start' | 'center' | 'end' | 'nearest';
    force?: boolean;
    container?: Element;
  } = {},
): void {
  const { block = 'nearest', inline = 'nearest', force = false, container } = options;

  if (!element || !element.getBoundingClientRect) {
    return;
  }

  // Find the scrollable container (either provided or auto-detected)
  const scrollContainer = container || findScrollableParent(element);

  if (!scrollContainer) {
    // Fallback to native scrollIntoView if no scrollable container found
    element.scrollIntoView({ behavior: 'instant', block, inline });
    return;
  }

  // Get element position relative to the scroll container
  const elementRect = element.getBoundingClientRect();
  const containerRect = scrollContainer.getBoundingClientRect();

  // Calculate if element is visible within the container
  const isVisibleInContainer =
    elementRect.top >= containerRect.top && elementRect.bottom <= containerRect.bottom && elementRect.left >= containerRect.left && elementRect.right <= containerRect.right;

  // Only scroll if forced or not visible in container
  if (!force && isVisibleInContainer) {
    return;
  }

  // Calculate scroll position to bring element into view
  let scrollTop = scrollContainer.scrollTop;
  let scrollLeft = scrollContainer.scrollLeft;

  if (block === 'center') {
    // Center the element vertically in the container
    const elementHeight = elementRect.height;
    const containerHeight = containerRect.height;
    const elementTop = elementRect.top - containerRect.top;
    scrollTop += elementTop - containerHeight / 2 + elementHeight / 2;
  } else if (block === 'start') {
    // Align element to top of container
    const elementTop = elementRect.top - containerRect.top;
    scrollTop += elementTop;
  } else if (block === 'end') {
    // Align element to bottom of container
    const elementHeight = elementRect.height;
    const containerHeight = containerRect.height;
    const elementTop = elementRect.top - containerRect.top;
    scrollTop += elementTop - containerHeight + elementHeight;
  } else if (block === 'nearest') {
    // Only scroll if element is not visible
    if (elementRect.top < containerRect.top) {
      scrollTop += elementRect.top - containerRect.top;
    } else if (elementRect.bottom > containerRect.bottom) {
      scrollTop += elementRect.bottom - containerRect.bottom;
    }
  }

  if (inline === 'center') {
    // Center the element horizontally in the container
    const elementWidth = elementRect.width;
    const containerWidth = containerRect.width;
    const elementLeft = elementRect.left - containerRect.left;
    scrollLeft += elementLeft - containerWidth / 2 + elementWidth / 2;
  } else if (inline === 'start') {
    // Align element to left of container
    const elementLeft = elementRect.left - containerRect.left;
    scrollLeft += elementLeft;
  } else if (inline === 'end') {
    // Align element to right of container
    const elementWidth = elementRect.width;
    const containerWidth = containerRect.width;
    const elementLeft = elementRect.left - containerRect.left;
    scrollLeft += elementLeft - containerWidth + elementWidth;
  } else if (inline === 'nearest') {
    // Only scroll if element is not visible
    if (elementRect.left < containerRect.left) {
      scrollLeft += elementRect.left - containerRect.left;
    } else if (elementRect.right > containerRect.right) {
      scrollLeft += elementRect.right - containerRect.right;
    }
  }

  // Apply the scroll position
  scrollContainer.scrollTo({
    top: scrollTop,
    left: scrollLeft,
    behavior: 'instant',
  });
}

/**
 * Finds the nearest scrollable parent element
 */
function findScrollableParent(element: Element): Element | null {
  let parent = element.parentElement;

  while (parent) {
    const style = window.getComputedStyle(parent);
    const overflow = style.overflow + style.overflowX + style.overflowY;

    if (overflow.includes('scroll') || overflow.includes('auto')) {
      return parent;
    }

    parent = parent.parentElement;
  }

  return null;
}

export { InstanceWebUiUtils, WebUiUtils };
