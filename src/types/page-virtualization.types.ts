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

import { PDFPageProxy } from 'pdfjs-dist';
import { RenderParameters } from 'pdfjs-dist/types/src/display/api';

/**
 * Represents the details required for rendering a PDF page.
 *
 * This type encapsulates all the information needed to render
 * a single page in the PDF viewer, including the page object,
 * page number, and rendering context.
 */
type pageDetails = {
  /** The PDF.js page proxy object representing the page. */
  page: PDFPageProxy;

  /** The page number corresponding to this page in the document. */
  pageNumber: number;

  /** The rendering context containing settings for how the page should be displayed. */
  renderContext: RenderParameters;
};

export default pageDetails;
