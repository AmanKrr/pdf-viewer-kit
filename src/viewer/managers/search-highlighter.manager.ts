/*
  Copyright 2025 Aman Kumar

  Licensed under the Apache License, Version 2.0 (the "License");
  you may not use this file except in compliance with the License.
  You may obtain a copy of the License at

      http://www.apache.org/licenses/LICENSE-2.0

  Unless required by applicable law or agreed to in writing, software
  distributed under the License is distributed on an "AS IS" BASIS,
  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
  See the License for the specific language governing permissions and
  limitations under the License.
*/

import { PDFDocumentProxy } from 'pdfjs-dist';
import SearchIndexManager from './search-index.manager';
import WebViewer from '../ui/web-viewer.component';
import { PDF_VIEWER_IDS } from '../../constants/pdf-viewer-selectors';
import { scrollElementIntoView } from '../../utils/web-ui-utils';

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
  matchPositions: { startIndex: number; length: number }[];
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
class SearchHighlighter {
  private _currentSearchTerm: string = '';
  private _currentOptions: SearchOptions = { matchCase: false, wholeWord: false, regex: false };

  // Flat list for navigation among highlighted elements.
  private _flatResults: { pageNumber: number; element: HTMLElement }[] = [];
  private _allFlatResults: { pageNumber: number; matchPosition: { startIndex: number; length: number } }[] = [];
  private _currentMatchIndex: number = -1;
  private readonly _webViewer: WebViewer;
  private readonly _searchIndexManager: SearchIndexManager;

  constructor(webViewer: WebViewer) {
    this._webViewer = webViewer;
    this._searchIndexManager = new SearchIndexManager();
  }

  get instance() {
    return this._webViewer;
  }

  get instanceId(): string {
    return this._webViewer.instanceId;
  }

  get containerId(): string {
    return this._webViewer.containerId;
  }

  get state() {
    return this._webViewer.state;
  }

  get pdfDocument() {
    return this._webViewer.pdfDocument!;
  }

  get events() {
    return this._webViewer.events;
  }

  /**
   * Performs a search over all indexed pages.
   * @param searchTerm The term to search for.
   * @param options Search options.
   * @returns An array of PageSearchResult objects.
   */
  async search(searchTerm: string, options: SearchOptions): Promise<PageSearchResult[]> {
    this._currentSearchTerm = searchTerm;
    this._currentOptions = options;
    this._flatResults = [];
    // First, remove any existing highlights.
    this.removeHighlights();

    if (!searchTerm) return [];

    const results: PageSearchResult[] = [];
    let pageNumbers = this._searchIndexManager.getAllPageNumbers();

    if (pageNumbers.length === 0) {
      // If no pages are indexed, extract content from the PDF.
      await this.extractPdfContent(this._webViewer.pdfDocument.numPages, this._webViewer.pdfDocument);
      // Re-fetch the page numbers after extraction.
      pageNumbers = this._searchIndexManager.getAllPageNumbers();
    }

    for (const pageNum of pageNumbers) {
      const text = this._searchIndexManager.getPageText(pageNum);
      if (!text) continue;

      const regex = this._buildRegex(searchTerm, options);
      let match: RegExpExecArray | null;
      const matchPositions: { startIndex: number; length: number }[] = [];
      while ((match = regex.exec(text)) !== null) {
        matchPositions.push({ startIndex: match.index, length: match[0].length });
      }
      if (matchPositions.length > 0) {
        results.push({ pageNumber: pageNum, matchPositions });
        // If the page is rendered, apply inline highlighting.
        await this.highlightPage(pageNum, searchTerm, options);
      }
    }

    this._allFlatResults = [];
    for (const result of results) {
      // result: { pageNumber, matchPositions }
      for (const pos of result.matchPositions) {
        this._allFlatResults.push({ pageNumber: result.pageNumber, matchPosition: pos });
      }
    }

    // Sort by page number then by start index.
    this._allFlatResults.sort((a, b) => {
      if (a.pageNumber !== b.pageNumber) {
        return a.pageNumber - b.pageNumber;
      }
      return a.matchPosition.startIndex - b.matchPosition.startIndex;
    });

    // Optionally, auto-select the first match if any are found.
    if (this._flatResults.length > 0) {
      this.selectMatch(0);
    }

    return results;
  }

