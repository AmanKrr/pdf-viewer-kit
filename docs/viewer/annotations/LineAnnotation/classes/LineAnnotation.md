[**pdf-kit v1.5.0**](../../../../README.md)

***

[pdf-kit](../../../../modules.md) / [viewer/annotations/LineAnnotation](../README.md) / LineAnnotation

# Class: LineAnnotation

Defined in: viewer/annotations/LineAnnotation.ts:28

Annotation that renders and manages a line (<line> SVG element) on the PDF.
Supports both programmatic drawing and interactive mouse‐driven drawing,
selection, deletion, zoom rescaling, and hit‐testing.

## Extends

- [`Annotation`](../../Annotation/classes/Annotation.md)

## Constructors

### Constructor

> **new LineAnnotation**(`container`, `pdfState`, `strokeColor`, `strokeWidth`, `strokeStyle`, `opacity`, `id?`): `LineAnnotation`

Defined in: viewer/annotations/LineAnnotation.ts:62

#### Parameters

##### container

`HTMLElement`

HTML element into which the annotation SVG is inserted

##### pdfState

[`default`](../../../ui/PDFState/classes/default.md)

Shared PdfState, emits 'scaleChange' events

##### strokeColor

`string`

CSS color for the visible line stroke

##### strokeWidth

`number`

Width (in CSS px) of the visible line stroke

##### strokeStyle

`string`

'solid' | 'dashed' | 'dotted'

##### opacity

`number`

Opacity for line

##### id?

`string`

Optional annotation ID

#### Returns

`LineAnnotation`

#### Overrides

