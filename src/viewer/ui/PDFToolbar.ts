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

import WebViewer from './WebViewer';
import { IToolbar, ToolbarOptions, ToolbarButtonConfig } from '../../types/toolbar.types';
import PdfState from './PDFState';
import { PDF_VIEWER_CLASSNAMES, PDF_VIEWER_IDS } from '../../constants/pdf-viewer-selectors';
import { AnnotationToolbar } from './PDFAnnotationToolbar';

/**
 * Implements the main toolbar UI for the PDF viewer.
 * Allows navigation, zoom, search, annotations, and download controls.
 */
export class Toolbar implements IToolbar {
  private _container!: HTMLElement;
  private _buttons: ToolbarButtonConfig[];
  private _opts: Required<ToolbarOptions>;
  private _pdfState: PdfState;
  private _viewer: WebViewer;
  private _annotationToolbar: AnnotationToolbar;
  private _searchBarOpen = false;

  /**
   * @param viewer    The WebViewer instance.
   * @param pdfState  Shared state object for PDF interactions.
   * @param buttons   Optional custom button configurations.
   * @param options   ToolbarOptions to enable/disable features.
   */
  constructor(viewer: WebViewer, pdfState: PdfState, buttons: ToolbarButtonConfig[] = [], options: ToolbarOptions = {}) {
    this._viewer = viewer;
    this._pdfState = pdfState;

    this._opts = {
      showFirstPage: true,
      showPrevNext: true,
      showLastPage: true,
      showPageNumber: true,
      showZoom: true,
      showSearch: false,
      showThumbnail: false,
      showAnnotation: true,
      showDownload: true,
      classPrefix: 'a-toolbar',
      ...options,
    };

    this._buttons = buttons.length ? buttons : this._defaultButtons();
    this._annotationToolbar = new AnnotationToolbar(this._viewer, this._pdfState);
  }

  /**
   * Renders the toolbar into the specified container element.
   *
   * @param container  The HTML element to host the toolbar.
   */
  public render(container: HTMLElement): void {
    this._container = container;
    container.innerHTML = '';

    for (const cfg of this._buttons) {
      if (cfg.isSeparatorBefore) {
        container.appendChild(this.__addSeparator());
      }

      if (cfg.render) {
        container.appendChild(cfg.render(this._viewer));
      } else {
        const wrapper = this.__wrapItem(cfg.id);
        if (cfg.breakBefore) {
          wrapper.style.marginLeft = 'auto';
        }
        wrapper.appendChild(this.__createButton(cfg));
        container.appendChild(wrapper);
      }
    }
  }

  /**
   * Builds the default toolbar buttons based on enabled options.
   *
   * @returns Array of ToolbarButtonConfig for default buttons.
   */
  private _defaultButtons(): ToolbarButtonConfig[] {
    const buttons: ToolbarButtonConfig[] = [];

    if (this._opts.showThumbnail) {
      buttons.push({
        id: 'thumbnail',
        iconClass: 'thumbnail-icon',
        tooltip: 'Toggle Thumbnails',
        onClick: (viewer) => viewer.toogleThumbnailViewer(),
      });
    }

    if (this._opts.showFirstPage) {
      buttons.push({
        id: 'firstPage',
        iconClass: 'first-page-icon',
        tooltip: 'First Page',
        isSeparatorBefore: this._opts.showThumbnail,
        onClick: (viewer) => viewer.firstPage(),
      });
    }

    if (this._opts.showPrevNext) {
      buttons.push(
        {
          id: 'previousPage',
          iconClass: 'previous-page-icon',
          tooltip: 'Previous Page',
          onClick: (viewer) => viewer.previousPage(),
        },
        {
          id: 'nextPage',
          iconClass: 'next-page-icon',
          tooltip: 'Next Page',
          onClick: (viewer) => viewer.nextPage(),
        },
      );
    }

    if (this._opts.showLastPage) {
      buttons.push({
        id: 'lastPage',
        iconClass: 'last-page-icon',
        tooltip: 'Last Page',
        onClick: (viewer) => viewer.lastPage(),
      });
    }

    if (this._opts.showPageNumber) {
      buttons.push({
        id: 'pageNumber',
        render: (viewer) => Toolbar._renderPageNumberControls(viewer),
      });
    }

    if (this._opts.showZoom) {
      buttons.push(
        {
          id: 'zoomIn',
          iconClass: 'zoom-in-icon',
          tooltip: 'Zoom In',
          isSeparatorBefore: true,
          onClick: (viewer) => viewer.zoomIn(),
        },
        {
          id: 'zoomOut',
          iconClass: 'zoom-out-icon',
          tooltip: 'Zoom Out',
          onClick: (viewer) => viewer.zoomOut(),
        },
      );
    }

    if (this._opts.showSearch) {
      buttons.push({
        id: 'search',
        iconClass: 'search-icon',
        tooltip: 'Search',
        onClick: (viewer) => {
          this._closeAnnotationToolbar();
          viewer.search();
          this._searchBarOpen = !this._searchBarOpen;
        },
        breakBefore: true,
      });
    }

    if (this._opts.showAnnotation) {
      buttons.push({
        id: 'annotation',
        iconClass: 'annotation-icon',
        tooltip: 'Annotations',
        onClick: () => {
          if (this._searchBarOpen) {
            this._viewer.search();
            this._searchBarOpen = false;
          }
          this._pdfState.isAnnotationEnabled = !this._pdfState.isAnnotationEnabled;
          const btn = document.querySelector<HTMLElement>(`#${this._pdfState.containerId} .${PDF_VIEWER_CLASSNAMES.A_TOOLBAR_BUTTON} .annotation-icon`)?.parentElement;
          btn?.classList.toggle('active');
          if (this._pdfState.isAnnotationEnabled) {
            this._annotationToolbar.render();
          } else {
            this._annotationToolbar.destroy();
          }
        },
        breakBefore: !this._opts.showSearch,
      });
    }

    if (this._opts.showDownload) {
      buttons.push({
        id: 'download',
        iconClass: 'download-icon',
        tooltip: 'Download PDF with Annotations',
        onClick: async (viewer) => {
          try {
            await viewer.downloadPdf();
          } catch (error) {
            console.error('Download failed:', error);
          }
        },
        breakBefore: !this._opts.showSearch || !this._opts.showAnnotation,
      });
    }

    return buttons;
  }

