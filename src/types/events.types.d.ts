/**
 * Defines the types of events that can be emitted within the PDF viewer system.
 */
export type Events =
  | 'scaleChange' /** Triggered when the scale factor of the PDF changes */
  // | 'ScaleUp' /** Triggered when the PDF is zoomed in */
  // | 'ScaleDown' /** Triggered when the PDF is zoomed out */
  // | 'pdfInstanceChange' /** Triggered when the PDF document instance changes */
  // | 'loadingChange' /** Triggered when the loading state of the PDF viewer changes */
  | 'ANNOTATION_SELECTED'
  | 'ANNOTATION_CREATED'
  | 'ANNOTATION_DELETED'
  | 'ANNOTATION_UPDATED';
