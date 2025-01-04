import PageElement from './PageElement';
import { PageViewport, PDFPageProxy } from 'pdfjs-dist';
declare class TextLayer extends PageElement {
    createTextLayer(pageWrapper: HTMLElement, container: HTMLElement, page: PDFPageProxy, viewport: PageViewport): Promise<HTMLDivElement>;
}
export default TextLayer;
