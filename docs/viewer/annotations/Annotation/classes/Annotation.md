[**pdf-kit v1.5.0**](../../../../README.md)

***

[pdf-kit](../../../../modules.md) / [viewer/annotations/Annotation](../README.md) / Annotation

# Class: `abstract` Annotation

Defined in: viewer/annotations/Annotation.ts:25

Abstract base class for handling annotations in a PDF viewer.
Provides shared logic for creating an SVG container, tracking drawing state, etc.

## Extended by

- [`EllipseAnnotation`](../../EllipseAnnotation/classes/EllipseAnnotation.md)
- [`LineAnnotation`](../../LineAnnotation/classes/LineAnnotation.md)
- [`RectangleAnnotation`](../../RectangleAnnotation/classes/RectangleAnnotation.md)

## Implements

- [`IAnnotation`](../../../../interface/IAnnotation/interfaces/IAnnotation.md)

## Constructors

### Constructor

> **new Annotation**(`annotationDrawerContainer`, `pdfState`, `id?`): `Annotation`

Defined in: viewer/annotations/Annotation.ts:45

Creates a new annotation instance.

#### Parameters

##### annotationDrawerContainer

`HTMLElement`

The container where the annotation is placed.

##### pdfState

[`default`](../../../ui/PDFState/classes/default.md)

The PdfState instance to manage annotation state.

##### id?

`string`

#### Returns

`Annotation`

## Properties

### \_\_annotationDrawerContainer

> `protected` **\_\_annotationDrawerContainer**: `HTMLElement`

Defined in: viewer/annotations/Annotation.ts:29

***

### \_\_element

> `protected` **\_\_element**: `null` \| `SVGElement` = `null`

Defined in: viewer/annotations/Annotation.ts:31

***

### \_\_hitElementRect

> `protected` **\_\_hitElementRect**: `null` \| `SVGElement` = `null`

Defined in: viewer/annotations/Annotation.ts:32

***

### \_\_pdfState

> `protected` **\_\_pdfState**: `null` \| [`default`](../../../ui/PDFState/classes/default.md) = `null`

Defined in: viewer/annotations/Annotation.ts:37

***

### \_\_startX

> `protected` **\_\_startX**: `number` = `0`

Defined in: viewer/annotations/Annotation.ts:35

***

### \_\_startY

> `protected` **\_\_startY**: `number` = `0`

Defined in: viewer/annotations/Annotation.ts:36

***

### \_\_svg

> `protected` **\_\_svg**: `SVGSVGElement`

Defined in: viewer/annotations/Annotation.ts:30

***

### annotationId

> `readonly` **annotationId**: `string`

Defined in: viewer/annotations/Annotation.ts:26

Unique identifier for the annotation.

#### Implementation of

