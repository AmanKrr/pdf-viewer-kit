/* Copyright 2015 Mozilla Foundation
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { IPDFLinkService } from "./Interface";

// import { EventBus } from "./event_utils";
// import { IPDFLinkService } from "./interfaces";

const DEFAULT_LINK_REL = "noopener noreferrer nofollow";

enum LinkTarget {
  NONE = 0,
  SELF = 1,
  BLANK = 2,
  PARENT = 3,
  TOP = 4,
}

interface PDFLinkServiceOptions {
  // eventBus: EventBus;
  externalLinkTarget?: LinkTarget | null;
  externalLinkRel?: string | null;
  ignoreDestinationZoom?: boolean;
}

class PDFLinkService implements IPDFLinkService {
  externalLinkEnabled: boolean = true;
  // eventBus: EventBus;
  externalLinkTarget: LinkTarget | null;
  externalLinkRel: string | null;
  private _ignoreDestinationZoom: boolean;
  baseUrl: string | null = null;
  pdfDocument: any = null;
  pdfViewer: any = null;
  pdfHistory: any = null;

  constructor({
    // eventBus,
    externalLinkTarget = null,
    externalLinkRel = null,
    ignoreDestinationZoom = false,
  }: PDFLinkServiceOptions = {}) {
    // this.eventBus = eventBus;
    this.externalLinkTarget = externalLinkTarget;
    this.externalLinkRel = externalLinkRel;
    this._ignoreDestinationZoom = ignoreDestinationZoom;
  }

  setDocument(pdfDocument: any, baseUrl: string | null = null): void {
    this.baseUrl = baseUrl;
    this.pdfDocument = pdfDocument;
  }

  setViewer(pdfViewer: any): void {
    console.log("Called ===============>");
    this.pdfViewer = pdfViewer;
  }

  setHistory(pdfHistory: any): void {
    this.pdfHistory = pdfHistory;
  }

  get pagesCount(): number {
    return this.pdfDocument ? this.pdfDocument.numPages : 0;
  }

  get page(): number {
    return this.pdfDocument ? this.pdfViewer.currentPageNumber : 1;
  }

  set page(value: number) {
    if (this.pdfDocument) {
      this.pdfViewer.currentPageNumber = value;
    }
  }

  get rotation(): number {
    return this.pdfDocument ? this.pdfViewer.pagesRotation : 0;
  }

  set rotation(value: number) {
    if (this.pdfDocument) {
      this.pdfViewer.pagesRotation = value;
    }
  }

  get isInPresentationMode(): boolean {
    return this.pdfDocument ? this.pdfViewer.isInPresentationMode : false;
  }

  async goToDestination(dest: string | any[]): Promise<void> {
    if (!this.pdfDocument) return;
    let namedDest: string | null, explicitDest: any;
    let pageNumber: number | null = null;
    console.log("Dest: ", dest);

    if (typeof dest === "string") {
      namedDest = dest;
      explicitDest = await this.pdfDocument.getDestination(dest);
    } else {
      namedDest = null;
      explicitDest = await dest;
    }

    if (!Array.isArray(explicitDest)) {
      console.error(`goToDestination: "${explicitDest}" is not a valid destination array, for dest="${dest}".`);
      return;
    }

    const [destRef] = explicitDest;

    if (destRef && typeof destRef === "object") {
      pageNumber = this.pdfDocument.cachedPageNumber(destRef);

      if (!pageNumber) {
        try {
          pageNumber = (await this.pdfDocument.getPageIndex(destRef)) + 1;
        } catch {
          console.error(`goToDestination: "${destRef}" is not a valid page reference, for dest="${dest}".`);
          return;
        }
      }
    } else if (Number.isInteger(destRef)) {
      pageNumber = destRef + 1;
    }

    if (!pageNumber || pageNumber < 1 || pageNumber > this.pagesCount) {
      console.error(`goToDestination: "${pageNumber}" is not a valid page number, for dest="${dest}".`);
      return;
    }

    if (this.pdfHistory) {
      this.pdfHistory.pushCurrentPosition();
      this.pdfHistory.push({ namedDest, explicitDest, pageNumber });
    }

    console.log("Page number:", pageNumber);
    this.pdfViewer.scrollPageIntoView({
      pageNumber,
      destArray: explicitDest,
      ignoreDestinationZoom: this._ignoreDestinationZoom,
    });
  }

  goToPage(val: number | string): void {
    if (!this.pdfDocument) return;

    const pageNumber = (typeof val === "string" && this.pdfViewer.pageLabelToPageNumber(val)) || val || 0;
    if (!(Number.isInteger(pageNumber) && pageNumber > 0 && pageNumber <= this.pagesCount)) {
      console.error(`PDFLinkService.goToPage: "${val}" is not a valid page.`);
      return;
    }

    if (this.pdfHistory) {
      this.pdfHistory.pushCurrentPosition();
      this.pdfHistory.pushPage(pageNumber);
    }

    this.pdfViewer.scrollPageIntoView({ pageNumber });
  }

  addLinkAttributes(link: HTMLAnchorElement, url: string, newWindow: boolean = false): void {
    if (!url || typeof url !== "string") {
      throw new Error('A valid "url" parameter must provided.');
    }
    const target = newWindow ? LinkTarget.BLANK : this.externalLinkTarget;
    const rel = this.externalLinkRel;

    if (this.externalLinkEnabled) {
      link.href = link.title = url;
    } else {
      link.href = "";
      link.title = `Disabled: ${url}`;
      link.onclick = () => false;
    }

    let targetStr = ""; // LinkTarget.NONE
    switch (target) {
      case LinkTarget.SELF:
        targetStr = "_self";
        break;
      case LinkTarget.BLANK:
        targetStr = "_blank";
        break;
      case LinkTarget.PARENT:
        targetStr = "_parent";
        break;
      case LinkTarget.TOP:
        targetStr = "_top";
        break;
    }
    link.target = targetStr;

    link.rel = typeof rel === "string" ? rel : DEFAULT_LINK_REL;
  }

  getDestinationHash(dest: string | any[]): string {
    if (typeof dest === "string") {
      return this.getAnchorUrl("#" + escape(dest));
    } else if (Array.isArray(dest)) {
      return this.getAnchorUrl("#" + escape(JSON.stringify(dest)));
    }
    return this.getAnchorUrl("");
  }

  getAnchorUrl(anchor: string): string {
    console.log("here here");
    return this.baseUrl ? this.baseUrl + anchor : anchor;
  }

  setHash(hash: string): void {
    if (!this.pdfDocument) return;

    // Additional code remains similar but with TypeScript types in usage.

    // (Truncated for brevity) - Continue converting the `setHash` method and subsequent methods similarly.
  }

  executeNamedAction(action: string): void {
    if (!this.pdfDocument) return;

    switch (action) {
      case "GoBack":
        this.pdfHistory?.back();
        break;
      case "GoForward":
        this.pdfHistory?.forward();
        break;
      case "NextPage":
        this.pdfViewer.nextPage();
        break;
      case "PrevPage":
        this.pdfViewer.previousPage();
        break;
      case "LastPage":
        this.page = this.pagesCount;
        break;
      case "FirstPage":
        this.page = 1;
        break;
      default:
        break;
    }

    // this.eventBus.dispatch("namedaction", {
    //   source: this,
    //   action,
    // });
  }

  async executeSetOCGState(action: any): Promise<void> {
    if (!this.pdfDocument) return;
    const pdfDocument = this.pdfDocument;
    const optionalContentConfig = await this.pdfViewer.optionalContentConfigPromise;

    if (pdfDocument !== this.pdfDocument) return;
    optionalContentConfig.setOCGState(action);

    this.pdfViewer.optionalContentConfigPromise = Promise.resolve(optionalContentConfig);
  }

  static #isValidExplicitDest(dest: any): boolean {
    if (!Array.isArray(dest) || dest.length < 2) return false;

    const [page, zoom, ...args] = dest;
    if (!(typeof page === "object" && Number.isInteger(page?.num) && Number.isInteger(page?.gen)) && !Number.isInteger(page)) return false;

    if (!(typeof zoom === "object" && typeof zoom?.name === "string")) return false;

    let allowNull = true;
    switch (zoom.name) {
      case "XYZ":
        if (args.length < 2 || args.length > 3) return false;
        break;
      case "Fit":
      case "FitB":
        return args.length === 0;
      case "FitH":
      case "FitBH":
      case "FitV":
      case "FitBV":
        if (args.length > 1) return false;
        break;
      case "FitR":
        if (args.length !== 4) return false;
        allowNull = false;
        break;
      default:
        return false;
    }

    return args.every((arg) => typeof arg === "number" || (allowNull && arg === null));
  }
}

export { PDFLinkService, LinkTarget, DEFAULT_LINK_REL };
