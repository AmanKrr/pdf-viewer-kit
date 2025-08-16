/**
 * Represents a drawable annotation (shape) in the PDF viewer.
 */
export interface IAnnotation {
  /** Unique identifier for the annotation. */
  readonly annotationId: string;

  /** Shape type, e.g. 'rectangle', 'ellipse', 'line'. */
  readonly type: string;

  /** True while the user is actively drawing this annotation. */
  readonly isDrawing: boolean;

  /** True if this annotation is valid and should be kept. */
  readonly isValidAnnotation: boolean;

  /**
   * Begin drawing the annotation.
   *
   * @param x - The x-coordinate where drawing starts (relative to the container).
   * @param y - The y-coordinate where drawing starts.
   * @param pageNumber - The PDF page number on which this annotation is being drawn.
   */
  startDrawing(x: number, y: number, pageNumber: number): void;

  /**
   * Update the annotation's geometry as the pointer moves.
   *
   * @param x - Current x-coordinate of the pointer.
   * @param y - Current y-coordinate of the pointer.
   */
  updateDrawing(x: number, y: number): void;

  /**
   * Complete the drawing operation.
   */
  stopDrawing(): void;

  /** Show selection UI (handles, outline, etc.). */
  select(): void;

  /** Hide selection UI. */
  deselect(): void;

  /**
   * Remove the annotation from the DOM and clean up.
   *
   * @param suppressEvent - If true, do not emit a delete event.
   */
  deleteAnnotation(suppressEvent: boolean): void;

  /**
   * Retrieve the annotation's configuration for saving or re-creation.
   *
   * @returns A plain object describing the annotation geometry and style.
   */
  getConfig(): Record<string, any>;

  /**
   * Optional: Scroll the annotation into view (e.g., after programmatic creation).
   */
  scrollToView?(): void;

  /**
   * Optional: Assign or update the annotation's ID.
   */
  setId?(): void;
}
