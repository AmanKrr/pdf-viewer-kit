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
 */
class TextLayer extends PageElement {
  private pageWrapper!: HTMLElement;
  private container!: HTMLElement;
  private page!: PDFPageProxy;
  private viewport!: PageViewport;

  /**
   * Constructs a `TextLayer` instance.
   *
   * @param pageWrapper - The HTML element wrapping the current page.
   * @param container - The HTML container for the text layer.
   * @param page - The PDF page proxy object representing the current page.
   * @param viewport - The viewport defining the dimensions and scale of the text layer.
   */
  constructor(pageWrapper: HTMLElement, container: HTMLElement, page: PDFPageProxy, viewport: PageViewport) {
    super();
    this.pageWrapper = pageWrapper;
    this.container = container;
    this.page = page;
    this.viewport = viewport;
  }

  /**
   * Creates and renders the text layer for the current page.
   *
   * This method retrieves text content from the PDF page, creates a text layer div, and uses
   * PDF.js's `TextLayer` to render the text content into the layer. Each rendered text element
   * is assigned a click handler for further interactivity.
   *
   * @returns A Promise that resolves to the text layer HTMLDivElement.
   */
  async createTextLayer(): Promise<HTMLDivElement> {
    // Create a text layer div with appropriate class and ID based on viewport dimensions.
    const textLayerDiv = PageElement.createLayers(aPdfViewerClassNames._A_TEXT_LAYER, aPdfViewerIds._TEXT_LAYER, this.viewport);
    this.pageWrapper.appendChild(textLayerDiv);

    // Retrieve the text content of the current page.
    const textContent = await this.page.getTextContent();

    // ########################## Render text layer changed after 4.0.379 ##########################
    // pdfjsLib.renderTextLayer({
    //   textContentSource: textContent,
    //   container: textLayerDiv,
    //   viewport: viewport,
    // });

    // ########################## Now need to create instance 4.8.69 ##########################
    // Create a new instance of PDF.js's internal TextLayer for rendering the text content.
    const pdfJsInternalTextLayer = new pdfjsTextLayer({
      textContentSource: textContent,
      container: textLayerDiv,
      viewport: this.viewport,
    });
    // Render the text layer into the container.
    pdfJsInternalTextLayer.render();
    // Attach a click event handler to each text div for potential interactivity.
    pdfJsInternalTextLayer.textDivs.forEach((ele) => {
      ele.onclick = (e) => console.log('Coming soon');
    });

    return textLayerDiv;
  }
}

export default TextLayer;
