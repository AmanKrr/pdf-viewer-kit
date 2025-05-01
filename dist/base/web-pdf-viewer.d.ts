import WebViewer from '../viewer/ui/WebViewer';
import '../style/toolbar.css';
import '../style/global.css';
import '../style/text-layer.css';
import '../style/thumbnail.css';
import '../style/annotation-layer.css';
import '../style/annotation-drawer-layer.css';
import { LoadOptions } from '../types/webpdf.types';
/**
 * Class responsible for loading and managing PDF documents within a web viewer.
 * Extends functionalities from `WebViewer` and integrates PDF.js for rendering.
 */
declare class WebPdf {
    private static _loadingTasks;
    private static _viewers;
    /**
     * Loads a PDF document into the web viewer.
     *
     * @param {LoadOptions} options - Configuration options for loading the document.
     * @returns {Promise<WebViewer | undefined>} Resolves to a `WebViewer` instance upon successful load or `undefined` on failure.
     */
    static load(options: LoadOptions): Promise<WebViewer | undefined>;
    /**
     * Completely tears down everything for the given container:
     *  • stops any in-flight PDF.js loads
     *  • destroys the PDFDocumentProxy
     *  • removes UI spinners
     *  • unsubscribes PdfState
     *  • destroys the WebViewer and its sub-components
     *  • clears out any injected DOM
     */
    static unload(containerId: string): void;
    static unloadAll(): void;
}
export default WebPdf;
//# sourceMappingURL=web-pdf-viewer.d.ts.map