[`Annotation`](../../Annotation/classes/Annotation.md).[`constructor`](../../Annotation/classes/Annotation.md#constructor)

## Properties

### \_\_annotationDrawerContainer

> `protected` **\_\_annotationDrawerContainer**: `HTMLElement`

Defined in: viewer/annotations/Annotation.ts:29

#### Inherited from

[`Annotation`](../../Annotation/classes/Annotation.md).[`__annotationDrawerContainer`](../../Annotation/classes/Annotation.md#__annotationdrawercontainer)

***

### \_\_element

> `protected` **\_\_element**: `null` \| `SVGElement` = `null`

Defined in: viewer/annotations/Annotation.ts:31

#### Inherited from

[`Annotation`](../../Annotation/classes/Annotation.md).[`__element`](../../Annotation/classes/Annotation.md#__element)

***

### \_\_hitElementRect

> `protected` **\_\_hitElementRect**: `null` \| `SVGElement` = `null`

Defined in: viewer/annotations/Annotation.ts:32

#### Inherited from

[`Annotation`](../../Annotation/classes/Annotation.md).[`__hitElementRect`](../../Annotation/classes/Annotation.md#__hitelementrect)

***

### \_\_pdfState

> `protected` **\_\_pdfState**: `null` \| [`default`](../../../ui/PDFState/classes/default.md) = `null`

Defined in: viewer/annotations/Annotation.ts:37

#### Inherited from

[`Annotation`](../../Annotation/classes/Annotation.md).[`__pdfState`](../../Annotation/classes/Annotation.md#__pdfstate)

***

### \_\_startX

> `protected` **\_\_startX**: `number` = `0`

Defined in: viewer/annotations/Annotation.ts:35

#### Inherited from

[`Annotation`](../../Annotation/classes/Annotation.md).[`__startX`](../../Annotation/classes/Annotation.md#__startx)

***

### \_\_startY

> `protected` **\_\_startY**: `number` = `0`

Defined in: viewer/annotations/Annotation.ts:36

#### Inherited from

[`Annotation`](../../Annotation/classes/Annotation.md).[`__startY`](../../Annotation/classes/Annotation.md#__starty)

***

### \_\_svg

> `protected` **\_\_svg**: `SVGSVGElement`

Defined in: viewer/annotations/Annotation.ts:30

#### Inherited from

[`Annotation`](../../Annotation/classes/Annotation.md).[`__svg`](../../Annotation/classes/Annotation.md#__svg)

***

### \_bindOnScaleChange()

> `private` **\_bindOnScaleChange**: (`_`) => `void`

Defined in: viewer/annotations/LineAnnotation.ts:51

Responds to PdfState scaleChange: update constraints and rescale.

#### Parameters

##### \_

`any`

Ignored event payload

#### Returns

`void`

***

### \_constraints

> `private` **\_constraints**: `DOMRect`

Defined in: viewer/annotations/LineAnnotation.ts:42

***

### \_onDeleteKeyBound()

> `private` **\_onDeleteKeyBound**: (`e`) => `void`

Defined in: viewer/annotations/LineAnnotation.ts:50

Handle Delete/Backspace key to remove annotation.

#### Parameters

##### e

`KeyboardEvent`

#### Returns

`void`

***

### \_opacity

> `private` **\_opacity**: `number`

Defined in: viewer/annotations/LineAnnotation.ts:37

***

### \_origX1

> `private` **\_origX1**: `number` = `0`

Defined in: viewer/annotations/LineAnnotation.ts:43

***

### \_origX2

> `private` **\_origX2**: `number` = `0`

Defined in: viewer/annotations/LineAnnotation.ts:45

***

### \_origY1

> `private` **\_origY1**: `number` = `0`

Defined in: viewer/annotations/LineAnnotation.ts:44

***

### \_origY2

> `private` **\_origY2**: `number` = `0`

Defined in: viewer/annotations/LineAnnotation.ts:46

***

### \_pageNumber?

> `private` `optional` **\_pageNumber**: `number`

Defined in: viewer/annotations/LineAnnotation.ts:48

***

### \_pdfState

> `private` **\_pdfState**: [`default`](../../../ui/PDFState/classes/default.md)

Defined in: viewer/annotations/LineAnnotation.ts:49

***

### \_resizer

> `private` **\_resizer**: `null` \| [`Resizer`](../../Resizer/classes/Resizer.md) = `null`

Defined in: viewer/annotations/LineAnnotation.ts:41

***

### \_shapeInfo

> `private` **\_shapeInfo**: `null` \| `LineConfig` = `null`

Defined in: viewer/annotations/LineAnnotation.ts:47

***

### \_strokeColor

> `private` **\_strokeColor**: `string`

Defined in: viewer/annotations/LineAnnotation.ts:38

***

### \_strokeStyle

> `private` **\_strokeStyle**: `string`

Defined in: viewer/annotations/LineAnnotation.ts:40

***

### \_strokeWidth

> `private` **\_strokeWidth**: `number`

Defined in: viewer/annotations/LineAnnotation.ts:39

***

### annotationId

> `readonly` **annotationId**: `string`

Defined in: viewer/annotations/Annotation.ts:26

Unique identifier for the annotation.

#### Inherited from

[`Annotation`](../../Annotation/classes/Annotation.md).[`annotationId`](../../Annotation/classes/Annotation.md#annotationid)

***

### isDrawing

> **isDrawing**: `boolean` = `false`

Defined in: viewer/annotations/Annotation.ts:33

True while the user is actively drawing this annotation.

#### Inherited from

[`Annotation`](../../Annotation/classes/Annotation.md).[`isDrawing`](../../Annotation/classes/Annotation.md#isdrawing)

***

### type

> `readonly` **type**: `"line"` = `'line'`

Defined in: viewer/annotations/LineAnnotation.ts:30

Discriminator used when serializing annotations.

#### Overrides

[`Annotation`](../../Annotation/classes/Annotation.md).[`type`](../../Annotation/classes/Annotation.md#type)

## Accessors

### id

#### Get Signature

> **get** **id**(): `string`

Defined in: viewer/annotations/LineAnnotation.ts:33

Unique identifier, inherited from Annotation.

##### Returns

`string`

## Methods

### \_\_generateUniqueId()

> `protected` **\_\_generateUniqueId**(): `string`

Defined in: viewer/annotations/Annotation.ts:141

Generates a unique ID for the annotation.

#### Returns

`string`

A unique string ID.

#### Inherited from

[`Annotation`](../../Annotation/classes/Annotation.md).[`__generateUniqueId`](../../Annotation/classes/Annotation.md#__generateuniqueid)

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

#### Inherited from

[`Annotation`](../../Annotation/classes/Annotation.md).[`__onAnnotationClick`](../../Annotation/classes/Annotation.md#__onannotationclick)

***

### \_captureOriginal()

> `private` **\_captureOriginal**(): `void`

Defined in: viewer/annotations/LineAnnotation.ts:282

Capture logical (unscaled) endpoints for later zoom updates.

#### Returns

`void`

***

### \_logicalCoords()

> `private` **\_logicalCoords**(): `object`

Defined in: viewer/annotations/LineAnnotation.ts:338

Compute logical (unscaled) endpoints by combining SVG container
position and in-SVG line coordinates.

#### Returns

`object`

##### x1

> **x1**: `number`

##### x2

> **x2**: `number`

##### y1

> **y1**: `number`

##### y2

> **y2**: `number`

***

### \_onDeleteKey()

> `private` **\_onDeleteKey**(`e`): `void`

Defined in: viewer/annotations/LineAnnotation.ts:275

Handle Delete/Backspace key to remove annotation.

#### Parameters

##### e

`KeyboardEvent`

#### Returns

`void`

***

### \_onScaleChange()

> `private` **\_onScaleChange**(`_`): `void`

Defined in: viewer/annotations/LineAnnotation.ts:77

Responds to PdfState scaleChange: update constraints and rescale.

#### Parameters

##### \_

`any`

Ignored event payload

#### Returns

`void`

***

### \_onShapeUpdate()

> `private` **\_onShapeUpdate**(): `void`

Defined in: viewer/annotations/LineAnnotation.ts:381

Called after any resize or drag to emit creation/update event.

#### Returns

`void`

***

### \_setLineInfo()

> `private` **\_setLineInfo**(): `void`

Defined in: viewer/annotations/LineAnnotation.ts:363

Populate `_shapeInfo` from logical endpoints and style.

#### Returns

`void`

***

### \_updateZoom()

> `private` **\_updateZoom**(`scale`): `void`

Defined in: viewer/annotations/LineAnnotation.ts:294

Recompute SVG position, size, and line endpoints for new zoom level.

#### Parameters

##### scale

`number`

Current PdfState.scale value

#### Returns

`void`

***

### createSvgLine()

> `private` **createSvgLine**(`x1`, `y1`, `x2`, `y2`): `void`

Defined in: viewer/annotations/LineAnnotation.ts:235

Create both the visible <line> and an invisible, thicker hit‐test <line>.

#### Parameters

##### x1

`number` = `0`

First endpoint X inside SVG

##### y1

`number` = `0`

First endpoint Y inside SVG

##### x2

`number` = `0`

Second endpoint X inside SVG

##### y2

`number` = `0`

Second endpoint Y inside SVG

#### Returns

`void`

***

### deleteAnnotation()

> **deleteAnnotation**(`suppressEvent`): `void`

Defined in: viewer/annotations/LineAnnotation.ts:202

Delete this annotation from DOM and emit deletion event.

#### Parameters

##### suppressEvent

`boolean` = `false`

If true, skip ANNOTATION_DELETED

#### Returns

`void`

#### Overrides

[`Annotation`](../../Annotation/classes/Annotation.md).[`deleteAnnotation`](../../Annotation/classes/Annotation.md#deleteannotation)

***

### deselect()

> **deselect**(): `void`

Defined in: viewer/annotations/LineAnnotation.ts:190

Deselect this annotation, removing handles and delete‐key listener.

#### Returns

`void`

#### Overrides

[`Annotation`](../../Annotation/classes/Annotation.md).[`deselect`](../../Annotation/classes/Annotation.md#deselect)

***

### draw()

> **draw**(`x1`, `y1`, `x2`, `y2`, `pageNumber`): `void`

Defined in: viewer/annotations/LineAnnotation.ts:90

Draw a line programmatically using absolute page coordinates.

#### Parameters

##### x1

`number`

Page‐space X of the first endpoint

##### y1

`number`

Page‐space Y of the first endpoint

##### x2

`number`

Page‐space X of the second endpoint

##### y2

`number`

Page‐space Y of the second endpoint

##### pageNumber

`number`

Index of the PDF page

#### Returns

`void`

***

### getConfig()

> **getConfig**(): `Partial`\<`LineConfig`\>

Defined in: viewer/annotations/LineAnnotation.ts:224

Return current annotation config for serialization or events.

#### Returns

`Partial`\<`LineConfig`\>

#### Overrides

[`Annotation`](../../Annotation/classes/Annotation.md).[`getConfig`](../../Annotation/classes/Annotation.md#getconfig)

***

### revokeSelection()

> **revokeSelection**(): `void`

Defined in: viewer/annotations/LineAnnotation.ts:211

Restore default cursor on hit‐test line.

#### Returns

`void`

***

### scrollToView()

> **scrollToView**(): `void`

Defined in: viewer/annotations/LineAnnotation.ts:219

Scroll annotation into center of view.

#### Returns

`void`

#### Overrides

[`Annotation`](../../Annotation/classes/Annotation.md).[`scrollToView`](../../Annotation/classes/Annotation.md#scrolltoview)

***

### select()

> **select**(): `void`

Defined in: viewer/annotations/LineAnnotation.ts:179

Select this annotation, adding resize handles and delete‐key listener.

#### Returns

`void`

#### Overrides

[`Annotation`](../../Annotation/classes/Annotation.md).[`select`](../../Annotation/classes/Annotation.md#select)

***

### startDrawing()

> **startDrawing**(`x`, `y`, `pageNumber`): `void`

Defined in: viewer/annotations/LineAnnotation.ts:117

Begin interactive drawing at the given page‐space point.

#### Parameters

##### x

`number`

X coordinate relative to container

##### y

`number`

Y coordinate relative to container

##### pageNumber

`number`

Index of the PDF page

#### Returns

`void`

#### Overrides

[`Annotation`](../../Annotation/classes/Annotation.md).[`startDrawing`](../../Annotation/classes/Annotation.md#startdrawing)

***

### stopDrawing()

> **stopDrawing**(`opts`): `void`

Defined in: viewer/annotations/LineAnnotation.ts:168

Finish interactive drawing, optionally select and emit event.

#### Parameters

##### opts

###### select

`boolean` = `true`

Automatically select the shape

###### shapeUpdate

`boolean` = `true`

Emit ANNOTATION_CREATED event

#### Returns

`void`

#### Overrides

[`Annotation`](../../Annotation/classes/Annotation.md).[`stopDrawing`](../../Annotation/classes/Annotation.md#stopdrawing)

***

### updateDrawing()

> **updateDrawing**(`x`, `y`): `void`

Defined in: viewer/annotations/LineAnnotation.ts:130

Update the interactive drawing as the pointer moves.

#### Parameters

##### x

`number`

X coordinate relative to container

##### y

`number`

Y coordinate relative to container

#### Returns

`void`

#### Overrides

[`Annotation`](../../Annotation/classes/Annotation.md).[`updateDrawing`](../../Annotation/classes/Annotation.md#updatedrawing)
