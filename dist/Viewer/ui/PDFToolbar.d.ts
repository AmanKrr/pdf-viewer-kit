import WebViewer from './WebViewer';
import { IToolbar, ToolbarOptions, ToolbarButtonConfig } from '../../types/toolbar.types';
import PdfState from './PDFState';
/**
 * Implements the main toolbar UI for the PDF viewer.
 * Allows navigation, zoom, search, annotations, and download controls.
 */
export declare class Toolbar implements IToolbar {
    private _container;
    private _buttons;
    private _opts;
    private _pdfState;
    private _viewer;
    private _annotationToolbar;
    private _searchBarOpen;
    /**
     * @param viewer    The WebViewer instance.
     * @param pdfState  Shared state object for PDF interactions.
     * @param buttons   Optional custom button configurations.
     * @param options   ToolbarOptions to enable/disable features.
     */
    constructor(viewer: WebViewer, pdfState: PdfState, buttons?: ToolbarButtonConfig[], options?: ToolbarOptions);
    /**
     * Renders the toolbar into the specified container element.
     *
     * @param container  The HTML element to host the toolbar.
     */
    render(container: HTMLElement): void;
    /**
     * Builds the default toolbar buttons based on enabled options.
     *
     * @returns Array of ToolbarButtonConfig for default buttons.
     */
    private _defaultButtons;
    /**
     * Closes the annotation toolbar if open.
     */
    private _closeAnnotationToolbar;
    /**
     * Creates a toolbar button element.
     *
     * @param cfg  Configuration for the button.
     * @returns The constructed HTMLButtonElement.
     */
    protected __createButton(cfg: ToolbarButtonConfig): HTMLButtonElement;
    /**
     * Wraps a toolbar item for consistent styling.
     *
     * @param itemId  Identifier for the toolbar item.
     * @returns A wrapper div element.
     */
    protected __wrapItem(itemId: string): HTMLDivElement;
    /**
     * Creates a visual separator between toolbar items.
     *
     * @returns A separator div element.
     */
    protected __addSeparator(): HTMLDivElement;
    /**
     * Renders the "page X of Y" page number control.
     *
     * @param viewer  The WebViewer instance.
     * @returns An HTMLElement containing page navigation controls.
     */
    private static _renderPageNumberControls;
    /**
     * Destroys the toolbar and its sub-components.
     */
    destroy(): void;
}
//# sourceMappingURL=PDFToolbar.d.ts.map