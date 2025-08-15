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
import { InstanceCanvasPool } from '../../core/InstanceCanvasPool';

/**
 * Utility class for managing and creating elements related to rendering PDF pages.
 */
class PageElement {
  public static gap = 15;

  /**
   * Creates or updates a container div for a PDF page with instance scoping
   */
  static createOrUpdatePageContainerDiv(
    pageNumber: number,
    viewport: PageViewport,
    pagePositionInfo: Map<number, number>,
    instanceId: string,
    recycleDiv?: HTMLDivElement,
  ): HTMLDivElement {
    const div = recycleDiv || document.createElement('div');

    if (recycleDiv) {
      while (div.firstChild) {
        div.removeChild(div.firstChild);
      }
    }

    div.style.position = 'absolute';
    div.style.top = `${pagePositionInfo.get(pageNumber) || 0}px`;

    div.id = `pageContainer-${instanceId}-${pageNumber}`;
    div.className = PDF_VIEWER_CLASSNAMES.A_PAGE_VIEW;
    div.style.height = `${viewport.height}px`;
    div.style.width = `${viewport.width}px`;
    div.style.backgroundColor = 'var(--web-pdf-viewer-page-background-color, white)';
    div.setAttribute('data-page-number', pageNumber.toString());

    div.setAttribute('data-instance', instanceId);
    div.setAttribute('data-pdf-page', 'true');

    return div;
  }

  /**
   * Retrieves canvas from instance-specific canvas pool
   */
  static getCanvasFromPool(viewport: PageViewport, canvasPool: InstanceCanvasPool): [HTMLCanvasElement, CanvasRenderingContext2D] {
    return canvasPool.getCanvas(viewport.width, viewport.height);
  }

  /**
   * Releases canvas back to instance-specific pool
   */
  static releaseCanvasToPool(canvas: HTMLCanvasElement, canvasPool: InstanceCanvasPool): void {
    canvasPool.releaseCanvas(canvas);
  }

  /**
   * Creates main container elements with instance scoping
   */
  static containerCreation(containerId: string, scale: number, instanceId: string) {
    const pdfParentViewer = document.createElement('div');
    pdfParentViewer.className = `${PDF_VIEWER_CLASSNAMES.A_PDF_VIEWER} pdf-loading`;

    pdfParentViewer.setAttribute('data-instance', instanceId);

    const toolbarParent = document.createElement('div');
    toolbarParent.classList.add(...[PDF_VIEWER_CLASSNAMES.A_TOOLBAR_ITEMS, PDF_VIEWER_CLASSNAMES.A_TOOLBAR_CONTAINER]);
    toolbarParent.id = `${PDF_VIEWER_IDS.TOOLBAR_CONTAINER}-${instanceId}`;

    const groupOneParent = document.createElement('div');
    groupOneParent.id = `${PDF_VIEWER_IDS.TOOLBAR_GROUP_ONE}-${instanceId}`;
    groupOneParent.classList.add(PDF_VIEWER_CLASSNAMES.TOOLBAR_GROUP);
    toolbarParent.appendChild(groupOneParent);

    const groupTwoParent = document.createElement('div');
    groupTwoParent.id = `${PDF_VIEWER_IDS.TOOLBAR_GROUP_TWO}-${instanceId}`;
    groupTwoParent.classList.add(PDF_VIEWER_CLASSNAMES.TOOLBAR_GROUP);
    toolbarParent.appendChild(groupTwoParent);

    const pageParentViewer = document.createElement('div');
    pageParentViewer.classList.add(PDF_VIEWER_CLASSNAMES.A_VIEWER_CONTAINER);
    pageParentViewer.id = `${PDF_VIEWER_IDS.MAIN_VIEWER_CONTAINER}-${instanceId}`;
    pageParentViewer.setAttribute('data-instance', instanceId);

    const pageContainer = document.createElement('div');
    pageContainer.classList.add(PDF_VIEWER_CLASSNAMES.A_PAGE_CONTAINER);
    pageContainer.id = `${PDF_VIEWER_IDS.MAIN_PAGE_VIEWER_CONTAINER}-${instanceId}`;
    pageContainer.style.setProperty('--scale-factor', String(scale));
    pageContainer.setAttribute('data-instance', instanceId);

    pageParentViewer.appendChild(pageContainer);
    pdfParentViewer.appendChild(toolbarParent);

    const wrapper = document.createElement('div');
    wrapper.classList.add(PDF_VIEWER_CLASSNAMES.A_VIEWER_WRAPPER);
    wrapper.setAttribute('data-instance', instanceId);
    wrapper.appendChild(pageParentViewer);
    pdfParentViewer.appendChild(wrapper);

    const container = document.getElementById(containerId);
    if (!container) {
      throw new Error(`Container with ID "${containerId}" not found`);
    }

    container.appendChild(pdfParentViewer);

    return {
      parent: pdfParentViewer,
      viewerContainer: pageParentViewer,
      pagesContainer: pageContainer,
      injectElementId: `${PDF_VIEWER_IDS.MAIN_PAGE_VIEWER_CONTAINER}-${instanceId}`,
    };
  }

  /**
   * Creates layer with instance-scoped ID
   */
  static createLayers(classNames: string, baseId: string, viewport: PageViewport, instanceId: string, pageNumber?: number): HTMLDivElement {
    const layerDiv = document.createElement('div');
    layerDiv.className = classNames;

    const scopedId = pageNumber ? `${baseId}-${instanceId}-page-${pageNumber}` : `${baseId}-${instanceId}`;
    layerDiv.id = scopedId;

    layerDiv.style.width = `${viewport.width}px`;
    layerDiv.style.height = `${viewport.height}px`;
    layerDiv.style.position = 'absolute';
    layerDiv.style.left = '0';
    layerDiv.style.top = '0';

    layerDiv.setAttribute('data-instance', instanceId);
    if (pageNumber) {
      layerDiv.setAttribute('data-page-number', pageNumber.toString());
    }

    return layerDiv;
  }

  /**
   * Helper method to generate scoped selectors for finding elements
   */
  static getScopedSelector(instanceId: string, selector: string): string {
    return `[data-instance="${instanceId}"] ${selector}`;
  }

  /**
   * Clean up all elements for a specific instance
   */
  static cleanupInstance(instanceId: string): void {
    const instanceElements = document.querySelectorAll(`[data-instance="${instanceId}"]`);
    instanceElements.forEach((element) => {
      if (element.parentNode) {
        element.parentNode.removeChild(element);
      }
    });
  }
}

export default PageElement;
