[**pdf-kit v1.5.0**](../../../../README.md)

***

[pdf-kit](../../../../modules.md) / [viewer/manager/SearchHighlighter](../README.md) / default

# Class: default

Defined in: viewer/manager/SearchHighlighter.ts:45

The SearchHighlighter module performs searches over the indexed text,
then applies inline highlights to the corresponding text layer elements.
It also maintains a flat list of highlighted elements for result navigation.

Integration Note: Each page container should have an ID in the format "pageContainer-{pageNumber}"
and its text layer should use the class "a-text-layer". The text spans inside the layer should
have the attribute role="presentation".

## Constructors

### Constructor

> **new default**(`pdfState`, `pdfViewer`): `SearchHighlighter`

Defined in: viewer/manager/SearchHighlighter.ts:57

#### Parameters

##### pdfState

[`default`](../../../ui/PDFState/classes/default.md)

##### pdfViewer

[`default`](../../../ui/WebViewer/classes/default.md)

#### Returns

`SearchHighlighter`

## Properties

### \_allFlatResults

> `private` **\_allFlatResults**: `object`[] = `[]`

Defined in: viewer/manager/SearchHighlighter.ts:51

#### matchPosition

> **matchPosition**: `object`

##### matchPosition.length

> **length**: `number`

##### matchPosition.startIndex

> **startIndex**: `number`

#### pageNumber

> **pageNumber**: `number`

***

### \_currentMatchIndex

> `private` **\_currentMatchIndex**: `number` = `-1`

Defined in: viewer/manager/SearchHighlighter.ts:52

***

### \_currentOptions

> `private` **\_currentOptions**: [`SearchOptions`](../interfaces/SearchOptions.md)

Defined in: viewer/manager/SearchHighlighter.ts:47

***

### \_currentSearchTerm

> `private` **\_currentSearchTerm**: `string` = `''`

Defined in: viewer/manager/SearchHighlighter.ts:46

***

### \_flatResults

> `private` **\_flatResults**: `object`[] = `[]`

Defined in: viewer/manager/SearchHighlighter.ts:50

#### element

> **element**: `HTMLElement`

#### pageNumber

> **pageNumber**: `number`

***

### \_pdfState

> `private` **\_pdfState**: [`default`](../../../ui/PDFState/classes/default.md)

Defined in: viewer/manager/SearchHighlighter.ts:54

***

### \_pdfViewer

> `private` **\_pdfViewer**: [`default`](../../../ui/WebViewer/classes/default.md)

Defined in: viewer/manager/SearchHighlighter.ts:53

***

### \_searchIndexManager

> `private` **\_searchIndexManager**: [`default`](../../SearchIndexManager/classes/default.md)

Defined in: viewer/manager/SearchHighlighter.ts:55

## Methods

### \_buildRegex()

> `private` **\_buildRegex**(`searchTerm`, `options`): `RegExp`

Defined in: viewer/manager/SearchHighlighter.ts:143

Builds a RegExp based on the search term and options.

#### Parameters

##### searchTerm

`string`

##### options

[`SearchOptions`](../interfaces/SearchOptions.md)

#### Returns

`RegExp`

***

### \_waitForPageContainer()

> `private` **\_waitForPageContainer**(`pageNumber`): `Promise`\<`null` \| `HTMLElement`\>

Defined in: viewer/manager/SearchHighlighter.ts:182

Waits until the page container (with ID "pageContainer-{pageNumber}") is available in the DOM.
Returns null after a timeout.

#### Parameters

##### pageNumber

`number`

#### Returns

`Promise`\<`null` \| `HTMLElement`\>

***

### deregisterPage()

> **deregisterPage**(`pageNumber`): `void`

Defined in: viewer/manager/SearchHighlighter.ts:231

Called when a page is unmounted; cleans up any highlight data for that page.

#### Parameters

##### pageNumber

`number`

#### Returns

`void`

***

### extractPdfContent()

> **extractPdfContent**(`totalPages`, `pdf`): `Promise`\<`void`\>

Defined in: viewer/manager/SearchHighlighter.ts:132

Extracts text from all pages and indexes it for search.

#### Parameters

##### totalPages

`number`

##### pdf

`PDFDocumentProxy`

#### Returns

`Promise`\<`void`\>

***

### getMatchStatus()

> **getMatchStatus**(): `object`

Defined in: viewer/manager/SearchHighlighter.ts:307

#### Returns

`object`

##### current

> **current**: `number`

##### total

> **total**: `number`

***

### highlightPage()

> **highlightPage**(`pageNumber`, `searchTerm`, `options`): `Promise`\<`void`\>

Defined in: viewer/manager/SearchHighlighter.ts:156

Applies inline highlighting to a specific page.
This method waits for the page container to exist (up to a timeout) and then processes its text layer.

#### Parameters

##### pageNumber

`number`

##### searchTerm

`string`

##### options

[`SearchOptions`](../interfaces/SearchOptions.md)

#### Returns

`Promise`\<`void`\>

***

### nextMatch()

> **nextMatch**(): `void`

Defined in: viewer/manager/SearchHighlighter.ts:292

Navigate to the next match.

#### Returns

`void`

***

### prevMatch()

> **prevMatch**(): `void`

Defined in: viewer/manager/SearchHighlighter.ts:301

Navigate to the previous match.

#### Returns

`void`

***

### registerPage()

> **registerPage**(`pageNumber`): `Promise`\<`void`\>

Defined in: viewer/manager/SearchHighlighter.ts:222

Called by the virtualization system when a page is mounted.
If a search is active, reapply highlights on that page.

#### Parameters

##### pageNumber

`number`

#### Returns

`Promise`\<`void`\>

***

### removeHighlights()

> **removeHighlights**(): `void`

Defined in: viewer/manager/SearchHighlighter.ts:206

Removes all inline highlights from all text layers.

#### Returns

`void`

***

### search()

> **search**(`searchTerm`, `options`, `pdfState`): `Promise`\<[`PageSearchResult`](../interfaces/PageSearchResult.md)[]\>

Defined in: viewer/manager/SearchHighlighter.ts:69

Performs a search over all indexed pages.

#### Parameters

##### searchTerm

`string`

The term to search for.

##### options

[`SearchOptions`](../interfaces/SearchOptions.md)

Search options.

##### pdfState

[`default`](../../../ui/PDFState/classes/default.md)

#### Returns

`Promise`\<[`PageSearchResult`](../interfaces/PageSearchResult.md)[]\>

An array of PageSearchResult objects.

***

### selectMatch()

> **selectMatch**(`index`): `void`

Defined in: viewer/manager/SearchHighlighter.ts:249

Selects a match by its index in the flat result array, scrolls it into view,
and adds an active highlight style.

#### Parameters

##### index

`number`

#### Returns

`void`
