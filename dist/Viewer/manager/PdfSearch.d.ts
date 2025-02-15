import PdfState from '../components/PdfState';
import WebViewer from '../components/WebViewer';
/**
 * Options for search behavior.
 */
interface SearchOptions {
    matchCase: boolean;
    wholeWord: boolean;
    regex: boolean;
}
/**
 * Represents a bounding box for highlighting search matches.
 */
interface MatchBoundingBox {
    x: number;
    y: number;
    width: number;
    height: number;
}
/**
 * Represents a search result, including the page number, total matches, and match positions.
 */
interface SearchResult {
    pageNumber: number;
    totalMatches: number;
    matchPositions: {
        startIndex: number;
        length: number;
        bbox?: MatchBoundingBox;
    }[];
}
/**
 * Handles PDF text extraction, search, and inline highlighting in the viewer.
 */
declare class PdfSearch {
    private textIndex;
    private trie;
    private pdfState;
    private currentMatchIndex;
    private matches;
    private pdfViewer;
    /**
     * The flat array built from the search results. In this inline‐highlighting version,
     * each found match has its associated inline element (wrapped with class "search-highlight").
     */
    private foundMatches;
    private matchCounterElement;
    private upButtonElement;
    private downButtonElement;
    private searchInputElement;
    private currentSearchTerm;
    private currentSearchOptions;
    /**
     * Initializes the PDF search module.
     *
     * @param {PdfState} pdfState - The PDF state instance managing document interactions.
     * @param {WebViewer} pdfViewer - The viewer instance (used for navigation, etc.)
     */
    constructor(pdfState: PdfState, pdfViewer: WebViewer);
    /**
     * Extracts text from all pages and indexes it for search.
     */
    extractPdfContent(): Promise<void>;
    /**
     * Returns a promise that resolves when the page container for the given page number exists.
     *
     * @param pageNumber - The page number to wait for.
     * @returns {Promise<HTMLElement>} A promise that resolves with the page container element.
     */
    private waitForPageContainer;
    /**
     * Extracts text from a specific page and caches it.
     *
     * @param {number} pageNumber - The page number to extract text from.
     */
    private extractPageText;
    /**
     * Searches for a term in the indexed PDF text.
     *
     * This method now also saves the current search term and options so that inline highlighting
     * can be re-applied if a page is virtualized.
     *
     * @param {string} searchTerm - The term to search for.
     * @param {SearchOptions} options - The search options.
     * @returns {Promise<SearchResult[]>} An array of search results.
     */
    search(searchTerm: string, options: SearchOptions): Promise<SearchResult[]>;
    /**
     * Removes all existing inline search highlights.
     */
    removeHighlights(): void;
    /**
     * Constructs the appropriate regex pattern for searching.
     *
     * @param {string} searchTerm - The search term.
     * @param {SearchOptions} options - The search options.
     * @returns {RegExp} The constructed regex pattern.
     */
    private constructSearchPattern;
    /**
     * Applies inline highlighting to a given page by wrapping matched text in the text layer spans.
     *
     * This method waits for the page container and its text layer (with class "a-text-layer") to be available,
     * then iterates over each text span (assumed to have role="presentation") and replaces matching text with
     * a wrapped element (<span class="search-highlight">…</span>).
     *
     * After processing, it updates the global foundMatches array with the inline highlight elements.
     *
     * @param {number} pageNumber - The page number to process.
     * @param {string} searchTerm - The search term.
     * @param {SearchOptions} options - The search options.
     * @returns {Promise<void>}
     */
    private highlightInlineMatchesForPage;
    /**
     * Refreshes (re-applies) inline highlights on a specific page.
     *
     * This is used when the page is re-rendered (for example via virtualization)
     * or when navigating to a match. It uses the saved current search term/options.
     *
     * @param {number} pageNumber - The page number to refresh.
     * @returns {Promise<void>}
     */
    private refreshInlineHighlightsForPage;
    /**
     * Selects a match (by index), updates the active inline highlight styling, scrolls it into view,
     * and navigates to the correct page. When the target page is not rendered, it waits
     * and then refreshes only that page’s inline highlights without affecting other pages.
     *
     * @param {number} index - The index of the match to select.
     */
    private selectMatch;
    /**
     * Moves to the next match in the list.
     */
    private nextMatch;
    /**
     * Moves to the previous match in the list.
     */
    private prevMatch;
    /**
     * Creates a UI for the search feature.
     */
    createSearchLayout(): void;
}
export default PdfSearch;
