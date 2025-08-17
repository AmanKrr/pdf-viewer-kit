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
 * Service for navigating within the PDF by destination or page number.
 */
export interface IPDFLinkService {
  /**
   * Navigate to a named destination or explicit PDF destination array.
   *
   * @param dest - The destination name (string) or destination array as defined by PDF.js.
   * @returns A promise that resolves once navigation completes.
   */
  goToDestination(dest: string | any[]): Promise<void>;

  /**
   * Navigate directly to the specified page.
   *
   * @param val - The 1-based page number or page label.
   */
  goToPage(val: number | string): void;
}
