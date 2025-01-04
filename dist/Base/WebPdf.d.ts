import WebViewer from "../Viewer/components/WebViewer";
import "../style/toolbar.css";
import "../style/root.css";
import "../style/textlayer.css";
import "../style/annotationlayer.css";
/**
 * Represents the options for loading a PDF document in the web viewer.
 */
interface LoadOptions {
    containerId: string;
    document: string | Blob | ArrayBuffer;
    disableTextSelection?: boolean;
    maxDefaultZoomLevel?: number;
    password?: string;
    printMode?: boolean;
    toolbarItems?: string[];
    styleSheets?: string;
    preventTextCopy?: boolean;
    renderSpecificPageOnly?: number | null;
}
/**
 * A class for loading and displaying PDF documents in a web viewer.
 */
declare class WebPdf extends WebViewer {
    private static loadOptions;
    isloading: boolean;
    private static scale;
    /**
     * Loads a PDF document into the web viewer.
     * @param options - The options for loading the document.
     * @returns A Promise that resolves to a WebViewer instance if successful, otherwise undefined.
     */
    static load(options: LoadOptions): Promise<WebViewer | undefined>;
}
export default WebPdf;
