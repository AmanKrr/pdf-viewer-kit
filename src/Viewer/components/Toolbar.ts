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

import { aPdfViewerClassNames, aPdfViewerIds } from '../../constant/ElementIdClass';
import WebUiUtils from '../../utils/WebUiUtils';
import PdfState from './PdfState';
import WebViewer from './WebViewer';

/**
 * Manages the toolbar functionality for the PDF viewer, including navigation, zoom, and additional tools.
 */
class Toolbar {
  private toolbar!: ToolbarOptions;
  private toolbarClass!: ToolbarClass;
  private toolbarConfig: ToolbarButtonConfig[];
  private _viewer!: WebViewer;
  private __pdfState!: PdfState;

  /**
   * Constructs the toolbar for the PDF viewer.
   *
   * @param {string} containerId - The ID of the container where the toolbar will be added.
   * @param {ToolbarButtonConfig[]} customToolbarItems - An array of custom toolbar items.
   * @param {WebViewer} webViewer - The WebViewer instance to control the PDF viewer.
   */
  constructor(containerId: string, customToolbarItems: ToolbarButtonConfig[] | [], webViewer: WebViewer) {
    this._viewer = webViewer;
    this.__pdfState = PdfState.getInstance(containerId);

    // Initialize default toolbar options
    this.toolbar = {
      firstPage: true,
      previousPage: true,
      nextPage: true,
      lastPage: true,
      pageNumber: true,
      zoomIn: true,
      zoomOut: true,
      rotate: false,
      print: false,
      download: false,
      search: false,
      thumbnail: false,
      annotation: {
        signature: false,
        drawing: false,
        stamp: false,
        circle: false,
        rectangle: true,
        line: false,
      },
    };

    // Initialize toolbar class names
    this.toolbarClass = {
      firstPage: 'a-first-page-container',
      previousPage: 'a-previous-page-container',
      nextPage: 'a-next-page-container',
      lastPage: 'a-last-page-container',
      pageNumber: 'a-page-number-container',
      zoomIn: 'a-zoom-in-container',
      zoomOut: 'a-zoom-out-container',
      rotate: 'a-rotate-container',
      print: 'a-print-container',
      download: 'a-download-container',
      search: 'a-search-container',
      thumbnail: 'a-thumbnail-view-container',
      annotation: {
        signature: '',
        drawing: '',
        stamp: '',
        circle: '',
        rectangle: 'a-rectangle-container',
        line: '',
      },
    };

    this.toolbarConfig = customToolbarItems.length ? customToolbarItems : this.getToolbarData();
    this.renderToolbar();
  }

  /**
   * Sets new toolbar options.
   *
   * @param {Partial<ToolbarOptions>} options - The updated toolbar options.
   */
  public setToolbar(options: Partial<ToolbarOptions> = {}): void {
    this.toolbar = { ...this.toolbar, ...options };
    this.renderToolbar(); // Re-render the toolbar with updated options
  }

  /**
   * Retrieves the current toolbar options.
   *
   * @returns {ToolbarOptions} The current toolbar settings.
   */
  public getToolbar(): ToolbarOptions {
    return this.toolbar;
  }

  /**
   * Removes the toolbar from the viewer.
   */
  public removeToolbar(): void {
    this.toolbar = {} as ToolbarOptions;
  }

