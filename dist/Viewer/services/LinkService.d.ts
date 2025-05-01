import PdfState from '../ui/PDFState';
import WebViewer from '../ui/WebViewer';
import { PDFDocumentProxy } from 'pdfjs-dist';
import EventEmitter from '../events/EventUtils';
/**
 * Default security attributes for external links to prevent security vulnerabilities.
 */
declare const DEFAULT_LINK_REL = "noopener noreferrer nofollow";
/**
 * Defines available link targets for navigation.
 */
declare enum LinkTarget {
    NONE = 0,
    SELF = 1,
    BLANK = 2,
    PARENT = 3,
    TOP = 4
}
/**
 * Configuration options for `PDFLinkService`.
 */
interface PDFLinkServiceOptions {
    pdfState?: PdfState | null;
    pdfDocument?: PDFDocumentProxy;
    pdfViewer: WebViewer;
    eventBus?: EventEmitter;
}
/**
 * Handles navigation and linking within a PDF document.
 * Allows interaction with internal and external links, providing methods for controlled navigation.
 */
declare class PDFLinkService {
    /** Indicates whether external links should be enabled. Defaults to `true`. */
    externalLinkEnabled: boolean;
    private _pdfDocument;
    private _pdfViewer;
    private _pdfState;
    /**
     * Constructs the `PDFLinkService` instance.
     *
     * @param {PDFLinkServiceOptions} options - Configuration options for the link service.
     */
    constructor({ pdfState, pdfViewer }: PDFLinkServiceOptions);
    /**
     * Retrieves the current page number being viewed.
     *
     * @returns {number} The currently active page number, or `-1` if the viewer is not initialized.
     */
    get currentPageNumber(): number;
    /**
     * Navigates to a specific page in the PDF viewer.
     *
     * @param {number} pageNumber - The target page number to navigate to.
     */
    goToPage(pageNumber: number): void;
}
export { PDFLinkService, LinkTarget, DEFAULT_LINK_REL };
//# sourceMappingURL=LinkService.d.ts.map