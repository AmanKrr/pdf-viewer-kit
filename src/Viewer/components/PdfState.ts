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

class PdfState extends EventEmitter {
  private static pdfStates: Map<string, PdfState> = new Map();

  private _scale: number = 1.0;
  private _pdfInstance!: PDFDocumentProxy; // Replace `any` with a specific type if possible
  private _isLoading: boolean = true;
  private _currentPage: number = 1;
  private _containerId: string = '';
  private _uiLoading!: HTMLElement;

  private constructor() {
    super();
  }

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

  static removeInstance(id: string): void {
    if (this.pdfStates.has(id)) {
      this.pdfStates.delete(id);
    } else {
      console.warn(`PDF State with ID "${id}" does not exist.`);
    }
  }

  static listInstances(): string[] {
    return Array.from(this.pdfStates.keys());
  }

  get scale(): number {
    return this._scale;
  }

  set scale(newScale: number) {
    if (this._scale !== newScale) {
      this._scale = newScale;
      this.emit('scaleChange', newScale);
    }
  }

  get pdfInstance(): PDFDocumentProxy {
    return this._pdfInstance;
  }

  set pdfInstance(instance: PDFDocumentProxy) {
    if (this._pdfInstance !== instance) {
      this._pdfInstance = instance;
      this.emit('pdfInstanceChange', instance);
    }
  }

  get isLoading(): boolean {
    return this._isLoading;
  }

  set isLoading(value: boolean) {
    if (this._isLoading !== value) {
      this._isLoading = value;
      this.emit('loadingChange', value);
    }
  }

  get currentPage(): number {
    return this._currentPage;
  }

  set currentPage(pageNumber: number) {
    if (this._currentPage !== pageNumber) {
      this._currentPage = pageNumber;
      // this.emit('pageChange', pageNumber);
    }
  }

  get containerId(): string {
    return this._containerId;
  }

  set containerId(id: string) {
    if (this._containerId !== id) {
      this._containerId = id;
    }
  }

  get uiLoading(): HTMLElement {
    return this._uiLoading;
  }

  set uiLoading(element: HTMLElement) {
    if (this._uiLoading !== element) {
      this._uiLoading = element;
    }
  }
}

export default PdfState;
