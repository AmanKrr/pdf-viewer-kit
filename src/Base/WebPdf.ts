// If your using webpack to create the build, use the webpack referenced file instead of /pdf.js
import { PDFDocumentProxy } from 'pdfjs-dist';
import * as pdfjsLib from 'pdfjs-dist/webpack.mjs';
import WebViewer from '../Viewer/components/WebViewer';
import WebUiUtils from '../utils/WebUiUtils';
import PdfState from '../Viewer/components/PdfState';
import PageElement from '../Viewer/components/PageElement';
import TextLayer from '../Viewer/components/TextLayer';
import Annotation from '../Viewer/components/Annotation';
import PageVirtualization from '../Viewer/components/PageVirtualization';

import '../style/toolbar.css';
import '../style/root.css';
import '../style/textlayer.css';
import '../style/annotationlayer.css';

/**
 * A class responsible for loading and managing PDF documents in a web viewer.
 * Inherits functionality from WebViewer.
 */
class WebPdf extends WebViewer {
  // Default options for configuring the PDF viewer during the load process.
  private static loadOptions: LoadOptions = {
    containerId: '',
    document: '',
    disableTextSelection: false,
    maxDefaultZoomLevel: 400,
    password: '',
    printMode: false,
    toolbarItems: [],
    styleSheets: '',
    preventTextCopy: false,
    renderSpecificPageOnly: null,
  };

  public isloading = true;
  private static scale = PdfState.getInstance()._scale;

  /**
   * Loads a PDF document into the web viewer.
   *
   * @param options - Configuration options for loading the document.
   * @returns A Promise that resolves to a WebViewer instance upon successful load, or `undefined` on failure.
   */
  static async load(options: LoadOptions) {
    // Create the necessary container elements for the PDF viewer.
    const internalContainers = PageElement.containerCreation(options.containerId, this.scale);
    const container = document.getElementById(internalContainers.injectElementId)!;

    // Display a loading spinner in the viewer container.
    const uiLoading = WebUiUtils.showLoading();
    internalContainers.parent.prepend(uiLoading.parentNode!);

    try {
      // Merge user-specified options with default options.
      this.loadOptions = {
        ...this.loadOptions,
        ...options,
      };

      // Fetch the PDF document using the specified source.
      const pdf: PDFDocumentProxy = await pdfjsLib.getDocument(options.document).promise;

      // Store the PDF instance in a shared state.
      PdfState.getInstance().setPdfInstance(pdf);

      // Initialize components for text layer, annotation layer, and page virtualization.
      const textLayer = new TextLayer();
      const annotationLayer = new Annotation();
      const pageVirtualization = new PageVirtualization(this.loadOptions, internalContainers['parent'], container, pdf.numPages, textLayer, annotationLayer);

      // Create and return a WebViewer instance configured with the loaded PDF.
      const viewer = new WebViewer(pdf, uiLoading, pageVirtualization);
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
