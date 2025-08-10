/*
  Copyright 2025 Aman Kumar

  Licensed under the Apache License, Version 2.0 (the "License");
  You may not use this file except in compliance with the License.
  You may obtain a copy of the License at

      http://www.apache.org/licenses/LICENSE-2.0

  Unless required by applicable law or agreed to in writing, software
  distributed under the License is distributed on an "AS IS" BASIS,
  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
  See the License for the specific language governing permissions and
  limitations under the License.
*/

import { PDF_VIEWER_CLASSNAMES, PDF_VIEWER_IDS } from '../constants/pdf-viewer-selectors';

class WebUiUtils {
  static showLoading() {
    // Create loading element
    const loadingElement = document.createElement('div');
    loadingElement.classList.add('loading');

    // Create spinner element
    const spinner = document.createElement('div');
    spinner.classList.add('spinner');

    // Append spinner to loading element
    loadingElement.appendChild(spinner);

    // Append loading element to container
    const container = document.createElement('div');
    container.setAttribute('id', PDF_VIEWER_IDS.LOADING_CONTAINER);
    container.appendChild(loadingElement);

    return loadingElement;
  }

  static hideLoading(loadingElement: HTMLElement, containerId: string) {
    const pdfContainer = document.querySelector(`#${containerId} .${PDF_VIEWER_CLASSNAMES.A_PDF_VIEWER}`);
    if (pdfContainer) {
      pdfContainer.classList.remove(PDF_VIEWER_CLASSNAMES.PDF_LOADING);
    }
    if (loadingElement && loadingElement.parentNode) {
      loadingElement.parentNode.removeChild(loadingElement);
    }
  }

  /**
   * Updates the loading spinner to show real-time progress percentage.
   * @param loadingElement The loading element returned by showLoading().
   * @param containerId The container id where the loading is shown.
   * @param percent The progress percentage (number or string).
   */
  static updateLoadingProgress(loadingElement: HTMLElement, containerId: string, percent: number | string) {
    if (!loadingElement) return;

    // Try to find or create a progress text element inside the loading element
    let progressText = loadingElement.querySelector(`#${containerId} .loading-progress-per`) as HTMLElement;
    if (!progressText) {
      progressText = document.createElement('div');
      progressText.className = 'loading-progress-per';
      // Style for visibility (optional, can be moved to CSS)
      progressText.style.marginTop = '20px';
      progressText.style.fontSize = '16px';
      progressText.style.fontWeight = '600';
      progressText.style.color = '#555';
      progressText.style.textAlign = 'center';
      loadingElement.appendChild(progressText);
    }

    // Clamp percent to [0, 100] and format
    let percentValue = typeof percent === 'string' ? parseFloat(percent) : percent;
    if (isNaN(percentValue)) percentValue = 0;
    percentValue = Math.max(0, Math.min(100, percentValue));
    progressText.textContent = `Loading ${percentValue}%`;
  }

  /**
   * Helper function to parse query string (e.g. ?param1=value&param2=...).
   * @param {string} query
   * @returns {Map}
   */
  static parseQueryString(query: any) {
    const params = new Map();
    for (const [key, value] of new URLSearchParams(query)) {
      params.set(key.toLowerCase(), value);
    }
    return params;
  }
}

export default WebUiUtils;
