[**pdf-kit v1.5.0**](../../../../README.md)

***

[pdf-kit](../../../../modules.md) / [viewer/annotations/RectangleAnnotation](../README.md) / RectangleAnnotation

# Class: RectangleAnnotation

Defined in: viewer/annotations/RectangleAnnotation.ts:27

Rectangle annotation supporting interactive drawing, programmatic creation,
selection, deletion, and automatic zoom synchronization.

## Extends

- [`Annotation`](../../Annotation/classes/Annotation.md)

## Constructors

### Constructor

> **new RectangleAnnotation**(`container`, `pdfState`, `fillColor`, `strokeColor`, `strokeWidth`, `strokeStyle`, `opacity`, `id?`): `RectangleAnnotation`

Defined in: viewer/annotations/RectangleAnnotation.ts:63

#### Parameters

##### container

`HTMLElement`

Host element for the annotation SVG

##### pdfState

[`default`](../../../ui/PDFState/classes/default.md)

Viewer state, emits 'scaleChange' events

##### fillColor

`string`

SVG fill color

##### strokeColor

`string`

SVG stroke color

##### strokeWidth

`number`

Stroke width in CSS pixels

##### strokeStyle

`string`

'solid' | 'dashed' | 'dotted'

##### opacity

`number`

Opacity for rectangle

##### id?

`string`

Optional annotation ID

#### Returns

`RectangleAnnotation`

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

> `private` **\_bindOnScaleChange**: (`event`) => `void`

Defined in: viewer/annotations/RectangleAnnotation.ts:43

#### Parameters

##### event

`any`

#### Returns

`void`

***

### \_constraints

> `private` **\_constraints**: `DOMRect`

Defined in: viewer/annotations/RectangleAnnotation.ts:40

***

### \_fillColor

> `private` **\_fillColor**: `string`

Defined in: viewer/annotations/RectangleAnnotation.ts:28

***

### \_onDeleteKeyBound()

> `private` **\_onDeleteKeyBound**: (`event`) => `void`

Defined in: viewer/annotations/RectangleAnnotation.ts:42

Handles Delete or Backspace key to delete the annotation.

#### Parameters

##### event

`KeyboardEvent`

#### Returns

`void`

***

### \_opacity

> `private` **\_opacity**: `number`

Defined in: viewer/annotations/RectangleAnnotation.ts:32

***

### \_originalHeight

> `private` **\_originalHeight**: `number` = `0`

Defined in: viewer/annotations/RectangleAnnotation.ts:37

***

### \_originalLeft

> `private` **\_originalLeft**: `number` = `0`

Defined in: viewer/annotations/RectangleAnnotation.ts:34

***

### \_originalTop

> `private` **\_originalTop**: `number` = `0`

Defined in: viewer/annotations/RectangleAnnotation.ts:35

***

### \_originalWidth

> `private` **\_originalWidth**: `number` = `0`

Defined in: viewer/annotations/RectangleAnnotation.ts:36

***

### \_pageNumber?

> `private` `optional` **\_pageNumber**: `number`

Defined in: viewer/annotations/RectangleAnnotation.ts:39

***

### \_pdfState

> `private` **\_pdfState**: [`default`](../../../ui/PDFState/classes/default.md)

Defined in: viewer/annotations/RectangleAnnotation.ts:41

***

### \_resizer

> `private` **\_resizer**: `null` \| [`Resizer`](../../Resizer/classes/Resizer.md) = `null`

Defined in: viewer/annotations/RectangleAnnotation.ts:33

***

### \_shapeInfo

> `private` **\_shapeInfo**: `null` \| `RectangleConfig` = `null`

Defined in: viewer/annotations/RectangleAnnotation.ts:38

***

### \_strokeColor

> `private` **\_strokeColor**: `string`

Defined in: viewer/annotations/RectangleAnnotation.ts:29

***

### \_strokeStyle

> `private` **\_strokeStyle**: `string`

Defined in: viewer/annotations/RectangleAnnotation.ts:31

***

### \_strokeWidth

> `private` **\_strokeWidth**: `number`

Defined in: viewer/annotations/RectangleAnnotation.ts:30

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