  /**
   * Retrieves the default toolbar configuration.
   *
   * @returns {ToolbarButtonConfig[]} An array of toolbar button configurations.
   */
  public getToolbarData(): ToolbarButtonConfig[] {
    return [
      {
        id: 'thumbnailBtn',
        label: 'View thumbnail',
        icon: 'view-thumbnail',
        onClick: (viewer: WebViewer) => this._viewer.toogleThumbnailViewer(),
        hide: false,
        class: this.toolbarClass['thumbnail'] + '-icon',
        group: 1,
      },
      {
        id: 'firstPage',
        label: 'First Page',
        icon: 'first-page-icon',
        onClick: (viewer: WebViewer) => this._viewer.firstPage(),
        hide: false,
        isSeparatorBefore: true,
        class: this.toolbarClass['firstPage'] + '-icon',
        group: 1,
      },
      {
        id: 'previousPage',
        label: 'Previous Page',
        icon: 'previous-page-icon',
        onClick: (viewer: WebViewer) => this._viewer.previousPage(),
        hide: false,
        class: this.toolbarClass['previousPage'] + '-icon',
        group: 1,
      },
      {
        id: 'nextPage',
        label: 'Next Page',
        icon: 'next-page-icon',
        onClick: (viewer: WebViewer) => this._viewer.nextPage(),
        hide: false,
        class: this.toolbarClass['nextPage'] + '-icon',
        group: 1,
      },
      {
        id: 'lastPage',
        label: 'Last Page',
        icon: 'last-page-icon',
        onClick: (viewer: WebViewer) => this._viewer.lastPage(),
        hide: false,
        class: this.toolbarClass['lastPage'] + '-icon',
        group: 1,
      },
      {
        id: 'pageNumber',
        label: 'Page Number',
        type: 'custom', // Indicates a special rendering type
        render: () => Toolbar.renderPageNumberControls(this._viewer),
        onClick: (p) => console.log('clicked'),
        hide: false,
        group: 1,
      },
      {
        id: 'zoomIn',
        label: 'Zoom In',
        icon: 'zoom-in-icon',
        onClick: (viewer: WebViewer) => this._viewer.zoomIn(),
        isSeparatorBefore: true,
        hide: false,
        class: this.toolbarClass['zoomIn'] + '-icon',
        group: 1,
      },
      {
        id: 'zoomOut',
        label: 'Zoom Out',
        icon: 'zoom-out-icon',
        onClick: (viewer: WebViewer) => this._viewer.zoomOut(),
        class: this.toolbarClass['zoomOut'] + '-icon',
        hide: false,
        group: 1,
      },
      {
        id: 'annotation',
        label: 'Annotate',
        icon: 'annotate-icon',
        onClick: () => {
          // this._viewer.search();
          const container = document.querySelector(`#${this.__pdfState.containerId} #pageContainer-${this.__pdfState.currentPage} #a-annotate-layer`);
          if (container) {
            (container as HTMLElement).style.pointerEvents = 'all';
            const annotationManager = this.__pdfState.getAnnotationManager(this.__pdfState.currentPage); // Assuming page 1 for now
            if (!annotationManager) {
              this.__pdfState.createAnnotationLayer(this.__pdfState.currentPage, container as HTMLElement);
              const currentPageManager = this.__pdfState.getAnnotationManager(this.__pdfState.currentPage);
              currentPageManager?.setPointerEvent('all');
              currentPageManager?.createRectangle('transparent', 'red', 2, 'solid');
            } else {
              annotationManager?.setPointerEvent('all');
              annotationManager?.createRectangle('transparent', 'red', 2, 'solid');
            }
          }
        },
        class: 'a-annotation-container-icon',
        hide: false,
        group: 2,
      },
      {
        id: 'search',
        label: 'Search',
        icon: 'search-icon',
        onClick: () => {
          this._viewer.search();
        },
        class: this.toolbarClass['search'] + '-icon',
        hide: false,
        group: 2,
      },
      {
        id: 'download',
        label: 'Download',
        icon: 'download-icon',
        onClick: (viewer: WebViewer) => this._viewer.zoomOut(),
        class: this.toolbarClass['download'] + '-icon',
        hide: true,
        group: 2,
      },
    ];
  }

  /**
   * Renders the toolbar and adds the buttons based on the current configuration.
   */
  private renderToolbar(): void {
    const toolbarContainerGroupOne = document.querySelector(`#${this.__pdfState.containerId} #toolbarContainer #${aPdfViewerIds._TOOLBAR_GROUP_1}`) as HTMLElement;
    const toolbarContainerGroupTwo = document.querySelector(`#${this.__pdfState.containerId} #toolbarContainer #${aPdfViewerIds._TOOLBAR_GROUP_2}`) as HTMLElement;
    if (!toolbarContainerGroupOne || !toolbarContainerGroupTwo) return;

    toolbarContainerGroupOne.textContent = ''; // Clear existing toolbar
    toolbarContainerGroupTwo.textContent = ''; // Clear existing toolbar

    this.toolbarConfig.forEach((item) => {
      if (item.hide) return;
      const container = item.group === 1 ? toolbarContainerGroupOne : toolbarContainerGroupTwo;

      if (item.isSeparatorBefore) {
        this.addSeparator(container);
      }

      if (item.type === 'custom' && item.render) {
        container.appendChild(item.render(this));
      } else {
        const button = this.createToolbarButton(item);
        const parentWrapper = this.parentWrapper(item);
        parentWrapper.appendChild(button);
        container.appendChild(parentWrapper);
      }
    });

    WebUiUtils.hideLoading(this.__pdfState.uiLoading, this.__pdfState.containerId);
  }

