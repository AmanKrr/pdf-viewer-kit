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
import { InstanceEventEmitter } from './InstanceEventEmitter';

/**
 * Manages state for a single PDF viewer instance.
 * Completely isolated from other instances.
 */
export class InstanceState {
  private readonly _instanceId: string;
  private readonly _containerId: string;
  private readonly _events: InstanceEventEmitter;

  // Instance-specific state
  private _scale: number = 1.0;
  private _pdfInstance: PDFDocumentProxy | null = null;
  private _isLoading: boolean = true;
  private _currentPage: number = 1;
  private _uiLoading: HTMLElement | null = null;
  private _totalPages: number = 0;

  constructor(instanceId: string, containerId: string) {
    this._instanceId = instanceId;
    this._containerId = containerId;
    this._events = new InstanceEventEmitter(instanceId);
  }

  /**
   * Gets the instance ID
   */
  get instanceId(): string {
    return this._instanceId;
  }

  /**
   * Gets the container ID
   */
  get containerId(): string {
    return this._containerId;
  }

  /**
   * Gets the current scale factor
   */
  get scale(): number {
    return this._scale;
  }

  /**
   * Sets the scale factor and emits change event
   */
  set scale(newScale: number) {
    if (this._scale !== newScale) {
      const oldScale = this._scale;
      this._scale = newScale;

      this._events.emit('scaleChange', {
        instanceId: this._instanceId,
        oldScale,
        newScale,
      });
    }
  }

  /**
   * Gets the PDF document instance
   */
  get pdfInstance(): PDFDocumentProxy | null {
    return this._pdfInstance;
  }

  /**
   * Sets the PDF document instance
   */
  set pdfInstance(instance: PDFDocumentProxy | null) {
    this._pdfInstance = instance;

    if (instance) {
      this._totalPages = instance.numPages;
      this._events.emit('pdfInstanceChange', {
        instanceId: this._instanceId,
        totalPages: this._totalPages,
      });
    }
  }

  /**
   * Gets the loading state
   */
  get isLoading(): boolean {
    return this._isLoading;
  }

  /**
   * Sets the loading state
   */
  set isLoading(value: boolean) {
    if (this._isLoading !== value) {
      this._isLoading = value;

      this._events.emit('loadingChange', {
        instanceId: this._instanceId,
        isLoading: value,
      });
    }
  }

  /**
   * Gets the current page number
   */
  get currentPage(): number {
    return this._currentPage;
  }

  /**
   * Sets the current page number
   */
  set currentPage(pageNumber: number) {
    if (this._currentPage !== pageNumber) {
      const oldPage = this._currentPage;
      this._currentPage = pageNumber;

      this._events.emit('pageChange', {
        instanceId: this._instanceId,
        oldPage,
        newPage: pageNumber,
      });
    }
  }

  /**
   * Gets the UI loading element
   */
  get uiLoading(): HTMLElement | null {
    return this._uiLoading;
  }

  /**
   * Sets the UI loading element
   */
  set uiLoading(element: HTMLElement | null) {
    this._uiLoading = element;
  }

  /**
   * Gets the total number of pages
   */
  get totalPages(): number {
    return this._totalPages;
  }

  /**
   * Gets the event emitter for this instance
   */
  get events(): InstanceEventEmitter {
    return this._events;
  }

  /**
   * Destroys this state instance
   */
  destroy(): void {
    this._events.destroy();
    this._pdfInstance = null;
    this._uiLoading = null;
  }
}
