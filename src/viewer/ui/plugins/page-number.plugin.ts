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

import { PDF_VIEWER_CLASSNAMES, PDF_VIEWER_IDS } from '../../../constants/pdf-viewer-selectors';
import { BaseToolbarPlugin, ToolbarPluginContext, ToolbarPluginPriority } from './toolbar.plugin';

/**
 * Page number display and navigation plugin
 * Shows "page X of Y" controls
 */
export class PageNumberPlugin extends BaseToolbarPlugin {
  private _inputField?: HTMLInputElement;

  constructor() {
    super('pageNumber', {
      priority: ToolbarPluginPriority.HIGH + 4,
    });
  }

  protected onInitialize(_context: ToolbarPluginContext): void {
    // Subscribe to page changes to update the input field
  }

  protected onRender(_container: HTMLElement, context: ToolbarPluginContext): HTMLElement {
    const wrapper = document.createElement('div');
    wrapper.className = `${PDF_VIEWER_CLASSNAMES.A_TOOLBAR_ITEM} ${PDF_VIEWER_CLASSNAMES.A_TOOLBAR_TOOLTIP} a-page-number-container`;

    // Input container
    const inputContainer = document.createElement('div');
    inputContainer.id = `${PDF_VIEWER_IDS.INPUT_PAGE_NUMBER}-${context.instanceId}`;
    inputContainer.className = PDF_VIEWER_CLASSNAMES.A_PAGE_INPUT_CONTAINER;

    // Input field
    this._inputField = document.createElement('input');
    this._inputField.type = 'number';
    this._inputField.id = `${PDF_VIEWER_IDS.CURRENT_PAGE_INPUT}-${context.instanceId}`;
    this._inputField.className = PDF_VIEWER_CLASSNAMES.A_CURRENT_PAGE_NUMBER_INPUT_FIELD;
    this._inputField.autocomplete = 'off';
    this._inputField.setAttribute('aria-label', 'Current page number');
    this._inputField.value = String(context.viewer.currentPageNumber);

    // Input event handler
    this._inputField.oninput = (e: Event) => {
      context.viewer.toolbarButtonClick('currentPageNumber', e);
    };

    // Keydown event handler
    this._inputField.onkeydown = (e: KeyboardEvent) => {
      context.viewer.toolbarButtonClick('currentPageNumber', e);
    };

    inputContainer.appendChild(this._inputField);

    // "of" text
    const ofContainer = document.createElement('div');
    const ofPara = document.createElement('p');
    ofPara.textContent = 'of';
    ofContainer.appendChild(ofPara);

    // Total pages
    const totalContainer = document.createElement('div');
    const totalPara = document.createElement('p');
    totalPara.textContent = String(context.viewer.totalPages);
    totalContainer.appendChild(totalPara);

    wrapper.append(inputContainer, ofContainer, totalContainer);

    return wrapper;
  }

  protected onUpdate(context: ToolbarPluginContext): void {
    // Update the input field when page changes
    if (this._inputField) {
      this._inputField.value = String(context.viewer.currentPageNumber);
    }
  }

  protected onDestroy(): void {
    this._inputField = undefined;
  }

  /**
   * Public method to update the page number display
   */
  public updatePageNumber(pageNumber: number): void {
    if (this._inputField) {
      this._inputField.value = String(pageNumber);
    }
  }
}
