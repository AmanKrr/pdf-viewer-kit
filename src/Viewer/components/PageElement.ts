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
import { aPdfViewerClassNames, aPdfViewerIds } from '../../constant/ElementIdClass';

class PageElement {
  public static gap = 15;

  /**
   * Creates a container div for a PDF page.
   * @param pageNumber - The page number.
   * @param viewport - The viewport of the page.
   * @param containerMainBoundingBox - The bounding box of the main container.
   * @param specificPage - The specific page number to render.
   * @returns The created container div.
   */
  static createPageContainerDiv(pageNumber: number, viewport: PageViewport, pagePositionInfo: Map<number, number>): HTMLDivElement {
    const div = document.createElement('div');

    // styles
    div.style.position = 'absolute';
    div.style.top = `${pagePositionInfo.get(pageNumber)}px`;

    div.id = `pageContainer-${pageNumber}`;
    div.classList.add(aPdfViewerClassNames._A_PAGE_VIEW);

    let height: string = `${viewport.height}px`;
    let width: string = `${viewport.width}px`;

    // Height and widht of current page container.
    div.style.height = height;
    div.style.width = width;
    return div;
  }

  /**
   * Creates a canvas element for rendering a PDF page.
   * @param viewport - The viewport of the page.
   * @returns The created canvas element.
   */
  static createCanvas(viewport: PageViewport): [HTMLCanvasElement, CanvasRenderingContext2D] {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d')!;
    const ratio = window.devicePixelRatio || 1;

    canvas.width = viewport.width * ratio;
    canvas.height = viewport.height * ratio;
    canvas.style.width = `${viewport.width}px`;
    canvas.style.height = `${viewport.height}px`;

    context.scale(ratio, ratio); // Scale the canvas to match pixel density.
    return [canvas, context];
  }

  /**
   * Creates container elements for the PDF viewer.
   * @param containerId - The ID of the container element.
   * @returns An object containing references to the created container elements.
   */
  static containerCreation(containerId: string, scale: number) {
    // Create parent container for the PDF viewer.
    const pdfParentViewer = document.createElement('div');
    pdfParentViewer.setAttribute('class', aPdfViewerClassNames._A_PDF_VIEWER + ' pdf-loading');

    // Create toolbar container.
    const toolbarParent = document.createElement('div');
    toolbarParent.classList.add(aPdfViewerClassNames._A_TOOLBAR_ITEMS);
    toolbarParent.setAttribute('id', aPdfViewerIds._TOOLBAR_CONTAINER);

    // Create main page viewer container.
    const pageParentViewer = document.createElement('div');
    pageParentViewer.classList.add(aPdfViewerClassNames._A_VIEWER_CONTAINER);
    pageParentViewer.setAttribute('id', aPdfViewerIds._MAIN_VIEWER_CONTAINER);

    // Create inner page viewer container containing all the pages.
    const pageContainer = document.createElement('div');
    pageContainer.classList.add(aPdfViewerClassNames._A_PAGE_CONTAINER);
    pageContainer.setAttribute('id', aPdfViewerIds._MAIN_PAGE_VIEWER_CONTAINER);
    pageContainer.style.setProperty('--scale-factor', String(scale));

    // Append containers to parent container.
    pageParentViewer.appendChild(pageContainer);
    pdfParentViewer.appendChild(toolbarParent);

    const sidebarAndPageViewerWrapper = document.createElement('div');
    sidebarAndPageViewerWrapper.classList.add(aPdfViewerClassNames._A_VIEWER_WRAPPER);
    sidebarAndPageViewerWrapper.appendChild(pageParentViewer);
    pdfParentViewer.appendChild(sidebarAndPageViewerWrapper);

    // Append parent container to specified wrapper container.
    const wrapperContainer = document.getElementById(containerId)!;
    wrapperContainer.appendChild(pdfParentViewer);

    // Return references to the created container elements.
    return {
      parent: pdfParentViewer,
      injectElementId: aPdfViewerIds._MAIN_PAGE_VIEWER_CONTAINER,
    };
  }

  static createLayers(classNames: string, ids: string, viewport: PageViewport) {
    const layerDiv = document.createElement('div');
    layerDiv.className = classNames;
    layerDiv.setAttribute('id', ids);
    layerDiv.style.width = `${viewport.width}px`;
    layerDiv.style.height = `${viewport.height}px`;

    return layerDiv;
  }
}

export default PageElement;
