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

import PageElement from './PDFPageElement';
import { PDF_VIEWER_CLASSNAMES, PDF_VIEWER_IDS } from '../../constants/pdf-viewer-selectors';
import { PageViewport, PDFPageProxy, TextLayer as pdfjsTextLayer, AnnotationLayer } from 'pdfjs-dist';
import { PDFLinkService } from '../services/LS';
import WebViewer from './WebViewer';

/**
 * Manages the creation and rendering of a text layer for a specific page in the PDF viewer.
 * The text layer overlays text content extracted from the PDF, enabling text selection and interactions.
 */
class TextLayer extends PageElement {
  private _pageWrapper!: HTMLElement;
  private _page!: PDFPageProxy;
  private _viewport!: PageViewport;

  /**
   * Constructs a `TextLayer` instance for a given PDF page.
   *
   * @param {HTMLElement} pageWrapper - The HTML element wrapping the current PDF page.
   * @param {HTMLElement} container - The HTML container for the text layer.
   * @param {PDFPageProxy} page - The PDF.js page proxy object representing the current page.
   * @param {PageViewport} viewport - The viewport defining the dimensions and scale of the text layer.
   */
  constructor(pageWrapper: HTMLElement, page: PDFPageProxy, viewport: PageViewport) {
    super();
    this._pageWrapper = pageWrapper;
    this._page = page;
    this._viewport = viewport;
  }

  /**
   * Creates and renders the text layer for the current PDF page.
   *
   * This method:
   * - Retrieves text content from the PDF page.
   * - Creates a text layer `<div>` with appropriate styles and dimensions.
   * - Uses PDF.js's `TextLayer` class to render the extracted text into the layer.
   * - Assigns a click handler to each text element for future interactions.
   *
   * @returns {Promise<HTMLDivElement>} A promise that resolves to the created text layer `<div>`.
   */
  async createTextLayer(): Promise<HTMLDivElement[]> {
    // Create a text layer div with appropriate class and ID based on viewport dimensions.
    const textLayerDiv = PageElement.createLayers(PDF_VIEWER_CLASSNAMES.ATEXT_LAYER, PDF_VIEWER_IDS.TEXT_LAYER, this._viewport);
    this._pageWrapper.appendChild(textLayerDiv);

    const annotaionLayerDiv = PageElement.createLayers(PDF_VIEWER_CLASSNAMES.AANNOTATION_DRAWING_LAYER, PDF_VIEWER_IDS.ANNOTATION_DRAWING_LAYER, this._viewport);
    this._pageWrapper.appendChild(annotaionLayerDiv);

    // Retrieve the text content of the current page.
    const textContent = await this._page.getTextContent();

    /**
     * Text layer rendering was changed after `pdfjs 4.0.379`.
     * The old approach using `renderTextLayer` is deprecated.
     *
     * Old method:
     * ```js
     * pdfjsLib.renderTextLayer({
     *   textContentSource: textContent,
     *   container: textLayerDiv,
     *   viewport: viewport,
     * });
     * ```
     *
     * New approach (introduced in `pdfjs 4.8.69`):
     * - Create a new instance of `TextLayer` and call `render()`.
     */

    // Create an instance of PDF.js's internal TextLayer for rendering text content.
    const pdfJsInternalTextLayer = new pdfjsTextLayer({
      textContentSource: textContent,
      container: textLayerDiv,
      viewport: this._viewport,
    });

    // Render the text layer into the container.
    await pdfJsInternalTextLayer.render();
    // this._wrapTextLayerIntoPTag();
    // this.copyAndPateText();

    // Attach a click event handler to each text div for future interactivity.
    pdfJsInternalTextLayer.textDivs.forEach((ele) => {
      ele.onclick = (e) => console.log('Coming soon'); // Placeholder for future interaction
    });

    return [textLayerDiv, annotaionLayerDiv];
  }

  private _wrapTextLayerIntoPTag() {
    if (!this._pageWrapper) return;

    const textLayer = this._pageWrapper.querySelector(`.${PDF_VIEWER_CLASSNAMES.ATEXT_LAYER}`);

    if (!textLayer) return;
    const innerHtml = textLayer.innerHTML;
    textLayer.innerHTML = '';
    textLayer.innerHTML = `<p>${innerHtml}</p>`.replaceAll(`<br role="presentation">`, '');
  }

  private copyAndPateText() {
    if (!this._pageWrapper) return;

    const textLayer = this._pageWrapper.querySelector(`.${PDF_VIEWER_CLASSNAMES.ATEXT_LAYER}`) as HTMLElement;

    if (!textLayer) return;

    textLayer.onkeydown = this.keyDown;
  }

  private keyDown(event: KeyboardEvent) {
    console.log(event);
  }
}

export default TextLayer;
