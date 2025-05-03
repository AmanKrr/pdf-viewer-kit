[**pdf-kit v1.5.0**](../../../README.md)

***

[pdf-kit](../../../modules.md) / [interface/IToolbar](../README.md) / IToolbar

# Interface: IToolbar

Defined in: [interface/IToolbar.ts:4](https://github.com/AmanKrr/pdf-kit/blob/643d0632fa36ecc0aadec82bd84cd2b2b2eefb0e/src/interface/IToolbar.ts#L4)

Contract for toolbar components in the PDF viewer.

## Methods

### destroy()

> **destroy**(): `void`

Defined in: [interface/IToolbar.ts:15](https://github.com/AmanKrr/pdf-kit/blob/643d0632fa36ecc0aadec82bd84cd2b2b2eefb0e/src/interface/IToolbar.ts#L15)

Destroy the toolbar, removing any event listeners and DOM elements it created.

#### Returns

`void`

***

### render()

> **render**(`container`): `void`

Defined in: [interface/IToolbar.ts:10](https://github.com/AmanKrr/pdf-kit/blob/643d0632fa36ecc0aadec82bd84cd2b2b2eefb0e/src/interface/IToolbar.ts#L10)

Render the toolbar into the specified container element.

#### Parameters

##### container

`HTMLElement`

The HTMLElement in which to render this toolbar.

#### Returns

`void`
