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

class Toolbar {
  private toolbar!: ToolbarOptions;
  private toolbarClass!: ToolbarClass;
  private toolbarConfig: ToolbarButtonConfig[];
  private _viewer!: WebViewer;
  private __pdfState!: PdfState;

  constructor(containerId: string, customToolbarItems: ToolbarButtonConfig[] | [], webViewer: WebViewer) {
    this._viewer = webViewer;
    this.__pdfState = PdfState.getInstance(containerId);

    // Initialize toolbar with default values
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
        rectangle: false,
        line: false,
        // Add more annotation options as needed
      },
      // Add more toolbar options as needed
    };

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
        rectangle: '',
        line: '',
        // Add more annotation options as needed
      },
      // Add more toolbar options as needed
    };

    this.toolbarConfig = customToolbarItems;
    this.toolbarConfig = this.getToolbarData();
    this.renderToolbar();
    // this.customToolbar = [];
  }

  // Method to set toolbar options
  public setToolbar(options: Partial<ToolbarOptions> = {}): void {
    this.toolbar = { ...this.toolbar, ...options };
    this.renderToolbar(); // Re-render the toolbar with updated options
  }

  // Method to add custom toolbar item
  // public addCustomToolbarItem(item: CustomToolbarItem): void {
  //   this.customToolbar.push(item);
  //   this.renderToolbar();
  // }

  // Method to remove custom toolbar item
  // public removeCustomToolbarItem(label: string): void {
  //   this.customToolbar = this.customToolbar.filter((item) => item.label !== label);
  // }

  // Method to get current toolbar options
  public getToolbar(): ToolbarOptions {
    return this.toolbar;
  }

  // Method to get custom toolbar items
  // public getCustomToolbar(): CustomToolbarItem[] {
  //   return this.customToolbar;
  // }

  // Method to remove toolbar
  public removeToolbar(): void {
    this.toolbar = {} as ToolbarOptions;
  }

  public getToolbarData(): ToolbarButtonConfig[] {
    const toolbarConfig: ToolbarButtonConfig[] = [
      {
        id: 'thumbnailBtn',
        label: 'View thumbnail',
        icon: 'view-thumbnail',
        onClick: (viewer: WebViewer) => this._viewer.toogleThumbnailViewer(),
        hide: false,
        class: this.toolbarClass['thumbnail'] + '-icon',
      },
      {
        id: 'firstPage',
        label: 'First Page',
        icon: 'first-page-icon',
        onClick: (viewer: WebViewer) => this._viewer.firstPage(),
        hide: false,
        isSeparatorBefore: true,
        class: this.toolbarClass['firstPage'] + '-icon',
      },
      {
        id: 'previousPage',
        label: 'Previous Page',
        icon: 'previous-page-icon',
        onClick: (viewer: WebViewer) => this._viewer.previousPage(),
        hide: false,
        class: this.toolbarClass['previousPage'] + '-icon',
      },
      {
        id: 'nextPage',
        label: 'Next Page',
        icon: 'next-page-icon',
        onClick: (viewer: WebViewer) => this._viewer.nextPage(),
        hide: false,
        class: this.toolbarClass['nextPage'] + '-icon',
      },
      {
        id: 'lastPage',
        label: 'Last Page',
        icon: 'last-page-icon',
        onClick: (viewer: WebViewer) => this._viewer.lastPage(),
        hide: false,
        class: this.toolbarClass['lastPage'] + '-icon',
      },
      {
        id: 'pageNumber',
        label: 'Page Number',
        type: 'custom', // Indicates a special rendering type
        render: () => Toolbar.renderPageNumberControls(this._viewer),
        onClick: (p) => console.log('clicked'),
        hide: false,
      },
      {
        id: 'zoomIn',
        label: 'Zoom In',
        icon: 'zoom-in-icon',
        onClick: (viewer: WebViewer) => this._viewer.zoomIn(),
        isSeparatorBefore: true,
        hide: false,
        class: this.toolbarClass['zoomIn'] + '-icon',
      },
      {
        id: 'zoomOut',
        label: 'Zoom Out',
        icon: 'zoom-out-icon',
        onClick: (viewer: WebViewer) => this._viewer.zoomOut(),
        class: this.toolbarClass['zoomOut'] + '-icon',
        hide: false,
      },
    ];
    return toolbarConfig;
  }

  private renderToolbar(): void {
    const toolbarContainer = document.querySelector(`#${this.__pdfState.containerId} #toolbarContainer`) as HTMLElement;
    if (!toolbarContainer) return;

    toolbarContainer.innerHTML = ''; // Clear existing toolbar

    this.toolbarConfig.forEach((item) => {
      if (item['hide']) return;

      if (item.isSeparatorBefore) {
        this.addSeparator(toolbarContainer);
      }

      if (item.type === 'custom' && item.render) {
        // Custom rendering logic
        const customElement = item.render(this);
        toolbarContainer.appendChild(customElement);
      } else {
        const button = this.createToolbarButton(item);
        const parentWrapper = this.parentWrapper(item);
        parentWrapper.appendChild(button);
        toolbarContainer.appendChild(parentWrapper);
      }
    });

    WebUiUtils.hideLoading(this.__pdfState.uiLoading, this.__pdfState.containerId);
  }

  // Helper method to create a button based on config
  private createToolbarButton(config: any): HTMLElement {
    const button = document.createElement('button');
    button.classList.add('a-toolbar-button');
    const icon = document.createElement('span');
    icon.setAttribute('class', `a-toolbar-icon ${config.class}`);
    button.appendChild(icon);
    button.addEventListener('click', () => config.onClick(this));
    return button;
  }

  private parentWrapper(config: any): HTMLElement {
    const wrapper = document.createElement('div');
    wrapper.setAttribute(
      'class',
      `${aPdfViewerClassNames['_A_TOOLBAR_ITEM']} ${aPdfViewerClassNames['_A_TOOLBAR_TOOLTIP']} ${config?.key ? (this.toolbarClass as any)[config['key']] : ''}`.trim(),
    );
    return wrapper;
  }

  // Helper method to add a separator
  private addSeparator(parent: HTMLElement): void {
    const separator = document.createElement('div');
    separator.classList.add('a-toolbar-item-separator');
    parent.appendChild(separator);
  }

  // Page number control renderer
  private static renderPageNumberControls(viewer: WebViewer): HTMLElement {
    // Create the main container
    const pageInputContainer = document.createElement('div');
    pageInputContainer.setAttribute('id', aPdfViewerIds._INPUT_PAGE_NUMBER);
    pageInputContainer.setAttribute('class', aPdfViewerClassNames._A_PAGE_INPUT_CONTAINER);

    // Create the input field for current page number
    const pageInputField = document.createElement('input');
    pageInputField.setAttribute('type', 'number');
    pageInputField.setAttribute('id', aPdfViewerIds._CURRENT_PAGE_INPUT);
    pageInputField.setAttribute('class', aPdfViewerClassNames._A_CURRENT_PAGE_NUMBER_INPUT_FIELD);
    pageInputField.setAttribute('autocomplete', 'off');
    pageInputField.setAttribute('aria-label', 'Current page number');
    pageInputField.value = String(viewer.currentPageNumber);

    // Attach event handlers for input and keydown
    pageInputField.oninput = (e) => viewer.toolbarButtonClick('currentPageNumber', e);
    pageInputField.onkeydown = (e) => viewer.toolbarButtonClick('currentPageNumber', e);

    // Append the input field to the main container
    pageInputContainer.appendChild(pageInputField);

    // Create the "of" text container
    const pageOfContainer = document.createElement('div');
    const ofPara = document.createElement('p');
    ofPara.textContent = 'of';
    pageOfContainer.appendChild(ofPara);

    // Create the total pages container
    const totalPageContainer = document.createElement('div');
    const totalPagePara = document.createElement('p');
    totalPagePara.textContent = String(viewer.totalPages);
    totalPageContainer.appendChild(totalPagePara);

    // Combine all components into the toolbar option container
    const wrapper = document.createElement('div');
    wrapper.setAttribute('class', `${aPdfViewerClassNames['_A_TOOLBAR_ITEM']} ${aPdfViewerClassNames['_A_TOOLBAR_TOOLTIP']} a-page-number-container`);
    wrapper.appendChild(pageInputContainer);
    wrapper.appendChild(pageOfContainer);
    wrapper.appendChild(totalPageContainer);

    return wrapper;
  }
}

export default Toolbar;
