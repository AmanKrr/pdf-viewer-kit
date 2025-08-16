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

import WebViewer from '../ui/web-viewer';

// Define the link target options.
export enum LinkTarget {
  NONE, // Default value.
  SELF,
  BLANK,
  PARENT,
  TOP,
}

export interface PDFLinkServiceOptions {
  baseUrl?: string | null;
  pdfDocument?: any;
  pdfViewer?: any;
  pdfHistory?: any;
  externalLinkTarget?: LinkTarget;
  externalLinkRel?: string;
  ignoreDestinationZoom?: boolean;
  externalLinkEnabled?: boolean;
}

// Minimal PDFLinkService implementation.
export class PDFLinkService {
  public baseUrl: string | null;
  public pdfDocument: any | null;
  public pdfViewer: WebViewer | null;
  public pdfHistory: any | null;
  public externalLinkTarget: LinkTarget;
  public externalLinkRel: string;
  private _ignoreDestinationZoom: boolean;
  public externalLinkEnabled: boolean = true;

  constructor(options: PDFLinkServiceOptions = {}) {
    this.baseUrl = options.baseUrl || null;
    this.pdfDocument = options.pdfDocument || null;
    this.pdfViewer = options.pdfViewer || null;
    this.pdfHistory = options.pdfHistory || null;
    this.externalLinkTarget = options.externalLinkTarget || LinkTarget.NONE;
    this.externalLinkRel = options.externalLinkRel || 'noopener noreferrer nofollow';
    this._ignoreDestinationZoom = options.ignoreDestinationZoom || false;
  }

  // Set the PDF document reference and an optional base URL.
  setDocument(pdfDocument: any, baseUrl: string | null = null): void {
    this.pdfDocument = pdfDocument;
    this.baseUrl = baseUrl;
  }

  // Set the PDF viewer reference.
  setViewer(pdfViewer: any): void {
    this.pdfViewer = pdfViewer;
  }

  // Set the history manager (if used).
  setHistory(pdfHistory: any): void {
    this.pdfHistory = pdfHistory;
  }

  // Returns the number of pages (if available).
  get pagesCount(): number {
    return this.pdfDocument ? this.pdfDocument.numPages : 0;
  }

  // Returns the current page number (defaults to 1).
  get page(): number {
    return this.pdfViewer ? this.pdfViewer.currentPageNumber : 1;
  }

  // Sets the current page number.
  set page(value: number) {
    if (this.pdfViewer) {
      // this.pdfViewer.currentPageNumber = value;
    }
  }

  // Returns the current rotation.
  get rotation(): number {
    // return this.pdfViewer ? this.pdfViewer.pagesRotation : 0;
    return 0;
  }

  // Sets the rotation value.
  set rotation(value: number) {
    if (this.pdfViewer) {
      // this.pdfViewer.pagesRotation = value;
    }
  }

  // Returns whether the viewer is in presentation mode.
  get isInPresentationMode(): boolean {
    // return this.pdfViewer ? this.pdfViewer.isInPresentationMode : false;
    return false;
  }

