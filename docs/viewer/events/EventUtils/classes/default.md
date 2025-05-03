[**pdf-kit v1.5.0**](../../../../README.md)

***

[pdf-kit](../../../../modules.md) / [viewer/events/EventUtils](../README.md) / default

# Class: default

Defined in: viewer/events/EventUtils.ts:23

A simple event emitter class for managing event-driven programming.
It allows registering event listeners, emitting events, and removing event listeners.

## Extended by

- [`default`](../../../ui/PDFState/classes/default.md)

## Constructors

### Constructor

> **new default**(): `EventEmitter`

#### Returns

`EventEmitter`

## Properties

### events

> `private` **events**: `object` = `{}`

Defined in: viewer/events/EventUtils.ts:25

Stores registered event listeners.

#### Index Signature

\[`event`: `string`\]: (...`args`) => `void`[]

## Methods

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
