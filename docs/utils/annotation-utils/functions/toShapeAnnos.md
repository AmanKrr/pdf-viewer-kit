[**pdf-kit v1.5.0**](../../../README.md)

***

[pdf-kit](../../../modules.md) / [utils/annotation-utils](../README.md) / toShapeAnnos

# Function: toShapeAnnos()

> **toShapeAnnos**(`configs`, `scale`): [`ShapeAnno`](../../../viewer/services/AnnotationExportService/type-aliases/ShapeAnno.md)[]

Defined in: [utils/annotation-utils.ts:29](https://github.com/AmanKrr/pdf-kit/blob/643d0632fa36ecc0aadec82bd84cd2b2b2eefb0e/src/utils/annotation-utils.ts#L29)

Convert an array of shape configurations into ShapeAnno objects
scaled to CSS pixels.

## Parameters

### configs

(`RectangleConfig` \| `EllipseConfig` \| `LineConfig`)[]

Array of RectangleConfig, EllipseConfig, or LineConfig

### scale

`number`

Current zoom scale factor

## Returns

[`ShapeAnno`](../../../viewer/services/AnnotationExportService/type-aliases/ShapeAnno.md)[]

Array of ShapeAnno for export
