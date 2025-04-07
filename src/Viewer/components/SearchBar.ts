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

import { debounce } from 'lodash';
import { aPdfViewerClassNames } from '../../constant/ElementIdClass';
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
class SearchBar {
  private pdfState: any; // Replace with the actual type for PdfState
  private container: HTMLElement | null = null;
  private searchInputElement: HTMLInputElement | null = null;
  private matchCounterElement: HTMLElement | null = null;
  private upButtonElement: HTMLButtonElement | null = null;
  private downButtonElement: HTMLButtonElement | null = null;

  /**
   * Creates and inserts the search bar into the viewer.
   * @param pdfState - The PDF state object with containerId property.
   * @param searchCallback - A function to perform the search.
   * @param prevMatchCallback - A function to go to the previous match.
   * @param nextMatchCallback - A function to go to the next match.
   */
  constructor(
    pdfState: any,
    searchCallback: (searchTerm: string, options: SearchOptions) => Promise<void>,
    prevMatchCallback: () => void,
    nextMatchCallback: () => void,
    getMatchStatus: () => { current: number; total: number },
  ) {
    this.pdfState = pdfState;
    // Get the parent container based on the containerId and viewer class.
    const parentContainer = document.querySelector(`#${this.pdfState.containerId} .${aPdfViewerClassNames._A_PDF_VIEWER}`);
    if (parentContainer) {
      // Create the main search container.
      const container = document.createElement('div');
      container.classList.add('a-search-container', 'a-search-hidden');

      // Search Bar container.
      const searchBar = document.createElement('div');
      searchBar.classList.add('a-search-bar');

      // Create the search input.
      const input = document.createElement('input');
      input.type = 'text';
      input.placeholder = 'Search...';
      input.classList.add('a-search-input');
      // When input changes, perform a search with default options.
      input.oninput = async (e: Event) => {
        const target = e.target as HTMLInputElement;
        await this.debounceSearch(searchCallback, target.value, { matchCase: false, regex: false, wholeWord: false }, getMatchStatus);
      };
      // Save a reference.
      this.searchInputElement = input;

      // Create the match counter display.
      const matchCounter = document.createElement('span');
      matchCounter.classList.add('a-match-counter');
      matchCounter.textContent = '0/0';
      this.matchCounterElement = matchCounter;

      // Create a separator.
      const separator = document.createElement('div');
      separator.classList.add('a-separator');

      // Create navigation buttons.
      const upButton = document.createElement('button');
      upButton.classList.add('a-search-nav', 'up');
      upButton.textContent = '▲';
      upButton.addEventListener('click', () => {
        prevMatchCallback();
        const { current, total } = getMatchStatus();
        this.updateMatchCounter(current, total);
      });
      this.upButtonElement = upButton;

      const downButton = document.createElement('button');
      downButton.classList.add('a-search-nav', 'down');
      downButton.textContent = '▼';
      downButton.addEventListener('click', () => {
        nextMatchCallback();
        const { current, total } = getMatchStatus();
        this.updateMatchCounter(current, total);
      });
      this.downButtonElement = downButton;

      // Assemble the search bar.
      searchBar.appendChild(input);
      searchBar.appendChild(matchCounter);
      searchBar.appendChild(separator);
      searchBar.appendChild(upButton);
      searchBar.appendChild(downButton);

      // Options Container (for additional search options).
      const optionsContainer = document.createElement('div');
      optionsContainer.classList.add('a-options-container');

      const options = ['Match Case', 'Whole Word', 'Regex'];
      options.forEach((option) => {
        const label = document.createElement('label');
        label.classList.add('a-option-label');

        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.classList.add('a-search-option');
        // Set a dataset attribute to later determine which option this is.
        checkbox.dataset.option = option.toLowerCase().replace(' ', '-');

        label.appendChild(checkbox);
        label.appendChild(document.createTextNode(option));
        optionsContainer.appendChild(label);
      });

      container.appendChild(searchBar);
      container.appendChild(optionsContainer);

      // Append the search container to the parent container.
      parentContainer.appendChild(container);
      this.container = container;
    }
  }

  private debounceSearch = debounce(async (searchCallback, searchTerm: string, options: SearchOptions, getMatchStatusCallback: any) => {
    await searchCallback(searchTerm, options);
    const { current, total } = getMatchStatusCallback();
    this.updateMatchCounter(current, total);
  }, 300);

  /**
   * Optionally, expose methods to show/hide or update the search bar.
   */
  public show(): void {
    if (this.container) {
      this.container.classList.remove('a-search-hidden');
    }
  }

  /**
   * Hides the search bar.
   */
  public hide(): void {
    if (this.container) {
      this.container.classList.add('a-search-hidden');
    }
  }

  /**
   * Updates the match counter display.
   * @param current The current match index (1-indexed).
   * @param total The total number of matches.
   */
  public updateMatchCounter(current: number, total: number): void {
    if (this.matchCounterElement) {
      this.matchCounterElement.textContent = `${current} / ${total}`;
    }
  }
}

export default SearchBar;
