[**pdf-kit v1.5.0**](../../../../README.md)

***

[pdf-kit](../../../../modules.md) / [viewer/services/LinkService](../README.md) / PDFLinkService

# Class: PDFLinkService

Defined in: viewer/services/LinkService.tsx:52

Handles navigation and linking within a PDF document.
Allows interaction with internal and external links, providing methods for controlled navigation.

## Constructors

### Constructor

> **new PDFLinkService**(`options`): `PDFLinkService`

Defined in: viewer/services/LinkService.tsx:65

Constructs the `PDFLinkService` instance.

#### Parameters

##### options

`PDFLinkServiceOptions`

Configuration options for the link service.

#### Returns

`PDFLinkService`

## Properties

### \_pdfDocument

> `private` **\_pdfDocument**: `undefined` \| `PDFDocumentProxy`

Defined in: viewer/services/LinkService.tsx:56

***

### \_pdfState

> `private` **\_pdfState**: `null` \| [`default`](../../../ui/PDFState/classes/default.md)

Defined in: viewer/services/LinkService.tsx:58

***

### \_pdfViewer

> `private` **\_pdfViewer**: [`default`](../../../ui/WebViewer/classes/default.md)

Defined in: viewer/services/LinkService.tsx:57

***

### externalLinkEnabled

> **externalLinkEnabled**: `boolean` = `true`

Defined in: viewer/services/LinkService.tsx:54

Indicates whether external links should be enabled. Defaults to `true`.

## Accessors

### currentPageNumber

#### Get Signature

> **get** **currentPageNumber**(): `number`

Defined in: viewer/services/LinkService.tsx:76

Retrieves the current page number being viewed.

##### Returns

`number`

The currently active page number, or `-1` if the viewer is not initialized.

## Methods

### goToPage()

> **goToPage**(`pageNumber`): `void`

Defined in: viewer/services/LinkService.tsx:89

Navigates to a specific page in the PDF viewer.

#### Parameters

##### pageNumber

`number`

The target page number to navigate to.

#### Returns

`void`
