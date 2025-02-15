import { PageViewport } from 'pdfjs-dist';
/**
 * A utility class for managing and creating various elements related to rendering PDF pages in a viewer.
 */
declare class PageElement {
    /** The gap between consecutive pages in the viewer. */
    static gap: number;
    /**
     * Creates a container `<div>` element for a PDF page.
     *
     * @param {number} pageNumber - The page number to create a container for.
     * @param {PageViewport} viewport - The viewport object representing the page dimensions.
     * @param {Map<number, number>} pagePositionInfo - A map storing page positions.
     * @returns {HTMLDivElement} The created page container element.
     */
    static createPageContainerDiv(pageNumber: number, viewport: PageViewport, pagePositionInfo: Map<number, number>): HTMLDivElement;
    /**
     * Creates a `<canvas>` element for rendering a PDF page.
     *
     * @param {PageViewport} viewport - The viewport object representing the page dimensions.
     * @returns {[HTMLCanvasElement, CanvasRenderingContext2D]} A tuple containing the created canvas and its rendering context.
     */
    static createCanvas(viewport: PageViewport): [HTMLCanvasElement, CanvasRenderingContext2D];
    /**
     * Creates the main container elements required for the PDF viewer.
     *
     * @param {string} containerId - The ID of the parent container where the viewer will be appended.
     * @param {number} scale - The scale factor to be applied to the viewer.
     * @returns {object} An object containing references to the created container elements.
     */
    static containerCreation(containerId: string, scale: number): {
        parent: HTMLDivElement;
        injectElementId: string;
    };
    /**
     * Creates layer elements (e.g., text, annotation layers) for a PDF page.
     *
     * @param {string} classNames - The class names to be assigned to the layer.
     * @param {string} ids - The ID to be assigned to the layer.
     * @param {PageViewport} viewport - The viewport object representing the page dimensions.
     * @returns {HTMLDivElement} The created layer `<div>` element.
     */
    static createLayers(classNames: string, ids: string, viewport: PageViewport): HTMLDivElement;
}
export default PageElement;
