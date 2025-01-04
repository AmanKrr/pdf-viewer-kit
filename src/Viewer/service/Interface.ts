/* Copyright 2018 Mozilla Foundation
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
/* eslint-disable getter-return */

// /** @typedef {import("../src/display/api").PDFPageProxy} PDFPageProxy */
// // eslint-disable-next-line max-len
// /** @typedef {import("../src/display/display_utils").PageViewport} PageViewport */
// /** @typedef {import("./ui_utils").RenderingStates} RenderingStates */

export interface IPDFLinkService {
  pagesCount: number;
  page: number;
  rotation: number;
  isInPresentationMode: boolean;
  externalLinkEnabled: boolean;

  goToDestination(dest: string | Array<any>): Promise<void>;
  goToPage(val: number | string): void;
  addLinkAttributes(link: HTMLAnchorElement, url: string, newWindow?: boolean): void;
  getDestinationHash(dest: any): string;
  getAnchorUrl(hash: string): string;
  setHash(hash: string): void;
  executeNamedAction(action: string): void;
  executeSetOCGState(action: object): void;
}

export interface IRenderableView {
  resume: (() => void) | null;
  renderingId: string;
  renderingState: any; // Replace `any` with your custom `RenderingStates` type if available.

  draw(): Promise<void>;
}

export interface IDownloadManager {
  downloadData(data: Uint8Array, filename: string, contentType?: string): void;
  openOrDownloadData(data: Uint8Array, filename: string, dest?: string | null): boolean;
  download(data: Uint8Array, url: string, filename: string): void;
}

export interface IL10n {
  getLanguage(): string;
  getDirection(): string;
  get(ids: string | Array<string>, args?: Record<string, any>, fallback?: string): Promise<string>;
  translate(element: HTMLElement): Promise<void>;
  pause(): void;
  resume(): void;
}

export abstract class IPDFPrintServiceFactory {
  static initGlobals(): void {}
  static get supportsPrinting(): boolean {
    return false;
  }
  static createPrintService(): never {
    throw new Error('Not implemented: createPrintService');
  }
}
