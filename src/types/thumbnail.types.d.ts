interface PDFThumbnailViewOptions {
  container: HTMLElement;
  pdfDocument: PDFDocumentProxy;
  pageNumber: number;
  linkService?: { goToPage: (pageNumber: number) => void } | null;
}
