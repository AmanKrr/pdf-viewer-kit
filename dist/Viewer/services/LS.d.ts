import WebViewer from '../ui/WebViewer';
export declare enum LinkTarget {
    NONE = 0,// Default value.
    SELF = 1,
    BLANK = 2,
    PARENT = 3,
    TOP = 4
}
export interface PDFLinkServiceOptions {
    baseUrl?: string | null;
    pdfDocument?: any;
    pdfViewer?: any;
    pdfHistory?: any;
    externalLinkTarget?: LinkTarget;
    externalLinkRel?: string;
    ignoreDestinationZoom?: boolean;
    externalLinkEnabled?: boolean;
}
export declare class PDFLinkService {
    baseUrl: string | null;
    pdfDocument: any | null;
    pdfViewer: WebViewer | null;
    pdfHistory: any | null;
    externalLinkTarget: LinkTarget;
    externalLinkRel: string;
    private _ignoreDestinationZoom;
    externalLinkEnabled: boolean;
    constructor(options?: PDFLinkServiceOptions);
    setDocument(pdfDocument: any, baseUrl?: string | null): void;
    setViewer(pdfViewer: any): void;
    setHistory(pdfHistory: any): void;
    get pagesCount(): number;
    get page(): number;
    set page(value: number);
    get rotation(): number;
    set rotation(value: number);
    get isInPresentationMode(): boolean;
    /**
     * Navigate to a destination in the PDF.
     *
     * This implementation supports:
     * - Named destinations (if dest is a string)
     * - Explicit destination arrays (if dest is an array)
     *
     * It uses the PDF document's methods to resolve named destinations and page references.
     *
     * @param dest - A destination which can be a string (named destination) or an explicit destination array.
     */
    goToDestination(dest: string | any[]): Promise<void>;
    /**
     * Navigate to a specific page.
     *
     * @param {number | string} val - The page number (or label) to navigate to.
     */
    goToPage(val: number | string): void;
    /**
     * Adds hyperlink attributes to the provided anchor element.
     *
     * @param {HTMLAnchorElement} link - The link element.
     * @param {string} url - The URL for the link.
     * @param {boolean} [newWindow=false] - Whether to open the link in a new window.
     */
    addLinkAttributes(link: HTMLAnchorElement, url: string, newWindow?: boolean): void;
    /**
     * Returns a hash string for the destination.
     *
     * @param {string | number | any[]} dest - The destination.
     * @returns {string} The destination hash.
     */
    getDestinationHash(dest: string | number | any[]): string;
    /**
     * Returns the full anchor URL by prefixing the base URL (if any).
     *
     * @param {string} anchor - The anchor hash (including "#").
     * @returns {string} The full URL.
     */
    getAnchorUrl(anchor: string): string;
    /**
     * Sets the browser's location hash.
     *
     * @param {string} hash - The hash value.
     */
    setHash(hash: string): void;
    /**
     * Executes a named action.
     *
     * @param {string} action - The named action to execute.
     */
    executeNamedAction(action: string): void;
    /**
     * Executes an optional content group (OCG) state change.
     *
     * @param {any} action - The action parameters.
     */
    executeSetOCGState(action: any): Promise<void>;
}
//# sourceMappingURL=LS.d.ts.map