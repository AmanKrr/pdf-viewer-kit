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
import Trie from './Trie';

interface SearchOptions {
  matchCase: boolean;
  wholeWord: boolean;
  regex: boolean;
}

interface MatchBoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface SearchResult {
  pageNumber: number;
  totalMatches: number;
  matchPositions: { startIndex: number; length: number; bbox?: MatchBoundingBox }[];
}

class PdfSearch {
  // private pdfDocument: PDFDocumentProxy;
  private textIndex: Map<number, string> = new Map();
  private trie: Trie = new Trie();
  private pdfState: PdfState;
  private currentMatchIndex: number = 0;
  private matches: SearchResult[] = [];

  constructor(pdfState: PdfState) {
    this.pdfState = pdfState;
    this.createSearchLayout();
  }

  /**
   * Extracts and indexes text from the PDF.
   */
  async extractPdfContent(): Promise<void> {
    for (let i = 1; i <= this.pdfState.pdfInstance.numPages; i++) {
      await this.extractPageText(i);
    }
  }

  /**
   * Extracts text from a specific page and caches it.
   */
  private async extractPageText(pageNumber: number): Promise<void> {
    if (this.textIndex.has(pageNumber)) return;

    const page = await this.pdfState.pdfInstance.getPage(pageNumber);
    const textContent = await page.getTextContent();
    const extractedText = textContent.items
      .map((item: any) => (item.str != '' ? item.str : '@REMOVE-1-1'))
      .filter((item) => item != '@REMOVE-1-1')
      .join(' ');

    this.textIndex.set(pageNumber, extractedText);

    // Store words in Trie for auto-suggestions
    extractedText.split(/\s+/).forEach((word) => this.trie.insert(word));
  }

  /**
   * Searches for a term in the indexed PDF text.
   */
  async search(searchTerm: string, options: SearchOptions): Promise<SearchResult[]> {
    this.removeHighlights();
    if (!searchTerm) return [];
    if (this.textIndex.size === 0) await this.extractPdfContent();

    const results: SearchResult[] = [];
    const searchPattern = this.constructSearchPattern(searchTerm, options);

    for (const [pageNumber, pageText] of this.textIndex) {
      let match;
      let matchCount = 0;
      let matchPositions: { startIndex: number; length: number }[] = [];

      while ((match = searchPattern.exec(pageText)) !== null) {
        matchPositions.push({ startIndex: match.index, length: match[0].length });
        matchCount++;
      }

      if (matchCount > 0) {
        this.matches.push({ pageNumber, totalMatches: matchCount, matchPositions });
      }
    }

    await this.highlightMatches();
    return results;
  }

  removeHighlights() {
    document.querySelectorAll('.a-highlight').forEach((el) => el.remove());
    this.matches = [];
  }

  async highlightMatches(pageNumber: number | null = null): Promise<void> {
    for (const result of this.matches) {
      const page = await this.pdfState.pdfInstance.getPage(pageNumber ?? result.pageNumber);
      const textContent = await page.getTextContent();
      const viewport = page.getViewport({ scale: this.pdfState.scale }); // Adjust scale factor
      let textIndex = 0; // To track character positions

      for (let i = 0; i < textContent.items.length; i++) {
        const item = textContent.items[i] as any;
        const itemText = item.str;
        if (!itemText) continue;

        // Loop through matches on this page
        for (const match of result.matchPositions) {
          const matchIndex = match.startIndex;
          const matchEnd = matchIndex + match.length;

          // If the match falls within this item's text
          if (matchIndex >= textIndex && matchEnd <= textIndex + itemText.length) {
            const relativeStart = matchIndex - textIndex;
            const relativeEnd = relativeStart + match.length;

            this.createCharacterHighlight(item, result.pageNumber, relativeStart, relativeEnd, viewport);
          }
        }

        textIndex += itemText.length + 1; // Account for spaces between items
      }
    }
  }

  /**
   * Creates highlights at precise character locations with correct Y-position.
   */
  private createCharacterHighlight(item: any, pageNumber: number, start: number, end: number, viewport: any): void {
    const fontSize = Math.abs(item.transform[0]); // Get font size from scale factor
    const charWidth = item.width / item.str.length; // Approximate width per character

    // Convert PDF Y-coordinate to HTML Y-coordinate
    const adjustedY = viewport.height - item.transform[5];

    for (let i = start; i < end; i++) {
      const highlight = document.createElement('div');
      highlight.classList.add('a-highlight');
      highlight.style.position = 'absolute';
      highlight.style.left = `${item.transform[4] + i * charWidth}px`;
      highlight.style.top = `${adjustedY - fontSize}px`; // Adjust Y position
      highlight.style.width = `${charWidth}px`;
      highlight.style.height = `${fontSize}px`;
      highlight.style.backgroundColor = 'yellow';
      highlight.style.opacity = '0.5';
      highlight.style.pointerEvents = 'none';

      const pageElement = document.querySelector(`#pageContainer-${pageNumber}`);
      if (pageElement) pageElement.appendChild(highlight);
    }
  }

  /**
   * Constructs the appropriate regex pattern for searching.
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
   * Returns auto-suggestions based on the search prefix.
   */
  getAutoSuggestions(prefix: string): string[] {
    return this.trie.search(prefix);
  }

  createSearchLayout() {
    const parentContainer = document.querySelector(`#${this.pdfState.containerId} .${aPdfViewerClassNames._A_PDF_VIEWER}`);
    if (parentContainer) {
      const container = document.createElement('div');
      container.classList.add('a-search-container');
      container.classList.add('a-search-hidden');

      // Search Bar
      const searchBar = document.createElement('div');
      searchBar.classList.add('a-search-bar');

      const input = document.createElement('input');
      input.type = 'text';
      input.placeholder = 'Search...';
      input.classList.add('a-search-input');
      input.oninput = async (e: Event) => {
        if (e && e.target != null) {
          await this.search((e.target as any).value, { matchCase: false, regex: false, wholeWord: false });
        }
      };

      // const matchCounter = document.createElement('span');
      // matchCounter.classList.add('a-match-counter');
      // matchCounter.textContent = '0/0';

      // const separator = document.createElement('div');
      // separator.classList.add('a-separator');

      // const upButton = document.createElement('button');
      // upButton.classList.add('a-search-nav', 'up');
      // upButton.textContent = '▲';

      // const downButton = document.createElement('button');
      // downButton.classList.add('a-search-nav', 'down');
      // downButton.textContent = '▼';

      searchBar.appendChild(input);
      // searchBar.appendChild(matchCounter);
      // searchBar.appendChild(separator);
      // searchBar.appendChild(upButton);
      // searchBar.appendChild(downButton);

      // Options Container
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

      // Append to container
      container.appendChild(searchBar);
      container.appendChild(optionsContainer);
      // return container;

      parentContainer.appendChild(container);
    }
  }
}

export default PdfSearch;
