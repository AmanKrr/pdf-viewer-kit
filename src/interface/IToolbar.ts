/**
 * Contract for toolbar components in the PDF viewer.
 */
export interface IToolbar {
  /**
   * Render the toolbar into the specified container element.
   *
   * @param container - The HTMLElement in which to render this toolbar.
   */
  render(container: HTMLElement): void;

  /**
   * Destroy the toolbar, removing any event listeners and DOM elements it created.
   */
  destroy(): void;
}
