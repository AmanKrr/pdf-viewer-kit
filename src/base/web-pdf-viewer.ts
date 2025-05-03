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

// If using Webpack to create the build, use the Webpack-referenced file instead of /pdf.js.
import { PDFDocumentProxy } from 'pdfjs-dist';
import WebViewer from '../viewer/ui/WebViewer';
import WebUiUtils from '../utils/web-ui-utils';
import PdfState from '../viewer/ui/PDFState';
import PageElement from '../viewer/ui/PDFPageElement';
import PasswordManager from '../viewer/manager/PDFPasswordManager';

// Import stylesheets for different PDF UI layers.
import '../style/toolbar.css';
import '../style/global.css';
import '../style/text-layer.css';
import '../style/thumbnail.css';
import '../style/annotation-layer.css';
import '../style/annotation-drawer-layer.css';

import { GlobalWorkerOptions, getDocument } from 'pdfjs-dist';
import { LoadOptions } from '../types/webpdf.types';
import { getPdfWorkerSrc } from '../utils/worker-factory';
GlobalWorkerOptions.workerSrc = getPdfWorkerSrc();

/**
 * Class responsible for loading and managing PDF documents within a web viewer.
 * Extends functionalities from `WebViewer` and integrates PDF.js for rendering.
 */
class PdfKit {
  private static _loadingTasks = new Map<string, any>();
  private static _viewers = new Map<string, WebViewer>();

  /**
   * Loads a PDF document into the web viewer.
   *
   * @param {LoadOptions} options - Configuration options for loading the document.
   * @returns {Promise<WebViewer | undefined>} Resolves to a `WebViewer` instance upon successful load or `undefined` on failure.
   */
  static async load(options: LoadOptions): Promise<WebViewer | undefined> {
    // Default options for configuring the PDF viewer during the load process.
    let loadOptions: LoadOptions = {
      containerId: '', // ID of the container where the PDF will be displayed
      document: '', // URL or file source of the PDF document
      disableTextSelection: false, // Option to enable/disable text selection
      maxDefaultZoomLevel: 5, // Maximum zoom level allowed
      password: undefined, // Password for encrypted PDFs
      toolbarItems: {}, // Custom toolbar items
      preventTextCopy: false, // Disable text copying in PDF
      renderSpecificPageOnly: null, // Load only a specific page
      customToolbarItems: [], // Additional toolbar buttons
    };
    const pdfStates = PdfState.getInstance(options.containerId);
    pdfStates.containerId = options.containerId;

    // Create the necessary container elements for the PDF viewer.
    const internalContainers = PageElement.containerCreation(options.containerId, pdfStates.scale);
    const container = document.querySelector(`#${options.containerId} #${internalContainers.injectElementId}`)! as HTMLElement;

    // Display a loading spinner in the viewer container.
    const uiLoading = WebUiUtils.showLoading();
    pdfStates.uiLoading = uiLoading;
    internalContainers.parent.prepend(uiLoading.parentNode!);

    try {
      // Merge user-specified options with default options.
      const { password, ...rest } = options;
      loadOptions = {
        ...rest,
        ...options,
      };

      /**
       * Initiates loading of the PDF document.
       * Supports fetching from URLs, local files, and encrypted PDFs.
       */
      const initiateLoadPdf = getDocument({
        url: options.document, // PDF source URL
        password: password, // Password (if required)
        withCredentials: options.withCredentials, // Send credentials if needed
        data: options.data, // Raw binary PDF data
        httpHeaders: options.httpHeaders, // Custom HTTP headers
        // disableRange: true,
        // disableStream: true,
      });
      PdfKit._loadingTasks.set(options.containerId, initiateLoadPdf);

      // Track progress while fetching the PDF (Commented out but can be enabled for debugging)
      /*
      initiateLoadPdf.onProgress = function (data: any) {
        console.log('Data:', data);
        console.log('Loaded:', data.loaded);
        console.log('Total:', data.total);
      };
      */

      let passwordManager: PasswordManager | null = null;

      /**
       * Handles password-protected PDFs.
       * If a password is required, prompts the user for input.
       */
      initiateLoadPdf.onPassword = function (updatePassword: (pass: string) => void, reason: any) {
        if (reason === 1) {
          // Request password from the user.
          if (!passwordManager) {
            passwordManager = new PasswordManager(internalContainers['parent'], updatePassword);
          }
        } else {
          // Handle incorrect password attempt.
          if (passwordManager) {
            passwordManager.onError = 'Incorrect! Enter password again:';
          }
        }
      };

      // Load the PDF document and store its instance.
      const pdf: PDFDocumentProxy = await initiateLoadPdf.promise;
      pdfStates.pdfInstance = pdf;

      // Once the correct password is entered and the PDF is opened, destroy the password prompt to free memory.
      if (passwordManager) {
        (passwordManager as PasswordManager).destroy();
      }

      // Initialize the WebViewer instance with the loaded PDF.
      const viewer = new WebViewer(pdf, loadOptions, internalContainers['parent'], container);
      await viewer.ready;
      WebUiUtils.hideLoading(uiLoading, options.containerId);
      PdfKit._viewers.set(options.containerId, viewer);
      return viewer;
    } catch (err: any) {
      // swallow the “Worker was destroyed” cancellation:
      if (err.message?.includes('Worker was destroyed')) {
        console.warn('Worker destroyed. If you unload your pdf ignore.');
        return undefined;
      }
      // Handle errors during the document loading process.
      console.error('Error loading PDF:', err);
      return undefined;
    }
  }

  /**
   * Completely tears down everything for the given container:
   *  • stops any in-flight PDF.js loads
   *  • destroys the PDFDocumentProxy
   *  • removes UI spinners
   *  • unsubscribes PdfState
   *  • destroys the WebViewer and its sub-components
   *  • clears out any injected DOM
   */
  static unload(containerId: string): void {
    const task = PdfKit._loadingTasks.get(containerId);
    if (task) {
      task.destroy();
      task.worker?.terminate();
      PdfKit._loadingTasks.delete(containerId);
    }

    const pdfState = PdfState.getInstance(containerId);
    pdfState.pdfInstance?.destroy();

    (pdfState.uiLoading?.parentNode as HTMLElement)?.remove();

    // 5) destroy the viewer and its children
    const viewer = PdfKit._viewers.get(containerId);
    viewer?.destroy();
    PdfKit._viewers.delete(containerId);

    const root = document.getElementById(containerId);
    if (root) {
      root.innerHTML = '';
    }
  }

  static unloadAll(): void {
    // unload every containerId
    for (const id of PdfKit._loadingTasks.keys()) {
      PdfKit.unload(id);
    }
  }
}

export default PdfKit;
