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

import EventEmitter from '../event/EventUtils';
import { PDFDocumentProxy } from 'pdfjs-dist';

/**
 * Manages the state of the PDF viewer, including scale, loading status, and page navigation.
 * Extends EventEmitter to allow event-based updates.
 */
class PdfState extends EventEmitter {
  /** Stores instances of PdfState mapped by container ID */
  private static pdfStates: Map<string, PdfState> = new Map();

  private _scale: number = 1.0;
  private _pdfInstance!: PDFDocumentProxy;
  private _isLoading: boolean = true;
  private _currentPage: number = 1;
  private _containerId: string = '';
  private _uiLoading!: HTMLElement;

  /** Private constructor to enforce singleton pattern per container ID */
  private constructor() {
    super();
  }

  /**
   * Retrieves or creates a `PdfState` instance for a given container ID.
   *
   * @param {string} id - The unique container ID.
   * @returns {PdfState} The PdfState instance associated with the given ID.
   * @throws {Error} If the ID is null or empty.
   */
  static getInstance(id: string): PdfState {
    if (!id) {
      throw new Error('Invalid ID: ID cannot be null or empty.');
    }

    if (this.pdfStates.has(id)) {
      return this.pdfStates.get(id)!;
    } else {
      const newState = new PdfState();
      this.pdfStates.set(id, newState);
      return newState;
    }
  }

  /**
   * Removes a `PdfState` instance associated with the given ID.
   *
   * @param {string} id - The ID of the PdfState instance to remove.
   */
  static removeInstance(id: string): void {
    if (this.pdfStates.has(id)) {
      this.pdfStates.delete(id);
    } else {
      console.warn(`PDF State with ID "${id}" does not exist.`);
    }
  }

  /**
   * Lists all active `PdfState` instances.
   *
   * @returns {string[]} An array of all registered container IDs.
   */
  static listInstances(): string[] {
    return Array.from(this.pdfStates.keys());
  }

  /**
   * Gets the current zoom scale of the PDF viewer.
   *
   * @returns {number} The current scale.
   */
  get scale(): number {
    return this._scale;
  }

  /**
   * Sets a new zoom scale and emits a `scaleChange` event.
   *
   * @param {number} newScale - The new scale to apply.
   */
  set scale(newScale: number) {
    if (this._scale !== newScale) {
      this._scale = newScale;
      this.emit('scaleChange', newScale);
    }
  }

  /**
   * Gets the PDF.js document instance.
   *
   * @returns {PDFDocumentProxy} The current PDF document instance.
   */
  get pdfInstance(): PDFDocumentProxy {
    return this._pdfInstance;
  }

  /**
   * Sets a new PDF.js document instance and emits a `pdfInstanceChange` event.
   *
   * @param {PDFDocumentProxy} instance - The new PDF document instance.
   */
  set pdfInstance(instance: PDFDocumentProxy) {
    if (this._pdfInstance !== instance) {
      this._pdfInstance = instance;
      this.emit('pdfInstanceChange', instance);
    }
  }

  /**
   * Checks if the PDF document is currently loading.
   *
   * @returns {boolean} `true` if the document is loading, `false` otherwise.
   */
  get isLoading(): boolean {
    return this._isLoading;
  }

  /**
   * Sets the loading state of the PDF document and emits a `loadingChange` event.
   *
   * @param {boolean} value - `true` if loading, `false` otherwise.
   */
  set isLoading(value: boolean) {
    if (this._isLoading !== value) {
      this._isLoading = value;
      this.emit('loadingChange', value);
    }
  }

  /**
   * Gets the current page number being viewed.
   *
   * @returns {number} The current page number.
   */
  get currentPage(): number {
    return this._currentPage;
  }

  /**
   * Sets the current page number.
   * (Note: Emitting 'pageChange' is commented out. Uncomment if needed.)
   *
   * @param {number} pageNumber - The new page number.
   */
  set currentPage(pageNumber: number) {
    if (this._currentPage !== pageNumber) {
      this._currentPage = pageNumber;
      // this.emit('pageChange', pageNumber);
    }
  }

  /**
   * Gets the container ID associated with this PdfState instance.
   *
   * @returns {string} The container ID.
   */
  get containerId(): string {
    return this._containerId;
  }

  /**
   * Sets a new container ID for this PdfState instance.
   *
   * @param {string} id - The new container ID.
   */
  set containerId(id: string) {
    if (this._containerId !== id) {
      this._containerId = id;
    }
  }

  /**
   * Gets the loading UI element used for displaying loading indicators.
   *
   * @returns {HTMLElement} The loading UI element.
   */
  get uiLoading(): HTMLElement {
    return this._uiLoading;
  }

  /**
   * Sets the loading UI element.
   *
   * @param {HTMLElement} element - The new loading UI element.
   */
  set uiLoading(element: HTMLElement) {
    if (this._uiLoading !== element) {
      this._uiLoading = element;
    }
  }
}

export default PdfState;
