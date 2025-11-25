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
import { PDFLinkService } from '../services/link.service';
import PageElement from './page-element.component';
import WebViewer from './web-viewer.component';
import { debugWarn } from '../../utils/debug-utils';

/**
 * Renders PDF.js’s built-in annotations (links, forms, etc.)
 * into an overlay on a rendered PDF page.
 */
export default class AnnotationLayer {
  private _pageWrapper: HTMLElement | null;
  private _page: PDFPageProxy | null;
  private _viewport: PageViewport | null;
  private _annotationLayerDiv: HTMLDivElement | null = null;
  private _pdfJsInternalAnnotationLayerInstance: PdfJsAnnotationLayerInternal | null = null;
  private _isDestroyed = false;

  /**
   * @param pageWrapper  Container element for the page.
   * @param page         PDF.js page proxy.
   * @param viewport     The PDF.js viewport at current scale/rotation.
   */
  constructor(pageWrapper: HTMLElement, page: PDFPageProxy, viewport: PageViewport) {
    this._pageWrapper = pageWrapper;
    this._page = page;
    this._viewport = viewport;
  }

  /**
   * Creates and renders the annotation layer for this page.
   *
   * @param webViewer     Host WebViewer instance for link navigation.
   * @param pdfDocument   The loaded PDF document.
   * @param annotationHostDiv Optional element for freehand annotations (unused here).
   * @returns The DIV containing rendered annotations.
   */
  public async createAnnotationLayer(webViewer: WebViewer, pdfDocument: PDFDocumentProxy, annotationHostDiv?: HTMLElement): Promise<HTMLDivElement> {
    if (this._isDestroyed) {
      debugWarn(`AnnotationLayer-${this._page?.pageNumber}: createAnnotationLayer after destroy`);
      throw new Error(`AnnotationLayer for page ${this._page?.pageNumber} was destroyed.`);
    }
    if (!this._pageWrapper || !this._page || !this._viewport) {
      throw new Error('AnnotationLayer not properly initialized.');
    }

    // Create container DIV for PDF.js annotations.
    this._annotationLayerDiv = PageElement.createLayers(PDF_VIEWER_CLASSNAMES.AANNOTATION_LAYER, PDF_VIEWER_IDS.ANNOTATION_LAYER, this._viewport, webViewer.instanceId);
    this._pageWrapper.appendChild(this._annotationLayerDiv);

    const linkService = new PDFLinkService({ pdfDocument, pdfViewer: webViewer });

    // Instantiate the internal PDF.js AnnotationLayer.
    this._pdfJsInternalAnnotationLayerInstance = new PdfJsAnnotationLayerInternal({
      div: this._annotationLayerDiv,
      page: this._page,
      viewport: this._viewport,
      annotationCanvasMap: null,
      accessibilityManager: null,
      annotationEditorUIManager: null,
      structTreeLayer: null,
      commentManager: null,
      linkService,
      annotationStorage: undefined,
    });

    if (this._isDestroyed) {
      debugWarn(`AnnotationLayer-${this._page?.pageNumber}: destroyed during render`);
      this._annotationLayerDiv?.remove();
      throw new Error(`AnnotationLayer for page ${this._page?.pageNumber} was destroyed.`);
    }

    // Fetch annotations and render them into the DIV.
    const annotations = await this._page.getAnnotations();
    await this._pdfJsInternalAnnotationLayerInstance.render({
      viewport: this._viewport.clone({ dontFlip: true }),
      annotations,
      div: this._annotationLayerDiv,
      page: this._page,
      linkService,
      renderForms: false,
      imageResourcesPath: '/pdfjs/web/images/',
      annotationStorage: undefined,
    });

    return this._annotationLayerDiv;
  }

  /**
   * Cleans up the annotation layer, removing DOM elements
   * and clearing references for garbage collection.
   */
  public destroy(): void {
    if (this._isDestroyed) return;
    this._isDestroyed = true;

    this._pdfJsInternalAnnotationLayerInstance = null;
    if (this._annotationLayerDiv) {
      this._annotationLayerDiv.remove();
      this._annotationLayerDiv = null;
    }
    this._pageWrapper = null;
    this._page = null;
    this._viewport = null;
  }
}
