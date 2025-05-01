import { SearchOptions } from '../manager/SearchHighlighter';
/**
 * SearchBar creates the search UI and wires events to perform a search,
 * navigate matches, and update the match counter.
 *
 * It expects the following instance methods to be available:
 *  - this.search(searchTerm: string, options: { matchCase: boolean, regex: boolean, wholeWord: boolean })
 *  - this.prevMatch()
 *  - this.nextMatch()
 *
 * It also stores references to its UI elements (search input, match counter, etc.)
 * for further use (like updating the counter).
 */
declare class SearchBar {
    private _pdfState;
    private _container;
    private _searchInputElement;
    private _matchCounterElement;
    private _upButtonElement;
    private _downButtonElement;
    /**
     * Creates and inserts the search bar into the viewer.
     * @param pdfState - The PDF state object with containerId property.
     * @param searchCallback - A function to perform the search.
     * @param prevMatchCallback - A function to go to the previous match.
     * @param nextMatchCallback - A function to go to the next match.
     */
    constructor(pdfState: any, searchCallback: (searchTerm: string, options: SearchOptions) => Promise<void>, prevMatchCallback: () => void, nextMatchCallback: () => void, getMatchStatus: () => {
        current: number;
        total: number;
    });
    private _debounceSearch;
    /**
     * Optionally, expose methods to show/hide or update the search bar.
     */
    show(): void;
    /**
     * Hides the search bar.
     */
    hide(): void;
    /**
     * Updates the match counter display.
     * @param current The current match index (1-indexed).
     * @param total The total number of matches.
     */
    updateMatchCounter(current: number, total: number): void;
}
export default SearchBar;
//# sourceMappingURL=PDFSearchBar.d.ts.map