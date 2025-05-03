[**pdf-kit v1.5.0**](../../../../README.md)

***

[pdf-kit](../../../../modules.md) / [viewer/manager/AnnotationManager](../README.md) / AnnotationManager

# Class: AnnotationManager

Defined in: viewer/manager/AnnotationManager.ts:27

Manages lifecycle of annotations: creation, interactive drawing,
selection, deselection, serialization, and cleanup.

## Constructors

### Constructor

> **new AnnotationManager**(`annotationDrawerContainer`, `pdfState`, `selectionManager`): `AnnotationManager`

Defined in: viewer/manager/AnnotationManager.ts:58

#### Parameters

##### annotationDrawerContainer

`HTMLElement`

The HTML container for drawing annotations

##### pdfState

[`default`](../../../ui/PDFState/classes/default.md)

Shared PdfState instance

##### selectionManager

[`SelectionManager`](../../SelectionManager/classes/SelectionManager.md)

Handles selection events

#### Returns

`AnnotationManager`

## Properties

### \_activeAnnotation

> `private` **\_activeAnnotation**: `null` \| [`IAnnotation`](../../../../interface/IAnnotation/interfaces/IAnnotation.md) = `null`

Defined in: viewer/manager/AnnotationManager.ts:32

***

### \_annotationDrawerContainer

> `private` **\_annotationDrawerContainer**: `null` \| `HTMLElement`

Defined in: viewer/manager/AnnotationManager.ts:28

***

### \_annotations

> `private` **\_annotations**: [`IAnnotation`](../../../../interface/IAnnotation/interfaces/IAnnotation.md)[] = `[]`

Defined in: viewer/manager/AnnotationManager.ts:31

***

### \_boundAnnotationSelection()

> `private` **\_boundAnnotationSelection**: (`annotationData`) => `void`

Defined in: viewer/manager/AnnotationManager.ts:51

Handle annotation selection from external events.

#### Parameters

##### annotationData

`Partial`\<`ShapeConfig`\>

The data of the selected annotation.

#### Returns

`void`

***

### \_boundInitMouseDown()

> `private` **\_boundInitMouseDown**: () => `void`

Defined in: viewer/manager/AnnotationManager.ts:50

Handler for initial mouse-down: creates the new shape instance.

#### Returns

`void`

***

### \_boundMouseDown()

> `private` **\_boundMouseDown**: (`event`) => `void`

Defined in: viewer/manager/AnnotationManager.ts:47

Handler for mouse up (stop drawing).

#### Parameters

##### event

`MouseEvent`

#### Returns

`void`

***

### \_boundMouseMove()

> `private` **\_boundMouseMove**: (`event`) => `void`

Defined in: viewer/manager/AnnotationManager.ts:48

Handler for mouse move (update drawing).

#### Parameters

##### event

`MouseEvent`

#### Returns

`void`

***

### \_boundMouseUp()

> `private` **\_boundMouseUp**: () => `void`

Defined in: viewer/manager/AnnotationManager.ts:49

Handler for mouse up (stop drawing).

#### Returns

`void`

***

### \_drawConfig

> `private` **\_drawConfig**: `DrawConfig` & `object`

Defined in: viewer/manager/AnnotationManager.ts:38

#### Type declaration

##### type

> **type**: `ShapeType`

***

### \_pdfState

> `private` **\_pdfState**: `null` \| [`default`](../../../ui/PDFState/classes/default.md) = `null`

Defined in: viewer/manager/AnnotationManager.ts:29

***

### \_selectedAnnotation

> `private` **\_selectedAnnotation**: `null` \| [`IAnnotation`](../../../../interface/IAnnotation/interfaces/IAnnotation.md) = `null`

Defined in: viewer/manager/AnnotationManager.ts:33

***

### \_selectionManager

> `private` **\_selectionManager**: [`SelectionManager`](../../SelectionManager/classes/SelectionManager.md)

Defined in: viewer/manager/AnnotationManager.ts:36

***

### \_selectionUnsubscribe()

> `private` **\_selectionUnsubscribe**: () => `void`

Defined in: viewer/manager/AnnotationManager.ts:35

#### Returns

`void`

## Accessors

### drawConfig

#### Set Signature

> **set** **drawConfig**(`config`): `void`

Defined in: viewer/manager/AnnotationManager.ts:76

Update default drawing configuration.

##### Parameters

###### config

`DrawConfig` & `object`

##### Returns

`void`

***

### getActiveAnnotation

#### Get Signature

> **get** **getActiveAnnotation**(): `null` \| [`IAnnotation`](../../../../interface/IAnnotation/interfaces/IAnnotation.md)

Defined in: viewer/manager/AnnotationManager.ts:99

Returns the currently active shape

##### Returns

`null` \| [`IAnnotation`](../../../../interface/IAnnotation/interfaces/IAnnotation.md)

***

### getAnnotations

#### Get Signature

> **get** **getAnnotations**(): [`IAnnotation`](../../../../interface/IAnnotation/interfaces/IAnnotation.md)[]

Defined in: viewer/manager/AnnotationManager.ts:92

Returns all shapes managed by this class

##### Returns

[`IAnnotation`](../../../../interface/IAnnotation/interfaces/IAnnotation.md)[]

***

### getSelectedAnnoation

#### Get Signature

> **get** **getSelectedAnnoation**(): `null` \| [`IAnnotation`](../../../../interface/IAnnotation/interfaces/IAnnotation.md)

Defined in: viewer/manager/AnnotationManager.ts:106

Returns the currently selected shape

##### Returns

`null` \| [`IAnnotation`](../../../../interface/IAnnotation/interfaces/IAnnotation.md)

***

### pdfState

#### Set Signature

> **set** **pdfState**(`pdfState`): `void`

