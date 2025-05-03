[**pdf-kit v1.5.0**](../../../../README.md)

***

[pdf-kit](../../../../modules.md) / [viewer/manager/PDFPasswordManager](../README.md) / default

# Class: default

Defined in: viewer/manager/PDFPasswordManager.ts:20

Manages password input and validation for protected PDF documents.

## Constructors

### Constructor

> **new default**(`parentContainer`, `updatePasswordCallback`): `PasswordManager`

Defined in: viewer/manager/PDFPasswordManager.ts:30

Constructs a `PasswordManager` instance.

#### Parameters

##### parentContainer

`HTMLElement`

The parent container where the password form will be rendered.

##### updatePasswordCallback

(`pass`) => `void`

Callback function to update the entered password.

#### Returns

`PasswordManager`

## Properties

### \_inpField

> `private` `readonly` **\_inpField**: `HTMLInputElement`

Defined in: viewer/manager/PDFPasswordManager.ts:21

***

### \_inpLabel

> `private` `readonly` **\_inpLabel**: `HTMLLabelElement`

Defined in: viewer/manager/PDFPasswordManager.ts:22

## Accessors

### onError

#### Set Signature

> **set** **onError**(`errorMessage`): `void`

Defined in: viewer/manager/PDFPasswordManager.ts:43

Displays an error message when an incorrect password is entered.

##### Parameters

###### errorMessage

`string`

The error message to display.

##### Returns

`void`

## Methods

### \_createElement()

> `private` **\_createElement**(`updatePasswordCallback`): \[`HTMLDivElement`, `HTMLInputElement`, `HTMLLabelElement`\]

Defined in: viewer/manager/PDFPasswordManager.ts:140

Creates the password input element and appends it to the container.

#### Parameters

##### updatePasswordCallback

(`pass`) => `void`

Callback function for handling password input.

#### Returns

\[`HTMLDivElement`, `HTMLInputElement`, `HTMLLabelElement`\]

The div container, input field, and label elements.

***

### \_createForm()

> `private` **\_createForm**(`parentDiv`, `updatePasswordCallback`): \[`HTMLFormElement`, `HTMLInputElement`, `HTMLLabelElement`\]

Defined in: viewer/manager/PDFPasswordManager.ts:111

Creates the password input form.

#### Parameters

##### parentDiv

`HTMLDivElement`

The parent div for the form.

##### updatePasswordCallback

(`pass`) => `void`

Callback function for handling password input.

#### Returns

\[`HTMLFormElement`, `HTMLInputElement`, `HTMLLabelElement`\]

The form, input field, and label elements.

***

### \_hashPassword()

> `private` **\_hashPassword**(`password`): `Promise`\<`string`\>

Defined in: viewer/manager/PDFPasswordManager.ts:60

Hashes a given password using SHA-256 for security purposes.

#### Parameters

##### password

`string`

The password to hash.

#### Returns

`Promise`\<`string`\>

The base64-encoded SHA-256 hash of the password.

***

### \_onFormSumbit()

> `private` **\_onFormSumbit**(`event`, `updatePasswordCallback`, `parentDiv`): `void`

Defined in: viewer/manager/PDFPasswordManager.ts:74

Handles the form submission event.

#### Parameters

##### event

`SubmitEvent`

The form submission event.

##### updatePasswordCallback

(`pass`) => `void`

The callback function for handling the password submission.

##### parentDiv

`HTMLDivElement`

The parent div of the password form.

#### Returns

`void`

***

### \_securityMeasures()

> `private` **\_securityMeasures**(`inputField`): `void`

Defined in: viewer/manager/PDFPasswordManager.ts:96

Applies security measures to the password input field to prevent unauthorized access.

#### Parameters

##### inputField

`HTMLInputElement`

The password input field.

#### Returns

`void`

***

### \_view()

> `private` **\_view**(`parentContainer`, `updatePasswordCallback`): \[`HTMLInputElement`, `HTMLLabelElement`\]

Defined in: viewer/manager/PDFPasswordManager.ts:155

Renders the password input UI within the specified parent container.

#### Parameters

##### parentContainer

`HTMLElement`

The parent container where the password input is displayed.

##### updatePasswordCallback

(`pass`) => `void`

Callback function for handling password input.

#### Returns

\[`HTMLInputElement`, `HTMLLabelElement`\]

The input field and label elements.

***

### destroy()

> **destroy**(): `void`

Defined in: viewer/manager/PDFPasswordManager.ts:164

Destroys the password input UI, removing it from the DOM.

#### Returns

`void`
