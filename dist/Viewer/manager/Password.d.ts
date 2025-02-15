/**
 * Manages password input and validation for protected PDF documents.
 */
declare class PasswordManager {
    private readonly inpField;
    private readonly inpLabel;
    /**
     * Constructs a `PasswordManager` instance.
     *
     * @param {HTMLElement} parentContainer - The parent container where the password form will be rendered.
     * @param {(pass: string) => void} updatePasswordCallback - Callback function to update the entered password.
     */
    constructor(parentContainer: HTMLElement, updatePasswordCallback: (pass: string) => void);
    /**
     * Displays an error message when an incorrect password is entered.
     *
     * @param {string} errorMessage - The error message to display.
     */
    set onError(errorMessage: string);
    /**
     * Hashes a given password using SHA-256 for security purposes.
     *
     * @param {string} password - The password to hash.
     * @returns {Promise<string>} The base64-encoded SHA-256 hash of the password.
     */
    private hashPassword;
    /**
     * Handles the form submission event.
     *
     * @param {SubmitEvent} event - The form submission event.
     * @param {(pass: string) => void} updatePasswordCallback - The callback function for handling the password submission.
     * @param {HTMLDivElement} parentDiv - The parent div of the password form.
     */
    private onFormSumbit;
    /**
     * Applies security measures to the password input field to prevent unauthorized access.
     *
     * @param {HTMLInputElement} inputField - The password input field.
     */
    private securityMeasures;
    /**
     * Creates the password input form.
     *
     * @param {HTMLDivElement} parentDiv - The parent div for the form.
     * @param {(pass: string) => void} updatePasswordCallback - Callback function for handling password input.
     * @returns {[HTMLFormElement, HTMLInputElement, HTMLLabelElement]} The form, input field, and label elements.
     */
    private createForm;
    /**
     * Creates the password input element and appends it to the container.
     *
     * @param {(pass: string) => void} updatePasswordCallback - Callback function for handling password input.
     * @returns {[HTMLDivElement, HTMLInputElement, HTMLLabelElement]} The div container, input field, and label elements.
     */
    private createElement;
    /**
     * Renders the password input UI within the specified parent container.
     *
     * @param {HTMLElement} parentContainer - The parent container where the password input is displayed.
     * @param {(pass: string) => void} updatePasswordCallback - Callback function for handling password input.
     * @returns {[HTMLInputElement, HTMLLabelElement]} The input field and label elements.
     */
    private view;
    /**
     * Destroys the password input UI, removing it from the DOM.
     */
    destroy(): void;
}
export default PasswordManager;
