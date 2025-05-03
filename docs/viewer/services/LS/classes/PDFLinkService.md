[**pdf-kit v1.5.0**](../../../../README.md)

***

[pdf-kit](../../../../modules.md) / [viewer/services/LS](../README.md) / PDFLinkService

# Class: PDFLinkService

Defined in: viewer/services/LS.ts:40

## Constructors

### Constructor

> **new PDFLinkService**(`options`): `PDFLinkService`

Defined in: viewer/services/LS.ts:50

#### Parameters

##### options

[`PDFLinkServiceOptions`](../interfaces/PDFLinkServiceOptions.md) = `{}`

#### Returns

`PDFLinkService`

## Properties

### \_ignoreDestinationZoom

> `private` **\_ignoreDestinationZoom**: `boolean`

Defined in: viewer/services/LS.ts:47

***

### baseUrl

> **baseUrl**: `null` \| `string`

Defined in: viewer/services/LS.ts:41

***

### externalLinkEnabled

> **externalLinkEnabled**: `boolean` = `true`

Defined in: viewer/services/LS.ts:48

***

### externalLinkRel

> **externalLinkRel**: `string`

Defined in: viewer/services/LS.ts:46

***

### externalLinkTarget

> **externalLinkTarget**: [`LinkTarget`](../enumerations/LinkTarget.md)

Defined in: viewer/services/LS.ts:45

***

### pdfDocument

> **pdfDocument**: `any`

Defined in: viewer/services/LS.ts:42

***

### pdfHistory

> **pdfHistory**: `any`

Defined in: viewer/services/LS.ts:44

***

### pdfViewer

> **pdfViewer**: `null` \| [`default`](../../../ui/WebViewer/classes/default.md)

Defined in: viewer/services/LS.ts:43

## Accessors

### isInPresentationMode

#### Get Signature

> **get** **isInPresentationMode**(): `boolean`

Defined in: viewer/services/LS.ts:107

##### Returns

`boolean`

***

### page

#### Get Signature

> **get** **page**(): `number`

Defined in: viewer/services/LS.ts:82

##### Returns

`number`

#### Set Signature

> **set** **page**(`value`): `void`

Defined in: viewer/services/LS.ts:87

##### Parameters

###### value

`number`

##### Returns

`void`

***

### pagesCount

#### Get Signature

> **get** **pagesCount**(): `number`

Defined in: viewer/services/LS.ts:77

##### Returns

`number`

***

### rotation

#### Get Signature

> **get** **rotation**(): `number`

Defined in: viewer/services/LS.ts:94

##### Returns

`number`

#### Set Signature

> **set** **rotation**(`value`): `void`

Defined in: viewer/services/LS.ts:100

##### Parameters

###### value

`number`

##### Returns

`void`

## Methods

### addLinkAttributes()

> **addLinkAttributes**(`link`, `url`, `newWindow?`): `void`

Defined in: viewer/services/LS.ts:227

Adds hyperlink attributes to the provided anchor element.

#### Parameters

##### link

`HTMLAnchorElement`

The link element.

##### url

`string`

The URL for the link.

##### newWindow?

`boolean` = `false`

Whether to open the link in a new window.

#### Returns

`void`

***

### executeNamedAction()

> **executeNamedAction**(`action`): `void`

Defined in: viewer/services/LS.ts:296

Executes a named action.

#### Parameters

##### action

`string`

The named action to execute.

#### Returns

`void`

***

### executeSetOCGState()

> **executeSetOCGState**(`action`): `Promise`\<`void`\>

Defined in: viewer/services/LS.ts:306

Executes an optional content group (OCG) state change.

#### Parameters

##### action

`any`

The action parameters.

#### Returns

`Promise`\<`void`\>

***

### getAnchorUrl()

> **getAnchorUrl**(`anchor`): `string`

Defined in: viewer/services/LS.ts:277

Returns the full anchor URL by prefixing the base URL (if any).

#### Parameters

##### anchor

`string`

The anchor hash (including "#").

#### Returns

`string`

The full URL.

***

### getDestinationHash()

> **getDestinationHash**(`dest`): `string`

Defined in: viewer/services/LS.ts:264

Returns a hash string for the destination.

#### Parameters

##### dest

The destination.

`string` | `number` | `any`[]

#### Returns

`string`

The destination hash.

***

### goToDestination()

> **goToDestination**(`dest`): `Promise`\<`void`\>

Defined in: viewer/services/LS.ts:123

Navigate to a destination in the PDF.

This implementation supports:
- Named destinations (if dest is a string)
- Explicit destination arrays (if dest is an array)

It uses the PDF document's methods to resolve named destinations and page references.

#### Parameters

##### dest

A destination which can be a string (named destination) or an explicit destination array.

`string` | `any`[]

#### Returns

`Promise`\<`void`\>

***

### goToPage()

> **goToPage**(`val`): `void`

Defined in: viewer/services/LS.ts:209

Navigate to a specific page.

#### Parameters

##### val

The page number (or label) to navigate to.

`string` | `number`

#### Returns

`void`

***

### setDocument()

> **setDocument**(`pdfDocument`, `baseUrl`): `void`

Defined in: viewer/services/LS.ts:61

#### Parameters

##### pdfDocument

`any`

##### baseUrl

`null` | `string`

#### Returns

`void`

***

### setHash()

> **setHash**(`hash`): `void`

Defined in: viewer/services/LS.ts:286

Sets the browser's location hash.

#### Parameters

##### hash

`string`

The hash value.

#### Returns

`void`

***

### setHistory()

> **setHistory**(`pdfHistory`): `void`

Defined in: viewer/services/LS.ts:72

#### Parameters

##### pdfHistory

`any`

#### Returns

`void`

***

### setViewer()

> **setViewer**(`pdfViewer`): `void`

Defined in: viewer/services/LS.ts:67

#### Parameters

##### pdfViewer

`any`

#### Returns

`void`
