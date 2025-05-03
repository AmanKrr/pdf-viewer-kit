[**pdf-kit v1.5.0**](../../../../README.md)

***

[pdf-kit](../../../../modules.md) / [viewer/annotations/EllipseAnnotation](../README.md) / EllipseAnnotation

# Class: EllipseAnnotation

Defined in: viewer/annotations/EllipseAnnotation.ts:27

An SVG ellipse annotation. Supports interactive drawing, programmatic creation,
selection, deletion, and automatic zoom updates from PdfState.

## Extends

- [`Annotation`](../../Annotation/classes/Annotation.md)

## Constructors

### Constructor

> **new EllipseAnnotation**(`container`, `pdfState`, `fillColor`, `strokeColor`, `strokeWidth`, `strokeStyle`, `opacity`, `id?`): `EllipseAnnotation`

Defined in: viewer/annotations/EllipseAnnotation.ts:62

#### Parameters

##### container

`HTMLElement`

Element into which the SVG will be injected

##### pdfState

[`default`](../../../ui/PDFState/classes/default.md)

Viewer state that emits scaleChange events

##### fillColor

`string`

SVG fill color

##### strokeColor

`string`

SVG stroke color

##### strokeWidth

`number`

Stroke width in px

##### strokeStyle

`string`

One of "solid" | "dashed" | "dotted"

##### opacity

`number`

##### id?

`string`

Optional identifier

#### Returns

`EllipseAnnotation`

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

Defined in: viewer/annotations/EllipseAnnotation.ts:51

#### Parameters

##### event

`any`

#### Returns

`void`

***

### \_constraints

> `private` **\_constraints**: `DOMRect`

Defined in: viewer/annotations/EllipseAnnotation.ts:42

***

### \_fillColor

> `private` **\_fillColor**: `string`

Defined in: viewer/annotations/EllipseAnnotation.ts:36

***

### \_onDeleteKeyBound()

> `private` **\_onDeleteKeyBound**: (`e`) => `void`

Defined in: viewer/annotations/EllipseAnnotation.ts:50

Handles Delete/Backspace key to remove the annotation.

#### Parameters

##### e

`KeyboardEvent`

Keyboard event

#### Returns

`void`

***

### \_opacity

> `private` **\_opacity**: `number`

Defined in: viewer/annotations/EllipseAnnotation.ts:40

***

### \_origCX

> `private` **\_origCX**: `number` = `0`

Defined in: viewer/annotations/EllipseAnnotation.ts:43

***

### \_origCY

> `private` **\_origCY**: `number` = `0`

Defined in: viewer/annotations/EllipseAnnotation.ts:44

***

### \_origRX

> `private` **\_origRX**: `number` = `0`

Defined in: viewer/annotations/EllipseAnnotation.ts:45

***

### \_origRY

> `private` **\_origRY**: `number` = `0`

Defined in: viewer/annotations/EllipseAnnotation.ts:46

***

### \_pageNumber?

> `private` `optional` **\_pageNumber**: `number`

Defined in: viewer/annotations/EllipseAnnotation.ts:48

***

### \_pdfState

> `private` **\_pdfState**: [`default`](../../../ui/PDFState/classes/default.md)

Defined in: viewer/annotations/EllipseAnnotation.ts:49

***

### \_resizer

> `private` **\_resizer**: `null` \| [`Resizer`](../../Resizer/classes/Resizer.md) = `null`

Defined in: viewer/annotations/EllipseAnnotation.ts:41

***

### \_shapeInfo

> `private` **\_shapeInfo**: `null` \| `EllipseConfig` = `null`

Defined in: viewer/annotations/EllipseAnnotation.ts:47

***

### \_strokeColor

> `private` **\_strokeColor**: `string`

Defined in: viewer/annotations/EllipseAnnotation.ts:37

***

### \_strokeStyle

> `private` **\_strokeStyle**: `string`

Defined in: viewer/annotations/EllipseAnnotation.ts:39

***

### \_strokeWidth

> `private` **\_strokeWidth**: `number`

Defined in: viewer/annotations/EllipseAnnotation.ts:38

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

> `readonly` **type**: `"ellipse"` = `'ellipse'`

Defined in: viewer/annotations/EllipseAnnotation.ts:29

Discriminator for serialization.

#### Overrides

