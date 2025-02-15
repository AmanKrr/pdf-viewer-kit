import EventEmitter from '../event/EventUtils';
import { PDFDocumentProxy } from 'pdfjs-dist';
/**
 * Manages the state of the PDF viewer, including scale, loading status, and page navigation.
 * Extends EventEmitter to allow event-based updates.
 */
declare class PdfState extends EventEmitter {
    /** Stores instances of PdfState mapped by container ID */
    private static pdfStates;
    private _scale;
    private _pdfInstance;
    private _isLoading;
    private _currentPage;
    private _containerId;
    private _uiLoading;
    /** Private constructor to enforce singleton pattern per container ID */
    private constructor();
    /**
     * Retrieves or creates a `PdfState` instance for a given container ID.
     *
     * @param {string} id - The unique container ID.
     * @returns {PdfState} The PdfState instance associated with the given ID.
     * @throws {Error} If the ID is null or empty.
     */
    static getInstance(id: string): PdfState;
    /**
     * Removes a `PdfState` instance associated with the given ID.
     *
     * @param {string} id - The ID of the PdfState instance to remove.
     */
    static removeInstance(id: string): void;
    /**
     * Lists all active `PdfState` instances.
     *
     * @returns {string[]} An array of all registered container IDs.
     */
    static listInstances(): string[];
    /**
     * Gets the current zoom scale of the PDF viewer.
     *
     * @returns {number} The current scale.
     */
    get scale(): number;
    /**
     * Sets a new zoom scale and emits a `scaleChange` event.
     *
     * @param {number} newScale - The new scale to apply.
     */
    set scale(newScale: number);
    /**
     * Gets the PDF.js document instance.
     *
     * @returns {PDFDocumentProxy} The current PDF document instance.
     */
    get pdfInstance(): PDFDocumentProxy;
    /**
     * Sets a new PDF.js document instance and emits a `pdfInstanceChange` event.
     *
     * @param {PDFDocumentProxy} instance - The new PDF document instance.
     */
    set pdfInstance(instance: PDFDocumentProxy);
    /**
     * Checks if the PDF document is currently loading.
     *
     * @returns {boolean} `true` if the document is loading, `false` otherwise.
     */
    get isLoading(): boolean;
    /**
     * Sets the loading state of the PDF document and emits a `loadingChange` event.
     *
     * @param {boolean} value - `true` if loading, `false` otherwise.
     */
    set isLoading(value: boolean);
    /**
     * Gets the current page number being viewed.
     *
     * @returns {number} The current page number.
     */
    get currentPage(): number;
    /**
     * Sets the current page number.
     * (Note: Emitting 'pageChange' is commented out. Uncomment if needed.)
     *
     * @param {number} pageNumber - The new page number.
     */
    set currentPage(pageNumber: number);
    /**
     * Gets the container ID associated with this PdfState instance.
     *
     * @returns {string} The container ID.
     */
    get containerId(): string;
    /**
     * Sets a new container ID for this PdfState instance.
     *
     * @param {string} id - The new container ID.
     */
    set containerId(id: string);
    /**
     * Gets the loading UI element used for displaying loading indicators.
     *
     * @returns {HTMLElement} The loading UI element.
     */
    get uiLoading(): HTMLElement;
    /**
     * Sets the loading UI element.
     *
     * @param {HTMLElement} element - The new loading UI element.
     */
    set uiLoading(element: HTMLElement);
}
export default PdfState;
