import { PDFPageProxy } from 'pdfjs-dist';
import { RenderParameters } from 'pdfjs-dist/types/src/display/api';
/**
 * Represents the details required for rendering a PDF page.
 */
type pageDetails = {
    /** The PDF.js page proxy object representing the page. */
    page: PDFPageProxy;
    /** The page number corresponding to this page in the document. */
    pageNumber: number;
    /** The rendering context containing settings for how the page should be displayed. */
    renderContext: RenderParameters;
};
export default pageDetails;
//# sourceMappingURL=pagevirtualization.types.d.ts.map