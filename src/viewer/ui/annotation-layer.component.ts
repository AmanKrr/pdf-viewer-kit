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

import { AnnotationLayer as PdfJsAnnotationLayerInternal, PageViewport, PDFDocumentProxy, PDFPageProxy } from 'pdfjs-dist';
import { PDF_VIEWER_CLASSNAMES, PDF_VIEWER_IDS } from '../../constants/pdf-viewer-selectors';
import { debugWarn } from '../../utils/debug-utils';
import { PDFLinkService } from '../services/link.service';
import PageElement from './page-element.component';
import WebViewer from './web-viewer.component';

export default class AnnotationLayer {
  private _pageWrapper: HTMLElement | null;
  private _page: PDFPageProxy | null;
  private _viewport: PageViewport | null;
  private _annotationLayerDiv: HTMLDivElement | null = null;
  private _pdfJsAnnotationLayer: PdfJsAnnotationLayerInternal | null = null;
  private _linkService: PDFLinkService | null = null;
  private _isDestroyed = false;

  constructor(pageWrapper: HTMLElement, page: PDFPageProxy, viewport: PageViewport) {
    this._pageWrapper = pageWrapper;
    this._page = page;
    this._viewport = viewport;
  }

  async createAnnotationLayer(
    webViewer: WebViewer,
    pdfDocument: PDFDocumentProxy,
    _annotationHostDiv?: HTMLElement
  ): Promise<HTMLDivElement> {
    this._validateNotDestroyed();
    this._validateInitialized();

    this._linkService = new PDFLinkService({ pdfDocument, pdfViewer: webViewer });
    this._createAnnotationDiv(webViewer);
    await this._initializePdfJsLayer();
    await this._renderAnnotations();

    return this._annotationLayerDiv!;
  }

  destroy(): void {
    if (this._isDestroyed) return;
    this._isDestroyed = true;

    // Cleanup PDF.js annotation layer internal state
    if (this._pdfJsAnnotationLayer) {
      try {
        // PDF.js AnnotationLayer might have cleanup methods
        (this._pdfJsAnnotationLayer as any).cancel?.();
        (this._pdfJsAnnotationLayer as any).destroy?.();
      } catch (e) {
        // Ignore cleanup errors
      }
      this._pdfJsAnnotationLayer = null;
    }

    // Cleanup link service
    this._linkService = null;

    // Remove DOM elements
    this._annotationLayerDiv?.remove();
    this._annotationLayerDiv = null;

    // Clear references to allow garbage collection
    this._pageWrapper = null;
    this._page = null;
    this._viewport = null;
  }

  private _validateNotDestroyed(): void {
    if (this._isDestroyed) {
      const pageNum = this._page?.pageNumber;
      debugWarn(`AnnotationLayer-${pageNum}: operation called after destroy`);
      throw new Error(`AnnotationLayer for page ${pageNum} was destroyed.`);
    }
  }

  private _validateInitialized(): void {
    if (!this._pageWrapper || !this._page || !this._viewport) {
      throw new Error('AnnotationLayer not properly initialized.');
    }
  }

  private _createAnnotationDiv(webViewer: WebViewer): void {
    this._annotationLayerDiv = PageElement.createLayers(
      PDF_VIEWER_CLASSNAMES.AANNOTATION_LAYER,
      PDF_VIEWER_IDS.ANNOTATION_LAYER,
      this._viewport!,
      webViewer.instanceId
    );
    this._pageWrapper!.appendChild(this._annotationLayerDiv);
  }

  private async _initializePdfJsLayer(): Promise<void> {
    this._pdfJsAnnotationLayer = new PdfJsAnnotationLayerInternal({
      div: this._annotationLayerDiv!,
      page: this._page!,
      viewport: this._viewport!,
      annotationCanvasMap: null,
      accessibilityManager: null,
      annotationEditorUIManager: null,
      structTreeLayer: null,
      annotationStorage: undefined,
      commentManager: undefined,
      linkService: this._linkService!,
    });

    if (this._isDestroyed) {
      const pageNum = this._page?.pageNumber;
      debugWarn(`AnnotationLayer-${pageNum}: destroyed during initialization`);
      this._annotationLayerDiv?.remove();
      throw new Error(`AnnotationLayer for page ${pageNum} was destroyed.`);
    }
  }

  private async _renderAnnotations(): Promise<void> {
    const annotations = await this._page!.getAnnotations();

    await this._pdfJsAnnotationLayer!.render({
      viewport: this._viewport!.clone({ dontFlip: true }),
      annotations,
      div: this._annotationLayerDiv!,
      page: this._page!,
      linkService: this._linkService!,
      renderForms: false,
      imageResourcesPath: '/pdfjs/web/images/',
    });
  }
}
