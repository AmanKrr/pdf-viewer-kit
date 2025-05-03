[**pdf-kit v1.5.0**](../../../../README.md)

***

[pdf-kit](../../../../modules.md) / [viewer/manager/SelectionManager](../README.md) / SelectionManager

# Class: SelectionManager

Defined in: viewer/manager/SelectionManager.ts:22

## Constructors

### Constructor

> **new SelectionManager**(): `SelectionManager`

#### Returns

`SelectionManager`

## Properties

### listeners

> `private` **listeners**: (`selected`) => `void`[] = `[]`

Defined in: viewer/manager/SelectionManager.ts:24

#### Parameters

##### selected

`null` | [`ISelectable`](../interfaces/ISelectable.md)

#### Returns

`void`

***

### selectedShape

> `private` **selectedShape**: `null` \| [`ISelectable`](../interfaces/ISelectable.md) = `null`

Defined in: viewer/manager/SelectionManager.ts:23

## Methods

### \_notifyListeners()

> `private` **\_notifyListeners**(): `void`

Defined in: viewer/manager/SelectionManager.ts:58

Notifies all registered listeners of a selection change.

#### Returns

`void`

***

### getSelected()

> **getSelected**(): `null` \| [`ISelectable`](../interfaces/ISelectable.md)

Defined in: viewer/manager/SelectionManager.ts:38

Returns the currently selected shape.

#### Returns

`null` \| [`ISelectable`](../interfaces/ISelectable.md)

***

### onSelectionChange()

> **onSelectionChange**(`listener`): () => `void`

Defined in: viewer/manager/SelectionManager.ts:47

Registers a listener that will be notified when the selection changes.
Returns a function that, when called, unsubscribes the listener.

#### Parameters

##### listener

(`selected`) => `void`

A callback function receiving the new selection.

#### Returns

> (): `void`

##### Returns

`void`

***

### setSelected()

> **setSelected**(`shape`): `void`

Defined in: viewer/manager/SelectionManager.ts:30

Sets the currently selected shape.

#### Parameters

##### shape

The shape to select or null to clear selection.

`null` | [`ISelectable`](../interfaces/ISelectable.md)

#### Returns

`void`
