import PdfState from '../ui/PDFState';
import { AnnotationService } from '../services/AnnotationService';
/**
 * Manages downloading of the current PDF, optionally embedding annotations.
 */
export declare class DownloadManager {
    private readonly _annotationService;
    private readonly _pdfState;
    private readonly _sourceUrl?;
    private readonly _cacheSource;
    /**
     * @param _annotationService  Service holding and exporting annotations.
     * @param _pdfState           Shared PdfState instance.
     * @param _sourceUrl          Optional URL to fetch PDF if in-memory bytes unavailable.
     * @param _cacheSource        If true, reuse original bytes; otherwise clone for GC.
     */
    constructor(_annotationService: AnnotationService, _pdfState: PdfState, _sourceUrl?: string | undefined, _cacheSource?: boolean);
    /**
     * Initiates a download of the PDF.
     * If annotations exist, they will be embedded into a copy of the PDF.
     *
     * @param filename  Optional filename (without extension); defaults to timestamp.
     */
    download(filename?: string): Promise<void>;
    /**
     * Retrieves the source PDF bytes from memory or via HTTP fetch.
     */
    private _getOriginalBytes;
    /**
     * Builds a map of PageViewport objects for each PDF page,
     * using the current zoom scale from PdfState.
     */
    private _buildViewportMap;
    /**
     * Triggers the browser's download mechanism for the given PDF bytes.
     *
     * @param bytes     The PDF file data.
     * @param filename  Name (without extension) for the downloaded file.
     */
    private _triggerBrowserDownload;
}
//# sourceMappingURL=PDFDownloadManager.d.ts.map