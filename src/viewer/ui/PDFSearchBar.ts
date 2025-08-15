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
import { PDF_VIEWER_CLASSNAMES } from '../../constants/pdf-viewer-selectors';
import { SearchOptions } from '../manager/SearchHighlighter';
import WebViewer from './WebViewer';

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
  private _webViewer: WebViewer;
  private _container: HTMLElement | null = null;
  private _searchInputElement: HTMLInputElement | null = null;
  private _matchCounterElement: HTMLElement | null = null;
  private _upButtonElement: HTMLButtonElement | null = null;
  private _downButtonElement: HTMLButtonElement | null = null;

  /**
   * Creates and inserts the search bar into the viewer.
   * @param pdfState - The PDF state object with containerId property.
   * @param searchCallback - A function to perform the search.
   * @param prevMatchCallback - A function to go to the previous match.
   * @param nextMatchCallback - A function to go to the next match.
   */
  constructor(
    webViewer: WebViewer,
    searchCallback: (searchTerm: string, options: SearchOptions) => Promise<void>,
    prevMatchCallback: () => void,
    nextMatchCallback: () => void,
    getMatchStatus: () => { current: number; total: number },
  ) {
    this._webViewer = webViewer;
    // Get the parent container based on the containerId and viewer class.
    const parentContainer = document.querySelector(`#${this.containerId} .${PDF_VIEWER_CLASSNAMES.A_PDF_VIEWER}`);
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
        await this._debounceSearch(searchCallback, target.value, { matchCase: false, regex: false, wholeWord: false }, getMatchStatus);
      };
      // Save a reference.
      this._searchInputElement = input;

      // Create the match counter display.
      const matchCounter = document.createElement('span');
      matchCounter.classList.add('a-match-counter');
      matchCounter.textContent = '0/0';
      this._matchCounterElement = matchCounter;

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
      this._upButtonElement = upButton;

      const downButton = document.createElement('button');
      downButton.classList.add('a-search-nav', 'down');
      downButton.textContent = '▼';
      downButton.addEventListener('click', () => {
        nextMatchCallback();
        const { current, total } = getMatchStatus();
        this.updateMatchCounter(current, total);
      });
      this._downButtonElement = downButton;

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
        if (option == 'Regex') return;
        // create button for each option
        const button = document.createElement('button');
        button.classList.add('a-option-button');
        button.textContent = option == 'Match Case' ? 'Aa' : option == 'Whole Word' ? 'ab' : option;
        button.addEventListener('click', () => {
          // Toggle the button's active state.
          button.classList.toggle('active');
          // Perform the search with the updated options.
          const searchTerm = this._searchInputElement?.value || '';
          const matchCase = document.querySelector(`#${this.containerId} .a-option-button.active`)?.textContent === 'Aa';
          const wholeWord = document.querySelector(`#${this.containerId} .a-option-button.active`)?.textContent === 'ab';
          const regex = document.querySelector(`#${this.containerId} .a-option-button.active`)?.textContent === 'Regex';
          this._debounceSearch(searchCallback, searchTerm, { matchCase, regex, wholeWord }, getMatchStatus);
        });
        // const label = document.createElement('label');
        // label.classList.add('a-option-label');

        // const checkbox = document.createElement('input');
        // checkbox.type = 'checkbox';
        // checkbox.classList.add('a-search-option');
        // // Set a dataset attribute to later determine which option this is.
        // checkbox.dataset.option = option.toLowerCase().replace(' ', '-');

        // label.appendChild(checkbox);
        // label.appendChild(document.createTextNode(option));
        optionsContainer.appendChild(button);
      });

      container.appendChild(searchBar);
      container.appendChild(optionsContainer);

      // Append the search container to the parent container.
      parentContainer.appendChild(container);
      this._container = container;
    }
  }

  get instance() {
    return this._webViewer;
  }

  get instanceId(): string {
    return this._webViewer.instanceId;
  }

  get containerId() {
    return this._webViewer.containerId;
  }

  get state() {
    return this._webViewer.state;
  }

  get pdfDocument() {
    return this._webViewer.pdfDocument;
  }

  private _debounceSearch = debounce(async (searchCallback, searchTerm: string, options: SearchOptions, getMatchStatusCallback: any) => {
    await searchCallback(searchTerm, options);
    const { current, total } = getMatchStatusCallback();
    this.updateMatchCounter(current, total);
  }, 300);

  /**
   * Optionally, expose methods to show/hide or update the search bar.
   */
  public show(): void {
    if (this._container) {
      this._container.classList.remove('a-search-hidden');
    }
  }

  /**
   * Hides the search bar.
   */
  public hide(): void {
    if (this._container) {
      this._container.classList.add('a-search-hidden');
    }
  }

  /**
   * Updates the match counter display.
   * @param current The current match index (1-indexed).
   * @param total The total number of matches.
   */
  public updateMatchCounter(current: number, total: number): void {
    if (this._matchCounterElement) {
      this._matchCounterElement.textContent = `${current} / ${total}`;
    }
  }
}

export default SearchBar;