[`IAnnotation`](../../../../interface/IAnnotation/interfaces/IAnnotation.md).[`annotationId`](../../../../interface/IAnnotation/interfaces/IAnnotation.md#annotationid)

***

### isDrawing

> **isDrawing**: `boolean` = `false`

Defined in: viewer/annotations/Annotation.ts:33

True while the user is actively drawing this annotation.

#### Implementation of

[`IAnnotation`](../../../../interface/IAnnotation/interfaces/IAnnotation.md).[`isDrawing`](../../../../interface/IAnnotation/interfaces/IAnnotation.md#isdrawing)

***

### type

> `abstract` `readonly` **type**: `string`

Defined in: viewer/annotations/Annotation.ts:27

Shape type, e.g. 'rectangle', 'ellipse', 'line'.

#### Implementation of

[`IAnnotation`](../../../../interface/IAnnotation/interfaces/IAnnotation.md).[`type`](../../../../interface/IAnnotation/interfaces/IAnnotation.md#type)

## Methods

### \_\_generateUniqueId()

> `protected` **\_\_generateUniqueId**(): `string`

Defined in: viewer/annotations/Annotation.ts:141

Generates a unique ID for the annotation.

#### Returns

`string`

A unique string ID.

***

### \_\_onAnnotationClick()

> `protected` **\_\_onAnnotationClick**(`event`, `annotationData`): `void`

Defined in: viewer/annotations/Annotation.ts:130

Emits an event when the annotation is clicked, indicating it's selected.

#### Parameters

##### event

The MouseEvent triggering the click.

`null` | `MouseEvent`

##### annotationData

`Partial`\<`RectangleConfig` \| `EllipseConfig`\>

Data describing the annotation.

#### Returns

`void`

***

### deleteAnnotation()

> `abstract` **deleteAnnotation**(`suppressEvent`): `void`

Defined in: viewer/annotations/Annotation.ts:111

Removes the annotation from the DOM.

#### Parameters

##### suppressEvent

`boolean`

#### Returns

`void`

#### Implementation of

[`IAnnotation`](../../../../interface/IAnnotation/interfaces/IAnnotation.md).[`deleteAnnotation`](../../../../interface/IAnnotation/interfaces/IAnnotation.md#deleteannotation)

***

### deselect()

> `abstract` **deselect**(): `void`

Defined in: viewer/annotations/Annotation.ts:106

Deselects the annotation.

#### Returns

`void`

#### Implementation of

[`IAnnotation`](../../../../interface/IAnnotation/interfaces/IAnnotation.md).[`deselect`](../../../../interface/IAnnotation/interfaces/IAnnotation.md#deselect)

***

### getConfig()

> `abstract` **getConfig**(): `Record`\<`string`, `any`\>

Defined in: viewer/annotations/Annotation.ts:117

Returns the configuration data for the annotation.

#### Returns

`Record`\<`string`, `any`\>

A record representing the annotation configuration.

#### Implementation of

[`IAnnotation`](../../../../interface/IAnnotation/interfaces/IAnnotation.md).[`getConfig`](../../../../interface/IAnnotation/interfaces/IAnnotation.md#getconfig)

***

### scrollToView()?

> `optional` **scrollToView**(): `void`

Defined in: viewer/annotations/Annotation.ts:123

Optionally scrolls to the annotation's position in the PDF view.
This can be implemented in derived classes if needed.

#### Returns

`void`

#### Implementation of

[`IAnnotation`](../../../../interface/IAnnotation/interfaces/IAnnotation.md).[`scrollToView`](../../../../interface/IAnnotation/interfaces/IAnnotation.md#scrolltoview)

***

### select()

> `abstract` **select**(): `void`

Defined in: viewer/annotations/Annotation.ts:101

Selects the annotation.

#### Returns

`void`

#### Implementation of

[`IAnnotation`](../../../../interface/IAnnotation/interfaces/IAnnotation.md).[`select`](../../../../interface/IAnnotation/interfaces/IAnnotation.md#select)

***

### startDrawing()

> **startDrawing**(`x`, `y`, `pageNumber`): `void`

Defined in: viewer/annotations/Annotation.ts:70

Begins the drawing process for the annotation.

#### Parameters

##### x

`number`

The starting X-coordinate.

##### y

`number`

The starting Y-coordinate.

##### pageNumber

`number`

#### Returns

`void`

#### Implementation of

[`IAnnotation`](../../../../interface/IAnnotation/interfaces/IAnnotation.md).[`startDrawing`](../../../../interface/IAnnotation/interfaces/IAnnotation.md#startdrawing)

***

### stopDrawing()

> **stopDrawing**(): `void`

Defined in: viewer/annotations/Annotation.ts:86

Stops the drawing process for the annotation.

#### Returns

`void`

#### Implementation of

[`IAnnotation`](../../../../interface/IAnnotation/interfaces/IAnnotation.md).[`stopDrawing`](../../../../interface/IAnnotation/interfaces/IAnnotation.md#stopdrawing)

***

### updateDrawing()

> `abstract` **updateDrawing**(`x`, `y`): `void`

Defined in: viewer/annotations/Annotation.ts:81

Updates the drawing of the annotation as the pointer moves.

#### Parameters

##### x

`number`

The current X-coordinate.

##### y

`number`

The current Y-coordinate.

#### Returns

`void`

#### Implementation of

[`IAnnotation`](../../../../interface/IAnnotation/interfaces/IAnnotation.md).[`updateDrawing`](../../../../interface/IAnnotation/interfaces/IAnnotation.md#updatedrawing)
