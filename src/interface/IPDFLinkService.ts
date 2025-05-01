/**
 * Service for navigating within the PDF by destination or page number.
 */
export interface IPDFLinkService {
  /**
   * Navigate to a named destination or explicit PDF destination array.
   *
   * @param dest - The destination name (string) or destination array as defined by PDF.js.
   * @returns A promise that resolves once navigation completes.
   */
  goToDestination(dest: string | any[]): Promise<void>;

  /**
   * Navigate directly to the specified page.
   *
   * @param val - The 1-based page number or page label.
   */
  goToPage(val: number | string): void;
}
