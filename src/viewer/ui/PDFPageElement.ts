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
import CanvasPool from './CanvasPool';

/**
 * Utility class for managing and creating elements related to rendering PDF pages.
 */
class PageElement {
  public static gap = 15;
  private static _canvasPool: CanvasPool | null = null;

  /**
   * Initializes PageElement with a CanvasPool instance.
   * Must be called once before using canvas-related methods.
   * @param canvasPoolInstance The global CanvasPool instance.
   */
  static init(canvasPoolInstance: CanvasPool): void {
    this._canvasPool = canvasPoolInstance;
  }

  /**
   * Creates or updates a container `<div>` element for a PDF page.
   * Intended to be recycled by the PageVirtualization logic.
   *
   * @param pageNumber The page number.
   * @param viewport The viewport of the page.
   * @param pagePositionInfo Map of page numbers to their top positions.
   * @param recycleDiv An optional existing div to reuse.
   * @returns The configured page container element.
   */
  static createOrUpdatePageContainerDiv(pageNumber: number, viewport: PageViewport, pagePositionInfo: Map<number, number>, recycleDiv?: HTMLDivElement): HTMLDivElement {
    const div = recycleDiv || document.createElement('div');

    if (recycleDiv) {
      while (div.firstChild) {
        div.removeChild(div.firstChild);
      }
    }

    div.style.position = 'absolute';
    div.style.top = `${pagePositionInfo.get(pageNumber) || 0}px`;
    div.id = `pageContainer-${pageNumber}`;
    div.className = PDF_VIEWER_CLASSNAMES.A_PAGE_VIEW;
    div.style.height = `${viewport.height}px`;
    div.style.width = `${viewport.width}px`;
    div.style.backgroundColor = 'var(--web-pdf-viewer-page-background-color, white)';
    div.setAttribute('data-page-number', pageNumber.toString());

    return div;
  }

  /**
   * Retrieves a canvas and its context from the canvas pool for rendering.
   *
   * @param viewport The viewport object representing the page dimensions.
   * @returns A tuple containing the canvas element and its 2D rendering context.
   * @throws If the CanvasPool has not been initialized.
   */
  static getCanvasFromPool(viewport: PageViewport): [HTMLCanvasElement, CanvasRenderingContext2D] {
    if (!this._canvasPool) {
      throw new Error('CanvasPool not initialized in PageElement. Call PageElement.init() first.');
    }
    return this._canvasPool.getCanvas(viewport.width, viewport.height);
  }

  /**
   * Releases a canvas back to the CanvasPool for reuse.
   *
   * @param canvas The canvas element to release.
   */
  static releaseCanvasToPool(canvas: HTMLCanvasElement): void {
    if (!this._canvasPool) return;
    this._canvasPool.releaseCanvas(canvas);
  }

  /**
   * Creates the main container elements required for the PDF viewer.
   * Called once during viewer setup.
   *
   * @param containerId The ID of the parent container where the viewer will be appended.
   * @param scale The initial scale factor.
   * @returns An object with references to the created container elements.
   */
  static containerCreation(containerId: string, scale: number) {
    const pdfParentViewer = document.createElement('div');
    pdfParentViewer.className = `${PDF_VIEWER_CLASSNAMES.A_PDF_VIEWER} pdf-loading`;

    const toolbarParent = document.createElement('div');
    toolbarParent.classList.add(PDF_VIEWER_CLASSNAMES.A_TOOLBAR_ITEMS);
    toolbarParent.id = PDF_VIEWER_IDS.TOOLBAR_CONTAINER;

    const groupOneParent = document.createElement('div');
    groupOneParent.id = PDF_VIEWER_IDS.TOOLBAR_GROUP_ONE;
    groupOneParent.classList.add(PDF_VIEWER_CLASSNAMES.TOOLBAR_GROUP);
    toolbarParent.appendChild(groupOneParent);

    const groupTwoParent = document.createElement('div');
    groupTwoParent.id = PDF_VIEWER_IDS.TOOLBAR_GROUP_TWO;
    groupTwoParent.classList.add(PDF_VIEWER_CLASSNAMES.TOOLBAR_GROUP);
    toolbarParent.appendChild(groupTwoParent);

    const pageParentViewer = document.createElement('div');
    pageParentViewer.classList.add(PDF_VIEWER_CLASSNAMES.A_VIEWER_CONTAINER);
    pageParentViewer.id = PDF_VIEWER_IDS.MAIN_VIEWER_CONTAINER;

    const pageContainer = document.createElement('div');
    pageContainer.classList.add(PDF_VIEWER_CLASSNAMES.A_PAGE_CONTAINER);
    pageContainer.id = PDF_VIEWER_IDS.MAIN_PAGE_VIEWER_CONTAINER;
    pageContainer.style.setProperty('--scale-factor', String(scale));

    pageParentViewer.appendChild(pageContainer);
    pdfParentViewer.appendChild(toolbarParent);

    const wrapper = document.createElement('div');
    wrapper.classList.add(PDF_VIEWER_CLASSNAMES.A_VIEWER_WRAPPER);
    wrapper.appendChild(pageParentViewer);
    pdfParentViewer.appendChild(wrapper);

    document.getElementById(containerId)!.appendChild(pdfParentViewer);

    return {
      parent: pdfParentViewer,
      viewerContainer: pageParentViewer,
      pagesContainer: pageContainer,
      injectElementId: PDF_VIEWER_IDS.MAIN_PAGE_VIEWER_CONTAINER,
    };
  }

  /**
   * Creates a layer `<div>` element (e.g., text or annotation layer) for a PDF page.
   *
   * @param classNames CSS class names for the layer.
   * @param ids The ID attribute for the layer.
   * @param viewport The viewport defining layer size.
   * @returns The created layer `<div>` element.
   */
  static createLayers(classNames: string, ids: string, viewport: PageViewport): HTMLDivElement {
    const layerDiv = document.createElement('div');
    layerDiv.className = classNames;
    layerDiv.id = ids;
    layerDiv.style.width = `${viewport.width}px`;
    layerDiv.style.height = `${viewport.height}px`;
    layerDiv.style.position = 'absolute';
    layerDiv.style.left = '0';
    layerDiv.style.top = '0';
    return layerDiv;
  }
}

export default PageElement;
