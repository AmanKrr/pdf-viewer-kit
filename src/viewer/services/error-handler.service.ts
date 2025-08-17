/*
  Copyright 2025 Aman Kumar

  Licensed under the Apache License, Version 2.0 (the "License");
  you may not use this file except in compliance with the License.
  You may obtain a copy of the License at

      http://www.apache.org/licenses/LICENSE-2.0

  Unless required by applicable law or agreed to in writing, software
  distributed under the License is distributed on an "AS IS" BASIS,
  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
  See the License for the specific language governing permissions and
  limitations under the License.
*/

/**
 * Service for handling and displaying user-friendly error messages.
 * This service provides a clean interface for showing errors in the UI
 * when PDF loading or other operations fail.
 */
export class ErrorHandlerService {
  private readonly _parentContainer: HTMLElement;
  private readonly _instanceId: string;
  private _errorElement: HTMLElement | null = null;
  private _isDestroyed = false;
  private _retryCallback?: () => void;

  /**
   * Creates a new error handler service.
   *
   * @param parentContainer - The parent container where error messages will be displayed
   * @param instanceId - The unique identifier for this PDF viewer instance
   * @param retryCallback - Optional callback function to handle retry attempts
   */
  constructor(parentContainer: HTMLElement, instanceId: string, retryCallback?: () => void) {
    this._parentContainer = parentContainer;
    this._instanceId = instanceId;
    this._retryCallback = retryCallback;
  }

  /**
   * Gets whether this service has been destroyed.
   */
  get isDestroyed(): boolean {
    return this._isDestroyed;
  }

  /**
   * Shows a user-friendly error message.
   *
   * @param error - The error object or message to display
   * @param title - Optional title for the error (defaults to "PDF Loading Error")
   */
  showError(error: Error | string, title: string = 'PDF Loading Error'): void {
    if (this._isDestroyed) {
      return;
    }

    // Remove any existing error element
    this.hideError();

    // Create error element
    this._errorElement = this._createErrorElement(error, title);

    // Add to parent container
    this._parentContainer.appendChild(this._errorElement);

    // Add error class to parent container for styling
    this._parentContainer.classList.add('pdf-error');
  }

  /**
   * Hides the current error message.
   */
  hideError(): void {
    if (this._errorElement && this._errorElement.parentNode) {
      this._errorElement.parentNode.removeChild(this._errorElement);
      this._errorElement = null;
    }

    // Remove error class from parent container
    this._parentContainer.classList.remove('pdf-error');
  }

  /**
   * Creates the error element with user-friendly styling.
   *
   * @param error - The error object or message
   * @param title - The error title
   * @returns The created error element
   */
  private _createErrorElement(error: Error | string, title: string): HTMLElement {
    const errorContainer = document.createElement('div');
    errorContainer.id = `pdf-error-${this._instanceId}`;
    errorContainer.className = 'pdf-error-container';
    errorContainer.setAttribute('data-instance', this._instanceId);

    // Create error icon using your existing color scheme
    const errorIcon = document.createElement('div');
    errorIcon.className = 'pdf-error-icon';
    errorIcon.innerHTML = '⚠️';
    errorIcon.style.color = 'var(--pdf-error-text-color)'; // Using your error color variable

    // Create error content
    const errorContent = document.createElement('div');
    errorContent.className = 'pdf-error-content';

    // Create error title
    const errorTitle = document.createElement('h1');
    errorTitle.className = 'pdf-error-title';
    errorTitle.textContent = title;

    // Create error message
    const errorMessage = document.createElement('p');
    errorMessage.className = 'pdf-error-message';

    // Extract meaningful error message
    let message = 'An unexpected error occurred while loading the PDF.';
    if (typeof error === 'string') {
      message = error;
    } else if (error instanceof Error) {
      message = this._getUserFriendlyMessage(error);
    }

    errorMessage.textContent = message;

    // Create retry button using your button styling
    const retryButton = document.createElement('button');
    retryButton.className = 'pdf-error-retry';
    retryButton.textContent = 'Try Again';
    retryButton.onclick = () => {
      this.hideError();
      // Use retry callback if provided, otherwise emit retry event
      if (this._retryCallback) {
        this._retryCallback();
      } else {
        this._emitRetryEvent();
      }
    };

    // Assemble error element
    errorContent.appendChild(errorTitle);
    errorContent.appendChild(errorMessage);
    errorContent.appendChild(retryButton);

    errorContainer.appendChild(errorIcon);
    errorContainer.appendChild(errorContent);

    return errorContainer;
  }

  /**
   * Converts technical error messages to user-friendly messages.
   *
   * @param error - The error object
   * @returns User-friendly error message
   */
  private _getUserFriendlyMessage(error: Error): string {
    const message = error.message.toLowerCase();

    // Network-related errors
    if (message.includes('network') || message.includes('fetch')) {
      return 'Unable to load the PDF. Please check your internet connection and try again.';
    }

    // File not found errors
    if (message.includes('404') || message.includes('not found')) {
      return 'The PDF file could not be found. Please check the file URL and try again.';
    }

    // Permission errors
    if (message.includes('403') || message.includes('forbidden')) {
      return 'Access to the PDF file is denied. Please check your permissions and try again.';
    }

    // Corrupted or invalid PDF
    if (message.includes('invalid') || message.includes('corrupt') || message.includes('pdf')) {
      return 'The PDF file appears to be corrupted or invalid. Please try a different file.';
    }

    // Timeout errors
    if (message.includes('timeout') || message.includes('timed out')) {
      return 'The PDF took too long to load. Please try again or check your connection.';
    }

    // Generic error message
    return 'An error occurred while loading the PDF. Please try again.';
  }

  /**
   * Emits a retry event for the parent to handle.
   */
  private _emitRetryEvent(): void {
    // Create and dispatch a custom retry event
    const retryEvent = new CustomEvent('pdfRetry', {
      detail: { instanceId: this._instanceId },
      bubbles: true,
    });

    this._parentContainer.dispatchEvent(retryEvent);
  }

  /**
   * Handles retry attempts by hiding the error and emitting a retry event.
   * This method can be called programmatically or by the retry button.
   */
  handleRetry(): void {
    if (this._isDestroyed) {
      return;
    }

    this.hideError();
    this._emitRetryEvent();
  }

  /**
   * Destroys this service and cleans up all resources.
   */
  destroy(): void {
    if (this._isDestroyed) {
      return;
    }

    this._isDestroyed = true;
    this.hideError();
  }
}
