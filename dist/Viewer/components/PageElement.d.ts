import { PageViewport } from 'pdfjs-dist';
declare class PageElement {
    /**
     * Creates a container div for a PDF page.
     * @param pageNumber - The page number.
     * @param viewport - The viewport of the page.
     * @param containerMainBoundingBox - The bounding box of the main container.
     * @param specificPage - The specific page number to render.
     * @returns The created container div.
     */
    static createPageContainerDiv(pageNumber: number, viewport: PageViewport): HTMLDivElement;
    /**
     * Creates a canvas element for rendering a PDF page.
     * @param viewport - The viewport of the page.
     * @returns The created canvas element.
     */
    static createCanvas(viewport: PageViewport): [HTMLCanvasElement, CanvasRenderingContext2D];
    /**
     * Creates container elements for the PDF viewer.
     * @param containerId - The ID of the container element.
     * @returns An object containing references to the created container elements.
     */
    static containerCreation(containerId: string): {
        parent: HTMLDivElement;
        injectElementId: string;
    };
    static createLayers(classNames: string, ids: string, viewport: PageViewport): HTMLDivElement;
}
export default PageElement;
