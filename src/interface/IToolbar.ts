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
 * Contract for toolbar components in the PDF viewer.
 */
export interface IToolbar {
  /**
   * Render the toolbar into the specified container element.
   *
   * @param container - The HTMLElement in which to render this toolbar.
   */
  render(container: HTMLElement): void;

  /**
   * Destroy the toolbar, removing any event listeners and DOM elements it created.
   */
  destroy(): void;
}
