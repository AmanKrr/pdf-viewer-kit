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

// If your using webpack to create the build, use the webpack referenced file instead of /pdf.js
import { PDFDocumentProxy } from 'pdfjs-dist';
import * as pdfjsLib from 'pdfjs-dist/webpack.mjs';
import WebViewer from '../Viewer/components/WebViewer';
import WebUiUtils from '../utils/WebUiUtils';
import PdfState from '../Viewer/components/PdfState';
import PageElement from '../Viewer/components/PageElement';
import PageVirtualization from '../Viewer/components/PageVirtualization';

import '../style/toolbar.css';
import '../style/root.css';
import '../style/textlayer.css';
import '../style/annotationlayer.css';
import '../style/thumbnail.css';

/**
 * A class responsible for loading and managing PDF documents in a web viewer.
 * Inherits functionality from WebViewer.
 */
class WebPdf {
  // Default options for configuring the PDF viewer during the load process.
  private static loadOptions: LoadOptions = {
    containerId: '',
    document: '',
    disableTextSelection: false,
    maxDefaultZoomLevel: 5,
    password: '',
    printMode: false,
    toolbarItems: {},
    styleSheets: '',
    preventTextCopy: false,
    renderSpecificPageOnly: null,
    customToolbarItems: [],
  };

  /**
   * Loads a PDF document into the web viewer.
   *
   * @param options - Configuration options for loading the document.
   * @returns A Promise that resolves to a WebViewer instance upon successful load, or `undefined` on failure.
   */
  static async load(options: LoadOptions) {
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
      this.loadOptions = {
        ...this.loadOptions,
        ...options,
      };

      // Fetch the PDF document using the specified source.
      const initiateLoadPdf = pdfjsLib.getDocument(options.document);

      // Track progress while fetching pdf.
      // initiateLoadPdf.onProgress = function (data: any) {
      //   console.log('data', data);
      //   console.log('loaded : ' + data.loaded);
      //   console.log('total : ' + data.total);
      // };

      const pdf: PDFDocumentProxy = await initiateLoadPdf.promise;

      // Store the PDF instance in a shared state.
      pdfStates.pdfInstance = pdf;

      // Create and return a WebViewer instance configured with the loaded PDF.
      const { password, ...neededOptions } = this.loadOptions;
      const viewer = new WebViewer(pdf, neededOptions, internalContainers['parent'], container);
      return viewer;
    } catch (err) {
      // Handle errors during the document loading process.
      console.error('Error', err);
      // this.hideLoading();
      return undefined;
    }
  }
}

export default WebPdf;
