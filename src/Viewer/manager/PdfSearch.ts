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

import { aPdfViewerClassNames } from '../../constant/ElementIdClass';
import PdfState from '../components/PdfState';
import WebViewer from '../components/WebViewer';
import Trie from './Trie';

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
  matchPositions: { startIndex: number; length: number; bbox?: MatchBoundingBox }[];
}

/**
 * Handles PDF text extraction, search, and inline highlighting in the viewer.
 */
class PdfSearch {
  private textIndex: Map<number, string> = new Map();
  private trie: Trie = new Trie();
  private pdfState: PdfState;
  private currentMatchIndex: number = -1; // -1 indicates no match is selected
  private matches: SearchResult[] = [];
  private pdfViewer: WebViewer;
  /**
   * The flat array built from the search results. In this inline‐highlighting version,
   * each found match has its associated inline element (wrapped with class "search-highlight").
   */
  private foundMatches: {
    pageNumber: number;
    highlights: HTMLElement[]; // In our case, one element per match.
    matchPosition: { startIndex: number; length: number };
  }[] = [];

  // References for UI elements
  private matchCounterElement: HTMLElement | null = null;
  private upButtonElement: HTMLElement | null = null;
  private downButtonElement: HTMLElement | null = null;
  private searchInputElement: HTMLInputElement | null = null;

  // Save the current search term and options for later re-highlighting.
  private currentSearchTerm: string = '';
  private currentSearchOptions: SearchOptions = { matchCase: false, wholeWord: false, regex: false };

  /**
   * Initializes the PDF search module.
   *
   * @param {PdfState} pdfState - The PDF state instance managing document interactions.
   * @param {WebViewer} pdfViewer - The viewer instance (used for navigation, etc.)
   */
  constructor(pdfState: PdfState, pdfViewer: WebViewer) {
    this.pdfState = pdfState;
    this.pdfViewer = pdfViewer;
    this.createSearchLayout();
  }

  /**
   * Extracts text from all pages and indexes it for search.
   */
  async extractPdfContent(): Promise<void> {
    for (let i = 1; i <= this.pdfState.pdfInstance.numPages; i++) {
      await this.extractPageText(i);
    }
  }

  /**
   * Returns a promise that resolves when the page container for the given page number exists.
   *
   * @param pageNumber - The page number to wait for.
   * @returns {Promise<HTMLElement>} A promise that resolves with the page container element.
   */
  private waitForPageContainer(pageNumber: number): Promise<HTMLElement> {
    return new Promise((resolve) => {
      const checkContainer = () => {
        const container = document.querySelector(`#pageContainer-${pageNumber}`);
        if (container) {
          resolve(container as HTMLElement);
        } else {
          // Check again after a short delay.
          setTimeout(checkContainer, 100);
        }
      };
      checkContainer();
    });
  }

  /**
   * Extracts text from a specific page and caches it.
   *
   * @param {number} pageNumber - The page number to extract text from.
   */
  private async extractPageText(pageNumber: number): Promise<void> {
    if (this.textIndex.has(pageNumber)) return;

    const page = await this.pdfState.pdfInstance.getPage(pageNumber);
    const textContent = await page.getTextContent();
    const extractedText = textContent.items
      .map((item: any) => (item.str !== '' ? item.str : '@REMOVE-1-1'))
      .filter((item) => item !== '@REMOVE-1-1')
      .join(' ');

    this.textIndex.set(pageNumber, extractedText);

    // Store words in Trie for auto-suggestions
    extractedText.split(/\s+/).forEach((word) => this.trie.insert(word));
  }

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
  async search(searchTerm: string, options: SearchOptions): Promise<SearchResult[]> {
    this.currentSearchTerm = searchTerm;
    this.currentSearchOptions = options;
    this.removeHighlights();
    if (!searchTerm) return [];
    if (this.textIndex.size === 0) await this.extractPdfContent();

    this.matches = []; // reset any previous match results

    // Use the full-text (per page) to find match positions.
    for (const [pageNumber, pageText] of this.textIndex) {
      let match;
      let matchCount = 0;
      const matchPositions: { startIndex: number; length: number }[] = [];

      const searchPattern = this.constructSearchPattern(searchTerm, options);
      while ((match = searchPattern.exec(pageText)) !== null) {
        matchPositions.push({ startIndex: match.index, length: match[0].length });
        matchCount++;
      }

      if (matchCount > 0) {
        this.matches.push({ pageNumber, totalMatches: matchCount, matchPositions });
      }
    }

    // For each page with matches, apply inline highlighting.
    for (const result of this.matches) {
      await this.highlightInlineMatchesForPage(result.pageNumber, searchTerm, options);
    }

    // Update the match counter display.
    if (this.matchCounterElement) {
      this.matchCounterElement.textContent = `${this.foundMatches.length > 0 ? 1 : 0} / ${this.foundMatches.length}`;
    }

    // If any match is found, automatically select the first one.
    if (this.foundMatches.length > 0) {
      this.selectMatch(0);
    }
    return this.matches;
  }

