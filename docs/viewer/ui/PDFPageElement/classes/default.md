[**pdf-kit v1.5.0**](../../../../README.md)

***

[pdf-kit](../../../../modules.md) / [viewer/ui/PDFPageElement](../README.md) / default

# Class: default

Defined in: viewer/ui/PDFPageElement.ts:23

A utility class for managing and creating various elements related to rendering PDF pages in a viewer.

## Extended by

- [`default`](../../PDFAnnotationLayer/classes/default.md)
- [`default`](../../PDFTextLayer/classes/default.md)

## Constructors

### Constructor

> **new default**(): `PageElement`

#### Returns

`PageElement`

## Properties

### gap

> `static` **gap**: `number` = `15`

Defined in: viewer/ui/PDFPageElement.ts:25

The gap between consecutive pages in the viewer.

## Methods

### containerCreation()

> `static` **containerCreation**(`containerId`, `scale`): `object`

Defined in: viewer/ui/PDFPageElement.ts:82

Creates the main container elements required for the PDF viewer.

#### Parameters

##### containerId

`string`

The ID of the parent container where the viewer will be appended.

##### scale

`number`

The scale factor to be applied to the viewer.

#### Returns

`object`

An object containing references to the created container elements.

##### injectElementId

> **injectElementId**: `string` = `PDF_VIEWER_IDS.MAIN_PAGE_VIEWER_CONTAINER`

##### parent

> **parent**: `HTMLDivElement` = `pdfParentViewer`

***

### createCanvas()

> `static` **createCanvas**(`viewport`): \[`HTMLCanvasElement`, `CanvasRenderingContext2D`\]

Defined in: viewer/ui/PDFPageElement.ts:58

Creates a `<canvas>` element for rendering a PDF page.

#### Parameters

##### viewport

`PageViewport`

The viewport object representing the page dimensions.

#### Returns

\[`HTMLCanvasElement`, `CanvasRenderingContext2D`\]

A tuple containing the created canvas and its rendering context.

***

### createLayers()

> `static` **createLayers**(`classNames`, `ids`, `viewport`): `HTMLDivElement`

Defined in: viewer/ui/PDFPageElement.ts:142

Creates layer elements (e.g., text, annotation layers) for a PDF page.

#### Parameters

##### classNames

`string`

The class names to be assigned to the layer.

##### ids

`string`

The ID to be assigned to the layer.

##### viewport

`PageViewport`

The viewport object representing the page dimensions.

#### Returns

`HTMLDivElement`

The created layer `<div>` element.

***

### createPageContainerDiv()

> `static` **createPageContainerDiv**(`pageNumber`, `viewport`, `pagePositionInfo`): `HTMLDivElement`

Defined in: viewer/ui/PDFPageElement.ts:35

Creates a container `<div>` element for a PDF page.

#### Parameters

##### pageNumber

`number`

The page number to create a container for.

##### viewport

`PageViewport`

The viewport object representing the page dimensions.

##### pagePositionInfo

`Map`\<`number`, `number`\>

A map storing page positions.

#### Returns

`HTMLDivElement`

The created page container element.
