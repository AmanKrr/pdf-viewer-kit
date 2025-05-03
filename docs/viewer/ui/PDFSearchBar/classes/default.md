[**pdf-kit v1.5.0**](../../../../README.md)

***

[pdf-kit](../../../../modules.md) / [viewer/ui/PDFSearchBar](../README.md) / default

# Class: default

Defined in: viewer/ui/PDFSearchBar.ts:33

SearchBar creates the search UI and wires events to perform a search,
navigate matches, and update the match counter.

It expects the following instance methods to be available:
 - this.search(searchTerm: string, options: { matchCase: boolean, regex: boolean, wholeWord: boolean })
 - this.prevMatch()
 - this.nextMatch()

It also stores references to its UI elements (search input, match counter, etc.)
for further use (like updating the counter).

## Constructors

### Constructor

> **new default**(`pdfState`, `searchCallback`, `prevMatchCallback`, `nextMatchCallback`, `getMatchStatus`): `SearchBar`

Defined in: viewer/ui/PDFSearchBar.ts:48

Creates and inserts the search bar into the viewer.

#### Parameters

##### pdfState

`any`

The PDF state object with containerId property.

##### searchCallback

(`searchTerm`, `options`) => `Promise`\<`void`\>

A function to perform the search.

##### prevMatchCallback

() => `void`

A function to go to the previous match.

##### nextMatchCallback

() => `void`

A function to go to the next match.

##### getMatchStatus

() => `object`

#### Returns

`SearchBar`

## Properties

### \_container

> `private` **\_container**: `null` \| `HTMLElement` = `null`

Defined in: viewer/ui/PDFSearchBar.ts:35

***

### \_debounceSearch

> `private` **\_debounceSearch**: `DebouncedFunc`\<(`searchCallback`, `searchTerm`, `options`, `getMatchStatusCallback`) => `Promise`\<`void`\>\>

Defined in: viewer/ui/PDFSearchBar.ts:162

***

### \_downButtonElement

> `private` **\_downButtonElement**: `null` \| `HTMLButtonElement` = `null`

Defined in: viewer/ui/PDFSearchBar.ts:39

***

### \_matchCounterElement

> `private` **\_matchCounterElement**: `null` \| `HTMLElement` = `null`

Defined in: viewer/ui/PDFSearchBar.ts:37

***

### \_pdfState

> `private` **\_pdfState**: `any`

Defined in: viewer/ui/PDFSearchBar.ts:34

***

### \_searchInputElement

> `private` **\_searchInputElement**: `null` \| `HTMLInputElement` = `null`

Defined in: viewer/ui/PDFSearchBar.ts:36

***

### \_upButtonElement

> `private` **\_upButtonElement**: `null` \| `HTMLButtonElement` = `null`

Defined in: viewer/ui/PDFSearchBar.ts:38

## Methods

### hide()

> **hide**(): `void`

Defined in: viewer/ui/PDFSearchBar.ts:180

Hides the search bar.

#### Returns

`void`

***

### show()

> **show**(): `void`

Defined in: viewer/ui/PDFSearchBar.ts:171

Optionally, expose methods to show/hide or update the search bar.

#### Returns

`void`

***

### updateMatchCounter()

> **updateMatchCounter**(`current`, `total`): `void`

Defined in: viewer/ui/PDFSearchBar.ts:191

Updates the match counter display.

#### Parameters

##### current

`number`

The current match index (1-indexed).

##### total

`number`

The total number of matches.

#### Returns

`void`
