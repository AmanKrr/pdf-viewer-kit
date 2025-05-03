[**pdf-kit v1.5.0**](../../../../README.md)

***

[pdf-kit](../../../../modules.md) / [viewer/ui/PDFTextLayer](../README.md) / default

# Class: default

Defined in: viewer/ui/PDFTextLayer.ts:25

Manages the creation and rendering of a text layer for a specific page in the PDF viewer.
The text layer overlays text content extracted from the PDF, enabling text selection and interactions.

## Extends

- [`default`](../../PDFPageElement/classes/default.md)

## Constructors

### Constructor

> **new default**(`pageWrapper`, `page`, `viewport`): `TextLayer`

Defined in: viewer/ui/PDFTextLayer.ts:38

Constructs a `TextLayer` instance for a given PDF page.

#### Parameters

##### pageWrapper

`HTMLElement`

The HTML element wrapping the current PDF page.

##### page

`PDFPageProxy`

The PDF.js page proxy object representing the current page.

##### viewport

`PageViewport`

The viewport defining the dimensions and scale of the text layer.

#### Returns

`TextLayer`

#### Overrides

[`default`](../../PDFPageElement/classes/default.md).[`constructor`](../../PDFPageElement/classes/default.md#constructor)

## Properties

### \_page

> `private` **\_page**: `PDFPageProxy`

Defined in: viewer/ui/PDFTextLayer.ts:27

***

### \_pageWrapper

> `private` **\_pageWrapper**: `HTMLElement`

Defined in: viewer/ui/PDFTextLayer.ts:26

***

### \_viewport

> `private` **\_viewport**: `PageViewport`

Defined in: viewer/ui/PDFTextLayer.ts:28

***

### gap

> `static` **gap**: `number` = `15`

Defined in: viewer/ui/PDFPageElement.ts:25

The gap between consecutive pages in the viewer.

#### Inherited from

[`default`](../../PDFPageElement/classes/default.md).[`gap`](../../PDFPageElement/classes/default.md#gap)

## Methods

### \_wrapTextLayerIntoPTag()

> `private` **\_wrapTextLayerIntoPTag**(): `void`

Defined in: viewer/ui/PDFTextLayer.ts:103

#### Returns

`void`

***

### createTextLayer()

> **createTextLayer**(): `Promise`\<`HTMLDivElement`[]\>

Defined in: viewer/ui/PDFTextLayer.ts:56

Creates and renders the text layer for the current PDF page.

This method:
- Retrieves text content from the PDF page.
- Creates a text layer `<div>` with appropriate styles and dimensions.
- Uses PDF.js's `TextLayer` class to render the extracted text into the layer.
- Assigns a click handler to each text element for future interactions.

#### Returns

`Promise`\<`HTMLDivElement`[]\>

A promise that resolves to the created text layer `<div>`.

***

### keyDown()

> `private` **keyDown**(`event`): `void`

Defined in: viewer/ui/PDFTextLayer.ts:127

#### Parameters

##### event

`KeyboardEvent`

#### Returns

`void`

***

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

#### Inherited from

[`default`](../../PDFPageElement/classes/default.md).[`containerCreation`](../../PDFPageElement/classes/default.md#containercreation)

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

#### Inherited from

[`default`](../../PDFPageElement/classes/default.md).[`createCanvas`](../../PDFPageElement/classes/default.md#createcanvas)

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

#### Inherited from

[`default`](../../PDFPageElement/classes/default.md).[`createLayers`](../../PDFPageElement/classes/default.md#createlayers)

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

#### Inherited from

[`default`](../../PDFPageElement/classes/default.md).[`createPageContainerDiv`](../../PDFPageElement/classes/default.md#createpagecontainerdiv)
