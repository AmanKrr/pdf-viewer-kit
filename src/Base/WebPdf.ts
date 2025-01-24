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
import * as pdfjsLib from 'pdfjs-dist/webpack.mjs';
import WebViewer from '../Viewer/components/WebViewer';
import WebUiUtils from '../utils/WebUiUtils';
import PdfState from '../Viewer/components/PdfState';
import PageElement from '../Viewer/components/PageElement';
import PasswordManager from '../Viewer/manager/Password';

// Import stylesheets for different PDF UI layers.
import '../style/toolbar.css';
import '../style/root.css';
import '../style/textlayer.css';
import '../style/annotationlayer.css';
import '../style/thumbnail.css';

/**
 * Class responsible for loading and managing PDF documents within a web viewer.
 * Extends functionalities from `WebViewer` and integrates PDF.js for rendering.
 */
class WebPdf {
  /**
   * Default options used when loading a PDF document.
   * These settings can be overridden by passing custom options.
   */
  private static loadOptions: LoadOptions = {
    containerId: '', // ID of the container where the PDF will be displayed
    document: '', // URL or file source of the PDF document
    disableTextSelection: false, // Option to enable/disable text selection
    maxDefaultZoomLevel: 5, // Maximum zoom level allowed
    password: '', // Password for encrypted PDFs
    printMode: false, // Enable or disable print mode
    toolbarItems: {}, // Custom toolbar items
    styleSheets: '', // External stylesheets for customization
    preventTextCopy: false, // Disable text copying in PDF
    renderSpecificPageOnly: null, // Load only a specific page
    customToolbarItems: [], // Additional toolbar buttons
  };

  /**
   * Loads a PDF document into the web viewer.
   *
   * @param {LoadOptions} options - Configuration options for loading the document.
   * @returns {Promise<WebViewer | undefined>} Resolves to a `WebViewer` instance upon successful load or `undefined` on failure.
   */
  static async load(options: LoadOptions): Promise<WebViewer | undefined> {
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
      this.loadOptions = {
        ...rest,
        ...options,
      };

      /**
       * Initiates loading of the PDF document.
       * Supports fetching from URLs, local files, and encrypted PDFs.
       */
      const initiateLoadPdf = pdfjsLib.getDocument({
        url: options.document, // PDF source URL
        password: password, // Password (if required)
        withCredentials: options.withCredentials, // Send credentials if needed
        data: options.data, // Raw binary PDF data
        httpHeaders: options.httpHeaders, // Custom HTTP headers
      } as GetDocumentOptions);

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
      const viewer = new WebViewer(pdf, this.loadOptions, internalContainers['parent'], container);
      return viewer;
    } catch (err) {
      // Handle errors during the document loading process.
      console.error('Error loading PDF:', err);
      return undefined;
    }
  }
}

export default WebPdf;
