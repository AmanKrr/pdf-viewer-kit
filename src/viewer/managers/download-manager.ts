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

import { PageViewport, PDFPageProxy } from 'pdfjs-dist';
import { PdfExportService } from '../services/annotation-export.service';
import { AnnotationService } from '../services/annotation.service';
import WebViewer from '../ui/web-viewer.component';

/**
 * Manages downloading of the current PDF, optionally embedding annotations.
 */
export class DownloadManager {
  private _cachedBytes: ArrayBuffer | null = null;
  private _cachedViewports: Map<number, PageViewport> | null = null;
  private _isDownloading = false;

  /**
   * @param _annotationService  Service holding and exporting annotations.
   * @param _sourceUrl          Optional URL to fetch PDF if in-memory bytes unavailable.
   * @param _cacheSource        If true, reuse original bytes; otherwise clone for GC.
   */
  constructor(
    private readonly _annotationService: AnnotationService,
    private readonly _webViewer: WebViewer,
    private readonly _sourceUrl?: string,
    private readonly _cacheSource = false,
  ) {}

  get instance() {
    return this._webViewer;
  }

  get instanceId(): string {
    return this._webViewer.instanceId;
  }

  get containerId(): string {
    return this._webViewer.containerId;
  }

  get state() {
    return this._webViewer.state;
  }

  get pdfDocument() {
    return this._webViewer.pdfDocument!;
  }

  /**
   * Initiates a download of the PDF.
   * If annotations exist, they will be embedded into a copy of the PDF.
   *
   * @param filename  Optional filename (without extension); defaults to timestamp.
   * @param onProgress Optional progress callback (0-1)
   */
  public async download(filename = '', onProgress?: (progress: number) => void): Promise<void> {
    if (this._isDownloading) {
      console.warn('Download already in progress');
      return;
    }

    this._isDownloading = true;
    try {
      onProgress?.(0.1); // Starting

      const [pdfBytes, viewports] = await Promise.all([this._getOriginalBytes(), this._buildViewportMap()]);

      onProgress?.(0.4); // Got PDF data and viewports

      const shapes = this._annotationService.exportShapes();
      onProgress?.(0.6); // Exported shapes

      const exporter = new PdfExportService();
      const annotatedPdf = await exporter.buildAnnotatedPdf(pdfBytes, shapes, viewports, onProgress);

      onProgress?.(0.9); // PDF built

      this._triggerBrowserDownload(annotatedPdf, filename || Date.now().toString());

      onProgress?.(1.0); // Complete
    } finally {
      this._isDownloading = false;
    }
  }

  /**
   * Retrieves the source PDF bytes from memory or via HTTP fetch.
   * Uses caching to avoid repeated fetches.
   */
  private async _getOriginalBytes(): Promise<ArrayBuffer> {
    // Return cached bytes if available and caching is enabled
    if (this._cacheSource && this._cachedBytes) {
      return this._cachedBytes;
    }

    const pdf = this.pdfDocument;

    if (pdf?.getData) {
      const data = await pdf.getData(); // Uint8Array
      const buf = data.buffer as ArrayBuffer;
      // Quick header check
      if (new TextDecoder().decode(new Uint8Array(buf.slice(0, 5))) === '%PDF-') {
        const result = this._cacheSource ? buf : buf.slice(0);
        if (this._cacheSource) {
          this._cachedBytes = result;
        }
        return result;
      }
      console.warn('pdf.js.getData did not return a full PDF; falling back to fetch.');
    }

    // Fallback to HTTP fetch
    if (!this._sourceUrl) {
      throw new Error('No valid PDF data and sourceUrl is undefined.');
    }
    const fetched = await fetch(this._sourceUrl).then((r) => r.arrayBuffer());
    const result = this._cacheSource ? fetched : fetched.slice(0);
    if (this._cacheSource) {
      this._cachedBytes = result;
    }
    return result;
  }

  /**
   * Builds a map of PageViewport objects for each PDF page,
   * using the current zoom scale from PdfState.
   * Uses caching and parallel processing for better performance.
   */
  private async _buildViewportMap(): Promise<Map<number, PageViewport>> {
    const pdf = this.pdfDocument;
    const scale = this.state.scale;

    // Return cached viewports if available and scale matches
    if (this._cacheSource && this._cachedViewports) {
      // Check if cached viewports are for the same scale
      const firstViewport = this._cachedViewports.values().next().value;
      if (firstViewport && Math.abs(firstViewport.scale - scale) < 0.001) {
        return this._cachedViewports;
      }
    }

    const map = new Map<number, PageViewport>();

    // Process pages in parallel for better performance
    const pagePromises: Promise<void>[] = [];
    for (let p = 1; p <= pdf.numPages; p++) {
      pagePromises.push(
        pdf.getPage(p).then((page: PDFPageProxy) => {
          const vp = page.getViewport({ scale });
          map.set(p, vp);
        }),
      );
    }

    await Promise.all(pagePromises);

    if (this._cacheSource) {
      this._cachedViewports = map;
    }

    return map;
  }

  /**
   * Triggers the browser's download mechanism for the given PDF bytes.
   *
   * @param bytes     The PDF file data.
   * @param filename  Name (without extension) for the downloaded file.
   */
  private _triggerBrowserDownload(bytes: Uint8Array, filename: string): void {
    const blob = new Blob([bytes], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = filename.endsWith('.pdf') ? filename : `${filename}.pdf`;
    a.style.display = 'none';

    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    // Clean up the URL after a short delay
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  /**
   * Clears cached data to free memory.
   */
  public clearCache(): void {
    this._cachedBytes = null;
    this._cachedViewports = null;
  }
}
