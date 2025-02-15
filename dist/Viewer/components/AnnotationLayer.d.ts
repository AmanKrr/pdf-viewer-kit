import { PageViewport, PDFDocumentProxy, PDFPageProxy } from 'pdfjs-dist';
import PageElement from './PageElement';
import WebViewer from './WebViewer';
declare class AnnotationLayer extends PageElement {
    private pageWrapper;
    private page;
    private viewport;
    constructor(pageWrapper: HTMLElement, page: PDFPageProxy, viewport: PageViewport);
    createAnnotationLayer(webViewer: WebViewer, pdfDocument: PDFDocumentProxy): Promise<HTMLDivElement>;
}
export default AnnotationLayer;
