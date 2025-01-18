import { PDFLinkService } from '../Viewer/service/PdfLinkService';

export interface PDFThumbnailViewOptions {
  container: HTMLElement;
  pdfDocument: PDFDocumentProxy;
  pageNumber: number;
  linkService?: PDFLinkService | null;
}