  /**
   * Closes the annotation toolbar if open.
   */
  private _closeAnnotationToolbar(): void {
    this._pdfState.isAnnotationEnabled = false;
    const btn = document.querySelector<HTMLElement>(`#${this._pdfState.containerId} .${PDF_VIEWER_CLASSNAMES.A_TOOLBAR_BUTTON} .annotation-icon`)?.parentElement;
    btn?.classList.toggle('active');
    this._annotationToolbar.destroy();
  }

  /**
   * Creates a toolbar button element.
   *
   * @param cfg  Configuration for the button.
   * @returns The constructed HTMLButtonElement.
   */
  protected __createButton(cfg: ToolbarButtonConfig): HTMLButtonElement {
    const btn = document.createElement('button');
    btn.classList.add(`${this._opts.classPrefix}-button`, `${cfg.id}-button`);
    if (cfg.tooltip) {
      btn.setAttribute('title', cfg.tooltip);
    }

    const icon = document.createElement('span');
    icon.classList.add(`${this._opts.classPrefix}-icon`, cfg.iconClass || '');
    btn.appendChild(icon);

    if (cfg.onClick) {
      btn.addEventListener('click', () => cfg.onClick!(this._viewer));
    }

    return btn;
  }

  /**
   * Wraps a toolbar item for consistent styling.
   *
   * @param itemId  Identifier for the toolbar item.
   * @returns A wrapper div element.
   */
  protected __wrapItem(itemId: string): HTMLDivElement {
    const wrapper = document.createElement('div');
    wrapper.classList.add(`${this._opts.classPrefix}-item`, `${itemId}-item`);
    return wrapper;
  }

  /**
   * Creates a visual separator between toolbar items.
   *
   * @returns A separator div element.
   */
  protected __addSeparator(): HTMLDivElement {
    const sep = document.createElement('div');
    sep.classList.add(`${this._opts.classPrefix}-separator`);
    return sep;
  }

  /**
   * Renders the "page X of Y" page number control.
   *
   * @param viewer  The WebViewer instance.
   * @returns An HTMLElement containing page navigation controls.
   */
  private static _renderPageNumberControls(viewer: WebViewer): HTMLElement {
    const inputContainer = document.createElement('div');
    inputContainer.id = PDF_VIEWER_IDS.INPUT_PAGE_NUMBER;
    inputContainer.className = PDF_VIEWER_CLASSNAMES.A_PAGE_INPUT_CONTAINER;

    const inputField = document.createElement('input');
    inputField.type = 'number';
    inputField.id = PDF_VIEWER_IDS.CURRENT_PAGE_INPUT;
    inputField.className = PDF_VIEWER_CLASSNAMES.A_CURRENT_PAGE_NUMBER_INPUT_FIELD;
    inputField.autocomplete = 'off';
    inputField.setAttribute('aria-label', 'Current page number');
    inputField.value = String(viewer.currentPageNumber);
    inputField.oninput = (e) => viewer.toolbarButtonClick('currentPageNumber', e);
    inputField.onkeydown = (e) => viewer.toolbarButtonClick('currentPageNumber', e);
    inputContainer.appendChild(inputField);

    const ofContainer = document.createElement('div');
    const ofPara = document.createElement('p');
    ofPara.textContent = 'of';
    ofContainer.appendChild(ofPara);

    const totalContainer = document.createElement('div');
    const totalPara = document.createElement('p');
    totalPara.textContent = String(viewer.totalPages);
    totalContainer.appendChild(totalPara);

    const wrapper = document.createElement('div');
    wrapper.className = `${PDF_VIEWER_CLASSNAMES.A_TOOLBAR_ITEM} ${PDF_VIEWER_CLASSNAMES.A_TOOLBAR_TOOLTIP} a-page-number-container`;
    wrapper.append(inputContainer, ofContainer, totalContainer);

    return wrapper;
  }

  /**
   * Destroys the toolbar and its sub-components.
   */
  public destroy(): void {
    if (this._container) {
      this._container.innerHTML = '';
    }
    this._annotationToolbar.destroy();
  }
}
