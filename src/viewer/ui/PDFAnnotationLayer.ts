import { AnnotationLayer as ALayer, PageViewport, PDFDocumentProxy, PDFPageProxy } from 'pdfjs-dist';
import { PDF_VIEWER_CLASSNAMES, PDF_VIEWER_IDS } from '../../constants/pdf-viewer-selectors';
import TextLayer from './PDFTextLayer';
import { PDFLinkService } from '../services/LS';
import PageElement from './PDFPageElement';
import WebViewer from './WebViewer';

class AnnotationLayer extends PageElement {
  private _pageWrapper!: HTMLElement;
  private _page!: PDFPageProxy;
  private _viewport!: PageViewport;

  constructor(pageWrapper: HTMLElement, page: PDFPageProxy, viewport: PageViewport) {
    super();
    this._pageWrapper = pageWrapper;
    this._page = page;
    this._viewport = viewport;
  }

  async createAnnotationLayer(webViewer: WebViewer, pdfDocument: PDFDocumentProxy) {
    const annotationLayerDiv = TextLayer.createLayers(PDF_VIEWER_CLASSNAMES.AANNOTATION_LAYER, PDF_VIEWER_IDS.ANNOTATION_LAYER, this._viewport);
    this._pageWrapper.appendChild(annotationLayerDiv);

    const annotationContent = await this._page.getAnnotations();

    const annotationLayer = new ALayer({
      div: annotationLayerDiv,
      page: this._page,
      viewport: this._viewport,
      accessibilityManager: null,
      annotationCanvasMap: null,
      annotationEditorUIManager: null,
      structTreeLayer: null,
    });

    await annotationLayer.render({
      viewport: this._viewport.clone({ dontFlip: true }),
      div: annotationLayerDiv,
      annotations: annotationContent,
      page: this._page,
      linkService: new PDFLinkService({ pdfDocument: pdfDocument, pdfViewer: webViewer }),
      renderForms: false,
    });

    return annotationLayerDiv;
  }
}

export default AnnotationLayer;
