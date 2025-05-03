[**pdf-kit v1.5.0**](../../../../README.md)

***

[pdf-kit](../../../../modules.md) / [viewer/services/AnnotationService](../README.md) / AnnotationService

# Class: AnnotationService

Defined in: viewer/services/AnnotationService.ts:29

Service to manage annotations across pages.
Listens for creation/deletion events and keeps per-page annotations synchronized.

## Constructors

### Constructor

> **new AnnotationService**(`pdfState`, `pdfViewer`): `AnnotationService`

Defined in: viewer/services/AnnotationService.ts:41

#### Parameters

##### pdfState

[`default`](../../../ui/PDFState/classes/default.md)

Shared PDF state, emits ANNOTATION_CREATED/DELETED events.

##### pdfViewer

[`default`](../../../ui/WebViewer/classes/default.md)

WebViewer for navigation (goToPage).

#### Returns

`AnnotationService`

## Properties

### \_annotationManagers

> `private` **\_annotationManagers**: `Map`\<`number`, [`AnnotationManager`](../../../manager/AnnotationManager/classes/AnnotationManager.md)\>

Defined in: viewer/services/AnnotationService.ts:31

***

### \_annotations

> `private` **\_annotations**: `Map`\<`number`, `ShapeConfig`[]\>

Defined in: viewer/services/AnnotationService.ts:30

***

### \_goTo()

> `private` **\_goTo**: (`pageNumber`) => `void`

Defined in: viewer/services/AnnotationService.ts:32

#### Parameters

##### pageNumber

`number`

#### Returns

`void`

***

### \_pdfState

> `private` **\_pdfState**: [`default`](../../../ui/PDFState/classes/default.md)

Defined in: viewer/services/AnnotationService.ts:33

## Methods

### \_collectAllConfigs()

> `private` **\_collectAllConfigs**(): (`RectangleConfig` \| `EllipseConfig` \| `LineConfig`)[]

Defined in: viewer/services/AnnotationService.ts:399

Internal: collect all live ShapeConfig from registered managers.

#### Returns

(`RectangleConfig` \| `EllipseConfig` \| `LineConfig`)[]

***

### \_deleteAnnotation()

> `private` **\_deleteAnnotation**(`annotationId`): `void`

Defined in: viewer/services/AnnotationService.ts:364

Internal: delete annotation logic for both storage and manager.

#### Parameters

##### annotationId

`string`

#### Returns

`void`

***

### \_generateUniqueId()

> `private` **\_generateUniqueId**(): `string`

Defined in: viewer/services/AnnotationService.ts:410

Internal: generate a unique identifier for a new annotation.

#### Returns

`string`

***

### \_onCreated()

> `private` **\_onCreated**(`annotationData`): `void`

Defined in: viewer/services/AnnotationService.ts:34

#### Parameters

##### annotationData

`ShapeConfig`

#### Returns

`void`

***

### \_onDeleted()

> `private` **\_onDeleted**(`id`): `void`

Defined in: viewer/services/AnnotationService.ts:35

#### Parameters

##### id

`string`

#### Returns

`void`

***

### \_updateAnnotationMap()

> `private` **\_updateAnnotationMap**(`annotationData`): `void`

Defined in: viewer/services/AnnotationService.ts:380

Internal: updates or adds annotation in the map when created externally.

#### Parameters

##### annotationData

`ShapeConfig`

#### Returns

`void`

***

### \_waitForAnnotationEl()

> `private` **\_waitForAnnotationEl**(`container`, `annotationId`, `timeoutMs`): `Promise`\<`SVGGraphicsElement`\>

Defined in: viewer/services/AnnotationService.ts:169

Waits until an SVG element with the given annotation-id attribute
appears under the specified container.

#### Parameters

##### container

`HTMLElement`

The parent HTMLElement under which to look for the SVG.

##### annotationId

`string`

The annotation-id attribute to match.

##### timeoutMs

`number` = `5000`

Maximum time in milliseconds to wait (default: 5000).

#### Returns

`Promise`\<`SVGGraphicsElement`\>

Promise that resolves with the SVGGraphicsElement once found.

#### Throws

Error if the SVG element does not appear within the specified timeout.

***

### \_waitForPageContainer()

> `private` **\_waitForPageContainer**(`page`, `timeoutMs`): `Promise`\<`HTMLElement`\>

Defined in: viewer/services/AnnotationService.ts:105

Waits until the page container element for the given page number appears in the DOM.

#### Parameters

##### page

`number`

