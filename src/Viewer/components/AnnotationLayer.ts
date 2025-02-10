// import * as pdfjsLib from 'pdfjs-dist/webpack.mjs';
import { AnnotationLayer as ALayer, PageViewport, PDFDocumentProxy, PDFPageProxy } from 'pdfjs-dist';
import { aPdfViewerClassNames, aPdfViewerIds } from '../../constant/ElementIdClass';
import TextLayer from './TextLayer';
import PageElement from './PageElement';
import WebViewer from './WebViewer';
import { PDFLinkService } from '../service/LS';

class AnnotationLayer extends PageElement {
  private pageWrapper!: HTMLElement;
  private container!: HTMLElement;
  private page!: PDFPageProxy;
  private viewport!: PageViewport;

  constructor(pageWrapper: HTMLElement, container: HTMLElement, page: PDFPageProxy, viewport: PageViewport) {
    super();
    this.pageWrapper = pageWrapper;
    this.container = container;
    this.page = page;
    this.viewport = viewport;
  }

  async createAnnotationLayer(webViewer: WebViewer, pdfDocument: PDFDocumentProxy) {
    const annotationLayerDiv = TextLayer.createLayers(aPdfViewerClassNames._A_ANNOTATION_LAYER, aPdfViewerIds._ANNOTATION_LAYER, this.viewport);
    this.pageWrapper.appendChild(annotationLayerDiv);

    const annotationContent = await this.page.getAnnotations();

    const annotationLayer = new ALayer({
      div: annotationLayerDiv,
      page: this.page,
      viewport: this.viewport,
      accessibilityManager: null,
      annotationCanvasMap: null,
      annotationEditorUIManager: null,
      structTreeLayer: null,
    });

    await annotationLayer.render({
      viewport: this.viewport.clone({ dontFlip: true }),
      div: annotationLayerDiv,
      annotations: annotationContent,
      page: this.page,
      linkService: new PDFLinkService({ pdfDocument: pdfDocument, pdfViewer: webViewer }),
      renderForms: false,
    });

    return annotationLayerDiv;
  }
}

export default AnnotationLayer;
