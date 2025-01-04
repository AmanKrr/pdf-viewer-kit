// If your using webpack to create the build, use the webpack referenced file instead of /pdf.js
import { PDFDocumentProxy, PDFPageProxy, PageViewport } from "pdfjs-dist";
import * as pdfjsLib from "pdfjs-dist/webpack.mjs";
import WebViewer from "../Viewer/components/WebViewer";
import { aPdfViewerClassNames, aPdfViewerIds } from "../constant/ElementIdClass";
import WebUiUtils from "../utils/WebUiUtils";
import { RenderParameters } from "pdfjs-dist/types/src/display/api";
import { PDFLinkService } from "../Viewer/service/LinkService";
import PdfState from "../Viewer/components/PdfState";
import PageElement from "../Viewer/components/PageElement";
import TextLayer from "../Viewer/components/TextLayer";
import Annotation from "../Viewer/components/Annotation";

import "../style/toolbar.css";
import "../style/root.css";
import "../style/textlayer.css";
import "../style/annotationlayer.css";

/**
 * Represents the options for loading a PDF document in the web viewer.
 */
interface LoadOptions {
  containerId: string; // The ID of the container element where the PDF viewer will be inserted.
  document: string | Blob | ArrayBuffer; // Union type for different document types: string, Blob, or ArrayBuffer.
  disableTextSelection?: boolean; // Optional flag to disable text selection in the viewer.
  maxDefaultZoomLevel?: number; // Optional maximum default zoom level for the viewer.
  password?: string; // Optional password for encrypted PDF documents.
  printMode?: boolean; // Optional flag to enable print mode for the viewer.
  toolbarItems?: string[]; // Optional array of toolbar items to display in the viewer.
  styleSheets?: string; // Optional custom style sheets for the viewer.
  preventTextCopy?: boolean; // Optional flag to prevent text copying from the viewer.
  renderSpecificPageOnly?: number | null; // Optional flag to render a specific page only.
}

/**
 * A class for loading and displaying PDF documents in a web viewer.
 */
class WebPdf extends WebViewer {
  // Default load options for PDF viewer.
  private static loadOptions: LoadOptions = {
    containerId: "",
    document: "",
    disableTextSelection: false,
    maxDefaultZoomLevel: 400,
    password: "",
    printMode: false,
    toolbarItems: [],
    styleSheets: "",
    preventTextCopy: false,
    renderSpecificPageOnly: null,
  };

  public isloading = true;
  private static scale = PdfState.getInstance()._scale;

  /**
   * Loads a PDF document into the web viewer.
   * @param options - The options for loading the document.
   * @returns A Promise that resolves to a WebViewer instance if successful, otherwise undefined.
   */
  static async load(options: LoadOptions) {
    // Create container elements for the PDF viewer.
    const internalContainers = PageElement.containerCreation(options.containerId);
    const container = document.getElementById(internalContainers.injectElementId)!;
    const specificPage = options.renderSpecificPageOnly;
    // Create loading container
    const uiLoading = WebUiUtils.showLoading();
    internalContainers.parent.prepend(uiLoading.parentNode!);

    try {
      // Merge provided options with default options.
      this.loadOptions = {
        ...this.loadOptions,
        ...options,
      };

      // Get PDF document from the specified source.
      const pdf: PDFDocumentProxy = await pdfjsLib.getDocument(options.document).promise;
      const pdfLinkService = new PDFLinkService();
      const textLayer = new TextLayer();
      const annotationLayer = new Annotation();
      // const viewer = new WebViewer(pdf, uiLoading, this.scale)

      // Iterate through each page of the PDF document.
      for (let pageNumber = specificPage || 1; pageNumber <= (specificPage || pdf.numPages); pageNumber++) {
        const page = await pdf.getPage(pageNumber);
        const scale = this.scale;
        const viewport = page.getViewport({ scale });

        // Create container div for the page.
        const pageWrapper = PageElement.createPageContainerDiv(pageNumber, viewport);
        container.appendChild(pageWrapper);

        // Create canvas element for rendering the page.
        const [canvas, context] = PageElement.createCanvas(viewport);
        pageWrapper.appendChild(canvas);

        // Render the page onto the canvas.
        const renderContext: RenderParameters = {
          canvasContext: context,
          viewport,
          annotationMode: 2,
        };
        await page.render(renderContext).promise;

        // Enable text layer if text selection is not disabled.
        if (!options.disableTextSelection) {
          const textLayerContainer = await textLayer.createTextLayer(pageWrapper, container, page, viewport);
          await annotationLayer.createAnnotationLayer(pageWrapper, textLayerContainer, page, viewport, pdfLinkService);
        }
      }

      // Return a new WebViewer instance.
      const viewer = new WebViewer(pdf, uiLoading);
      pdfLinkService.setViewer(viewer);
      pdfLinkService.setDocument(pdf);
      return viewer;
    } catch (err) {
      console.error("Error", err);
      // this.hideLoading();
      return undefined;
    }
  }
}

export default WebPdf;
