[**pdf-kit v1.5.0**](../../../README.md)

***

[pdf-kit](../../../modules.md) / [interface/IPDFLinkService](../README.md) / IPDFLinkService

# Interface: IPDFLinkService

Defined in: [interface/IPDFLinkService.ts:4](https://github.com/AmanKrr/pdf-kit/blob/643d0632fa36ecc0aadec82bd84cd2b2b2eefb0e/src/interface/IPDFLinkService.ts#L4)

Service for navigating within the PDF by destination or page number.

## Methods

### goToDestination()

> **goToDestination**(`dest`): `Promise`\<`void`\>

Defined in: [interface/IPDFLinkService.ts:11](https://github.com/AmanKrr/pdf-kit/blob/643d0632fa36ecc0aadec82bd84cd2b2b2eefb0e/src/interface/IPDFLinkService.ts#L11)

Navigate to a named destination or explicit PDF destination array.

#### Parameters

##### dest

The destination name (string) or destination array as defined by PDF.js.

`string` | `any`[]

#### Returns

`Promise`\<`void`\>

A promise that resolves once navigation completes.

***

### goToPage()

> **goToPage**(`val`): `void`

Defined in: [interface/IPDFLinkService.ts:18](https://github.com/AmanKrr/pdf-kit/blob/643d0632fa36ecc0aadec82bd84cd2b2b2eefb0e/src/interface/IPDFLinkService.ts#L18)

Navigate directly to the specified page.

#### Parameters

##### val

The 1-based page number or page label.

`string` | `number`

#### Returns

`void`
