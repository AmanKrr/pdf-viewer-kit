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

import { aPdfViewerClassNames, aPdfViewerIds } from '../constant/ElementIdClass';

/**
 * Utility class for managing UI-related tasks in the PDF Viewer.
 * Provides functions for showing/hiding loading indicators,
 * handling page visibility, and rendering pages.
 */
class WebUiUtils {
  /**
   * Displays a loading spinner inside the viewer container.
   *
   * @returns {HTMLElement} The loading element that can be later removed when loading completes.
   */
  static showLoading(): HTMLElement {
    // Create the loading element
    const loadingElement = document.createElement('div');
    loadingElement.classList.add('loading');

    // Create and append a spinner to the loading element
    const spinner = document.createElement('div');
    spinner.classList.add('spinner');
    loadingElement.appendChild(spinner);

    // Create and append a container for the loading spinner
    const container = document.createElement('div');
    container.setAttribute('id', aPdfViewerIds._LOADING_CONTAINER);
    container.appendChild(loadingElement);

    return loadingElement;
  }

  /**
   * Hides and removes the loading spinner from the viewer.
   *
   * @param {HTMLElement} loadingElement - The loading element to be removed.
   * @param {string} containerId - The container ID where the loading spinner is located.
   */
  static hideLoading(loadingElement: HTMLElement, containerId: string): void {
    const pdfContainer = document.querySelector(`#${containerId} .${aPdfViewerClassNames._A_PDF_VIEWER}`);

    // Remove the loading class from the PDF container
    if (pdfContainer) {
      pdfContainer.classList.remove(aPdfViewerClassNames._PDF_LOADING);
    }

    // Remove the loading element from the DOM
    if (loadingElement?.parentNode) {
      loadingElement.parentNode.removeChild(loadingElement);
    }
  }

  /**
   * Sets up an intersection observer to detect visible pages in the viewer.
   * Calls the provided callback function when a page becomes visible.
   *
   * @param {(pageNumber: number) => void} callback - Callback function to execute when a page is visible.
   * @param {string} containerId - The container ID where the PDF pages are rendered.
   */
  static Observer(callback: (pageNumber: number) => void, containerId: string): void {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            // Extract the page number from the page container's ID
            const pageNumber = entry.target.id.split('-')[1];
            callback(parseInt(pageNumber));
          }
        });
      },
      { threshold: 0.1 }, // Adjust threshold as needed
    );

    // Select all page containers within the specified PDF viewer container
    const pageContainers = document.querySelectorAll(`#${containerId} .${aPdfViewerClassNames._A_PAGE_VIEW}`);

    // Observe each page container
    pageContainers.forEach((pageContainer) => {
      observer.observe(pageContainer);
    });
  }

  /**
   * Parses a query string into a Map object.
   *
   * @param {string} query - The query string (e.g., "?param1=value&param2=...").
   * @returns {Map<string, string>} A map of key-value pairs parsed from the query string.
   */
  static parseQueryString(query: string): Map<string, string> {
    const params = new Map<string, string>();

    // Iterate over each query parameter and store it in the map
    for (const [key, value] of new URLSearchParams(query)) {
      params.set(key.toLowerCase(), value);
    }

    return params;
  }

  /**
   * Retrieves an array of currently visible pages within the PDF viewer.
   *
   * @param {any} pdfInstance - The PDF.js instance.
   * @returns {number[]} An array containing the numbers of visible pages.
   */
  public static getVisiblePages(pdfInstance: any): number[] {
    const pageViewerContainer = document.getElementById(aPdfViewerIds._MAIN_VIEWER_CONTAINER);
    if (!pageViewerContainer) return [];

    const containerRect = pageViewerContainer.getBoundingClientRect();
    const visiblePages: number[] = [];

    // Iterate through all pages and check their visibility
    for (let pageIndex = 1; pageIndex <= pdfInstance.numPages; pageIndex++) {
      const pageContainer = document.getElementById(`pageContainer-${pageIndex}`);
      if (!pageContainer) continue;

      const pageRect = pageContainer.getBoundingClientRect();

      // Check if the page is within the viewport
      if (pageRect.bottom > containerRect.top && pageRect.top < containerRect.bottom) {
        visiblePages.push(pageIndex);
      }
    }

    return visiblePages;
  }

  /**
   * Renders a specific PDF page onto a canvas within the viewer.
   *
   * @param {any} pdfInstance - The PDF.js instance.
   * @param {number} pageIndex - The index of the page to be rendered.
   * @param {number} scale - The scale factor for rendering.
   * @param {number} devicePixelRatio - The device pixel ratio for high-DPI rendering.
   * @returns {Promise<void>} A promise that resolves once the page is rendered.
   */
  public static async renderPage(pdfInstance: any, pageIndex: number, scale: number, devicePixelRatio: number): Promise<void> {
    const pageContainer = document.getElementById(`pageContainer-${pageIndex}`);
    if (!pageContainer) return;

    // Retrieve the PDF page from the document
    const pdfPage = await pdfInstance.getPage(pageIndex);
    const viewport = pdfPage.getViewport({ scale });

    // Update the container dimensions
    pageContainer.style.width = `${viewport.width}px`;
    pageContainer.style.height = `${viewport.height}px`;

    // Retrieve the canvas inside the page container
    const canvas = pageContainer.querySelector('canvas');
    if (!canvas) return;

    const canvasContext = canvas.getContext('2d');
    if (!canvasContext) return;

    // Adjust canvas dimensions for high-resolution rendering
    canvas.width = viewport.width * devicePixelRatio;
    canvas.height = viewport.height * devicePixelRatio;
    canvas.style.width = `${viewport.width}px`;
    canvas.style.height = `${viewport.height}px`;

    // Scale the canvas for high-DPI displays
    canvasContext.scale(devicePixelRatio, devicePixelRatio);

    // Render the page onto the canvas
    const renderContext = {
      canvasContext,
      viewport,
      annotationMode: 2, // Enable annotation layer rendering
    };

    await pdfPage.render(renderContext).promise;
  }
}

export default WebUiUtils;
