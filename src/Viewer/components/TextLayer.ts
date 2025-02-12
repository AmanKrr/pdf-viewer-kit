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

import PageElement from './PageElement';
import { aPdfViewerClassNames, aPdfViewerIds } from '../../constant/ElementIdClass';
import { PageViewport, PDFPageProxy, TextLayer as pdfjsTextLayer } from 'pdfjs-dist';

/**
 * Manages the creation and rendering of a text layer for a specific page in the PDF viewer.
 * The text layer overlays text content extracted from the PDF, enabling text selection and interactions.
 */
class TextLayer extends PageElement {
  private pageWrapper!: HTMLElement;
  private container!: HTMLElement;
  private page!: PDFPageProxy;
  private viewport!: PageViewport;

  /**
   * Constructs a `TextLayer` instance for a given PDF page.
   *
   * @param {HTMLElement} pageWrapper - The HTML element wrapping the current PDF page.
   * @param {HTMLElement} container - The HTML container for the text layer.
   * @param {PDFPageProxy} page - The PDF.js page proxy object representing the current page.
   * @param {PageViewport} viewport - The viewport defining the dimensions and scale of the text layer.
   */
  constructor(pageWrapper: HTMLElement, container: HTMLElement, page: PDFPageProxy, viewport: PageViewport) {
    super();
    this.pageWrapper = pageWrapper;
    this.container = container;
    this.page = page;
    this.viewport = viewport;
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
    const textLayerDiv = PageElement.createLayers(aPdfViewerClassNames._A_TEXT_LAYER, aPdfViewerIds._TEXT_LAYER, this.viewport);
    this.pageWrapper.appendChild(textLayerDiv);

    const annotaionLayerDiv = PageElement.createLayers(aPdfViewerClassNames._A_ANNOTATION_DRAWING_LAYER, aPdfViewerIds._ANNOTATION_DRAWING_LAYER, this.viewport);
    this.pageWrapper.appendChild(annotaionLayerDiv);

    // Retrieve the text content of the current page.
    const textContent = await this.page.getTextContent();

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
      viewport: this.viewport,
    });

    // Render the text layer into the container.
    pdfJsInternalTextLayer.render();

    // Attach a click event handler to each text div for future interactivity.
    pdfJsInternalTextLayer.textDivs.forEach((ele) => {
      ele.onclick = (e) => console.log('Coming soon'); // Placeholder for future interaction
    });

    return [textLayerDiv, annotaionLayerDiv];
  }
}

export default TextLayer;