  /**
   * Creates a button element for the toolbar.
   *
   * @param {ToolbarButtonConfig} config - The button configuration.
   * @returns {HTMLElement} The created button element.
   */
  private createToolbarButton(config: ToolbarButtonConfig): HTMLElement {
    const button = document.createElement('button');
    button.classList.add('a-toolbar-button');

    const icon = document.createElement('span');
    icon.setAttribute('class', `a-toolbar-icon ${config.class}`);
    button.appendChild(icon);

    button.addEventListener('click', () => config.onClick(this._viewer));
    return button;
  }

  /**
   * Creates a wrapper element for the toolbar button.
   *
   * @param {any} config - The button configuration.
   * @returns {HTMLElement} The wrapper element.
   */
  private parentWrapper(config: any): HTMLElement {
    const wrapper = document.createElement('div');
    wrapper.setAttribute(
      'class',
      `${aPdfViewerClassNames['_A_TOOLBAR_ITEM']} ${aPdfViewerClassNames['_A_TOOLBAR_TOOLTIP']} ${config?.key ? (this.toolbarClass as any)[config['key']] : ''}`.trim(),
    );
    return wrapper;
  }

  /**
   * Adds a separator element between toolbar buttons.
   *
   * @param {HTMLElement} parent - The parent element where the separator is added.
   */
  private addSeparator(parent: HTMLElement): void {
    const separator = document.createElement('div');
    separator.classList.add('a-toolbar-item-separator');
    parent.appendChild(separator);
  }

  /**
   * Creates and renders the page number controls for the toolbar.
   * This includes:
   * - An input field for the user to enter a specific page number.
   * - A "of" label indicating the total number of pages.
   *
   * @param {WebViewer} viewer - The WebViewer instance controlling the PDF viewer.
   * @returns {HTMLElement} The container element containing the page number input and total page count.
   */
  private static renderPageNumberControls(viewer: WebViewer): HTMLElement {
    // Create the main container for the page number input
    const pageInputContainer = document.createElement('div');
    pageInputContainer.setAttribute('id', aPdfViewerIds._INPUT_PAGE_NUMBER);
    pageInputContainer.setAttribute('class', aPdfViewerClassNames._A_PAGE_INPUT_CONTAINER);

    // Create the input field for the current page number
    const pageInputField = document.createElement('input');
    pageInputField.setAttribute('type', 'number');
    pageInputField.setAttribute('id', aPdfViewerIds._CURRENT_PAGE_INPUT);
    pageInputField.setAttribute('class', aPdfViewerClassNames._A_CURRENT_PAGE_NUMBER_INPUT_FIELD);
    pageInputField.setAttribute('autocomplete', 'off');
    pageInputField.setAttribute('aria-label', 'Current page number');
    pageInputField.value = String(viewer.currentPageNumber);

    // Attach event handlers for input changes and key press events
    pageInputField.oninput = (e) => viewer.toolbarButtonClick('currentPageNumber', e);
    pageInputField.onkeydown = (e) => viewer.toolbarButtonClick('currentPageNumber', e);

    // Append the input field to the page input container
    pageInputContainer.appendChild(pageInputField);

    // Create the "of" text container to separate input and total page count
    const pageOfContainer = document.createElement('div');
    const ofPara = document.createElement('p');
    ofPara.textContent = 'of';
    pageOfContainer.appendChild(ofPara);

    // Create the total pages container to display the total number of pages
    const totalPageContainer = document.createElement('div');
    const totalPagePara = document.createElement('p');
    totalPagePara.textContent = String(viewer.totalPages);
    totalPageContainer.appendChild(totalPagePara);

    // Create the wrapper container to hold all page number elements
    const wrapper = document.createElement('div');
    wrapper.setAttribute('class', `${aPdfViewerClassNames['_A_TOOLBAR_ITEM']} ${aPdfViewerClassNames['_A_TOOLBAR_TOOLTIP']} a-page-number-container`);

    // Append elements to the wrapper container
    wrapper.appendChild(pageInputContainer);
    wrapper.appendChild(pageOfContainer);
    wrapper.appendChild(totalPageContainer);

    return wrapper;
  }
}

export default Toolbar;
