import { PageViewport, PDFPageProxy } from "pdfjs-dist";
import TextLayer from "./TextLayer";
import { PDFLinkService } from "../service/LinkService";
declare class Annotation extends TextLayer {
    createAnnotationLayer(pageWrapper: HTMLElement, textLayer: HTMLElement, page: PDFPageProxy, viewport: PageViewport, pdfLinkService: PDFLinkService): Promise<void>;
}
export default Annotation;
