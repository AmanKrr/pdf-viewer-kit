import { PDFPageProxy } from 'pdfjs-dist';
/**
 * The SearchIndexManager extracts and caches text for each page in the PDF.
 * This module can later be extended (for example, to build a Trie for auto-suggestions).
 */
declare class SearchIndexManager {
    private pageTexts;
    /**
     * Extracts text from a PDF page and caches it.
     * @param pageNumber The page number.
     * @param page The PDF.js page proxy.
     */
    extractPageText(pageNumber: number, page: PDFPageProxy): Promise<void>;
    /**
     * Returns the cached text for a given page.
     * @param pageNumber The page number.
     */
    getPageText(pageNumber: number): string | undefined;
    /**
     * Returns an array of page numbers for which text has been extracted.
     */
    getAllPageNumbers(): number[];
}
declare const _default: SearchIndexManager;
export default _default;