  /**
   * Removes all existing inline search highlights.
   */
  removeHighlights(): void {
    // Remove any inserted inline highlights by removing the wrapping elements.
    // For each page container, reset its text layer spans to plain text.
    document.querySelectorAll('.a-text-layer').forEach((textLayer) => {
      // Remove our inserted <span class="search-highlight"> elements by replacing their parent innerHTML
      // For simplicity, we re-set the innerText of each span.
      textLayer.querySelectorAll('span[role="presentation"]').forEach((span) => {
        // Replace innerHTML with its textContent so that our highlight markup is removed.
        if (span.textContent) {
          span.innerHTML = span.textContent;
        }
      });
    });
    this.matches = [];
    this.foundMatches = [];
    this.currentMatchIndex = -1;
    if (this.matchCounterElement) {
      this.matchCounterElement.textContent = '0/0';
    }
  }

  /**
   * Constructs the appropriate regex pattern for searching.
   *
   * @param {string} searchTerm - The search term.
   * @param {SearchOptions} options - The search options.
   * @returns {RegExp} The constructed regex pattern.
   */
  private constructSearchPattern(searchTerm: string, options: SearchOptions): RegExp {
    if (options.regex) {
      return new RegExp(searchTerm, options.matchCase ? 'g' : 'gi');
    } else {
      const escapedTerm = searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const boundary = options.wholeWord ? '\\b' : '';
      return new RegExp(`${boundary}${escapedTerm}${boundary}`, options.matchCase ? 'g' : 'gi');
    }
  }

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
  private async highlightInlineMatchesForPage(pageNumber: number, searchTerm: string, options: SearchOptions): Promise<void> {
    const container = await this.waitForPageContainer(pageNumber);
    // Assume the text layer has a class "a-text-layer"
    const textLayer = container.querySelector('.a-text-layer');
    if (!textLayer) return;

    // For each span that contains text
    textLayer.querySelectorAll('span[role="presentation"]').forEach((span) => {
      if (span.textContent) {
        const regex = this.constructSearchPattern(searchTerm, options);
        // Replace occurrences by wrapping them with our highlight element.
        span.innerHTML = span.textContent.replace(regex, (match) => `<span class="search-highlight">${match}</span>`);
      }
    });

    // Update foundMatches for this page:
    // Remove any existing entries for this page.
    this.foundMatches = this.foundMatches.filter((m) => m.pageNumber !== pageNumber);
    // Now collect all inline highlight elements from the text layer.
    const newMatches = Array.from(textLayer.querySelectorAll('.search-highlight')) as HTMLElement[];
    newMatches.forEach((el) => {
      this.foundMatches.push({
        pageNumber,
        highlights: [el],
        // In inline mode we cannot easily recover the character position, so we store dummy values.
        matchPosition: { startIndex: 0, length: el.textContent ? el.textContent.length : 0 },
      });
    });
  }

  /**
   * Refreshes (re-applies) inline highlights on a specific page.
   *
   * This is used when the page is re-rendered (for example via virtualization)
   * or when navigating to a match. It uses the saved current search term/options.
   *
   * @param {number} pageNumber - The page number to refresh.
   * @returns {Promise<void>}
   */
  private async refreshInlineHighlightsForPage(pageNumber: number): Promise<void> {
    await this.highlightInlineMatchesForPage(pageNumber, this.currentSearchTerm, this.currentSearchOptions);
  }