  /**
   * Extracts text from all pages and indexes it for search.
   */
  async extractPdfContent(totalPages: number, pdf: PDFDocumentProxy): Promise<void> {
    for (let i = 1; i <= totalPages; i++) {
      const page = await pdf.getPage(i);
      // Extract text and cache it.
      await this._searchIndexManager.extractPageText(i, page);
    }
  }

  /**
   * Builds a RegExp based on the search term and options.
   */
  private _buildRegex(searchTerm: string, options: SearchOptions): RegExp {
    if (options.regex) {
      return new RegExp(searchTerm, options.matchCase ? 'g' : 'gi');
    }
    const escapedTerm = searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const boundary = options.wholeWord ? '\\b' : '';
    return new RegExp(`${boundary}${escapedTerm}${boundary}`, options.matchCase ? 'g' : 'gi');
  }

  /**
   * Applies inline highlighting to a specific page.
   * This method waits for the page container to exist (up to a timeout) and then processes its text layer.
   */
  async highlightPage(pageNumber: number, searchTerm: string, options: SearchOptions): Promise<void> {
    const container = await this._waitForPageContainer(pageNumber);
    if (!container) return;
    const textLayer = container.querySelector('.a-text-layer');
    if (!textLayer) return;

    // Process each text span (assumed to have role="presentation")
    textLayer.querySelectorAll('span[role="presentation"]').forEach((span) => {
      if (span.textContent) {
        const regex = this._buildRegex(searchTerm, options);
        // Replace matching text with a span that has the "search-highlight" class.
        span.innerHTML = span.textContent.replace(regex, (match) => `<span class="search-highlight" style="position: relative; display: inline-block;">${match}</span>`);
      }
    });

    // Update flat results for navigation.
    const matches = Array.from(textLayer.querySelectorAll('.search-highlight')) as HTMLElement[];
    matches.forEach((el) => {
      this._flatResults.push({ pageNumber, element: el });
    });
  }

  /**
   * Waits until the page container (with ID "pageContainer-{pageNumber}") is available in the DOM.
   * Returns null after a timeout.
   */
  private _waitForPageContainer(pageNumber: number): Promise<HTMLElement | null> {
    return new Promise((resolve) => {
      let attempts = 0;
      const maxAttempts = 0.2; // 50 * 100ms = 5 seconds
      const check = () => {
        const el = document
          .getElementById(this.containerId)
          ?.shadowRoot?.querySelector(`#pageContainer-${this.instanceId}-${pageNumber}[data-page-number="${pageNumber}"]`) as HTMLElement;
        if (el) {
          resolve(el);
        } else {
          attempts++;
          if (attempts >= maxAttempts) {
            resolve(null);
          } else {
            setTimeout(check, 100);
          }
        }
      };
      check();
    });
  }

  /**
   * Removes all inline highlights from all text layers.
   */
  removeHighlights(): void {
    document
      .getElementById(this.containerId)
      ?.shadowRoot?.querySelectorAll(`.a-text-layer`)
      .forEach((layer) => {
        layer.querySelectorAll('span[role="presentation"]').forEach((span) => {
          if (span.textContent) {
            span.innerHTML = span.textContent;
          }
        });
      });
    this._flatResults = [];
    this._currentMatchIndex = -1;
  }

  /**
   * Called by the virtualization system when a page is mounted.
   * If a search is active, reapply highlights on that page.
   */
  async registerPage(pageNumber: number): Promise<void> {
    if (this._currentSearchTerm) {
      await this.highlightPage(pageNumber, this._currentSearchTerm, this._currentOptions);
    }
  }

