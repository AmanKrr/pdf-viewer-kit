import { SelectionManager } from '../manager/SelectionManager';
import WebViewer from './WebViewer';
/**
 * Manages the toolbar functionality for the PDF viewer, including navigation, zoom, and additional tools.
 */
declare class Toolbar {
    private toolbar;
    private toolbarClass;
    private toolbarConfig;
    private _viewer;
    private __pdfState;
    private selectionManager;
    /**
     * Constructs the toolbar for the PDF viewer.
     *
     * @param {string} containerId - The ID of the container where the toolbar will be added.
     * @param {ToolbarButtonConfig[]} customToolbarItems - An array of custom toolbar items.
     * @param {WebViewer} webViewer - The WebViewer instance to control the PDF viewer.
     */
    constructor(containerId: string, customToolbarItems: ToolbarButtonConfig[] | [], webViewer: WebViewer, selectionManager: SelectionManager);
    /**
     * Sets new toolbar options.
     *
     * @param {Partial<ToolbarOptions>} options - The updated toolbar options.
     */
    setToolbar(options?: Partial<ToolbarOptions>): void;
    /**
     * Retrieves the current toolbar options.
     *
     * @returns {ToolbarOptions} The current toolbar settings.
     */
    getToolbar(): ToolbarOptions;
    /**
     * Removes the toolbar from the viewer.
     */
    removeToolbar(): void;
    /**
     * Retrieves the default toolbar configuration.
     *
     * @returns {ToolbarButtonConfig[]} An array of toolbar button configurations.
     */
    getToolbarData(): ToolbarButtonConfig[];
    /**
     * Renders the toolbar and adds the buttons based on the current configuration.
     */
    private renderToolbar;
    /**
     * Creates a button element for the toolbar.
     *
     * @param {ToolbarButtonConfig} config - The button configuration.
     * @returns {HTMLElement} The created button element.
     */
    private createToolbarButton;
    /**
     * Creates a wrapper element for the toolbar button.
     *
     * @param {any} config - The button configuration.
     * @returns {HTMLElement} The wrapper element.
     */
    private parentWrapper;
    /**
     * Adds a separator element between toolbar buttons.
     *
     * @param {HTMLElement} parent - The parent element where the separator is added.
     */
    private addSeparator;
    /**
     * Creates and renders the page number controls for the toolbar.
     * This includes:
     * - An input field for the user to enter a specific page number.
     * - A "of" label indicating the total number of pages.
     *
     * @param {WebViewer} viewer - The WebViewer instance controlling the PDF viewer.
     * @returns {HTMLElement} The container element containing the page number input and total page count.
     */
    private static renderPageNumberControls;
    private static shapeTool;
}
export default Toolbar;
