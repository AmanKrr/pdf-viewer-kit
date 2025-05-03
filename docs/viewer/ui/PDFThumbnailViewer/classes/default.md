[**pdf-kit v1.5.0**](../../../../README.md)

***

[pdf-kit](../../../../modules.md) / [viewer/ui/PDFThumbnailViewer](../README.md) / default

# Class: default

Defined in: viewer/ui/PDFThumbnailViewer.ts:25

Manages the creation, rendering, and interaction of PDF thumbnails in the sidebar.

## Constructors

### Constructor

> **new default**(`options`): `ThumbnailViewer`

Defined in: viewer/ui/PDFThumbnailViewer.ts:37

Constructs a `ThumbnailViewer` instance.

#### Parameters

##### options

`PDFThumbnailViewOptions`

Configuration options for the thumbnail.

#### Returns

`ThumbnailViewer`

## Properties

### \_canvas

> `private` **\_canvas**: `null` \| `HTMLCanvasElement` = `null`

Defined in: viewer/ui/PDFThumbnailViewer.ts:30

***

### \_container

> `private` **\_container**: `HTMLElement`

Defined in: viewer/ui/PDFThumbnailViewer.ts:26

***

### \_linkService

> `private` **\_linkService**: `null` \| [`PDFLinkService`](../../../services/LinkService/classes/PDFLinkService.md)

Defined in: viewer/ui/PDFThumbnailViewer.ts:29

***

### \_pageNumber

> `private` **\_pageNumber**: `number`

Defined in: viewer/ui/PDFThumbnailViewer.ts:28

***

### \_pdfDocument

> `private` **\_pdfDocument**: `PDFDocumentProxy`

Defined in: viewer/ui/PDFThumbnailViewer.ts:27

## Accessors

### activeThumbnail

#### Set Signature

> **set** **activeThumbnail**(`pageNumber`): `void`

Defined in: viewer/ui/PDFThumbnailViewer.ts:96

Sets the active thumbnail and navigates to the corresponding page in the PDF viewer.

##### Parameters

###### pageNumber

`number`

The page number to be set as active.

##### Returns

`void`

***

### totalPages

#### Get Signature

> **get** **totalPages**(): `number`

Defined in: viewer/ui/PDFThumbnailViewer.ts:75

Retrieves the total number of pages in the PDF document.

##### Returns

`number`

The total number of pages.

## Methods

### \_renderThumbnail()

> `private` **\_renderThumbnail**(`thumbnailDiv`): `Promise`\<`void`\>

Defined in: viewer/ui/PDFThumbnailViewer.ts:118

Renders the thumbnail image for the corresponding PDF page.

#### Parameters

##### thumbnailDiv

`HTMLElement`

The container for the thumbnail.

#### Returns

`Promise`\<`void`\>

***

### \_thumbnailDestination()

> `private` **\_thumbnailDestination**(`thumbnailDiv`, `pageNumber?`): `void`

Defined in: viewer/ui/PDFThumbnailViewer.ts:173

Navigates to the corresponding page when a thumbnail is clicked.

#### Parameters

##### thumbnailDiv

`HTMLElement`

The clicked thumbnail element.

##### pageNumber?

`number` = `-1`

The page number to navigate to.

#### Returns

`void`

***

### destroy()

> **destroy**(): `void`

Defined in: viewer/ui/PDFThumbnailViewer.ts:199

Cleans up resources and removes the canvas to free memory.

#### Returns

`void`

***

### initThumbnail()

> **initThumbnail**(): `Promise`\<`void`\>

Defined in: viewer/ui/PDFThumbnailViewer.ts:82

Initializes and renders the thumbnail for the current page.

#### Returns

`Promise`\<`void`\>

***

### createThumbnailContainer()

> `static` **createThumbnailContainer**(`parentContainerId`): `undefined` \| `HTMLElement`

Defined in: viewer/ui/PDFThumbnailViewer.ts:51

Creates the thumbnail sidebar container and attaches it to the PDF viewer.

#### Parameters

##### parentContainerId

`string`

The ID of the parent PDF viewer container.

#### Returns

`undefined` \| `HTMLElement`

The created inner thumbnail container.
