import { IPDFLinkService } from "./Interface";
declare const DEFAULT_LINK_REL = "noopener noreferrer nofollow";
declare enum LinkTarget {
    NONE = 0,
    SELF = 1,
    BLANK = 2,
    PARENT = 3,
    TOP = 4
}
interface PDFLinkServiceOptions {
    externalLinkTarget?: LinkTarget | null;
    externalLinkRel?: string | null;
    ignoreDestinationZoom?: boolean;
}
declare class PDFLinkService implements IPDFLinkService {
    #private;
    externalLinkEnabled: boolean;
    externalLinkTarget: LinkTarget | null;
    externalLinkRel: string | null;
    private _ignoreDestinationZoom;
    baseUrl: string | null;
    pdfDocument: any;
    pdfViewer: any;
    pdfHistory: any;
    constructor({ externalLinkTarget, externalLinkRel, ignoreDestinationZoom, }?: PDFLinkServiceOptions);
    setDocument(pdfDocument: any, baseUrl?: string | null): void;
    setViewer(pdfViewer: any): void;
    setHistory(pdfHistory: any): void;
    get pagesCount(): number;
    get page(): number;
    set page(value: number);
    get rotation(): number;
    set rotation(value: number);
    get isInPresentationMode(): boolean;
    goToDestination(dest: string | any[]): Promise<void>;
    goToPage(val: number | string): void;
    addLinkAttributes(link: HTMLAnchorElement, url: string, newWindow?: boolean): void;
    getDestinationHash(dest: string | any[]): string;
    getAnchorUrl(anchor: string): string;
    setHash(hash: string): void;
    executeNamedAction(action: string): void;
    executeSetOCGState(action: any): Promise<void>;
}
export { PDFLinkService, LinkTarget, DEFAULT_LINK_REL };
