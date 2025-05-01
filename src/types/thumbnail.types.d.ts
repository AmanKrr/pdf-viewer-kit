import { PDFLinkService } from '../viewer/services/LinkService';
import { PDFDocumentProxy } from 'pdfjs-dist';

/**
 * Configuration options for rendering a PDF thumbnail.
 */
export interface PDFThumbnailViewOptions {
  /** The container element where the thumbnail will be rendered. */
  container: HTMLElement;

  /** The PDF document instance from which the thumbnail is generated. */
  pdfDocument: PDFDocumentProxy;

  /** The page number for which the thumbnail should be created. */
  pageNumber: number;

  /** Optional link service for handling navigation within the PDF viewer. */
  linkService?: PDFLinkService | null;
}
