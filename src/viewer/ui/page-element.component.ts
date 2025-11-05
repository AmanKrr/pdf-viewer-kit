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
import { InstanceCanvasPool } from '../../core/canvas-pool.core';
import baseCss from '../../index.css?inline';

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

  static addGoogleFontLink(shadowRoot: ShadowRoot) {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200';
    shadowRoot.appendChild(link);
  }

  /**
   * Creates main container elements with instance scoping
   */
  static containerCreation(containerId: string, scale: number, instanceId: string) {
    const rootContainer = document.getElementById(containerId);
    if (!rootContainer) {
      throw new Error(`Container with ID "${containerId}" not found`);
    }

    // Always use Shadow DOM for isolation
    const shadowRoot = rootContainer.shadowRoot || rootContainer.attachShadow({ mode: 'open' });
    // Ensure the shadow host fills the container
    (rootContainer as HTMLElement).style.display = (rootContainer as HTMLElement).style.display || 'block';
    (rootContainer as HTMLElement).style.width = (rootContainer as HTMLElement).style.width || '100%';
    (rootContainer as HTMLElement).style.height = (rootContainer as HTMLElement).style.height || '100%';

    // add google fonts
    this.addGoogleFontLink(shadowRoot);

    // Adopt core CSS into the shadow root for encapsulated styling
    const coreStyle = document.createElement('style');
    // In Shadow DOM, :host and :host, * selectors are needed for root styling.
    // html, body selectors do not match anything in shadow root.
    // So, use :host and * for global font and sizing.
    coreStyle.textContent = `
      :host, * {
        margin: 0;
        padding: 0;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;
        box-sizing: border-box;
      }
      :host {
        width: 100%;
        height: 100%;
        display: block;
        -webkit-font-smoothing: antialiased;
        -moz-osx-font-smoothing: grayscale;
      }
      ${baseCss}
    `;
    shadowRoot.appendChild(coreStyle);

    let targetDocument: Document = document;
    let mountRoot: HTMLElement | null = shadowRoot as unknown as HTMLElement;

    const pdfParentViewer = targetDocument.createElement('div');
    pdfParentViewer.className = `${PDF_VIEWER_CLASSNAMES.A_PDF_VIEWER} pdf-loading`;

    pdfParentViewer.setAttribute('data-instance', instanceId);

    const toolbarParent = targetDocument.createElement('div');
    toolbarParent.classList.add(...[PDF_VIEWER_CLASSNAMES.A_TOOLBAR_ITEMS, PDF_VIEWER_CLASSNAMES.A_TOOLBAR_CONTAINER]);
    toolbarParent.id = `${PDF_VIEWER_IDS.TOOLBAR_CONTAINER}-${instanceId}`;

    const groupOneParent = targetDocument.createElement('div');
    groupOneParent.id = `${PDF_VIEWER_IDS.TOOLBAR_GROUP_ONE}-${instanceId}`;
    groupOneParent.classList.add(PDF_VIEWER_CLASSNAMES.TOOLBAR_GROUP);
    toolbarParent.appendChild(groupOneParent);

    const groupTwoParent = targetDocument.createElement('div');
    groupTwoParent.id = `${PDF_VIEWER_IDS.TOOLBAR_GROUP_TWO}-${instanceId}`;
    groupTwoParent.classList.add(PDF_VIEWER_CLASSNAMES.TOOLBAR_GROUP);
    toolbarParent.appendChild(groupTwoParent);

    const pageParentViewer = targetDocument.createElement('div');
    pageParentViewer.classList.add(PDF_VIEWER_CLASSNAMES.A_VIEWER_CONTAINER);
    pageParentViewer.id = `${PDF_VIEWER_IDS.MAIN_VIEWER_CONTAINER}-${instanceId}`;
    pageParentViewer.setAttribute('data-instance', instanceId);

    const pageContainer = targetDocument.createElement('div');
    pageContainer.classList.add(PDF_VIEWER_CLASSNAMES.A_PAGE_CONTAINER);
    pageContainer.id = `${PDF_VIEWER_IDS.MAIN_PAGE_VIEWER_CONTAINER}-${instanceId}`;
    pageContainer.style.setProperty('--scale-factor', String(scale));
    pageContainer.setAttribute('data-instance', instanceId);

    pageParentViewer.appendChild(pageContainer);
    pdfParentViewer.appendChild(toolbarParent);

    const wrapper = targetDocument.createElement('div');
    wrapper.classList.add(PDF_VIEWER_CLASSNAMES.A_VIEWER_WRAPPER);
    wrapper.setAttribute('data-instance', instanceId);
    wrapper.appendChild(pageParentViewer);
    pdfParentViewer.appendChild(wrapper);

    mountRoot!.appendChild(pdfParentViewer);

    return {
      parent: pdfParentViewer,
      viewerContainer: pageParentViewer,
      pagesContainer: pageContainer,
      injectElementId: `${PDF_VIEWER_IDS.MAIN_PAGE_VIEWER_CONTAINER}-${instanceId}`,
      shadowRoot: shadowRoot,
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
  static cleanupInstance(contaierId: string, instanceId: string): void {
    const instanceElements = document.getElementById(contaierId)?.shadowRoot?.querySelectorAll(`[data-instance="${instanceId}"]`);
    instanceElements?.forEach((element) => {
      if (element.parentNode) {
        element.parentNode.removeChild(element);
      }
    });
  }
}

export default PageElement;