> `readonly` **type**: `"rectangle"` = `'rectangle'`

Defined in: viewer/annotations/RectangleAnnotation.ts:51

Discriminator for serialization.

#### Overrides

[`Annotation`](../../Annotation/classes/Annotation.md).[`type`](../../Annotation/classes/Annotation.md#type)

## Accessors

### id

#### Get Signature

> **get** **id**(): `string`

Defined in: viewer/annotations/RectangleAnnotation.ts:46

Unique identifier of this annotation.

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

### \_addDeleteEvent()

> `private` **\_addDeleteEvent**(): `void`

Defined in: viewer/annotations/RectangleAnnotation.ts:260

Adds keyboard listener for Delete/Backspace.

#### Returns

`void`

***

### \_createSvgRect()

> `private` **\_createSvgRect**(`padding`, `height`, `width`): `void`

Defined in: viewer/annotations/RectangleAnnotation.ts:227

Creates the visible <rect> and an invisible hit-test <rect> inside the SVG.

#### Parameters

##### padding

`string` = `'0'`

Optional x/y offset inside the SVG

##### height

`number` = `0`

Rectangle height

##### width

`number` = `0`

Rectangle width

#### Returns

`void`

***

### \_getCoordinates()

> `private` **\_getCoordinates**(): `object`

Defined in: viewer/annotations/RectangleAnnotation.ts:334

Computes current un-scaled coordinates from the SVG element.

#### Returns

`object`

##### x0

> **x0**: `number`

##### x1

> **x1**: `number`

##### y0

> **y0**: `number`

##### y1

> **y1**: `number`

***

### \_getLogicalCoordinates()

> `private` **\_getLogicalCoordinates**(): `object`

Defined in: viewer/annotations/RectangleAnnotation.ts:344

Computes logical (un-scaled) coordinates, preferring captured originals.

#### Returns

`object`

##### x0

> **x0**: `number`

##### x1

> **x1**: `number`

##### y0

> **y0**: `number`

##### y1

> **y1**: `number`

***

### \_getStrokeDashArray()

> `private` **\_getStrokeDashArray**(): `string`

Defined in: viewer/annotations/RectangleAnnotation.ts:327

Returns stroke-dasharray string corresponding to the stroke style.

#### Returns

`string`

***

### \_maintainOriginalBounding()

> `private` **\_maintainOriginalBounding**(`zoomLevel`): `void`

Defined in: viewer/annotations/RectangleAnnotation.ts:279

Captures current un-scaled position and size for zoom adjustments.

#### Parameters

##### zoomLevel

`number` = `0`

#### Returns

`void`

***

### \_onDeleteKey()

> `private` **\_onDeleteKey**(`event`): `void`

Defined in: viewer/annotations/RectangleAnnotation.ts:272

Handles Delete or Backspace key to delete the annotation.

#### Parameters

##### event

`KeyboardEvent`

#### Returns

`void`

***

### \_onScaleChange()

> `private` **\_onScaleChange**(`event`): `void`

Defined in: viewer/annotations/RectangleAnnotation.ts:76

#### Parameters

##### event

`any`

#### Returns

`void`

***

### \_onShapeUpdate()

> `private` **\_onShapeUpdate**(): `void`

Defined in: viewer/annotations/RectangleAnnotation.ts:380

Emits ANNOTATION_CREATED after geometry changes.

#### Returns

`void`

***

### \_removeDeleteEvent()

> `private` **\_removeDeleteEvent**(): `void`

Defined in: viewer/annotations/RectangleAnnotation.ts:265

Removes keyboard listener for Delete/Backspace.

#### Returns

`void`

***

### \_setRectInfo()

> `private` **\_setRectInfo**(): `void`

Defined in: viewer/annotations/RectangleAnnotation.ts:361

Updates internal shape info for serialization or events.

#### Returns

`void`

***

### \_updateZoom()

> `private` **\_updateZoom**(`zoomFactor`): `void`

Defined in: viewer/annotations/RectangleAnnotation.ts:291

Re-applies scaled position and size based on captured original values.

#### Parameters

##### zoomFactor

`number`

Current viewer scale

#### Returns

`void`

***

### deleteAnnotation()

> **deleteAnnotation**(`suppressEvent`): `void`

Defined in: viewer/annotations/RectangleAnnotation.ts:183

Deletes this annotation from the DOM.

#### Parameters

##### suppressEvent

`boolean` = `false`

If true, skips ANNOTATION_DELETED emission

#### Returns

`void`

#### Overrides

[`Annotation`](../../Annotation/classes/Annotation.md).[`deleteAnnotation`](../../Annotation/classes/Annotation.md#deleteannotation)

***

### deselect()

> **deselect**(): `void`

Defined in: viewer/annotations/RectangleAnnotation.ts:171

Deselects this annotation, removing resizers and keyboard handler.

#### Returns

`void`

#### Overrides

[`Annotation`](../../Annotation/classes/Annotation.md).[`deselect`](../../Annotation/classes/Annotation.md#deselect)

***

### draw()

> **draw**(`x0`, `x1`, `y0`, `y1`, `pageNumber`): `void`

Defined in: viewer/annotations/RectangleAnnotation.ts:89

Programmatically draws a rectangle without user interaction.

#### Parameters

##### x0

`number`

X-coordinate of top-left corner

##### x1

`number`

Width of the rectangle

##### y0

`number`

Y-coordinate of top-left corner

##### y1

`number`

Height of the rectangle

##### pageNumber

`number`

PDF page index

#### Returns

`void`

***

### getConfig()

> **getConfig**(): `Partial`\<`RectangleConfig`\>

Defined in: viewer/annotations/RectangleAnnotation.ts:217

Returns a serializable snapshot of this annotation.

#### Returns

`Partial`\<`RectangleConfig`\>

#### Overrides

[`Annotation`](../../Annotation/classes/Annotation.md).[`getConfig`](../../Annotation/classes/Annotation.md#getconfig)

***

### revokeSelection()

> **revokeSelection**(): `void`

Defined in: viewer/annotations/RectangleAnnotation.ts:200

Cancels pointer cursor and click handler on the hit-test rectangle.

#### Returns

`void`

***

### scrollToView()

> **scrollToView**(): `void`

Defined in: viewer/annotations/RectangleAnnotation.ts:210

Scrolls the annotation into view (centered in viewport).

#### Returns

`void`

#### Overrides

[`Annotation`](../../Annotation/classes/Annotation.md).[`scrollToView`](../../Annotation/classes/Annotation.md#scrolltoview)

***

### select()

> **select**(): `void`

Defined in: viewer/annotations/RectangleAnnotation.ts:160

Selects this annotation, adding resizers and Delete/Backspace handler.

#### Returns

`void`

#### Overrides

[`Annotation`](../../Annotation/classes/Annotation.md).[`select`](../../Annotation/classes/Annotation.md#select)

***

### startDrawing()

> **startDrawing**(`x`, `y`, `pageNumber`): `void`

Defined in: viewer/annotations/RectangleAnnotation.ts:107

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

#### Overrides

[`Annotation`](../../Annotation/classes/Annotation.md).[`startDrawing`](../../Annotation/classes/Annotation.md#startdrawing)

***

### stopDrawing()

> **stopDrawing**(`opts`): `void`

Defined in: viewer/annotations/RectangleAnnotation.ts:149

Ends interactive drawing, caches geometry, and optionally selects
or emits an update event.

#### Parameters

##### opts

###### select?

`boolean`

Auto-select after drawing

###### shapeUpdate?

`boolean`

Emit ANNOTATION_CREATED event

#### Returns

`void`

#### Overrides

[`Annotation`](../../Annotation/classes/Annotation.md).[`stopDrawing`](../../Annotation/classes/Annotation.md#stopdrawing)

***

### updateDrawing()

> **updateDrawing**(`x`, `y`): `void`

Defined in: viewer/annotations/RectangleAnnotation.ts:116

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

#### Overrides

[`Annotation`](../../Annotation/classes/Annotation.md).[`updateDrawing`](../../Annotation/classes/Annotation.md#updatedrawing)