  /**
   * Selects a match (by index), updates the active inline highlight styling, scrolls it into view,
   * and navigates to the correct page. When the target page is not rendered, it waits
   * and then refreshes only that page’s inline highlights without affecting other pages.
   *
   * @param {number} index - The index of the match to select.
   */
  private selectMatch(index: number): void {
    if (this.foundMatches.length === 0) return;

    // Remove any existing active highlight classes.
    this.foundMatches.forEach((match) => {
      match.highlights.forEach((el) => el.classList.remove('a-active-highlight'));
    });
    this.currentMatchIndex = index;
    const currentMatch = this.foundMatches[this.currentMatchIndex];

    if (currentMatch.pageNumber !== undefined) {
      // Navigate to the target page.
      this.pdfViewer.goToPage(currentMatch.pageNumber);
      // Wait until the page container is available.
      this.waitForPageContainer(currentMatch.pageNumber).then(() => {
        // Refresh inline highlights on the target page.
        this.refreshInlineHighlightsForPage(currentMatch.pageNumber).then(() => {
          // Find the updated match element corresponding to the originally selected match.
          const container = document.querySelector(`#pageContainer-${currentMatch.pageNumber} .a-text-layer`);
          if (!container) return;
          // For simplicity, find the first inline highlight element on that page.
          const updatedMatch = container.querySelector('.search-highlight') as HTMLElement;
          if (updatedMatch) {
            updatedMatch.classList.add('a-active-highlight');
            updatedMatch.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
          // Update the match counter display.
          if (this.matchCounterElement) {
            this.matchCounterElement.textContent = `${this.currentMatchIndex + 1} / ${this.foundMatches.length}`;
          }
        });
      });
    }
  }

  /**
   * Moves to the next match in the list.
   */
  private nextMatch(): void {
    if (this.foundMatches.length === 0) return;
    const nextIndex = (this.currentMatchIndex + 1) % this.foundMatches.length;
    this.selectMatch(nextIndex);
  }

  /**
   * Moves to the previous match in the list.
   */
  private prevMatch(): void {
    if (this.foundMatches.length === 0) return;
    const prevIndex = (this.currentMatchIndex - 1 + this.foundMatches.length) % this.foundMatches.length;
    this.selectMatch(prevIndex);
  }

  /**
   * Creates a UI for the search feature.
   */
  createSearchLayout(): void {
    const parentContainer = document.querySelector(`#${this.pdfState.containerId} .${aPdfViewerClassNames._A_PDF_VIEWER}`);
    if (parentContainer) {
      const container = document.createElement('div');
      container.classList.add('a-search-container', 'a-search-hidden');

      // Search Bar
      const searchBar = document.createElement('div');
      searchBar.classList.add('a-search-bar');

      const input = document.createElement('input');
      input.type = 'text';
      input.placeholder = 'Search...';
      input.classList.add('a-search-input');
      // When the input changes, perform a search with default options.
      input.oninput = async (e: Event) => {
        const target = e.target as HTMLInputElement;
        await this.search(target.value, { matchCase: false, regex: false, wholeWord: false });
      };
      // Save a reference to the search input.
      this.searchInputElement = input;

      const matchCounter = document.createElement('span');
      matchCounter.classList.add('a-match-counter');
      matchCounter.textContent = '0/0';
      this.matchCounterElement = matchCounter;

      const separator = document.createElement('div');
      separator.classList.add('a-separator');

      const upButton = document.createElement('button');
      upButton.classList.add('a-search-nav', 'up');
      upButton.textContent = '▲';
      // When clicked, go to the previous match.
      upButton.addEventListener('click', () => {
        this.prevMatch();
      });
      this.upButtonElement = upButton;

      const downButton = document.createElement('button');
      downButton.classList.add('a-search-nav', 'down');
      downButton.textContent = '▼';
      // When clicked, go to the next match.
      downButton.addEventListener('click', () => {
        this.nextMatch();
      });
      this.downButtonElement = downButton;

      searchBar.appendChild(input);
      searchBar.appendChild(matchCounter);
      searchBar.appendChild(separator);
      searchBar.appendChild(upButton);
      searchBar.appendChild(downButton);

      // Options Container (for additional search options)
      const optionsContainer = document.createElement('div');
      optionsContainer.classList.add('a-options-container');

      const options = ['Match Case', 'Whole Word', 'Regex'];
      options.forEach((option) => {
        const label = document.createElement('label');
        label.classList.add('a-option-label');

        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.classList.add('a-search-option');
        checkbox.dataset.option = option.toLowerCase().replace(' ', '-');

        label.appendChild(checkbox);
        label.appendChild(document.createTextNode(option));
        optionsContainer.appendChild(label);
      });

      // Append the search bar and options container to the overall container.
      container.appendChild(searchBar);
      container.appendChild(optionsContainer);

      parentContainer.appendChild(container);
    }
  }
}

export default PdfSearch;
