[**pdf-kit v1.5.0**](../../../../README.md)

***

[pdf-kit](../../../../modules.md) / [viewer/services/AnnotationExportService](../README.md) / ShapeAnnoBase

# Interface: ShapeAnnoBase

Defined in: viewer/services/AnnotationExportService.ts:24

Base properties for any shape annotation.

## Extended by

- [`RectangleAnno`](RectangleAnno.md)
- [`EllipseAnno`](EllipseAnno.md)
- [`LineAnno`](LineAnno.md)

## Properties

### fill?

> `optional` **fill**: `string`

Defined in: viewer/services/AnnotationExportService.ts:30

Optional fill color in "#RRGGBB" format

***

### opacity?

> `optional` **opacity**: `number`

Defined in: viewer/services/AnnotationExportService.ts:34

Optional opacity [0–1]

***

### page

> **page**: `number`

Defined in: viewer/services/AnnotationExportService.ts:26

1-based page number

***

### stroke

> **stroke**: `string`

Defined in: viewer/services/AnnotationExportService.ts:28

Stroke color in "#RRGGBB" format

***

### strokeWidth

> **strokeWidth**: `number`

Defined in: viewer/services/AnnotationExportService.ts:32

Stroke width in CSS pixels (at creation zoom)
