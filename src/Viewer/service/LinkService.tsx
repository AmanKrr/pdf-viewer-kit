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

const DEFAULT_LINK_REL = 'noopener noreferrer nofollow';

enum LinkTarget {
  NONE = 0,
  SELF = 1,
  BLANK = 2,
  PARENT = 3,
  TOP = 4,
}

interface PDFLinkServiceOptions {
  pdfState?: PdfState | null;
  pdfDocument?: PDFDocumentProxy;
  pdfViewer: WebViewer;
  eventBus?: EventEmitter;
}

class PDFLinkService {
  externalLinkEnabled: boolean = true;
  // private __eventBus: EventEmitter | null;
  private __pdfDocument: PDFDocumentProxy | undefined;
  private __pdfViewer!: WebViewer;
  private __pdfState: PdfState | null;

  constructor({ pdfState, pdfViewer }: PDFLinkServiceOptions) {
    // this.__eventBus = eventBus ?? null;
    this.__pdfState = pdfState ?? null;
    this.__pdfViewer = pdfViewer;
    this.__pdfDocument = this.__pdfState?.pdfInstance;
  }

  get currentPageNumber() {
    if (!this.__pdfViewer) {
      console.error(`this.__pdfViewer is ${this.__pdfViewer}`);
      return -1;
    }
    return this.__pdfViewer.currentPageNumber;
  }

  goToPage(pageNumber: number): void {
    if (!this.__pdfDocument) return;

    if (pageNumber < 0 && pageNumber > this.__pdfViewer.totalPages) {
      console.error(`PDFLinkService.goToPage: "${pageNumber}" is not a valid page.`);
      return;
    }

    this.__pdfViewer.goToPage(pageNumber);
  }
}

export { PDFLinkService, LinkTarget, DEFAULT_LINK_REL };
