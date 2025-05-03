[**pdf-kit v1.5.0**](../../../../README.md)

***

[pdf-kit](../../../../modules.md) / [viewer/services/AnnotationExportService](../README.md) / PdfExportService

# Class: PdfExportService

Defined in: viewer/services/AnnotationExportService.ts:77

Service to export a PDF with embedded annotations.
Uses pdf-lib to draw shapes onto a fresh copy of the original PDF.

## Constructors

### Constructor

> **new PdfExportService**(): `PdfExportService`

#### Returns

`PdfExportService`

## Methods

### \_cssPxToPt()

> `private` **\_cssPxToPt**(`px`, `dpi`): `number`

Defined in: viewer/services/AnnotationExportService.ts:161

Convert a value in CSS pixels to PDF points (1/72 in).

#### Parameters

##### px

`number`

Value in CSS px.

##### dpi

`number` = `96`

Screen resolution, default 96 dpi.

#### Returns

`number`

Value in PDF points.

***

### buildAnnotatedPdf()

> **buildAnnotatedPdf**(`originalBytes`, `annotations`, `viewports`): `Promise`\<`Uint8Array`\<`ArrayBufferLike`\>\>

Defined in: viewer/services/AnnotationExportService.ts:86

Embeds annotations into a copy of the source PDF.

#### Parameters

##### originalBytes

`ArrayBuffer`

Raw bytes of the source PDF.

##### annotations

[`ShapeAnno`](../type-aliases/ShapeAnno.md)[]

Array of annotations to draw.

##### viewports

`Map`\<`number`, `PageViewport`\>

Map from page number to its PDF.js viewport (at annotation scale).

#### Returns

`Promise`\<`Uint8Array`\<`ArrayBufferLike`\>\>

Uint8Array of the annotated PDF.

***

### \_hexToRgb()

> `private` `static` **\_hexToRgb**(`hex`): \[`number`, `number`, `number`\]

Defined in: viewer/services/AnnotationExportService.ts:203

Parse a hex color string "#RRGGBB" (or shorthand "#RGB") into an rgb tuple [r,g,b] in [0,1].
Logs errors and returns red [1,0,0] on invalid input.

#### Parameters

##### hex

`string`

Hex color string.

#### Returns

\[`number`, `number`, `number`\]

[r, g, b] each in 0–1 range.

***

### \_toPdfPoint()

> `private` `static` **\_toPdfPoint**(`vp`, `x`, `y`): `any`[]

Defined in: viewer/services/AnnotationExportService.ts:174

Convert a CSS‐space point to PDF user‐space point.
Handles rotation and scaling via the viewport.

#### Parameters

##### vp

`PageViewport`

PDF.js PageViewport at annotation scale.

##### x

`number`

CSS‐pixel X relative to viewport top-left.

##### y

`number`

CSS‐pixel Y relative to viewport top-left.

#### Returns

`any`[]

Tuple [pdfX, pdfY] in PDF user‐space coords.

***

### \_toPdfRect()

> `private` `static` **\_toPdfRect**(`vp`, `rect`): `object`

Defined in: viewer/services/AnnotationExportService.ts:186

Convert a CSS‐space rectangle to PDF user‐space rectangle.
Ensures origin at bottom‐left in PDF coordinates.

#### Parameters

##### vp

`PageViewport`

PDF.js PageViewport at annotation scale.

##### rect

Rectangle {x, y, width, height} in CSS px.

###### height

`number`

###### width

`number`

###### x

`number`

###### y

`number`

#### Returns

`object`

Rectangle {x, y, width, height} in PDF points.

##### height

> **height**: `number`

##### width

> **width**: `number`

##### x

> **x**: `number`

##### y

> **y**: `number`
