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

import PageElement from './page-element.component';
import { PDF_VIEWER_CLASSNAMES, PDF_VIEWER_IDS } from '../../constants/pdf-viewer-selectors';
import { PageViewport, PDFPageProxy, TextLayer as PdfJsTextLayerInternal } from 'pdfjs-dist';
import { debugWarn, reportError } from '../../utils/debug-utils';
import { TextSelectionHandler } from '../annotations/text-selection-handler';
import { TextContent } from 'pdfjs-dist/types/src/display/api';

/**
 * Manages the rendering of the PDF.js text layer and a matching annotation layer.
 */
class TextLayer {
  private _pageWrapper: HTMLElement | null;
  private _page: PDFPageProxy | null;
  private _viewport: PageViewport | null;
  private _textLayerDiv: HTMLDivElement | null = null;
  private _annotationHostDiv: HTMLDivElement | null = null;
  private _pdfJsInternalTextLayerInstance: PdfJsTextLayerInternal | null = null;
  private _selectionHandler: TextSelectionHandler | null = null;
  private _isDestroyed = false;
  private readonly _containerId: string;
  private readonly _instanceId: string;

  /**
   * @param pageWrapper - Container element for this page's layers.
   * @param page - PDFPageProxy for accessing text content.
   * @param viewport - Viewport for coordinate mapping.
   */
  constructor(containerId: string, instanceId: string, pageWrapper: HTMLElement, page: PDFPageProxy, viewport: PageViewport) {
    if (!viewport) {
      reportError('TextLayer init: viewport is null or undefined', { pageNumber: page?.pageNumber });
    }
    this._pageWrapper = pageWrapper;
    this._page = page;
    this._viewport = viewport;
    this._containerId = containerId;
    this._instanceId = instanceId;
  }

  /**
   * Creates and renders the text layer and annotation host layer.
   *
   * @returns A promise resolving to the text-layer and annotation-layer divs.
   * @throws If called after destruction or if initialization failed.
   */
  public async createTextLayer(): Promise<[HTMLDivElement, HTMLDivElement]> {
    if (this._isDestroyed) {
      debugWarn(`TextLayer-${this._page?.pageNumber}: createTextLayer after destroy`);
      throw new Error(`TextLayer for page ${this._page?.pageNumber} was destroyed.`);
    }
    if (!this._pageWrapper || !this._page || !this._viewport) {
      reportError('TextLayer.createTextLayer init error', { page: this._page?.pageNumber, viewport: this._viewport });
      throw new Error('TextLayer not properly initialized or already destroyed.');
    }

    this._textLayerDiv = PageElement.createLayers(PDF_VIEWER_CLASSNAMES.ATEXT_LAYER, PDF_VIEWER_IDS.TEXT_LAYER, this._viewport, this._instanceId);
    this._pageWrapper.appendChild(this._textLayerDiv);

    this._annotationHostDiv = PageElement.createLayers(PDF_VIEWER_CLASSNAMES.AANNOTATION_DRAWING_LAYER, PDF_VIEWER_IDS.ANNOTATION_DRAWING_LAYER, this._viewport, this._instanceId);
    this._pageWrapper.appendChild(this._annotationHostDiv);

    const textContent = await this._page.getTextContent();

    if (this._isDestroyed) {
      debugWarn(`TextLayer-${this._page?.pageNumber}: destroyed during getTextContent`);
      this._textLayerDiv?.remove();
      this._annotationHostDiv?.remove();
      throw new Error(`TextLayer for page ${this._page?.pageNumber} was destroyed.`);
    }
    if (!this._viewport) {
      reportError('TextLayer render: viewport unexpectedly null', { page: this._page?.pageNumber });
      throw new Error('TextLayer critical error: Viewport became null unexpectedly.');
    }

    this._pdfJsInternalTextLayerInstance = new PdfJsTextLayerInternal({
      textContentSource: textContent,
      container: this._textLayerDiv,
      viewport: this._viewport,
    });
    await this._pdfJsInternalTextLayerInstance.render();
    this._wrapTextLayerIntoPTag();
    this._putActualFonts(textContent, this._pdfJsInternalTextLayerInstance.textDivs ?? []);

    if (this._isDestroyed) {
      debugWarn(`TextLayer-${this._page?.pageNumber}: destroyed during render`);
      throw new Error(`TextLayer for page ${this._page?.pageNumber} was destroyed.`);
    }

    // this._pdfJsInternalTextLayerInstance.textDivs.forEach((ele) => {
    //   ele.onclick = (e) => console.log('Coming soon'); // Placeholder for future interaction
    // });

    this._selectionHandler = new TextSelectionHandler(
      this._containerId,
      this._instanceId,
      this._pageWrapper!,
      this._textLayerDiv!,
      this._annotationHostDiv!,
      this._pdfJsInternalTextLayerInstance.textDivs,
      this._viewport!,
    );

    return [this._textLayerDiv, this._annotationHostDiv];
  }

  private _putActualFonts(textContent: TextContent, textDivs: HTMLElement[] = []) {
    textContent.items.forEach((item: any, index: number) => {
      const div = textDivs[index];
      if (!div) return;

      const targetPx = div.getBoundingClientRect().width;

      div.style.transform = 'none';

      const fontId = item.fontName;
      this._page!.commonObjs.get(fontId, (font: any) => {
        if (font && font.name) {
          const clean = this._getCleanFontName(font.name) || '';
          if (clean) {
            const [family, weight] = clean.split('-');
            if (family) div.style.fontFamily = `'${family}', serif`;
            if (weight) div.style.fontWeight = weight;
            const measuredPx = div.getBoundingClientRect().width;
            const newScaleX = targetPx / measuredPx;
            div.style.transformOrigin = '0 0';
            div.style.transform = `scaleX(${newScaleX})`;
          }
        }
      });
    });
  }

  private _getCleanFontName(pdfFontName: string) {
    if (!pdfFontName) {
      return null;
    }
    const plusIndex = pdfFontName.indexOf('+');
    if (plusIndex !== -1) {
      return pdfFontName.substring(plusIndex + 1);
    }
    // If no '+' is found, it might be a standard name already,
    // or a name without a typical subset prefix.
    return pdfFontName;
  }

  /**
   * Wraps the rendered text spans into a single <p> for better formatting.
   */
  private _wrapTextLayerIntoPTag(): void {
    const textLayer = this._pageWrapper?.querySelector<HTMLElement>(`.${PDF_VIEWER_CLASSNAMES.ATEXT_LAYER}`);
    if (!textLayer) return;

    const nodes = Array.from(textLayer.childNodes);
    const p = document.createElement('p');
    p.style.whiteSpace = 'pre-wrap';
    p.style.margin = '0';

    nodes.forEach((node) => {
      if (node.nodeName !== 'BR') {
        p.appendChild(node);
      }
    });

    textLayer.innerHTML = '';
    textLayer.appendChild(p);
  }

  /**
   * Example keydown handler; replace or remove as needed.
   */
  private keyDown(event: KeyboardEvent): void {
    console.log(event);
  }

  /**
   * Destroys the text layer, annotation layer, and internal references.
   */
  public destroy(): void {
    if (this._isDestroyed) return;
    this._isDestroyed = true;

    this._selectionHandler?.destroy();
    this._selectionHandler = null;

    this._textLayerDiv?.remove();
    this._textLayerDiv = null;

    this._annotationHostDiv?.remove();
    this._annotationHostDiv = null;

    this._pageWrapper = null;
    this._page = null;
    this._viewport = null;
    this._pdfJsInternalTextLayerInstance = null;
  }
}

export default TextLayer;
