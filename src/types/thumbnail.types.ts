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

import { PDFLinkService } from '../viewer/services/link.service';
import { PDFDocumentProxy } from 'pdfjs-dist';

/**
 * Configuration options for rendering a PDF thumbnail.
 */
export interface PDFThumbnailViewOptions {
  /** The container element where the thumbnail will be rendered. */
  container: HTMLElement;

  /** The PDF document instance from which the thumbnail is generated. */
  pdfDocument: PDFDocumentProxy;

  /** The page number for which the thumbnail should be created. */
  pageNumber: number;

  /** Optional link service for handling navigation within the PDF viewer. */
  linkService?: PDFLinkService | null;
}
