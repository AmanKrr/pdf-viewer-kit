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

import PdfState from '../components/PdfState';
import WebViewer from '../components/WebViewer';
import { PDFDocumentProxy } from 'pdfjs-dist';
import EventEmitter from '../event/EventUtils';

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

  private __pdfDocument: PDFDocumentProxy | undefined;
  private __pdfViewer!: WebViewer;
  private __pdfState: PdfState | null;

  /**
   * Constructs the `PDFLinkService` instance.
   *
   * @param {PDFLinkServiceOptions} options - Configuration options for the link service.
   */
  constructor({ pdfState, pdfViewer }: PDFLinkServiceOptions) {
    this.__pdfState = pdfState ?? null;
    this.__pdfViewer = pdfViewer;
    this.__pdfDocument = this.__pdfState?.pdfInstance;
  }

  /**
   * Retrieves the current page number being viewed.
   *
   * @returns {number} The currently active page number, or `-1` if the viewer is not initialized.
   */
  get currentPageNumber(): number {
    if (!this.__pdfViewer) {
      console.error(`this.__pdfViewer is ${this.__pdfViewer}`);
      return -1;
    }
    return this.__pdfViewer.currentPageNumber;
  }

  /**
   * Navigates to a specific page in the PDF viewer.
   *
   * @param {number} pageNumber - The target page number to navigate to.
   */
  goToPage(pageNumber: number): void {
    if (!this.__pdfDocument) return;

    if (pageNumber < 0 || pageNumber > this.__pdfViewer.totalPages) {
      console.error(`PDFLinkService.goToPage: "${pageNumber}" is not a valid page.`);
      return;
    }

    this.__pdfViewer.goToPage(pageNumber);
  }
}

export { PDFLinkService, LinkTarget, DEFAULT_LINK_REL };
