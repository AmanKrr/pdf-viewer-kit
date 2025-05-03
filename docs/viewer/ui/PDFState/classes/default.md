[**pdf-kit v1.5.0**](../../../../README.md)

***

[pdf-kit](../../../../modules.md) / [viewer/ui/PDFState](../README.md) / default

# Class: default

Defined in: viewer/ui/PDFState.ts:24

Manages the state of the PDF viewer, including scale, loading status, and page navigation.
Extends EventEmitter to allow event-based updates.

## Extends

- [`default`](../../../events/EventUtils/classes/default.md)

## Constructors

### Constructor

> `private` **new default**(): `PdfState`

Defined in: viewer/ui/PDFState.ts:38

Private constructor to enforce singleton pattern per container ID

#### Returns

`PdfState`

#### Overrides

[`default`](../../../events/EventUtils/classes/default.md).[`constructor`](../../../events/EventUtils/classes/default.md#constructor)

## Properties

### \_containerId

> `private` **\_containerId**: `string` = `''`

Defined in: viewer/ui/PDFState.ts:32

***

### \_currentPage

> `private` **\_currentPage**: `number` = `1`

Defined in: viewer/ui/PDFState.ts:31

***

### \_isAnnotationConfigurationPropertiesEnabled

> `private` **\_isAnnotationConfigurationPropertiesEnabled**: `boolean` = `false`

Defined in: viewer/ui/PDFState.ts:35

***

### \_isAnnotationEnabled

> `private` **\_isAnnotationEnabled**: `boolean` = `false`

Defined in: viewer/ui/PDFState.ts:34

***

### \_isLoading

> `private` **\_isLoading**: `boolean` = `true`

Defined in: viewer/ui/PDFState.ts:30

***

### \_pdfInstance

> `private` **\_pdfInstance**: `PDFDocumentProxy`

Defined in: viewer/ui/PDFState.ts:29

***

### \_scale

> `private` **\_scale**: `number` = `1.0`

Defined in: viewer/ui/PDFState.ts:28

***

### \_uiLoading

> `private` **\_uiLoading**: `HTMLElement`

Defined in: viewer/ui/PDFState.ts:33

***

### pdfStates

> `private` `static` **pdfStates**: `Map`\<`string`, `PdfState`\>

Defined in: viewer/ui/PDFState.ts:26

Stores instances of PdfState mapped by container ID

## Accessors

### containerId

#### Get Signature

> **get** **containerId**(): `string`

Defined in: viewer/ui/PDFState.ts:214

Gets the container ID associated with this PdfState instance.

##### Returns

`string`

The container ID.

#### Set Signature

> **set** **containerId**(`id`): `void`

Defined in: viewer/ui/PDFState.ts:223

Sets a new container ID for this PdfState instance.

##### Parameters

###### id

`string`

The new container ID.

##### Returns

`void`

***

### currentPage

#### Get Signature

> **get** **currentPage**(): `number`

Defined in: viewer/ui/PDFState.ts:192

Gets the current page number being viewed.

##### Returns

`number`

The current page number.

#### Set Signature

> **set** **currentPage**(`pageNumber`): `void`

Defined in: viewer/ui/PDFState.ts:202

Sets the current page number.
(Note: Emitting 'pageChange' is commented out. Uncomment if needed.)

##### Parameters

###### pageNumber

`number`

The new page number.

##### Returns

`void`

***

### isAnnotationConfigurationPropertiesEnabled

#### Get Signature

> **get** **isAnnotationConfigurationPropertiesEnabled**(): `boolean`

Defined in: viewer/ui/PDFState.ts:130

Checks if annotation configuration properties are enabled.

##### Returns

`boolean`

`true` if enabled, `false` otherwise.

#### Set Signature

> **set** **isAnnotationConfigurationPropertiesEnabled**(`value`): `void`

Defined in: viewer/ui/PDFState.ts:139

Sets the annotation configuration properties state.

##### Parameters

###### value

`boolean`

`true` to enable, `false` to disable.

##### Returns

`void`

***

### isAnnotationEnabled

#### Get Signature

> **get** **isAnnotationEnabled**(): `boolean`

Defined in: viewer/ui/PDFState.ts:110

Checks if annotations are enabled.

##### Returns

`boolean`

`true` if annotations are enabled, `false` otherwise.

#### Set Signature

> **set** **isAnnotationEnabled**(`value`): `void`

Defined in: viewer/ui/PDFState.ts:119

Sets the annotation state.

##### Parameters

###### value

`boolean`

`true` to enable annotations, `false` to disable.

##### Returns

`void`

***

### isLoading

#### Get Signature

> **get** **isLoading**(): `boolean`

Defined in: viewer/ui/PDFState.ts:171

Checks if the PDF document is currently loading.

##### Returns

`boolean`

`true` if the document is loading, `false` otherwise.

#### Set Signature

> **set** **isLoading**(`value`): `void`

Defined in: viewer/ui/PDFState.ts:180

Sets the loading state of the PDF document and emits a `loadingChange` event.

##### Parameters

###### value

`boolean`

`true` if loading, `false` otherwise.

##### Returns

`void`

***

### pdfInstance

#### Get Signature

> **get** **pdfInstance**(): `PDFDocumentProxy`

Defined in: viewer/ui/PDFState.ts:150

Gets the PDF.js document instance.

##### Returns

`PDFDocumentProxy`

The current PDF document instance.

#### Set Signature

> **set** **pdfInstance**(`instance`): `void`

Defined in: viewer/ui/PDFState.ts:159

Sets a new PDF.js document instance and emits a `pdfInstanceChange` event.

##### Parameters

###### instance

`PDFDocumentProxy`

The new PDF document instance.

##### Returns

`void`

***

### scale

#### Get Signature

> **get** **scale**(): `number`

Defined in: viewer/ui/PDFState.ts:90

Gets the current zoom scale of the PDF viewer.

##### Returns

`number`

The current scale.

#### Set Signature

> **set** **scale**(`newScale`): `void`

Defined in: viewer/ui/PDFState.ts:99

Sets a new zoom scale and emits a `scaleChange` event.

##### Parameters

###### newScale

`number`

The new scale to apply.

##### Returns

`void`

***

### uiLoading

#### Get Signature

> **get** **uiLoading**(): `HTMLElement`

Defined in: viewer/ui/PDFState.ts:234

Gets the loading UI element used for displaying loading indicators.

##### Returns

`HTMLElement`

The loading UI element.

#### Set Signature

> **set** **uiLoading**(`element`): `void`

Defined in: viewer/ui/PDFState.ts:243

Sets the loading UI element.

##### Parameters

###### element

`HTMLElement`

The new loading UI element.

##### Returns

`void`

## Methods

### destroy()

> **destroy**(): `void`

Defined in: viewer/ui/PDFState.ts:249

#### Returns

`void`

***

### emit()

> **emit**(`event`, ...`args`): `void`

Defined in: viewer/events/EventUtils.ts:46

Emits an event, triggering all registered listeners with the provided arguments.

#### Parameters

##### event

`Events`

The event name.

##### args

...`any`[]

Arguments to pass to the event listeners.

#### Returns

`void`

#### Inherited from

[`default`](../../../events/EventUtils/classes/default.md).[`emit`](../../../events/EventUtils/classes/default.md#emit)

***

### off()

> **off**(`event`, `listener`): `void`

Defined in: viewer/events/EventUtils.ts:58

Removes a specific listener for an event.

#### Parameters

##### event

`Events`

The event name.

##### listener

(...`args`) => `void`

The listener function to remove.

#### Returns

`void`

#### Inherited from

[`default`](../../../events/EventUtils/classes/default.md).[`off`](../../../events/EventUtils/classes/default.md#off)

***

### on()

> **on**(`event`, `listener`): `void`

Defined in: viewer/events/EventUtils.ts:33

Registers an event listener for a specific event.

#### Parameters

##### event

`Events`

The event name.

##### listener

(...`args`) => `void`

The callback function to execute when the event is emitted.

#### Returns

`void`

#### Inherited from

[`default`](../../../events/EventUtils/classes/default.md).[`on`](../../../events/EventUtils/classes/default.md#on)

***

### removeAllListeners()

> **removeAllListeners**(`event?`): `void`

Defined in: viewer/events/EventUtils.ts:69

Removes **all** listeners.
If you pass an event name, only that event’s handlers are cleared;
otherwise **every** event is wiped out.

#### Parameters

##### event?

`Events`

#### Returns

`void`

#### Inherited from

[`default`](../../../events/EventUtils/classes/default.md).[`removeAllListeners`](../../../events/EventUtils/classes/default.md#removealllisteners)

***

### getInstance()

> `static` **getInstance**(`id`): `PdfState`

Defined in: viewer/ui/PDFState.ts:49

Retrieves or creates a `PdfState` instance for a given container ID.

#### Parameters

##### id

`string`

The unique container ID.

#### Returns

`PdfState`

The PdfState instance associated with the given ID.

#### Throws

If the ID is null or empty.

***

### listInstances()

> `static` **listInstances**(): `string`[]

Defined in: viewer/ui/PDFState.ts:81

Lists all active `PdfState` instances.

#### Returns

`string`[]

An array of all registered container IDs.

***

### removeInstance()

> `static` **removeInstance**(`id`): `void`

Defined in: viewer/ui/PDFState.ts:68

Removes a `PdfState` instance associated with the given ID.

#### Parameters

##### id

`string`

The ID of the PdfState instance to remove.

#### Returns

`void`
