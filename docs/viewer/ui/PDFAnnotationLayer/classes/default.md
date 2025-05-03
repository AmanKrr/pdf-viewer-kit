[**pdf-kit v1.5.0**](../../../../README.md)

***

[pdf-kit](../../../../modules.md) / [viewer/ui/PDFAnnotationLayer](../README.md) / default

# Class: default

Defined in: viewer/ui/PDFAnnotationLayer.ts:8

A utility class for managing and creating various elements related to rendering PDF pages in a viewer.

## Extends

- [`default`](../../PDFPageElement/classes/default.md)

## Constructors

### Constructor

> **new default**(`pageWrapper`, `page`, `viewport`): `AnnotationLayer`

Defined in: viewer/ui/PDFAnnotationLayer.ts:13

#### Parameters

##### pageWrapper

`HTMLElement`

##### page

`PDFPageProxy`

##### viewport

`PageViewport`

#### Returns

`AnnotationLayer`

#### Overrides

[`default`](../../PDFPageElement/classes/default.md).[`constructor`](../../PDFPageElement/classes/default.md#constructor)

## Properties

### \_page

> `private` **\_page**: `PDFPageProxy`

Defined in: viewer/ui/PDFAnnotationLayer.ts:10

***

### \_pageWrapper

> `private` **\_pageWrapper**: `HTMLElement`

Defined in: viewer/ui/PDFAnnotationLayer.ts:9

***

### \_viewport

> `private` **\_viewport**: `PageViewport`

Defined in: viewer/ui/PDFAnnotationLayer.ts:11

***

### gap

> `static` **gap**: `number` = `15`

Defined in: viewer/ui/PDFPageElement.ts:25

The gap between consecutive pages in the viewer.

#### Inherited from

[`default`](../../PDFPageElement/classes/default.md).[`gap`](../../PDFPageElement/classes/default.md#gap)

## Methods

### createAnnotationLayer()

> **createAnnotationLayer**(`webViewer`, `pdfDocument`): `Promise`\<`HTMLDivElement`\>

Defined in: viewer/ui/PDFAnnotationLayer.ts:20

#### Parameters

##### webViewer

[`default`](../../WebViewer/classes/default.md)

##### pdfDocument

`PDFDocumentProxy`

#### Returns

`Promise`\<`HTMLDivElement`\>

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
