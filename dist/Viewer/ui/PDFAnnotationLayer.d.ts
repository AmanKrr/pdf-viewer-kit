import { PageViewport, PDFDocumentProxy, PDFPageProxy } from 'pdfjs-dist';
import PageElement from './PDFPageElement';
import WebViewer from './WebViewer';
declare class AnnotationLayer extends PageElement {
    private _pageWrapper;
    private _page;
    private _viewport;
    constructor(pageWrapper: HTMLElement, page: PDFPageProxy, viewport: PageViewport);
    createAnnotationLayer(webViewer: WebViewer, pdfDocument: PDFDocumentProxy): Promise<HTMLDivElement>;
}
export default AnnotationLayer;
//# sourceMappingURL=PDFAnnotationLayer.d.ts.map