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

import { PageViewport } from 'pdfjs-dist';
import PdfState from '../ui/PDFState';
import { PdfExportService } from '../services/AnnotationExportService';
import { AnnotationService } from '../services/AnnotationService';

/**
 * Manages downloading of the current PDF, optionally embedding annotations.
 */
export class DownloadManager {
  /**
   * @param _annotationService  Service holding and exporting annotations.
   * @param _pdfState           Shared PdfState instance.
   * @param _sourceUrl          Optional URL to fetch PDF if in-memory bytes unavailable.
   * @param _cacheSource        If true, reuse original bytes; otherwise clone for GC.
   */
  constructor(
    private readonly _annotationService: AnnotationService,
    private readonly _pdfState: PdfState,
    private readonly _sourceUrl?: string,
    private readonly _cacheSource = false,
  ) {}

  /**
   * Initiates a download of the PDF.
   * If annotations exist, they will be embedded into a copy of the PDF.
   *
   * @param filename  Optional filename (without extension); defaults to timestamp.
   */
  public async download(filename = ''): Promise<void> {
    const [pdfBytes, viewports] = await Promise.all([this._getOriginalBytes(), this._buildViewportMap()]);

    const shapes = this._annotationService.exportShapes();
    const exporter = new PdfExportService();
    const annotatedPdf = await exporter.buildAnnotatedPdf(pdfBytes, shapes, viewports);

    this._triggerBrowserDownload(annotatedPdf, filename || Date.now().toString());
  }

  /**
   * Retrieves the source PDF bytes from memory or via HTTP fetch.
   */
  private async _getOriginalBytes(): Promise<ArrayBuffer> {
    const pdf = this._pdfState.pdfInstance;

    // Try to get in-memory data
    if (pdf?.getData) {
      const data = await pdf.getData();
      const buf = data.buffer as ArrayBuffer;
      return this._cacheSource ? buf : buf.slice(0);
    }

    // Fallback to fetch from URL
    if (!this._sourceUrl) {
      throw new Error('DownloadManager: sourceUrl required when pdf.js cannot provide bytes.');
    }
    const fetched = await fetch(this._sourceUrl).then((r) => r.arrayBuffer());
    return this._cacheSource ? fetched : fetched.slice(0);
  }

  /**
   * Builds a map of PageViewport objects for each PDF page,
   * using the current zoom scale from PdfState.
   */
  private async _buildViewportMap(): Promise<Map<number, PageViewport>> {
    const pdf = this._pdfState.pdfInstance;
    const scale = this._pdfState.scale;
    const map = new Map<number, PageViewport>();

    for (let p = 1; p <= pdf.numPages; p++) {
      const vp = (await pdf.getPage(p)).getViewport({ scale });
      map.set(p, vp);
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
    const a = Object.assign(document.createElement('a'), {
      href: URL.createObjectURL(blob),
      download: filename,
    });
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 0);
  }
}
