import { ToolbarButtonConfig } from '../../types/toolbar.types';
import PdfState from './PDFState';
import WebViewer from './WebViewer';
/**
 * A toolbar for creating and configuring annotations using only DOM APIs.
 * No frameworks required.
 */
export declare class AnnotationToolbar {
    private _color;
    private _fillColor;
    private _opacity;
    private _thickness;
    private _borderStyle;
    private _toolbarContainer;
    private _toolbarPropertiesContainer;
    private _shapeDropdown;
    private _shapeOptions;
    private _selectedShape;
    private _selectedShapeIcon;
    private _isShapeDropdownOpen;
    private _isToolbarPropertiesContainerOpen;
    private _pdfState;
    private _viewer;
    private _onAnnotationCreated;
    private _activeAnnotation;
    /**
     * @param viewer    The WebViewer instance containing PDF pages.
     * @param pdfState  Shared PDF state for events and configuration.
     */
    constructor(viewer: WebViewer, pdfState: PdfState);
    /**
     * Callback when an annotation is finished; resets toolbar state.
     */
    private _handleAnnotationCreated;
    /**
     * Enable or disable annotation drawing cursors and listeners.
     */
    toogleAnnotationDrawing(): void;
    /**
     * Registers or unregisters mouse-down listener for new annotations.
     */
    private _initAnnotationListners;
    /** Apply current toolbar settings to all visible page annotation managers. */
    private updateDrawConfig;
    /**
     * Construct and attach the annotation toolbar UI.
     */
    render(): void;
    /**
     * Insert toolbar elements into the PDF viewer DOM.
     */
    private _injectToolbarContainers;
    /** Remove the main toolbar from the DOM. */
    private _removeToolbarContainer;
    /** Remove the properties panel from the DOM. */
    private _removeToolbarPropertiesContainer;
    /** Remove the shape dropdown from the DOM. */
    private _removeShapeDropdown;
    /** Create the Back button for the toolbar. */
    private _createGoBackButton;
    /**
     * Wrap a toolbar button in a consistent container for layout & tooltip.
     */
    parentWrapper(config: any): HTMLElement;
    /**
     * Create the properties panel (color, fill, opacity, thickness, border).
     */
    private _createToolbarPropertiesContainer;
    /**
     * Create a color picker dropdown (stroke or fill).
     */
    private _createColorDropdown;
    /**
     * Create a slider dropdown for numeric values (opacity or thickness).
     */
    private _createDropdownSlider;
    /**
     * Create a dropdown to select border style: Solid, Dashed, or Dotted.
     */
    private _createBorderDropdown;
    /**
     * Set the selected shape and update toolbar accordingly.
     */
    private _selectShape;
    /**
     * Toggle the visibility of the shape dropdown menu.
     */
    private _toggleShapeDropdown;
    /** Handle Back button click: destroy toolbar and reset state. */
    private handleBackClick;
    /** Remove active selection styles from color pickers. */
    private _deselectColorPicker;
    /**
     * Create a generic toolbar button element.
     */
    createToolbarButton(config: ToolbarButtonConfig): HTMLElement;
    /** Cleanup toolbar and event handlers. */
    destroy(): void;
}
//# sourceMappingURL=PDFAnnotationToolbar.d.ts.map