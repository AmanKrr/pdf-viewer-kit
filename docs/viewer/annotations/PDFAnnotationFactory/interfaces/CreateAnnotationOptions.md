[**pdf-kit v1.5.0**](../../../../README.md)

***

[pdf-kit](../../../../modules.md) / [viewer/annotations/PDFAnnotationFactory](../README.md) / CreateAnnotationOptions

# Interface: CreateAnnotationOptions

Defined in: viewer/annotations/PDFAnnotationFactory.ts:27

Options for creating a new annotation via AnnotationFactory.

## Properties

### annotationDrawerContainer

> **annotationDrawerContainer**: `HTMLElement`

Defined in: viewer/annotations/PDFAnnotationFactory.ts:31

Container element into which the annotation SVG will be inserted

***

### fillColor

> **fillColor**: `string`

Defined in: viewer/annotations/PDFAnnotationFactory.ts:35

Fill color for shapes (CSS color string)

***

### id?

> `optional` **id**: `string`

Defined in: viewer/annotations/PDFAnnotationFactory.ts:45

Optional ID to assign to the annotation

***

### opacity

> **opacity**: `number`

Defined in: viewer/annotations/PDFAnnotationFactory.ts:41

Opacity of the annotation (0–1)

***

### pdfState

> **pdfState**: [`default`](../../../ui/PDFState/classes/default.md)

Defined in: viewer/annotations/PDFAnnotationFactory.ts:33

Shared PdfState instance for scale and event handling

***

### strokeColor

> **strokeColor**: `string`

Defined in: viewer/annotations/PDFAnnotationFactory.ts:37

Stroke color for shapes (CSS color string)

***

### strokeStyle

> **strokeStyle**: `string`

Defined in: viewer/annotations/PDFAnnotationFactory.ts:43

Stroke style: 'solid' | 'dashed' | 'dotted'

***

### strokeWidth

> **strokeWidth**: `number`

Defined in: viewer/annotations/PDFAnnotationFactory.ts:39

Stroke width in CSS pixels

***

### type

> **type**: `ShapeType`

Defined in: viewer/annotations/PDFAnnotationFactory.ts:29

The shape type to create ('rectangle', 'ellipse', or 'line')
