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

/**
 * Returns the URL that PDF.js should use for its worker script.
 *
 * This function constructs the correct path to the PDF.js worker script
 * based on the current module's location, ensuring the worker can be
 * loaded properly in different deployment scenarios.
 *
 * @returns The absolute URL to the PDF.js worker script
 */
export function getPdfWorkerSrc(): string {
  return new URL('pdfjs-dist/build/pdf.worker.min.mjs', import.meta.url).href;
}
