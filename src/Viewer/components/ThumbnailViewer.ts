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

import { PDFDocumentProxy, PDFPageProxy } from 'pdfjs-dist';
import { aPdfViewerClassNames } from '../../constant/ElementIdClass';

class ThumbnailViewer {
  private __pdfInstance!: PDFDocumentProxy;
  private __enableHWA = false;
  private __canvasWidth = 98;

  private container: HTMLElement;
  private pdfDocument: PDFDocumentProxy;
  private pageNumber: number;
  private linkService: { goToPage: (pageNumber: number) => void } | null;
  private canvas: HTMLCanvasElement | null = null;

  constructor(options: PDFThumbnailViewOptions) {
    const { container, pdfDocument, pageNumber, linkService } = options;
    this.container = container;
    this.pdfDocument = pdfDocument;
    this.pageNumber = pageNumber;
    this.linkService = linkService || null;
  }

  static createThumbnailContainer(parentContainerId: string) {
    const thumbnailContainer = document.createElement('div');
    thumbnailContainer.classList.add(aPdfViewerClassNames._A_SIDEBAR_CONTAINER);

    const innerThumbnailContent = document.createElement('div');
    innerThumbnailContent.classList.add(aPdfViewerClassNames._A_INNER_SIDEBAR_CONTAINER_CONTENT);

    thumbnailContainer.appendChild(innerThumbnailContent);

    const pdfViewer = document.querySelector(`#${parentContainerId} .${aPdfViewerClassNames._A_VIEWER_WRAPPER}`);
    if (!pdfViewer) {
      console.error(`Viewer not found!`);
      return;
    }

    pdfViewer.prepend(thumbnailContainer);
    return innerThumbnailContent;
  }

  get totalPages() {
    return this.__pdfInstance.numPages;
  }

  public async initThumbnail() {
    const thumbnailDiv = document.createElement('div');
    thumbnailDiv.className = 'thumbnail';
    thumbnailDiv.dataset.pageNumber = this.pageNumber.toString();
    this.container.appendChild(thumbnailDiv);

    await this.renderThumbnail(thumbnailDiv);
  }

  // private async renderThumbnail(thumbnailDiv: HTMLElement) {
  //   const page: PDFPageProxy = await this.pdfDocument.getPage(this.pageNumber);

  //   // Set thumbnail scale
  //   const scale = 0.2;
  //   const viewport = page.getViewport({ scale });

  //   // Create and configure canvas
  //   this.canvas = document.createElement('canvas');
  //   this.canvas.width = viewport.width;
  //   this.canvas.height = viewport.height;

  //   const ctx = this.canvas.getContext('2d');
  //   if (!ctx) {
  //     throw new Error('Canvas context is not available.');
  //   }

  //   // Render the page onto the canvas
  //   await page.render({ canvasContext: ctx, viewport }).promise;

  //   // Convert canvas to image
  //   const img = document.createElement('img');
  //   img.src = this.canvas.toDataURL();
  //   img.className = 'thumbnail-image';

  //   // Append image to the thumbnail container
  //   thumbnailDiv.appendChild(img);

  //   // pageNumber
  //   const label = document.createElement('div');
  //   label.classList.add('pagenumber-label');
  //   label.textContent = `${this.pageNumber}`;
  //   thumbnailDiv.append(label);

  //   // Add click event for navigation
  //   // thumbnailDiv.addEventListener('click', () => this.linkService.goToPage(this.pageNumber));
  // }

  private async renderThumbnail(thumbnailDiv: HTMLElement) {
    const page: PDFPageProxy = await this.pdfDocument.getPage(this.pageNumber);

    // Set thumbnail scale
    const scale = 0.3; // Render at a higher scale for better quality
    const viewport = page.getViewport({ scale });

    // Create and configure canvas
    const upscaleFactor = 2; // Render at 2x resolution
    const canvasWidth = viewport.width * upscaleFactor;
    const canvasHeight = viewport.height * upscaleFactor;

    this.canvas = document.createElement('canvas');
    this.canvas.width = canvasWidth;
    this.canvas.height = canvasHeight;

    const ctx = this.canvas.getContext('2d', { alpha: false, willReadFrequently: true });
    if (!ctx) {
      throw new Error('Canvas context is not available.');
    }

    const transform = [upscaleFactor, 0, 0, upscaleFactor, 0, 0];

    // Render the page onto the canvas
    await page.render({ canvasContext: ctx, viewport, transform }).promise;

    // Create an image and scale it down for display
    const img = document.createElement('img');
    img.src = this.canvas.toDataURL('image/png'); // Use PNG for better quality
    img.className = 'thumbnail-image';
    img.style.width = `${viewport.width}px`;
    img.style.height = `${viewport.height}px`;

    // Append the image to the thumbnail container
    thumbnailDiv.appendChild(img);

    // Add page number label
    const label = document.createElement('div');
    label.classList.add('pagenumber-label');
    label.textContent = `${this.pageNumber}`;
    thumbnailDiv.append(label);

    // Add click event for navigation
    // thumbnailDiv.addEventListener('click', () => this.linkService?.goToPage(this.pageNumber));

    this.canvas.width = 0;
    this.canvas.height = 0;
  }

  public destroy() {
    // Cleanup canvas and DOM elements
    this.canvas?.remove();
    this.canvas = null;
  }
}

export default ThumbnailViewer;
