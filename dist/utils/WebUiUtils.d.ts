/**
 * Utility class for managing UI-related tasks in the PDF Viewer.
 * Provides functions for showing/hiding loading indicators,
 * handling page visibility, and rendering pages.
 */
declare class WebUiUtils {
    /**
     * Displays a loading spinner inside the viewer container.
     *
     * @returns {HTMLElement} The loading element that can be later removed when loading completes.
     */
    static showLoading(): HTMLElement;
    /**
     * Hides and removes the loading spinner from the viewer.
     *
     * @param {HTMLElement} loadingElement - The loading element to be removed.
     * @param {string} containerId - The container ID where the loading spinner is located.
     */
    static hideLoading(loadingElement: HTMLElement, containerId: string): void;
    /**
     * Sets up an intersection observer to detect visible pages in the viewer.
     * Calls the provided callback function when a page becomes visible.
     *
     * @param {(pageNumber: number) => void} callback - Callback function to execute when a page is visible.
     * @param {string} containerId - The container ID where the PDF pages are rendered.
     */
    static Observer(callback: (pageNumber: number) => void, containerId: string): void;
    /**
     * Parses a query string into a Map object.
     *
     * @param {string} query - The query string (e.g., "?param1=value&param2=...").
     * @returns {Map<string, string>} A map of key-value pairs parsed from the query string.
     */
    static parseQueryString(query: string): Map<string, string>;
    /**
     * Retrieves an array of currently visible pages within the PDF viewer.
     *
     * @param {any} pdfInstance - The PDF.js instance.
     * @returns {number[]} An array containing the numbers of visible pages.
     */
    static getVisiblePages(pdfInstance: any): number[];
    /**
     * Renders a specific PDF page onto a canvas within the viewer.
     *
     * @param {any} pdfInstance - The PDF.js instance.
     * @param {number} pageIndex - The index of the page to be rendered.
     * @param {number} scale - The scale factor for rendering.
     * @param {number} devicePixelRatio - The device pixel ratio for high-DPI rendering.
     * @returns {Promise<void>} A promise that resolves once the page is rendered.
     */
    static renderPage(pdfInstance: any, pageIndex: number, scale: number, devicePixelRatio: number): Promise<void>;
}
export default WebUiUtils;
