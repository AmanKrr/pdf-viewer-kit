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

/**
 * The SearchIndexManager extracts and caches text for each page in the PDF.
 * This module can later be extended (for example, to build a Trie for auto-suggestions).
 */
class SearchIndexManager {
  // Cache mapping page numbers to extracted text.
  private _pageTexts: Map<number, string> = new Map();

  /**
   * Extracts text from a PDF page and caches it.
   * @param pageNumber The page number.
   * @param page The PDF.js page proxy.
   */
  async extractPageText(pageNumber: number, page: PDFPageProxy): Promise<void> {
    if (this._pageTexts.has(pageNumber)) return;

    const textContent = await page.getTextContent();
    // Concatenate all non-empty text items.
    const extractedText = textContent.items
      .map((item: any) => item.str.trim())
      .filter((str: string) => str.length > 0)
      .join(' ');
    this._pageTexts.set(pageNumber, extractedText);
  }

  /**
   * Returns the cached text for a given page.
   * @param pageNumber The page number.
   */
  getPageText(pageNumber: number): string | undefined {
    return this._pageTexts.get(pageNumber);
  }

  /**
   * Returns an array of page numbers for which text has been extracted.
   */
  getAllPageNumbers(): number[] {
    return Array.from(this._pageTexts.keys());
  }
}

export default SearchIndexManager;
