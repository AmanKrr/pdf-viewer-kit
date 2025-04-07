import { PDFDocumentProxy } from 'pdfjs-dist';
import PdfState from '../components/PdfState';
import WebViewer from '../components/WebViewer';
export interface SearchOptions {
    matchCase: boolean;
    wholeWord: boolean;
    regex: boolean;
}
/**
 * Represents a search result on a single page.
 */
export interface PageSearchResult {
    pageNumber: number;
    matchPositions: {
        startIndex: number;
        length: number;
    }[];
}
/**
 * The SearchHighlighter module performs searches over the indexed text,
 * then applies inline highlights to the corresponding text layer elements.
 * It also maintains a flat list of highlighted elements for result navigation.
 *
 * Integration Note: Each page container should have an ID in the format "pageContainer-{pageNumber}"
 * and its text layer should use the class "a-text-layer". The text spans inside the layer should
 * have the attribute role="presentation".
 */
declare class SearchHighlighter {
    private currentSearchTerm;
    private currentOptions;
    private flatResults;
    private allFlatResults;
    private currentMatchIndex;
    private pdfViewer;
    set viewer(pdfViewer: WebViewer);
    /**
     * Performs a search over all indexed pages.
     * @param searchTerm The term to search for.
     * @param options Search options.
     * @returns An array of PageSearchResult objects.
     */
    search(searchTerm: string, options: SearchOptions, pdfState: PdfState): Promise<PageSearchResult[]>;
    /**
     * Extracts text from all pages and indexes it for search.
     */
    extractPdfContent(totalPages: number, pdf: PDFDocumentProxy): Promise<void>;
    /**
     * Builds a RegExp based on the search term and options.
     */
    private buildRegex;
    /**
     * Applies inline highlighting to a specific page.
     * This method waits for the page container to exist (up to a timeout) and then processes its text layer.
     */
    highlightPage(pageNumber: number, searchTerm: string, options: SearchOptions): Promise<void>;
    /**
     * Waits until the page container (with ID "pageContainer-{pageNumber}") is available in the DOM.
     * Returns null after a timeout.
     */
    private waitForPageContainer;
    /**
     * Removes all inline highlights from all text layers.
     */
    removeHighlights(): void;
    /**
     * Called by the virtualization system when a page is mounted.
     * If a search is active, reapply highlights on that page.
     */
    registerPage(pageNumber: number): Promise<void>;
    /**
     * Called when a page is unmounted; cleans up any highlight data for that page.
     */
    deregisterPage(pageNumber: number): void;
    /**
     * Selects a match by its index in the flat result array, scrolls it into view,
     * and adds an active highlight style.
     */
    selectMatch(index: number): void;
    /**
     * Navigate to the next match.
     */
    nextMatch(): void;
    /**
     * Navigate to the previous match.
     */
    prevMatch(): void;
    getMatchStatus(): {
        current: number;
        total: number;
    };
}
declare const _default: SearchHighlighter;
export default _default;
