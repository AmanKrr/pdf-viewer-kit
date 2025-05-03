[**pdf-kit v1.5.0**](../../../../README.md)

***

[pdf-kit](../../../../modules.md) / [viewer/manager/SearchIndexManager](../README.md) / default

# Class: default

Defined in: viewer/manager/SearchIndexManager.ts:23

The SearchIndexManager extracts and caches text for each page in the PDF.
This module can later be extended (for example, to build a Trie for auto-suggestions).

## Constructors

### Constructor

> **new default**(): `SearchIndexManager`

#### Returns

`SearchIndexManager`

## Properties

### \_pageTexts

> `private` **\_pageTexts**: `Map`\<`number`, `string`\>

Defined in: viewer/manager/SearchIndexManager.ts:25

## Methods

### extractPageText()

> **extractPageText**(`pageNumber`, `page`): `Promise`\<`void`\>

Defined in: viewer/manager/SearchIndexManager.ts:32

Extracts text from a PDF page and caches it.

#### Parameters

##### pageNumber

`number`

The page number.

##### page

`PDFPageProxy`

The PDF.js page proxy.

#### Returns

`Promise`\<`void`\>

***

### getAllPageNumbers()

> **getAllPageNumbers**(): `number`[]

Defined in: viewer/manager/SearchIndexManager.ts:55

Returns an array of page numbers for which text has been extracted.

#### Returns

`number`[]

***

### getPageText()

> **getPageText**(`pageNumber`): `undefined` \| `string`

Defined in: viewer/manager/SearchIndexManager.ts:48

Returns the cached text for a given page.

#### Parameters

##### pageNumber

`number`

The page number.

#### Returns

`undefined` \| `string`
