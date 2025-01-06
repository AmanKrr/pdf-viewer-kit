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