  /**
   * Called when a page is unmounted; cleans up any highlight data for that page.
   */
  deregisterPage(pageNumber: number): void {
    const container = document.getElementById(this.containerId)?.shadowRoot?.querySelector(`#pageContainer-${this.instanceId}-${pageNumber}[data-page-number="${pageNumber}"]`);
    if (container) {
      const textLayer = container.querySelector('.a-text-layer');
      if (textLayer) {
        textLayer.querySelectorAll('.search-highlight').forEach((el) => {
          (el as HTMLElement).classList.remove('search-highlight');
        });
      }
    }
    // Remove flat results for this page.
    this._flatResults = this._flatResults.filter((r) => r.pageNumber !== pageNumber);
  }

  /**
   * Selects a match by its index in the flat result array, scrolls it into view,
   * and adds an active highlight style.
   */
  selectMatch(index: number): void {
    if (this._allFlatResults.length === 0) return;
    this._currentMatchIndex = index;
    const targetMatch = this._allFlatResults[index];

    // if match result page is not in vitualization buffer then go to that page
    // and wait for the page to be rendered.
    // This is a workaround for the issue where the page is not rendered yet.
    if (targetMatch) {
      const container = document
        .getElementById(this.containerId)
        ?.shadowRoot?.querySelector(`#pageContainer-${this.instanceId}-${targetMatch.pageNumber}[data-page-number="${targetMatch.pageNumber}"]`);
      if (!container && this._webViewer) {
        this._webViewer.goToPage(targetMatch.pageNumber);
        setTimeout(() => {
          this.selectMatch(index);
        }, 300);
        return;
      }
    }

    // Wait until the page is rendered.
    this._waitForPageContainer(targetMatch.pageNumber).then((container) => {
      if (!container) return;
      const textLayer = container.querySelector('.a-text-layer');
      if (!textLayer) return;
      // Get all highlight elements on that page.
      const highlights = Array.from(textLayer.querySelectorAll('.search-highlight')) as HTMLElement[];

      // Determine the match’s index on that page:
      const indexOnPage = this._allFlatResults.filter((m) => m.pageNumber === targetMatch.pageNumber && m.matchPosition.startIndex < targetMatch.matchPosition.startIndex).length;

      const targetElement = highlights[indexOnPage];
      if (targetElement) {
        // Remove active class from all highlights on that page.
        highlights.forEach((el) => el.classList.remove('a-active-highlight'));
        targetElement.classList.add('a-active-highlight');

        // Find the main viewer container to scroll within
        const mainViewerContainer = document.getElementById(this.containerId)?.shadowRoot?.querySelector(`#${PDF_VIEWER_IDS['MAIN_VIEWER_CONTAINER']}-${this.instanceId}`);
        if (mainViewerContainer) {
          scrollElementIntoView(targetElement, { block: 'center', container: mainViewerContainer });
        } else {
          // Fallback to default behavior
          scrollElementIntoView(targetElement, { block: 'center' });
        }
      }
    });
  }

  /**
   * Navigate to the next match.
   */
  nextMatch(): void {
    if (this._allFlatResults.length === 0) return;
    const next = (this._currentMatchIndex + 1) % this._allFlatResults.length;
    this.selectMatch(next);
  }

  /**
   * Navigate to the previous match.
   */
  prevMatch(): void {
    if (this._allFlatResults.length === 0) return;
    const prev = (this._currentMatchIndex - 1 + this._allFlatResults.length) % this._allFlatResults.length;
    this.selectMatch(prev);
  }

  public getMatchStatus(): { current: number; total: number } {
    return {
      current: this._allFlatResults.length > 0 && this._currentMatchIndex >= 0 ? this._currentMatchIndex + 1 : 0,
      total: this._allFlatResults.length,
    };
  }
}

export default SearchHighlighter;
