[**pdf-kit v1.5.0**](../../../README.md)

***

[pdf-kit](../../../modules.md) / [interface/IAnnotation](../README.md) / IAnnotation

# Interface: IAnnotation

Defined in: [interface/IAnnotation.ts:4](https://github.com/AmanKrr/pdf-kit/blob/643d0632fa36ecc0aadec82bd84cd2b2b2eefb0e/src/interface/IAnnotation.ts#L4)

Represents a drawable annotation (shape) in the PDF viewer.

## Properties

### annotationId

> `readonly` **annotationId**: `string`

Defined in: [interface/IAnnotation.ts:6](https://github.com/AmanKrr/pdf-kit/blob/643d0632fa36ecc0aadec82bd84cd2b2b2eefb0e/src/interface/IAnnotation.ts#L6)

Unique identifier for the annotation.

***

### isDrawing

> `readonly` **isDrawing**: `boolean`

Defined in: [interface/IAnnotation.ts:12](https://github.com/AmanKrr/pdf-kit/blob/643d0632fa36ecc0aadec82bd84cd2b2b2eefb0e/src/interface/IAnnotation.ts#L12)

True while the user is actively drawing this annotation.

***

### type

> `readonly` **type**: `string`

Defined in: [interface/IAnnotation.ts:9](https://github.com/AmanKrr/pdf-kit/blob/643d0632fa36ecc0aadec82bd84cd2b2b2eefb0e/src/interface/IAnnotation.ts#L9)

Shape type, e.g. 'rectangle', 'ellipse', 'line'.

## Methods

### deleteAnnotation()

> **deleteAnnotation**(`suppressEvent`): `void`

Defined in: [interface/IAnnotation.ts:50](https://github.com/AmanKrr/pdf-kit/blob/643d0632fa36ecc0aadec82bd84cd2b2b2eefb0e/src/interface/IAnnotation.ts#L50)

Remove the annotation from the DOM and clean up.

#### Parameters

##### suppressEvent

`boolean`

If true, do not emit a delete event.

#### Returns

`void`

***

### deselect()

> **deselect**(): `void`

Defined in: [interface/IAnnotation.ts:43](https://github.com/AmanKrr/pdf-kit/blob/643d0632fa36ecc0aadec82bd84cd2b2b2eefb0e/src/interface/IAnnotation.ts#L43)

Hide selection UI.

#### Returns

`void`

***

### getConfig()

> **getConfig**(): `Record`\<`string`, `any`\>

Defined in: [interface/IAnnotation.ts:57](https://github.com/AmanKrr/pdf-kit/blob/643d0632fa36ecc0aadec82bd84cd2b2b2eefb0e/src/interface/IAnnotation.ts#L57)

Retrieve the annotation's configuration for saving or re-creation.

#### Returns

`Record`\<`string`, `any`\>

A plain object describing the annotation geometry and style.

***

### scrollToView()?

> `optional` **scrollToView**(): `void`

Defined in: [interface/IAnnotation.ts:62](https://github.com/AmanKrr/pdf-kit/blob/643d0632fa36ecc0aadec82bd84cd2b2b2eefb0e/src/interface/IAnnotation.ts#L62)

Optional: Scroll the annotation into view (e.g., after programmatic creation).

#### Returns

`void`

***

### select()

> **select**(): `void`

Defined in: [interface/IAnnotation.ts:40](https://github.com/AmanKrr/pdf-kit/blob/643d0632fa36ecc0aadec82bd84cd2b2b2eefb0e/src/interface/IAnnotation.ts#L40)

Show selection UI (handles, outline, etc.).

#### Returns

`void`

***

### setId()?

> `optional` **setId**(): `void`

Defined in: [interface/IAnnotation.ts:67](https://github.com/AmanKrr/pdf-kit/blob/643d0632fa36ecc0aadec82bd84cd2b2b2eefb0e/src/interface/IAnnotation.ts#L67)

Optional: Assign or update the annotation's ID.

#### Returns

`void`

***

### startDrawing()

> **startDrawing**(`x`, `y`, `pageNumber`): `void`

Defined in: [interface/IAnnotation.ts:21](https://github.com/AmanKrr/pdf-kit/blob/643d0632fa36ecc0aadec82bd84cd2b2b2eefb0e/src/interface/IAnnotation.ts#L21)

Begin drawing the annotation.

#### Parameters

##### x

`number`

The x-coordinate where drawing starts (relative to the container).

##### y

`number`

The y-coordinate where drawing starts.

##### pageNumber

`number`

The PDF page number on which this annotation is being drawn.

#### Returns

`void`

***

### stopDrawing()

> **stopDrawing**(`opts?`): `void`

Defined in: [interface/IAnnotation.ts:37](https://github.com/AmanKrr/pdf-kit/blob/643d0632fa36ecc0aadec82bd84cd2b2b2eefb0e/src/interface/IAnnotation.ts#L37)

Complete the drawing operation.

#### Parameters

##### opts?

###### select?

`boolean`

If true, select the annotation after drawing.

###### shapeUpdate?

`boolean`

If true, emit a shape‐update event.

#### Returns

`void`

***

### updateDrawing()

> **updateDrawing**(`x`, `y`): `void`

Defined in: [interface/IAnnotation.ts:29](https://github.com/AmanKrr/pdf-kit/blob/643d0632fa36ecc0aadec82bd84cd2b2b2eefb0e/src/interface/IAnnotation.ts#L29)

Update the annotation's geometry as the pointer moves.

#### Parameters

##### x

`number`

Current x-coordinate of the pointer.

##### y

`number`

Current y-coordinate of the pointer.

#### Returns

`void`
