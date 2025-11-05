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

import PasswordManager from '../managers/password-manager';

/**
 * Service for managing password-protected PDF documents.
 * This service integrates with the existing PasswordManager class
 * to provide a clean, class-based approach for password handling.
 */
export class PasswordManagerService {
  private _passwordManager: PasswordManager | null = null;
  private readonly _parentContainer: HTMLElement;
  private readonly _instanceId: string;
  private _isDestroyed = false;

  /**
   * Creates a new password manager service.
   *
   * @param parentContainer - The parent container where password prompts will be displayed
   * @param instanceId - The unique identifier for this PDF viewer instance
   */
  constructor(parentContainer: HTMLElement, instanceId: string) {
    this._parentContainer = parentContainer;
    this._instanceId = instanceId;
  }

  /**
   * Gets the current password manager instance.
   */
  get passwordManager(): PasswordManager | null {
    return this._passwordManager;
  }

  /**
   * Gets whether this service has been destroyed.
   */
  get isDestroyed(): boolean {
    return this._isDestroyed;
  }

  /**
   * Handles password requirement for a PDF document.
   *
   * @param updatePassword - Callback function to update the password
   * @param reason - Reason for password requirement (1 = initial request, 2 = incorrect password)
   */
  handlePasswordRequired(updatePassword: (pass: string) => void, reason: number): void {
    if (this._isDestroyed) {
      return;
    }

    if (reason === 1) {
      // Initial password request
      this._createPasswordManager(updatePassword);
    } else if (reason === 2) {
      // Incorrect password attempt
      this._handleIncorrectPassword();
    }
  }

  /**
   * Creates a new password manager instance.
   *
   * @param updatePassword - Callback function to update the password
   */
  private _createPasswordManager(updatePassword: (pass: string) => void): void {
    if (this._passwordManager) {
      // If a password manager already exists, just update the error state
      this._passwordManager.onError = 'Enter password: ';
    } else {
      // Create a new password manager
      this._passwordManager = new PasswordManager(this._parentContainer, updatePassword);
    }
  }

  /**
   * Handles incorrect password attempts.
   */
  private _handleIncorrectPassword(): void {
    if (this._passwordManager) {
      this._passwordManager.onError = 'Incorrect! Enter password again:';
    }
  }

  /**
   * Cleans up the password manager after successful authentication.
   */
  cleanupAfterSuccess(): void {
    if (this._passwordManager) {
      this._passwordManager.destroy();
      this._passwordManager = null;
    }
  }

  /**
   * Destroys this service and cleans up all resources.
   */
  destroy(): void {
    if (this._isDestroyed) {
      return;
    }

    this._isDestroyed = true;

    if (this._passwordManager) {
      this._passwordManager.destroy();
      this._passwordManager = null;
    }
  }
}
