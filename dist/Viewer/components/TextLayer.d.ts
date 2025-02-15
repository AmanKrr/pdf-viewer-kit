import PageElement from './PageElement';
import { PageViewport, PDFPageProxy } from 'pdfjs-dist';
/**
 * Manages the creation and rendering of a text layer for a specific page in the PDF viewer.
 * The text layer overlays text content extracted from the PDF, enabling text selection and interactions.
 */
declare class TextLayer extends PageElement {
    private pageWrapper;
    private page;
    private viewport;
    /**
     * Constructs a `TextLayer` instance for a given PDF page.
     *
     * @param {HTMLElement} pageWrapper - The HTML element wrapping the current PDF page.
     * @param {HTMLElement} container - The HTML container for the text layer.
     * @param {PDFPageProxy} page - The PDF.js page proxy object representing the current page.
     * @param {PageViewport} viewport - The viewport defining the dimensions and scale of the text layer.
     */
    constructor(pageWrapper: HTMLElement, page: PDFPageProxy, viewport: PageViewport);
    /**
     * Creates and renders the text layer for the current PDF page.
     *
     * This method:
     * - Retrieves text content from the PDF page.
     * - Creates a text layer `<div>` with appropriate styles and dimensions.
     * - Uses PDF.js's `TextLayer` class to render the extracted text into the layer.
     * - Assigns a click handler to each text element for future interactions.
     *
     * @returns {Promise<HTMLDivElement>} A promise that resolves to the created text layer `<div>`.
     */
    createTextLayer(): Promise<HTMLDivElement[]>;
    private wrapTextLayerIntoPTag;
    private copyAndPateText;
    private keyDown;
}
export default TextLayer;
