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
import { AnnotationManager } from '../manager/AnnotationManager';
import { SelectionManager } from '../manager/SelectionManager';
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
  private selectionManager: SelectionManager;

  /**
   * Constructs the toolbar for the PDF viewer.
   *
   * @param {string} containerId - The ID of the container where the toolbar will be added.
   * @param {ToolbarButtonConfig[]} customToolbarItems - An array of custom toolbar items.
   * @param {WebViewer} webViewer - The WebViewer instance to control the PDF viewer.
   */
  constructor(containerId: string, customToolbarItems: ToolbarButtonConfig[] | [], webViewer: WebViewer, selectionManager: SelectionManager) {
    this._viewer = webViewer;
    this.__pdfState = PdfState.getInstance(containerId);
    this.selectionManager = selectionManager;

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
        onClick: (e: any, viewer: WebViewer) => this._viewer.toogleThumbnailViewer(),
        hide: false,
        class: this.toolbarClass['thumbnail'] + '-icon',
        group: 1,
      },
      {
        id: 'firstPage',
        label: 'First Page',
        icon: 'first-page-icon',
        onClick: (e: any, viewer: WebViewer) => this._viewer.firstPage(),
        hide: false,
        isSeparatorBefore: true,
        class: this.toolbarClass['firstPage'] + '-icon',
        group: 1,
      },
      {
        id: 'previousPage',
        label: 'Previous Page',
        icon: 'previous-page-icon',
        onClick: (e: any, viewer: WebViewer) => this._viewer.previousPage(),
        hide: false,
        class: this.toolbarClass['previousPage'] + '-icon',
        group: 1,
      },
      {
        id: 'nextPage',
        label: 'Next Page',
        icon: 'next-page-icon',
        onClick: (e: any, viewer: WebViewer) => this._viewer.nextPage(),
        hide: false,
        class: this.toolbarClass['nextPage'] + '-icon',
        group: 1,
      },
      {
        id: 'lastPage',
        label: 'Last Page',
        icon: 'last-page-icon',
        onClick: (e: any, viewer: WebViewer) => this._viewer.lastPage(),
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
        onClick: (e: any, viewer: WebViewer) => this._viewer.zoomIn(),
        isSeparatorBefore: true,
        hide: false,
        class: this.toolbarClass['zoomIn'] + '-icon',
        group: 1,
      },
      {
        id: 'zoomOut',
        label: 'Zoom Out',
        icon: 'zoom-out-icon',
        onClick: (e: any, viewer: WebViewer) => this._viewer.zoomOut(),
        class: this.toolbarClass['zoomOut'] + '-icon',
        hide: false,
        group: 1,
      },
      {
        id: 'annotation',
        label: 'Annotate',
        icon: 'annotate-icon',
        onClick: (e: any) => {
          const target = e?.target as HTMLInputElement;
          if (target?.parentElement) {
            target?.parentElement.classList.toggle('active');
          }
          const container = document.querySelector(`#${this.__pdfState.containerId} #pageContainer-${this.__pdfState.currentPage} #${aPdfViewerIds._ANNOTATION_DRAWING_LAYER}`);
          if (container) {
            (container as HTMLElement).style.cursor = 'crosshair';
            (container as HTMLElement).style.pointerEvents = 'all';
            const manager = this._viewer.annotation.isAnnotationManagerRegistered(this.__pdfState.currentPage);
            if (manager) {
              manager.createRectangle('transparent', 'red', 2, 'solid');
            } else {
              const manager = new AnnotationManager(container as HTMLElement, this.__pdfState, this.selectionManager);
              this._viewer.annotation.registerAnnotationManager(this.__pdfState.currentPage, manager);
              manager.createRectangle('transparent', 'red', 2, 'solid');
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
        onClick: (e: any) => {
          const target = e?.target as HTMLInputElement;
          if (target?.parentElement) {
            target?.parentElement.classList.toggle('active');
          }
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

    button.addEventListener('click', (e: any) => config.onClick(e, this._viewer));
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

  private static shapeTool() {
    // Parent wrapper
    // const shapeToolbarWrapper = document.createElement('div');
    // shapeToolbarWrapper.classList.add('a-shape-toolbar-wrapper');
    // // Selected tool button
    // const div = document.createElement('div');
    // div.classList.add('a-toolbar-item');
    // div.classList.add('a-toolbar-tooltip');
    // const selectedToolButton = document.createElement('button');
    // selectedToolButton.classList.add('a-toolbar-button');
    // const icon = document.createElement('span');
    // icon.setAttribute('class', `a-toolbar-icon a-shape-selection-dropdown`);
    // selectedToolButton.appendChild(icon);
    // selectedToolButton.addEventListener('click', () => {});
    // div.appendChild(selectedToolButton);
    // // arrow
    // const dropdownArrow = document.createElement('div');
    // dropdownArrow.classList.add('a-toolbar-button');
    // const icon2 = document.createElement('span');
    // icon2.setAttribute('class', `a-toolbar-icon`);
    // dropdownArrow.appendChild(icon2);
    // dropdownArrow.addEventListener('click', () => {});
    // shapeToolbarWrapper.appendChild(div);
    // shapeToolbarWrapper.appendChild(dropdownArrow);
    // return shapeToolbarWrapper;
    // const dropIconElement = document.createElement('span');
    // dropIconElement.classList.add('a-shape-selection-dropdown');
    // // Create Main Shape Button (last selected shape)
    // const mainShapeButton = document.createElement('button');
    // mainShapeButton.classList.add('a-toolbar-item');
    // mainShapeButton.classList.add('a-toolbar-tooltip');
    // mainShapeButton.id = 'mainShapeButton';
    // const btn = document.createElement('button');
    // btn.classList.add('a-toolbar-item');
    // btn.classList.add('a-toolbar-tooltip');
    // btn.classList.add('a-toolbar-button');
    // btn.appendChild(dropIconElement);
    // const selectedShapeIcon = document.createElement('img');
    // selectedShapeIcon.id = 'selectedShapeIcon';
    // selectedShapeIcon.src = 'icons/line.svg'; // Default icon
    // // selectedShapeIcon.alt = 'Line';
    // mainShapeButton.appendChild(selectedShapeIcon);
    // // Create Dropdown Container
    // const dropdown = document.createElement('div');
    // dropdown.classList.add('dropdown');
    // const dropdownButton = document.createElement('button');
    // dropdownButton.classList.add('toolbar-button');
    // dropdownButton.id = 'dropdownButton';
    // const dropdownIcon = document.createElement('img');
    // dropdownIcon.src = 'icons/arrow-down.svg';
    // dropdownIcon.alt = 'Dropdown';
    // dropdownButton.appendChild(dropdownIcon);
    // // Create Dropdown Menu
    // const dropdownMenu = document.createElement('div');
    // dropdownMenu.classList.add('dropdown-menu');
    // // Shape options (icon path should be adjusted)
    // const shapes = [
    //   { shape: 'line', label: 'Line', icon: 'icons/line.svg' },
    //   { shape: 'arrow', label: 'Arrow', icon: 'icons/arrow.svg' },
    //   { shape: 'rectangle', label: 'Rectangle', icon: 'icons/rectangle.svg' },
    //   { shape: 'ellipse', label: 'Ellipse', icon: 'icons/ellipse.svg' },
    //   { shape: 'polygon', label: 'Polygon', icon: 'icons/polygon.svg' },
    //   { shape: 'cloudy-polygon', label: 'Cloudy Polygon', icon: 'icons/cloudy-polygon.svg' },
    //   { shape: 'polyline', label: 'Polyline', icon: 'icons/polyline.svg' },
    //   { shape: 'cloudy-rectangle', label: 'Cloudy Rectangle', icon: 'icons/cloudy-rectangle.svg' },
    //   { shape: 'dashed-rectangle', label: 'Dashed Rectangle', icon: 'icons/dashed-rectangle.svg' },
    // ];
    // let lastSelectedShape = 'line'; // Default shape
    // // Populate dropdown menu
    // shapes.forEach(({ shape, label, icon }) => {
    //   const item = document.createElement('div');
    //   item.classList.add('dropdown-item');
    //   item.dataset.shape = shape;
    //   const img = document.createElement('img');
    //   img.src = icon;
    //   img.alt = label;
    //   item.appendChild(img);
    //   item.append(label);
    //   item.addEventListener('click', () => {
    //     lastSelectedShape = shape;
    //     selectedShapeIcon.src = icon; // Update main button icon
    //     dropdownMenu.classList.remove('show');
    //     console.log('Selected Shape:', lastSelectedShape);
    //   });
    //   dropdownMenu.appendChild(item);
    // });
    // // Append elements
    // dropdown.appendChild(dropdownButton);
    // dropdown.appendChild(dropdownMenu);
    // // toolbar.appendChild(mainShapeButton);
    // // toolbar.appendChild(dropdown);
    // // document.body.appendChild(toolbar);
    // // Event Listeners
    // dropdownButton.addEventListener('click', (event) => {
    //   event.stopPropagation();
    //   dropdownMenu.classList.toggle('show');
    // });
    // document.addEventListener('click', () => {
    //   dropdownMenu.classList.remove('show');
    // });
    // mainShapeButton.addEventListener('click', () => {
    //   console.log('Using tool:', lastSelectedShape);
    // });
    // const div = document.createElement('div');
    // div.classList.add('a-shape-selection-toolbar');
    // div.appendChild(mainShapeButton);
    // div.appendChild(btn);
    // // div.appendChild(dropdown);
    // return div;
  }
}

export default Toolbar;