  /**
   * Navigate to a destination in the PDF.
   *
   * This implementation supports:
   * - Named destinations (if dest is a string)
   * - Explicit destination arrays (if dest is an array)
   *
   * It uses the PDF document's methods to resolve named destinations and page references.
   *
   * @param dest - A destination which can be a string (named destination) or an explicit destination array.
   */
  async goToDestination(dest: string | any[]): Promise<void> {
    // Ensure the PDF document is set.
    if (!this.pdfDocument) {
      console.error('PDF document is not set.');
      return;
    }

    let namedDest: string | null = null;
    let explicitDest: any;
    let pageNumber: number | undefined;

    // If dest is a string, assume it's a named destination.
    if (typeof dest === 'string') {
      namedDest = dest;
      // Resolve the named destination to an explicit destination array.
      explicitDest = await this.pdfDocument.getDestination(dest);
    } else {
      // Otherwise, assume dest is already an explicit destination.
      explicitDest = await dest;
    }

    // Validate that we obtained an explicit destination array.
    if (!Array.isArray(explicitDest)) {
      console.error(`goToDestination: "${explicitDest}" is not a valid destination array, for dest="${dest}".`);
      return;
    }

    // The explicit destination array typically has this format:
    //   [pageRef, { name: "XYZ" or another fit type }, ...args]
    const destRef = explicitDest[0];

    // Determine the page number from the destination reference.
    if (destRef && typeof destRef === 'object') {
      // Attempt to get a cached page number first, if available.
      if (typeof this.pdfDocument.cachedPageNumber === 'function') {
        pageNumber = this.pdfDocument.cachedPageNumber(destRef);
      }
      // If not cached, fetch the page index.
      if (!pageNumber) {
        try {
          const pageIndex: number = await this.pdfDocument.getPageIndex(destRef);
          pageNumber = pageIndex + 1;
        } catch (error) {
          console.error(`goToDestination: "${destRef}" is not a valid page reference, for dest="${dest}".`, error);
          return;
        }
      }
    } else if (Number.isInteger(destRef)) {
      // If destRef is an integer, add 1 (assuming zero-based indexing).
      pageNumber = destRef + 1;
    }

    // Check that the page number is valid.
    if (!pageNumber || pageNumber < 1 || pageNumber > this.pagesCount) {
      console.error(`goToDestination: "${pageNumber}" is not a valid page number, for dest="${dest}".`);
      return;
    }

    // If a history manager is set, update the history before navigation.
    if (this.pdfHistory) {
      if (typeof this.pdfHistory.pushCurrentPosition === 'function') {
        this.pdfHistory.pushCurrentPosition();
      }
      if (typeof this.pdfHistory.push === 'function') {
        this.pdfHistory.push({ namedDest, explicitDest, pageNumber });
      }
    }

    // Finally, scroll the viewer to the desired page/destination.
    if (this.pdfViewer) {
      this.goToPage(pageNumber);
      // this.pdfViewer.scrollPageIntoView({
      //   pageNumber,
      //   destArray: explicitDest,
      //   ignoreDestinationZoom: this._ignoreDestinationZoom,
      // });
    } else {
      console.error('PDF viewer is not set or does not support scrolling.');
    }
  }

  /**
   * Navigate to a specific page.
   *
   * @param {number | string} val - The page number (or label) to navigate to.
   */
  goToPage(val: number | string): void {
    if (this.pdfViewer) {
      // Convert to number if needed.
      const pageNum = typeof val === 'string' ? parseInt(val, 10) : val;
      // this.pdfViewer.currentPageNumber = pageNum;
      this.pdfViewer.goToPage(pageNum);
    } else {
      console.warn('No PDF viewer set for goToPage.');
    }
  }

  /**
   * Adds hyperlink attributes to the provided anchor element.
   *
   * @param {HTMLAnchorElement} link - The link element.
   * @param {string} url - The URL for the link.
   * @param {boolean} [newWindow=false] - Whether to open the link in a new window.
   */
  addLinkAttributes(link: HTMLAnchorElement, url: string, newWindow: boolean = false): void {
    if (!url || typeof url !== 'string') {
      throw new Error('A valid "url" parameter must be provided.');
    }
    // For this minimal version, we assume external links are enabled.
    link.href = url;
    link.title = url;

    // Determine the target attribute.
    let targetStr: string = '';
    const target = newWindow ? LinkTarget.BLANK : this.externalLinkTarget;
    switch (target) {
      case LinkTarget.SELF:
        targetStr = '_self';
        break;
      case LinkTarget.BLANK:
        targetStr = '_blank';
        break;
      case LinkTarget.PARENT:
        targetStr = '_parent';
        break;
      case LinkTarget.TOP:
        targetStr = '_top';
        break;
      default:
        targetStr = '';
    }
    link.target = targetStr;
    link.rel = this.externalLinkRel;
  }

  /**
   * Returns a hash string for the destination.
   *
   * @param {string | number | any[]} dest - The destination.
   * @returns {string} The destination hash.
   */
  getDestinationHash(dest: string | number | any[]): string {
    if (typeof dest === 'string') {
      return '#' + escape(dest);
    }
    return '#' + escape(JSON.stringify(dest));
  }

  /**
   * Returns the full anchor URL by prefixing the base URL (if any).
   *
   * @param {string} anchor - The anchor hash (including "#").
   * @returns {string} The full URL.
   */
  getAnchorUrl(anchor: string): string {
    return this.baseUrl ? this.baseUrl + anchor : anchor;
  }

  /**
   * Sets the browser's location hash.
   *
   * @param {string} hash - The hash value.
   */
  setHash(hash: string): void {
    window.location.hash = hash;
  }

  /**
   * Executes a named action.
   *
   * @param {string} action - The named action to execute.
   */
  executeNamedAction(action: string): void {
    console.log('executeNamedAction called with:', action);
    // In this minimal implementation, no action is taken.
  }

  /**
   * Executes an optional content group (OCG) state change.
   *
   * @param {any} action - The action parameters.
   */
  async executeSetOCGState(action: any): Promise<void> {
    console.log('executeSetOCGState called with:', action);
    // Minimal implementation: simply log the action.
  }
}
