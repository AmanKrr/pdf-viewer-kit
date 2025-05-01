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
 * Manages password input and validation for protected PDF documents.
 */
class PasswordManager {
  private readonly _inpField: HTMLInputElement;
  private readonly _inpLabel: HTMLLabelElement;

  /**
   * Constructs a `PasswordManager` instance.
   *
   * @param {HTMLElement} parentContainer - The parent container where the password form will be rendered.
   * @param {(pass: string) => void} updatePasswordCallback - Callback function to update the entered password.
   */
  constructor(parentContainer: HTMLElement, updatePasswordCallback: (pass: string) => void) {
    const [inpField, inpLabel] = this._view(parentContainer, updatePasswordCallback);
    this._inpField = inpField as HTMLInputElement;
    this._inpLabel = inpLabel as HTMLLabelElement;
    // Prevent prototype tampering
    Object.freeze(PasswordManager.prototype);
  }

  /**
   * Displays an error message when an incorrect password is entered.
   *
   * @param {string} errorMessage - The error message to display.
   */
  set onError(errorMessage: string) {
    if (this._inpField && this._inpLabel) {
      this._inpLabel.textContent = errorMessage;
      this._inpField.focus();
      const parentDiv = this._inpField.parentElement?.parentElement;
      if (parentDiv) {
        parentDiv.removeAttribute('style');
      }
    }
  }

  /**
   * Hashes a given password using SHA-256 for security purposes.
   *
   * @param {string} password - The password to hash.
   * @returns {Promise<string>} The base64-encoded SHA-256 hash of the password.
   */
  private async _hashPassword(password: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    return btoa(String.fromCharCode(...new Uint8Array(hashBuffer)));
  }

  /**
   * Handles the form submission event.
   *
   * @param {SubmitEvent} event - The form submission event.
   * @param {(pass: string) => void} updatePasswordCallback - The callback function for handling the password submission.
   * @param {HTMLDivElement} parentDiv - The parent div of the password form.
   */
  private _onFormSumbit(event: SubmitEvent, updatePasswordCallback: (pass: string) => void, parentDiv: HTMLDivElement): void {
    event.preventDefault();
    event.stopPropagation();

    if (event.target) {
      const formData = new FormData(event.target as HTMLFormElement);
      if (this._inpField) {
        this._inpField.value = '';
      }
      const pass = formData.get('pass');
      if (pass) {
        updatePasswordCallback(pass as string);
        parentDiv.style.display = 'none';
      }
    }
  }

  /**
   * Applies security measures to the password input field to prevent unauthorized access.
   *
   * @param {HTMLInputElement} inputField - The password input field.
   */
  private _securityMeasures(inputField: HTMLInputElement): void {
    inputField.oncopy = (e: ClipboardEvent) => e.preventDefault();
    inputField.onpaste = (e: ClipboardEvent) => e.preventDefault();
    inputField.ondragstart = (e: DragEvent) => e.preventDefault();
    inputField.oncontextmenu = (e: MouseEvent) => e.preventDefault();
    inputField.autocomplete = 'off';
  }

  /**
   * Creates the password input form.
   *
   * @param {HTMLDivElement} parentDiv - The parent div for the form.
   * @param {(pass: string) => void} updatePasswordCallback - Callback function for handling password input.
   * @returns {[HTMLFormElement, HTMLInputElement, HTMLLabelElement]} The form, input field, and label elements.
   */
  private _createForm(parentDiv: HTMLDivElement, updatePasswordCallback: (pass: string) => void): [HTMLFormElement, HTMLInputElement, HTMLLabelElement] {
    const form = document.createElement('form');

    const inputField = document.createElement('input');
    inputField.setAttribute('id', 'password');
    inputField.setAttribute('type', 'password');
    inputField.setAttribute('name', 'pass');

    const label = document.createElement('label');
    label.setAttribute('for', 'password');
    label.textContent = 'Enter password: ';

    const inputSubmit = document.createElement('input');
    inputSubmit.setAttribute('type', 'submit');
    inputSubmit.setAttribute('value', 'Submit');

    this._securityMeasures(inputField);
    form.onsubmit = (e: SubmitEvent) => this._onFormSumbit(e, updatePasswordCallback, parentDiv);

    form.append(label, inputField, inputSubmit);
    return [form, inputField, label];
  }

  /**
   * Creates the password input element and appends it to the container.
   *
   * @param {(pass: string) => void} updatePasswordCallback - Callback function for handling password input.
   * @returns {[HTMLDivElement, HTMLInputElement, HTMLLabelElement]} The div container, input field, and label elements.
   */
  private _createElement(updatePasswordCallback: (pass: string) => void): [HTMLDivElement, HTMLInputElement, HTMLLabelElement] {
    const div = document.createElement('div');
    div.classList.add('a-password-viewer');
    const [form, inputField, label] = this._createForm(div, updatePasswordCallback);
    div.append(form);
    return [div, inputField, label];
  }

  /**
   * Renders the password input UI within the specified parent container.
   *
   * @param {HTMLElement} parentContainer - The parent container where the password input is displayed.
   * @param {(pass: string) => void} updatePasswordCallback - Callback function for handling password input.
   * @returns {[HTMLInputElement, HTMLLabelElement]} The input field and label elements.
   */
  private _view(parentContainer: HTMLElement, updatePasswordCallback: (pass: string) => void): [HTMLInputElement, HTMLLabelElement] {
    const [div, inputField, label] = this._createElement(updatePasswordCallback);
    parentContainer.prepend(div);
    return [inputField, label];
  }

  /**
   * Destroys the password input UI, removing it from the DOM.
   */
  public destroy(): void {
    if (this._inpField) {
      const parentContainer = this._inpField.parentElement?.parentElement;
      if (parentContainer) {
        parentContainer.remove();
      }
    }
  }
}

export default PasswordManager;
