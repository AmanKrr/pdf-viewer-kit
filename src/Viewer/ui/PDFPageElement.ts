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

import { PageViewport } from 'pdfjs-dist';
import { PDF_VIEWER_CLASSNAMES, PDF_VIEWER_IDS } from '../../constants/pdf-viewer-selectors';

/**
 * A utility class for managing and creating various elements related to rendering PDF pages in a viewer.
 */
class PageElement {
  /** The gap between consecutive pages in the viewer. */
  public static gap = 15;

  /**
   * Creates a container `<div>` element for a PDF page.
   *
   * @param {number} pageNumber - The page number to create a container for.
   * @param {PageViewport} viewport - The viewport object representing the page dimensions.
   * @param {Map<number, number>} pagePositionInfo - A map storing page positions.
   * @returns {HTMLDivElement} The created page container element.
   */
  static createPageContainerDiv(pageNumber: number, viewport: PageViewport, pagePositionInfo: Map<number, number>): HTMLDivElement {
    const div = document.createElement('div');

    // Apply necessary styles
    div.style.position = 'absolute';
    div.style.top = `${pagePositionInfo.get(pageNumber)}px`;

    div.id = `pageContainer-${pageNumber}`;
    div.classList.add(PDF_VIEWER_CLASSNAMES.A_PAGE_VIEW);

    // Set page container dimensions
    div.style.height = `${viewport.height}px`;
    div.style.width = `${viewport.width}px`;

    return div;
  }

  /**
   * Creates a `<canvas>` element for rendering a PDF page.
   *
   * @param {PageViewport} viewport - The viewport object representing the page dimensions.
   * @returns {[HTMLCanvasElement, CanvasRenderingContext2D]} A tuple containing the created canvas and its rendering context.
   */
  static createCanvas(viewport: PageViewport): [HTMLCanvasElement, CanvasRenderingContext2D] {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d')!;
    const ratio = window.devicePixelRatio || 1;

    // Set canvas dimensions considering device pixel ratio
    canvas.width = viewport.width * ratio;
    canvas.height = viewport.height * ratio;
    canvas.style.width = `${viewport.width}px`;
    canvas.style.height = `${viewport.height}px`;

    // Scale the canvas to match pixel density for high-quality rendering
    context.scale(ratio, ratio);

    return [canvas, context];
  }

  /**
   * Creates the main container elements required for the PDF viewer.
   *
   * @param {string} containerId - The ID of the parent container where the viewer will be appended.
   * @param {number} scale - The scale factor to be applied to the viewer.
   * @returns {object} An object containing references to the created container elements.
   */
  static containerCreation(containerId: string, scale: number) {
    // Create the parent container for the PDF viewer
    const pdfParentViewer = document.createElement('div');
    pdfParentViewer.setAttribute('class', `${PDF_VIEWER_CLASSNAMES.A_PDF_VIEWER} pdf-loading`);

    // Create the toolbar container
    const toolbarParent = document.createElement('div');
    toolbarParent.classList.add(PDF_VIEWER_CLASSNAMES.A_TOOLBAR_ITEMS);
    toolbarParent.setAttribute('id', PDF_VIEWER_IDS.TOOLBAR_CONTAINER);

    // Create and append toolbar groups
    const groupOneParent = document.createElement('div');
    groupOneParent.setAttribute('id', PDF_VIEWER_IDS.TOOLBAR_GROUP_ONE);
    groupOneParent.classList.add(PDF_VIEWER_CLASSNAMES.TOOLBAR_GROUP);
    toolbarParent.appendChild(groupOneParent);

    const groupTwoParent = document.createElement('div');
    groupTwoParent.setAttribute('id', PDF_VIEWER_IDS.TOOLBAR_GROUP_TWO);
    groupTwoParent.classList.add(PDF_VIEWER_CLASSNAMES.TOOLBAR_GROUP);
    toolbarParent.appendChild(groupTwoParent);

    // Create the main page viewer container
    const pageParentViewer = document.createElement('div');
    pageParentViewer.classList.add(PDF_VIEWER_CLASSNAMES.A_VIEWER_CONTAINER);
    pageParentViewer.setAttribute('id', PDF_VIEWER_IDS.MAIN_VIEWER_CONTAINER);

    // Create an inner container that will hold all the pages
    const pageContainer = document.createElement('div');
    pageContainer.classList.add(PDF_VIEWER_CLASSNAMES.A_PAGE_CONTAINER);
    pageContainer.setAttribute('id', PDF_VIEWER_IDS.MAIN_PAGE_VIEWER_CONTAINER);
    pageContainer.style.setProperty('--scale-factor', String(scale));

    // Append page container to the page viewer
    pageParentViewer.appendChild(pageContainer);
    pdfParentViewer.appendChild(toolbarParent);

    // Create a wrapper to hold the sidebar and page viewer
    const sidebarAndPageViewerWrapper = document.createElement('div');
    sidebarAndPageViewerWrapper.classList.add(PDF_VIEWER_CLASSNAMES.A_VIEWER_WRAPPER);
    sidebarAndPageViewerWrapper.appendChild(pageParentViewer);
    pdfParentViewer.appendChild(sidebarAndPageViewerWrapper);

    // Append the main PDF viewer container to the specified wrapper container
    const wrapperContainer = document.getElementById(containerId)!;
    wrapperContainer.appendChild(pdfParentViewer);

    return {
      parent: pdfParentViewer,
      injectElementId: PDF_VIEWER_IDS.MAIN_PAGE_VIEWER_CONTAINER,
    };
  }

  /**
   * Creates layer elements (e.g., text, annotation layers) for a PDF page.
   *
   * @param {string} classNames - The class names to be assigned to the layer.
   * @param {string} ids - The ID to be assigned to the layer.
   * @param {PageViewport} viewport - The viewport object representing the page dimensions.
   * @returns {HTMLDivElement} The created layer `<div>` element.
   */
  static createLayers(classNames: string, ids: string, viewport: PageViewport): HTMLDivElement {
    const layerDiv = document.createElement('div');

    layerDiv.className = classNames;
    layerDiv.setAttribute('id', ids);
    layerDiv.style.width = `${viewport.width}px`;
    layerDiv.style.height = `${viewport.height}px`;

    return layerDiv;
  }
}

export default PageElement;