Defined in: viewer/manager/AnnotationManager.ts:85

Update the PdfState instance used by this manager.

##### Parameters

###### pdfState

[`default`](../../../ui/PDFState/classes/default.md)

##### Returns

`void`

## Methods

### \_addListeners()

> `private` **\_addListeners**(): `void`

Defined in: viewer/manager/AnnotationManager.ts:129

Add event listeners to track drawing

#### Returns

`void`

***

### \_drawShape()

> `private` **\_drawShape**(`shapeConfig`, `revokeSelection`): `undefined` \| [`IAnnotation`](../../../../interface/IAnnotation/interfaces/IAnnotation.md)

Defined in: viewer/manager/AnnotationManager.ts:255

Internal helper to draw an existing ShapeConfig programmatically
(e.g., loading saved annotations).

#### Parameters

##### shapeConfig

`ShapeConfig`

##### revokeSelection

`boolean`

#### Returns

`undefined` \| [`IAnnotation`](../../../../interface/IAnnotation/interfaces/IAnnotation.md)

***

### \_initAnnotation()

> **\_initAnnotation**(): `void`

Defined in: viewer/manager/AnnotationManager.ts:113

Begin listening for the initial mouse-down to start a new annotation.

#### Returns

`void`

***

### \_initAnnotationCleanup()

> **\_initAnnotationCleanup**(): `void`

Defined in: viewer/manager/AnnotationManager.ts:121

Stop listening for the initial mouse-down.

#### Returns

`void`

***

### \_initMouseDown()

> `private` **\_initMouseDown**(): `void`

Defined in: viewer/manager/AnnotationManager.ts:153

Handler for initial mouse-down: creates the new shape instance.

#### Returns

`void`

***

### \_onAnnotationSelection()

> `private` **\_onAnnotationSelection**(`annotationData`): `void`

Defined in: viewer/manager/AnnotationManager.ts:358

Handle annotation selection from external events.

#### Parameters

##### annotationData

`Partial`\<`ShapeConfig`\>

The data of the selected annotation.

#### Returns

`void`

***

### \_onMouseDown()

> `private` **\_onMouseDown**(`event`): `void`

Defined in: viewer/manager/AnnotationManager.ts:161

Handler for mouse up (stop drawing).

#### Parameters

##### event

`MouseEvent`

#### Returns

`void`

***

### \_onMouseMove()

> `private` **\_onMouseMove**(`event`): `void`

Defined in: viewer/manager/AnnotationManager.ts:180

Handler for mouse move (update drawing).

#### Parameters

##### event

`MouseEvent`

#### Returns

`void`

***

### \_onMouseUp()

> `private` **\_onMouseUp**(): `void`

Defined in: viewer/manager/AnnotationManager.ts:195

Handler for mouse up (stop drawing).

#### Returns

`void`

***

### \_removeListeners()

> `private` **\_removeListeners**(): `void`

Defined in: viewer/manager/AnnotationManager.ts:141

Remove event listeners to stop tracking drawing

#### Returns

`void`

***

### addAnnotation()

> **addAnnotation**(`shapeConfig`, `scrollIntoView`, `revokeSelection`): `void`

Defined in: viewer/manager/AnnotationManager.ts:294

Add an annotation to the viewer. This is a wrapper around drawShape.

#### Parameters

##### shapeConfig

`ShapeConfig`

The configuration for the shape.

##### scrollIntoView

`boolean` = `false`

Whether to scroll the annotation into view.

##### revokeSelection

`boolean` = `false`

#### Returns

`void`

***

### createShape()

> **createShape**(`type`, `config`): `void`

Defined in: viewer/manager/AnnotationManager.ts:218

Create a new annotation of the given type and config, then begin drawing.

#### Parameters

##### type

`ShapeType`

The shape type ('rectangle' | 'ellipse', etc.)

##### config

Optional override of drawConfig properties

###### fillColor?

`string`

###### id?

`string`

###### opacity?

`number`

###### strokeColor?

`string`

###### strokeStyle?

`string`

###### strokeWidth?

`number`

#### Returns

`void`

***

### deleteAnnotation()

> **deleteAnnotation**(`annotationId`): `void`

Defined in: viewer/manager/AnnotationManager.ts:321

Delete an annotation by its ID.

#### Parameters

##### annotationId

`string`

The ID of the annotation to delete.

#### Returns

`void`

***

### deselectAll()

> **deselectAll**(): `void`

Defined in: viewer/manager/AnnotationManager.ts:349

Deselect all annotations.

#### Returns

`void`

***

### destroy()

> **destroy**(): `void`

Defined in: viewer/manager/AnnotationManager.ts:371

Cleanup resources, event handlers, subscriptions

#### Returns

`void`

***

### selectAnnotation()

> **selectAnnotation**(`annotation`): `void`

Defined in: viewer/manager/AnnotationManager.ts:333

Select an annotation and notify the selection manager.

#### Parameters

##### annotation

[`IAnnotation`](../../../../interface/IAnnotation/interfaces/IAnnotation.md)

The annotation to select.

#### Returns

`void`

***

### setPointerEvent()

> **setPointerEvent**(`pointerEvent`): `void`

Defined in: viewer/manager/AnnotationManager.ts:207

Enable or disable pointer events on the drawing container.

#### Parameters

##### pointerEvent

`"none"` | `"all"`

#### Returns

`void`

***

### updateAnnotation()

> **updateAnnotation**(`annotation`): `void`

Defined in: viewer/manager/AnnotationManager.ts:313

Update an existing annotation. This is a placeholder and should be
implemented in subclasses or specific managers.

#### Parameters

##### annotation

`ShapeConfig`

The annotation to update.

#### Returns

`void`
