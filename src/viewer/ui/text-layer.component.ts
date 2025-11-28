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

import { PageViewport, PDFPageProxy, TextLayer as PdfJsTextLayerInternal } from 'pdfjs-dist';
import { TextContent } from 'pdfjs-dist/types/src/display/api';
import { PDF_VIEWER_CLASSNAMES, PDF_VIEWER_IDS } from '../../constants/pdf-viewer-selectors';
import { debugWarn, reportError } from '../../utils/debug-utils';
import PageElement from './page-element.component';

class TextLayer {
  private readonly _containerId: string;
  private readonly _instanceId: string;
  private _pageWrapper: HTMLElement | null;
  private _page: PDFPageProxy | null;
  private _viewport: PageViewport | null;
  private _textLayerDiv: HTMLDivElement | null = null;
  private _annotationHostDiv: HTMLDivElement | null = null;
  private _pdfJsTextLayer: PdfJsTextLayerInternal | null = null;
  private _isDestroyed = false;

  constructor(
    containerId: string,
    instanceId: string,
    pageWrapper: HTMLElement,
    page: PDFPageProxy,
    viewport: PageViewport
  ) {
    if (!viewport) {
      reportError('TextLayer: viewport is required', { pageNumber: page?.pageNumber });
    }
    this._containerId = containerId;
    this._instanceId = instanceId;
    this._pageWrapper = pageWrapper;
    this._page = page;
    this._viewport = viewport;
  }

  async createTextLayer(): Promise<[HTMLDivElement, HTMLDivElement]> {
    this._validateNotDestroyed();
    this._validateInitialized();

    this._createLayerDivs();
    const textContent = await this._fetchTextContent();
    await this._renderTextLayer(textContent);
    this._applyFontStyling(textContent);
    this._wrapTextInParagraph();

    return [this._textLayerDiv!, this._annotationHostDiv!];
  }

  destroy(): void {
    if (this._isDestroyed) return;
    this._isDestroyed = true;

    // Cancel PDF.js text layer if it has a cancel method
    if (this._pdfJsTextLayer) {
      try {
        (this._pdfJsTextLayer as any).cancel?.();
      } catch (e) {
        // Ignore cancellation errors
      }
      this._pdfJsTextLayer = null;
    }

    // Remove DOM elements
    this._textLayerDiv?.remove();
    this._textLayerDiv = null;

    this._annotationHostDiv?.remove();
    this._annotationHostDiv = null;

    // Clear references to allow garbage collection
    this._pageWrapper = null;
    this._page = null;
    this._viewport = null;
  }

  private _validateNotDestroyed(): void {
    if (this._isDestroyed) {
      const pageNum = this._page?.pageNumber;
      debugWarn(`TextLayer-${pageNum}: operation called after destroy`);
      throw new Error(`TextLayer for page ${pageNum} was destroyed.`);
    }
  }

  private _validateInitialized(): void {
    if (!this._pageWrapper || !this._page || !this._viewport) {
      reportError('TextLayer: not properly initialized', { page: this._page?.pageNumber });
      throw new Error('TextLayer not properly initialized or already destroyed.');
    }
  }

  private _createLayerDivs(): void {
    this._textLayerDiv = PageElement.createLayers(
      PDF_VIEWER_CLASSNAMES.ATEXT_LAYER,
      PDF_VIEWER_IDS.TEXT_LAYER,
      this._viewport!,
      this._instanceId
    );
    this._pageWrapper!.appendChild(this._textLayerDiv);

    this._annotationHostDiv = PageElement.createLayers(
      PDF_VIEWER_CLASSNAMES.AANNOTATION_DRAWING_LAYER,
      PDF_VIEWER_IDS.ANNOTATION_DRAWING_LAYER,
      this._viewport!,
      this._instanceId
    );
    this._pageWrapper!.appendChild(this._annotationHostDiv);
  }

  private async _fetchTextContent(): Promise<TextContent> {
    const textContent = await this._page!.getTextContent();

    if (this._isDestroyed) {
      const pageNum = this._page?.pageNumber;
      debugWarn(`TextLayer-${pageNum}: destroyed during getTextContent`);
      this._textLayerDiv?.remove();
      this._annotationHostDiv?.remove();
      throw new Error(`TextLayer for page ${pageNum} was destroyed.`);
    }

    if (!this._viewport) {
      reportError('TextLayer: viewport unexpectedly null', { page: this._page?.pageNumber });
      throw new Error('TextLayer critical error: Viewport became null unexpectedly.');
    }

    return textContent;
  }

  private async _renderTextLayer(textContent: TextContent): Promise<void> {
    this._pdfJsTextLayer = new PdfJsTextLayerInternal({
      textContentSource: textContent,
      container: this._textLayerDiv!,
      viewport: this._viewport!,
    });

    await this._pdfJsTextLayer.render();

    if (this._isDestroyed) {
      const pageNum = this._page?.pageNumber;
      debugWarn(`TextLayer-${pageNum}: destroyed during render`);
      throw new Error(`TextLayer for page ${pageNum} was destroyed.`);
    }
  }

  private _applyFontStyling(textContent: TextContent): void {
    const textDivs = this._pdfJsTextLayer?.textDivs ?? [];

    textContent.items.forEach((item: any, index: number) => {
      const div = textDivs[index];
      if (!div) return;

      const targetWidth = div.getBoundingClientRect().width;
      div.style.transform = 'none';

      const fontId = item.fontName;
      this._page!.commonObjs.get(fontId, (font: any) => {
        if (!font?.name) return;

        const cleanFontName = this._extractCleanFontName(font.name);
        if (!cleanFontName) return;

        const [family, weight] = cleanFontName.split('-');
        if (family) div.style.fontFamily = `'${family}', serif`;
        if (weight) div.style.fontWeight = weight;

        const measuredWidth = div.getBoundingClientRect().width;
        const scaleX = targetWidth / measuredWidth;
        div.style.transformOrigin = '0 0';
        div.style.transform = `scaleX(${scaleX})`;
      });
    });
  }

  private _extractCleanFontName(pdfFontName: string): string | null {
    if (!pdfFontName) return null;

    const plusIndex = pdfFontName.indexOf('+');
    return plusIndex !== -1 ? pdfFontName.substring(plusIndex + 1) : pdfFontName;
  }

  private _wrapTextInParagraph(): void {
    const textLayer = this._pageWrapper?.querySelector<HTMLElement>(`.${PDF_VIEWER_CLASSNAMES.ATEXT_LAYER}`);
    if (!textLayer) return;

    const nodes = Array.from(textLayer.childNodes);
    const paragraph = document.createElement('p');
    paragraph.style.whiteSpace = 'pre-wrap';
    paragraph.style.margin = '0';

    nodes.forEach((node) => {
      if (node.nodeName !== 'BR') {
        paragraph.appendChild(node);
      }
    });

    textLayer.innerHTML = '';
    textLayer.appendChild(paragraph);
  }
}

export default TextLayer;
