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

import { PDFDocumentProxy, PDFPageProxy } from 'pdfjs-dist';
import PdfState from '../components/PdfState';
import SearchIndexManager from './SearchIndexManager';
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
  private currentSearchTerm: string = '';
  private currentOptions: SearchOptions = { matchCase: false, wholeWord: false, regex: false };

  // Flat list for navigation among highlighted elements.
  private flatResults: { pageNumber: number; element: HTMLElement }[] = [];
  private allFlatResults: { pageNumber: number; matchPosition: { startIndex: number; length: number } }[] = [];
  private currentMatchIndex: number = -1;
  private pdfViewer: WebViewer | null = null;

  set viewer(pdfViewer: WebViewer) {
    this.pdfViewer = pdfViewer;
  }

  /**
   * Performs a search over all indexed pages.
   * @param searchTerm The term to search for.
   * @param options Search options.
   * @returns An array of PageSearchResult objects.
   */
  async search(searchTerm: string, options: SearchOptions, pdfState: PdfState): Promise<PageSearchResult[]> {
    this.currentSearchTerm = searchTerm;
    this.currentOptions = options;
    this.flatResults = [];
    // First, remove any existing highlights.
    this.removeHighlights();

    if (!searchTerm) return [];

    const results: PageSearchResult[] = [];
    let pageNumbers = SearchIndexManager.getAllPageNumbers();

    if (pageNumbers.length === 0) {
      // If no pages are indexed, extract content from the PDF.
      await this.extractPdfContent(pdfState.pdfInstance.numPages, pdfState.pdfInstance);
      // Re-fetch the page numbers after extraction.
      pageNumbers = SearchIndexManager.getAllPageNumbers();
    }

    for (const pageNum of pageNumbers) {
      const text = SearchIndexManager.getPageText(pageNum);
      if (!text) continue;

      const regex = this.buildRegex(searchTerm, options);
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

    this.allFlatResults = [];
    for (const result of results) {
      // result: { pageNumber, matchPositions }
      for (const pos of result.matchPositions) {
        this.allFlatResults.push({ pageNumber: result.pageNumber, matchPosition: pos });
      }
    }

    // Sort by page number then by start index.
    this.allFlatResults.sort((a, b) => {
      if (a.pageNumber !== b.pageNumber) {
        return a.pageNumber - b.pageNumber;
      }
      return a.matchPosition.startIndex - b.matchPosition.startIndex;
    });

    // Optionally, auto-select the first match if any are found.
    if (this.flatResults.length > 0) {
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
      await SearchIndexManager.extractPageText(i, page);
    }
  }

  /**
   * Builds a RegExp based on the search term and options.
   */
  private buildRegex(searchTerm: string, options: SearchOptions): RegExp {
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
    const container = await this.waitForPageContainer(pageNumber);
    if (!container) return;
    const textLayer = container.querySelector('.a-text-layer');
    if (!textLayer) return;

    // Process each text span (assumed to have role="presentation")
    textLayer.querySelectorAll('span[role="presentation"]').forEach((span) => {
      if (span.textContent) {
        const regex = this.buildRegex(searchTerm, options);
        // Replace matching text with a span that has the "search-highlight" class.
        span.innerHTML = span.textContent.replace(regex, (match) => `<span class="search-highlight" style="position: relative; display: inline-block;">${match}</span>`);
      }
    });

    // Update flat results for navigation.
    const matches = Array.from(textLayer.querySelectorAll('.search-highlight')) as HTMLElement[];
    matches.forEach((el) => {
      this.flatResults.push({ pageNumber, element: el });
    });
  }

  /**
   * Waits until the page container (with ID "pageContainer-{pageNumber}") is available in the DOM.
   * Returns null after a timeout.
   */
  private waitForPageContainer(pageNumber: number): Promise<HTMLElement | null> {
    return new Promise((resolve) => {
      let attempts = 0;
      const maxAttempts = 0.2; // 50 * 100ms = 5 seconds
      const check = () => {
        const el = document.getElementById(`pageContainer-${pageNumber}`);
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
    document.querySelectorAll('.a-text-layer').forEach((layer) => {
      layer.querySelectorAll('span[role="presentation"]').forEach((span) => {
        if (span.textContent) {
          span.innerHTML = span.textContent;
        }
      });
    });
    this.flatResults = [];
    this.currentMatchIndex = -1;
  }

  /**
   * Called by the virtualization system when a page is mounted.
   * If a search is active, reapply highlights on that page.
   */
  async registerPage(pageNumber: number): Promise<void> {
    if (this.currentSearchTerm) {
      await this.highlightPage(pageNumber, this.currentSearchTerm, this.currentOptions);
    }
  }

  /**
   * Called when a page is unmounted; cleans up any highlight data for that page.
   */
  deregisterPage(pageNumber: number): void {
    const container = document.getElementById(`pageContainer-${pageNumber}`);
    if (container) {
      const textLayer = container.querySelector('.a-text-layer');
      if (textLayer) {
        textLayer.querySelectorAll('.search-highlight').forEach((el) => {
          (el as HTMLElement).classList.remove('search-highlight');
        });
      }
    }
    // Remove flat results for this page.
    this.flatResults = this.flatResults.filter((r) => r.pageNumber !== pageNumber);
  }

  /**
   * Selects a match by its index in the flat result array, scrolls it into view,
   * and adds an active highlight style.
   */
  selectMatch(index: number): void {
    if (this.allFlatResults.length === 0) return;
    this.currentMatchIndex = index;
    const targetMatch = this.allFlatResults[index];

    // if match result page is not in vitualization buffer then go to that page
    // and wait for the page to be rendered.
    // This is a workaround for the issue where the page is not rendered yet.
    if (targetMatch) {
      const container = document.getElementById(`pageContainer-${targetMatch.pageNumber}`);
      if (!container && this.pdfViewer) {
        this.pdfViewer.goToPage(targetMatch.pageNumber);
        setTimeout(() => {
          this.selectMatch(index);
        }, 300);
        return;
      }
    }

    // Wait until the page is rendered.
    this.waitForPageContainer(targetMatch.pageNumber).then((container) => {
      if (!container) return;
      const textLayer = container.querySelector('.a-text-layer');
      if (!textLayer) return;
      // Get all highlight elements on that page.
      const highlights = Array.from(textLayer.querySelectorAll('.search-highlight')) as HTMLElement[];

      // Determine the match’s index on that page:
      const indexOnPage = this.allFlatResults.filter((m) => m.pageNumber === targetMatch.pageNumber && m.matchPosition.startIndex < targetMatch.matchPosition.startIndex).length;

      const targetElement = highlights[indexOnPage];
      if (targetElement) {
        // Remove active class from all highlights on that page.
        highlights.forEach((el) => el.classList.remove('a-active-highlight'));
        targetElement.classList.add('a-active-highlight');
        targetElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    });
  }

  /**
   * Navigate to the next match.
   */
  nextMatch(): void {
    if (this.allFlatResults.length === 0) return;
    const next = (this.currentMatchIndex + 1) % this.allFlatResults.length;
    this.selectMatch(next);
  }

  /**
   * Navigate to the previous match.
   */
  prevMatch(): void {
    if (this.allFlatResults.length === 0) return;
    const prev = (this.currentMatchIndex - 1 + this.allFlatResults.length) % this.allFlatResults.length;
    this.selectMatch(prev);
  }

  public getMatchStatus(): { current: number; total: number } {
    return {
      current: this.allFlatResults.length > 0 && this.currentMatchIndex >= 0 ? this.currentMatchIndex + 1 : 0,
      total: this.allFlatResults.length,
    };
  }
}

export default new SearchHighlighter();