1-based page number whose container to wait for.

##### timeoutMs

`number` = `5000`

Maximum time in milliseconds to wait (default: 5000).

#### Returns

`Promise`\<`HTMLElement`\>

Promise that resolves with the HTMLElement once found.

#### Throws

Error if the element does not appear within the specified timeout.

***

### \_waitForTextLayer()

> `private` **\_waitForTextLayer**(`container`, `timeoutMs`): `Promise`\<`HTMLElement`\>

Defined in: viewer/services/AnnotationService.ts:134

Waits until a text-layer element appears within the given container.

#### Parameters

##### container

`HTMLElement`

The parent HTMLElement under which to look for the text layer.

##### timeoutMs

`number` = `5000`

Maximum time in milliseconds to wait (default: 5000).

#### Returns

`Promise`\<`HTMLElement`\>

Promise that resolves with the text-layer HTMLElement once found.

#### Throws

Error if the text layer does not appear within the specified timeout.

***

### addAnnotation()

> **addAnnotation**(`annotationInput`): `string`

Defined in: viewer/services/AnnotationService.ts:286

Creates and saves a new annotation, navigates to its page,
and renders it if the page manager is registered.

#### Parameters

##### annotationInput

`Omit`\<`ShapeConfig`, `"id"`\>

Annotation data without 'id'.

#### Returns

`string`

Generated annotation id.

***

### deleteAnnotation()

> **deleteAnnotation**(`annotationId`): `void`

Defined in: viewer/services/AnnotationService.ts:332

Deletes an annotation by its ID from storage and view.

#### Parameters

##### annotationId

`string`

ID of the annotation to delete.

#### Returns

`void`

***

### destroy()

> **destroy**(): `void`

Defined in: viewer/services/AnnotationService.ts:350

Removes event listeners and destroys all managers.

#### Returns

`void`

***

### exportShapes()

> **exportShapes**(): [`ShapeAnno`](../../AnnotationExportService/type-aliases/ShapeAnno.md)[]

Defined in: viewer/services/AnnotationService.ts:342

Exports all current annotations as ShapeAnno objects,
applying current PDF scale.

#### Returns

[`ShapeAnno`](../../AnnotationExportService/type-aliases/ShapeAnno.md)[]

Array of ShapeAnno ready for saving or download.

***

### getTextInsideRectangle()

> **getTextInsideRectangle**(`annotationId`): `Promise`\<`string`\>

Defined in: viewer/services/AnnotationService.ts:198

Retrieves all text runs that intersect the bounding box of a rectangle annotation.

#### Parameters

##### annotationId

`string`

ID of an existing rectangle annotation.

#### Returns

`Promise`\<`string`\>

Promise that resolves to the concatenated text inside the rectangle,
         preserving word order and line breaks.

#### Throws

Error if no rectangle with the given ID exists.

***

### isAnnotationManagerRegistered()

> **isAnnotationManagerRegistered**(`page`): `undefined` \| [`AnnotationManager`](../../../manager/AnnotationManager/classes/AnnotationManager.md)

Defined in: viewer/services/AnnotationService.ts:55

Checks if an AnnotationManager is registered for the given page.

#### Parameters

##### page

`number`

Page number to check.

#### Returns

`undefined` \| [`AnnotationManager`](../../../manager/AnnotationManager/classes/AnnotationManager.md)

The AnnotationManager instance or undefined.

***

### registerAnnotationManager()

> **registerAnnotationManager**(`page`, `manager`): `void`

Defined in: viewer/services/AnnotationService.ts:66

Registers an AnnotationManager for a page.
Renders any existing annotations for that page immediately.

#### Parameters

##### page

`number`

Page number.

##### manager

[`AnnotationManager`](../../../manager/AnnotationManager/classes/AnnotationManager.md)

AnnotationManager instance.

#### Returns

`void`

***

### unregisterAnnotationManager()

> **unregisterAnnotationManager**(`page`): `void`

Defined in: viewer/services/AnnotationService.ts:87

Unregisters the AnnotationManager for a page and cleans up.

#### Parameters

##### page

`number`

Page number.

#### Returns

`void`

***

### updateAnnotation()

> **updateAnnotation**(`annotationId`, `updatedData`): `void`

Defined in: viewer/services/AnnotationService.ts:314

Updates an existing annotation's properties.

#### Parameters

##### annotationId

`string`

ID of the annotation to update.

##### updatedData

`Partial`\<`ShapeConfig`\>

Partial data to merge into the annotation.

#### Returns

`void`
