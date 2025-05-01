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

import PdfState from '../ui/PDFState';
import WebViewer from '../ui/WebViewer';
import { PDFDocumentProxy } from 'pdfjs-dist';
import EventEmitter from '../events/EventUtils';

/**
 * Default security attributes for external links to prevent security vulnerabilities.
 */
const DEFAULT_LINK_REL = 'noopener noreferrer nofollow';

/**
 * Defines available link targets for navigation.
 */
enum LinkTarget {
  NONE = 0,
  SELF = 1,
  BLANK = 2,
  PARENT = 3,
  TOP = 4,
}

/**
 * Configuration options for `PDFLinkService`.
 */
interface PDFLinkServiceOptions {
  pdfState?: PdfState | null;
  pdfDocument?: PDFDocumentProxy;
  pdfViewer: WebViewer;
  eventBus?: EventEmitter;
}

/**
 * Handles navigation and linking within a PDF document.
 * Allows interaction with internal and external links, providing methods for controlled navigation.
 */
class PDFLinkService {
  /** Indicates whether external links should be enabled. Defaults to `true`. */
  externalLinkEnabled: boolean = true;

  private _pdfDocument: PDFDocumentProxy | undefined;
  private _pdfViewer!: WebViewer;
  private _pdfState: PdfState | null;

  /**
   * Constructs the `PDFLinkService` instance.
   *
   * @param {PDFLinkServiceOptions} options - Configuration options for the link service.
   */
  constructor({ pdfState, pdfViewer }: PDFLinkServiceOptions) {
    this._pdfState = pdfState ?? null;
    this._pdfViewer = pdfViewer;
    this._pdfDocument = this._pdfState?.pdfInstance;
  }

  /**
   * Retrieves the current page number being viewed.
   *
   * @returns {number} The currently active page number, or `-1` if the viewer is not initialized.
   */
  get currentPageNumber(): number {
    if (!this._pdfViewer) {
      console.error(`this._pdfViewer is ${this._pdfViewer}`);
      return -1;
    }
    return this._pdfViewer.currentPageNumber;
  }

  /**
   * Navigates to a specific page in the PDF viewer.
   *
   * @param {number} pageNumber - The target page number to navigate to.
   */
  goToPage(pageNumber: number): void {
    if (!this._pdfDocument) return;

    if (pageNumber < 0 || pageNumber > this._pdfViewer.totalPages) {
      console.error(`PDFLinkService.goToPage: "${pageNumber}" is not a valid page.`);
      return;
    }

    this._pdfViewer.goToPage(pageNumber);
  }
}

export { PDFLinkService, LinkTarget, DEFAULT_LINK_REL };