[`Annotation`](../../Annotation/classes/Annotation.md).[`type`](../../Annotation/classes/Annotation.md#type)

## Accessors

### id

#### Get Signature

> **get** **id**(): `string`

Defined in: viewer/annotations/EllipseAnnotation.ts:32

Alias for `annotationId`.

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

> `private` **\_captureOriginal**(`scale`): `void`

Defined in: viewer/annotations/EllipseAnnotation.ts:256

Stores logical geometry for zoom recalculation.

#### Parameters

##### scale

`number` = `0`

Current scale factor

#### Returns

`void`

***

### \_getStrokeDashArray()

> `private` **\_getStrokeDashArray**(): `string`

Defined in: viewer/annotations/EllipseAnnotation.ts:303

Returns the SVG `stroke-dasharray` based on style.

#### Returns

`string`

***

### \_logicalCoords()

> `private` **\_logicalCoords**(): `object`

Defined in: viewer/annotations/EllipseAnnotation.ts:310

Computes current logical coordinates from SVG position and size.

#### Returns

`object`

##### cx

> **cx**: `number`

##### cy

> **cy**: `number`

##### rx

> **rx**: `number`

##### ry

> **ry**: `number`

***

### \_onDeleteKey()

> `private` **\_onDeleteKey**(`e`): `void`

Defined in: viewer/annotations/EllipseAnnotation.ts:248

Handles Delete/Backspace key to remove the annotation.

#### Parameters

##### e

`KeyboardEvent`

Keyboard event

#### Returns

`void`

***

### \_onScaleChange()

> `private` **\_onScaleChange**(`event`): `void`

Defined in: viewer/annotations/EllipseAnnotation.ts:75

#### Parameters

##### event

`any`

#### Returns

`void`

***

### \_onShapeUpdate()

> `private` **\_onShapeUpdate**(): `void`

Defined in: viewer/annotations/EllipseAnnotation.ts:343

Emits an update event after shape changes.

#### Returns

`void`

***

### \_setEllipseInfo()

> `private` **\_setEllipseInfo**(): `void`

Defined in: viewer/annotations/EllipseAnnotation.ts:324

Updates `_shapeInfo` for serialization or event emission.

#### Returns

`void`

***

### \_updateZoom()

> `private` **\_updateZoom**(`scale`): `void`

Defined in: viewer/annotations/EllipseAnnotation.ts:271

Applies a new zoom level to the SVG and resizer overlay.

#### Parameters

##### scale

`number`

New scale factor

#### Returns

`void`

***

### createSvgEllipse()

> `private` **createSvgEllipse**(`cx`, `cy`, `rx`, `ry`): `void`

Defined in: viewer/annotations/EllipseAnnotation.ts:212

Creates the visible ellipse and an invisible, thicker hit-test ellipse.

#### Parameters

##### cx

`number` = `0`

##### cy

`number` = `0`

##### rx

`number` = `0`

##### ry

`number` = `0`

#### Returns

`void`

***

### deleteAnnotation()

> **deleteAnnotation**(`suppressEvent`): `void`

Defined in: viewer/annotations/EllipseAnnotation.ts:183

Deletes the annotation from DOM.

#### Parameters

##### suppressEvent

`boolean` = `false`

If true, skips emitting ANNOTATION_DELETED

#### Returns

`void`

#### Overrides

[`Annotation`](../../Annotation/classes/Annotation.md).[`deleteAnnotation`](../../Annotation/classes/Annotation.md#deleteannotation)

***

### deselect()

> **deselect**(): `void`

Defined in: viewer/annotations/EllipseAnnotation.ts:171

Removes resizers and key listener.

#### Returns

`void`

#### Overrides

[`Annotation`](../../Annotation/classes/Annotation.md).[`deselect`](../../Annotation/classes/Annotation.md#deselect)

***

### draw()

> **draw**(`cx`, `cy`, `rx`, `ry`, `pageNumber`): `void`

Defined in: viewer/annotations/EllipseAnnotation.ts:88

Programmatically draws an ellipse (no pointer events).

#### Parameters

##### cx

`number`

Logical center-x

##### cy

`number`

Logical center-y

##### rx

`number`

Logical horizontal radius

##### ry

`number`

Logical vertical radius

##### pageNumber

`number`

Page index for this annotation

#### Returns

`void`

***

### getConfig()

> **getConfig**(): `Partial`\<`EllipseConfig`\>

Defined in: viewer/annotations/EllipseAnnotation.ts:205

Retrieves the current annotation configuration.

#### Returns

`Partial`\<`EllipseConfig`\>

#### Overrides

[`Annotation`](../../Annotation/classes/Annotation.md).[`getConfig`](../../Annotation/classes/Annotation.md#getconfig)

***

### revokeSelection()

> **revokeSelection**(): `void`

Defined in: viewer/annotations/EllipseAnnotation.ts:192

Cancels the pointer cursor on the hit-test ellipse.

#### Returns

`void`

***

### scrollToView()

> **scrollToView**(): `void`

Defined in: viewer/annotations/EllipseAnnotation.ts:200

Scrolls this annotation into view (centered).

#### Returns

`void`

#### Overrides

[`Annotation`](../../Annotation/classes/Annotation.md).[`scrollToView`](../../Annotation/classes/Annotation.md#scrolltoview)

***

### select()

> **select**(): `void`

Defined in: viewer/annotations/EllipseAnnotation.ts:162

Adds resizers and listens for Delete/Backspace.

#### Returns

`void`

#### Overrides

[`Annotation`](../../Annotation/classes/Annotation.md).[`select`](../../Annotation/classes/Annotation.md#select)

***

### startDrawing()

> **startDrawing**(`x`, `y`, `pageNumber`): `void`

Defined in: viewer/annotations/EllipseAnnotation.ts:109

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

Defined in: viewer/annotations/EllipseAnnotation.ts:153

Ends drawing mode, captures geometry, and optionally selects or emits update.

#### Parameters

##### opts

###### select

`boolean` = `true`

If true, the ellipse is auto-selected

###### shapeUpdate

`boolean` = `true`

If true, fires ANNOTATION_CREATED

#### Returns

`void`

#### Overrides

[`Annotation`](../../Annotation/classes/Annotation.md).[`stopDrawing`](../../Annotation/classes/Annotation.md#stopdrawing)

***

### updateDrawing()

> **updateDrawing**(`x`, `y`): `void`

Defined in: viewer/annotations/EllipseAnnotation.ts:118

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
