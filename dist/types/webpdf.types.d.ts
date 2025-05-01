import { DocumentInitParameters, TypedArray } from 'pdfjs-dist/types/src/display/api';
import { IToolbar, ToolbarButtonConfig, ToolbarOptions } from './toolbar.types';
/**
 * Represents the options for loading a PDF document in the web viewer.
 */
export interface LoadOptions extends DocumentInitParameters {
    /** The ID of the container element where the PDF viewer will be inserted. */
    containerId: string;
    /** The source URL or path of the PDF document. */
    document?: string | URL;
    /** Raw PDF data provided as an `ArrayBuffer` or `Blob`. */
    data?: string | ArrayBuffer | TypedArray | number[] | undefined;
    /** If `true`, text selection will be disabled in the viewer. */
    disableTextSelection?: boolean;
    /** The maximum zoom level allowed in the viewer (optional). */
    maxDefaultZoomLevel?: number;
    /** The password required to open an encrypted PDF (optional). */
    password?: string;
    /** If `true`, enables print mode for the viewer (optional). */
    printMode?: boolean;
    /** Toolbar configuration, allowing partial customization (optional). */
    toolbarItems?: Partial<ToolbarOptions> | {};
    /** Custom CSS stylesheets for customizing the viewer UI (optional). */
    styleSheets?: string;
    /** If `true`, prevents text copying in the viewer (optional). */
    preventTextCopy?: boolean;
    /** Specifies a specific page number to render only that page (optional). */
    renderSpecificPageOnly?: number | null;
    disableToolbar?: boolean;
    customToolbar?: IToolbar;
    customToolbarItems?: ToolbarButtonConfig[];
    toolbarOptions?: ToolbarOptions;
    /** If `true`, enables credentials for cross-origin requests (optional). */
    withCredentials?: boolean;
    /** HTTP headers to be used for fetching the PDF document (optional). */
    httpHeaders?: Record<string, string>;
}
/**
 * Represents viewer options for loading a PDF, excluding sensitive properties.
 * This omits `password`, `withCredentials`, and `httpHeaders` for security reasons.
 */
export type ViewerLoadOptions = Omit<LoadOptions, 'password' | 'withCredentials' | 'httpHeaders'>;
/**
 * Options used when retrieving a PDF document from a URL or other sources.
 */
export interface GetDocumentOptions {
    /** The URL or path to the PDF document. */
    url: string | URL;
    /** The password required to unlock an encrypted PDF (optional). */
    password?: string;
    /** If `true`, enables credentials for cross-origin requests (optional). */
    withCredentials?: boolean;
    /** HTTP headers to be included when fetching the PDF document (optional). */
    httpHeaders?: Record<string, string>;
    /** Raw PDF data provided as an `ArrayBuffer` or `Blob` (optional). */
    data?: ArrayBuffer | Blob;
}
//# sourceMappingURL=webpdf.types.d.ts.map