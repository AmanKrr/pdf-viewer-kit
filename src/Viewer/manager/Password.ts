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

class PasswordManager {
  private readonly inpField: HTMLInputElement;
  private readonly inpLabel: HTMLLabelElement;

  constructor(parentContainer: HTMLElement, updatePasswordCallback: (pass: string) => void) {
    const [inpField, inpLabel] = this.view(parentContainer, updatePasswordCallback);
    this.inpField = inpField as HTMLInputElement;
    this.inpLabel = inpLabel as HTMLLabelElement;
    // Prevent prototype tampering
    Object.freeze(PasswordManager.prototype);
  }

  set onError(errorMessage: string) {
    if (this.inpField && this.inpLabel) {
      this.inpLabel.textContent = errorMessage;
      this.inpField.focus();
      const parentDiv = this.inpField.parentElement?.parentElement;
      if (parentDiv) {
        parentDiv.removeAttribute('style');
      }
    }
  }

  private async hashPassword(password: string) {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    return btoa(String.fromCharCode(...new Uint8Array(hashBuffer)));
  }

  private onFormSumbit(event: SubmitEvent, updatePasswordCallback: (pass: string) => void, parentDiv: HTMLDivElement) {
    event.preventDefault();
    event.stopPropagation();

    console.log('submit event', event);
    if (event.target) {
      const formData = new FormData(event.target as HTMLFormElement);
      if (this.inpField) {
        this.inpField.value = '';
      }
      const pass = formData.get('pass');
      if (pass) {
        updatePasswordCallback(pass as string);
        parentDiv.style.display = 'none';
      }
    }
  }

  private securityMeasures(inputField: HTMLInputElement) {
    // secure input field
    inputField.oncopy = (e: ClipboardEvent) => e.preventDefault();
    inputField.onpaste = (e: ClipboardEvent) => e.preventDefault();
    inputField.ondragstart = (e: DragEvent) => e.preventDefault();
    inputField.oncontextmenu = (e: MouseEvent) => e.preventDefault();
    inputField.autocomplete = 'off';
  }

  private createForm(parentDiv: HTMLDivElement, updatePasswordCallback: (pass: string) => void) {
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
    inputSubmit.setAttribute('value', 'Sumbit');

    this.securityMeasures(inputField);
    form.onsubmit = (e: SubmitEvent) => this.onFormSumbit(e, updatePasswordCallback, parentDiv);

    form.append(label);
    form.append(inputField);
    form.append(inputSubmit);

    return [form, inputField, label];
  }

  private createElement(updatePasswordCallback: (pass: string) => void) {
    const div = document.createElement('div');
    div.classList.add('a-password-viewer');
    const [form, inputField, label] = this.createForm(div, updatePasswordCallback);
    div.append(form);
    return [div, inputField, label];
  }

  private view(parentContainer: HTMLElement, updatePasswordCallback: (pass: string) => void) {
    const [div, inputField, label] = this.createElement(updatePasswordCallback);
    parentContainer.prepend(div);
    return [inputField, label];
  }

  public destroy() {
    if (this.inpField) {
      const parentContainer = this.inpField.parentElement?.parentElement;
      if (parentContainer) {
        parentContainer.remove();
      }
    }
  }
}

export default PasswordManager;
