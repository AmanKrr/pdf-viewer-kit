[**pdf-kit v1.5.0**](../../../README.md)

***

[pdf-kit](../../../modules.md) / [base/web-pdf-viewer](../README.md) / default

# Class: default

Defined in: [base/web-pdf-viewer.ts:42](https://github.com/AmanKrr/pdf-kit/blob/643d0632fa36ecc0aadec82bd84cd2b2b2eefb0e/src/base/web-pdf-viewer.ts#L42)

Class responsible for loading and managing PDF documents within a web viewer.
Extends functionalities from `WebViewer` and integrates PDF.js for rendering.

## Constructors

### Constructor

> **new default**(): `PdfKit`

#### Returns

`PdfKit`

## Properties

### \_loadingTasks

> `private` `static` **\_loadingTasks**: `Map`\<`string`, `any`\>

Defined in: [base/web-pdf-viewer.ts:43](https://github.com/AmanKrr/pdf-kit/blob/643d0632fa36ecc0aadec82bd84cd2b2b2eefb0e/src/base/web-pdf-viewer.ts#L43)

***

### \_viewers

> `private` `static` **\_viewers**: `Map`\<`string`, [`default`](../../../viewer/ui/WebViewer/classes/default.md)\>

Defined in: [base/web-pdf-viewer.ts:44](https://github.com/AmanKrr/pdf-kit/blob/643d0632fa36ecc0aadec82bd84cd2b2b2eefb0e/src/base/web-pdf-viewer.ts#L44)

## Methods

### load()

> `static` **load**(`options`): `Promise`\<`undefined` \| [`default`](../../../viewer/ui/WebViewer/classes/default.md)\>

Defined in: [base/web-pdf-viewer.ts:52](https://github.com/AmanKrr/pdf-kit/blob/643d0632fa36ecc0aadec82bd84cd2b2b2eefb0e/src/base/web-pdf-viewer.ts#L52)

Loads a PDF document into the web viewer.

#### Parameters

##### options

`LoadOptions`

Configuration options for loading the document.

#### Returns

`Promise`\<`undefined` \| [`default`](../../../viewer/ui/WebViewer/classes/default.md)\>

Resolves to a `WebViewer` instance upon successful load or `undefined` on failure.

***

### unload()

> `static` **unload**(`containerId`): `void`

Defined in: [base/web-pdf-viewer.ts:165](https://github.com/AmanKrr/pdf-kit/blob/643d0632fa36ecc0aadec82bd84cd2b2b2eefb0e/src/base/web-pdf-viewer.ts#L165)

Completely tears down everything for the given container:
 • stops any in-flight PDF.js loads
 • destroys the PDFDocumentProxy
 • removes UI spinners
 • unsubscribes PdfState
 • destroys the WebViewer and its sub-components
 • clears out any injected DOM

#### Parameters

##### containerId

`string`

#### Returns

`void`

***

### unloadAll()

> `static` **unloadAll**(): `void`

Defined in: [base/web-pdf-viewer.ts:189](https://github.com/AmanKrr/pdf-kit/blob/643d0632fa36ecc0aadec82bd84cd2b2b2eefb0e/src/base/web-pdf-viewer.ts#L189)

#### Returns

`void`
