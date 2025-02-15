import WebViewer from '../Viewer/components/WebViewer';
import '../style/toolbar.css';
import '../style/root.css';
import '../style/textlayer.css';
import '../style/thumbnail.css';
import '../style/annotationlayer.css';
import '../style/annotationDrawerLayer.css';
import { LoadOptions } from '../types/webpdf.types';
/**
 * Class responsible for loading and managing PDF documents within a web viewer.
 * Extends functionalities from `WebViewer` and integrates PDF.js for rendering.
 */
declare class WebPdf {
    /**
     * Loads a PDF document into the web viewer.
     *
     * @param {LoadOptions} options - Configuration options for loading the document.
     * @returns {Promise<WebViewer | undefined>} Resolves to a `WebViewer` instance upon successful load or `undefined` on failure.
     */
    static load(options: LoadOptions): Promise<WebViewer | undefined>;
}
export default WebPdf;
