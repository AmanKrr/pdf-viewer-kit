[**pdf-kit v1.5.0**](../../../../README.md)

***

[pdf-kit](../../../../modules.md) / [viewer/ui/PDFPageVirtualization](../README.md) / default

# Class: default

Defined in: viewer/ui/PDFPageVirtualization.ts:36

Handles virtualization of PDF pages, rendering only those visible within the viewport.

## Constructors

### Constructor

> **new default**(`options`, `parentContainer`, `container`, `totalPages`, `pdfViewer`, `selectionManager`, `searchHighlighter`, `pageBuffer?`): `PageVirtualization`

Defined in: viewer/ui/PDFPageVirtualization.ts:66

Constructor initializes the PageVirtualization with required parameters.

#### Parameters

##### options

`ViewerLoadOptions`

Configuration options for the PDF viewer.

##### parentContainer

`HTMLElement`

The parent container element for the viewer.

##### container

`HTMLElement`

The container element for the pages.

##### totalPages

`number`

Total number of pages in the PDF.

##### pdfViewer

[`default`](../../WebViewer/classes/default.md)

Instance of the WebViewer.

##### selectionManager

[`SelectionManager`](../../../manager/SelectionManager/classes/SelectionManager.md)

##### searchHighlighter

[`default`](../../../manager/SearchHighlighter/classes/default.md)

##### pageBuffer?

`number` = `3`

Number of extra pages to render around the viewport.

#### Returns

`PageVirtualization`

## Properties

### \_bindOnScaleChange()

> `private` **\_bindOnScaleChange**: () => `void`

Defined in: viewer/ui/PDFPageVirtualization.ts:50

#### Returns

`void`

***

### \_container

> `private` **\_container**: `null` \| `HTMLElement` = `null`

Defined in: viewer/ui/PDFPageVirtualization.ts:39

***

### \_debouncedScrollHandler

> `private` **\_debouncedScrollHandler**: `DebouncedFuncLeading`\<(`isScaleChangeActive`) => `Promise`\<`void`\>\>

Defined in: viewer/ui/PDFPageVirtualization.ts:153

***

### \_isScaleChangeActive

> `private` **\_isScaleChangeActive**: `boolean` = `false`

Defined in: viewer/ui/PDFPageVirtualization.ts:51

***

### \_lastScrollTop

> `private` **\_lastScrollTop**: `number` = `0`

Defined in: viewer/ui/PDFPageVirtualization.ts:44

***

### \_observer

> `private` **\_observer**: `null` \| `IntersectionObserver` = `null`

Defined in: viewer/ui/PDFPageVirtualization.ts:54

***

### \_options

> `private` **\_options**: `null` \| `ViewerLoadOptions` = `null`

Defined in: viewer/ui/PDFPageVirtualization.ts:37

***

### \_pageBuffer

> `private` **\_pageBuffer**: `number` = `3`

Defined in: viewer/ui/PDFPageVirtualization.ts:40

***

### \_pagePosition

> `private` **\_pagePosition**: `Map`\<`number`, `number`\>

Defined in: viewer/ui/PDFPageVirtualization.ts:45

***

### \_parentContainer

> `private` **\_parentContainer**: `null` \| `HTMLElement` = `null`

Defined in: viewer/ui/PDFPageVirtualization.ts:38

***

### \_pdf

> `private` **\_pdf**: `PDFDocumentProxy`

Defined in: viewer/ui/PDFPageVirtualization.ts:42

***

### \_pdfState

> `private` **\_pdfState**: [`default`](../../PDFState/classes/default.md)

Defined in: viewer/ui/PDFPageVirtualization.ts:46

***

### \_pdfViewer

> `private` **\_pdfViewer**: [`default`](../../WebViewer/classes/default.md)

Defined in: viewer/ui/PDFPageVirtualization.ts:47

***

### \_renderedPages

> `private` **\_renderedPages**: `Set`\<`number`\>

Defined in: viewer/ui/PDFPageVirtualization.ts:43

***

### \_resolveReady()

> `private` **\_resolveReady**: () => `void`

Defined in: viewer/ui/PDFPageVirtualization.ts:53

#### Returns

`void`

***

### \_searchHighlighter

> `private` **\_searchHighlighter**: [`default`](../../../manager/SearchHighlighter/classes/default.md)

Defined in: viewer/ui/PDFPageVirtualization.ts:49

***

### \_selectionManager

> `private` **\_selectionManager**: [`SelectionManager`](../../../manager/SelectionManager/classes/SelectionManager.md)

Defined in: viewer/ui/PDFPageVirtualization.ts:48

***

### \_totalPages

> `private` **\_totalPages**: `number`

Defined in: viewer/ui/PDFPageVirtualization.ts:41

## Accessors

### cachedPagePosition

#### Get Signature

> **get** **cachedPagePosition**(): `Map`\<`number`, `number`\>

Defined in: viewer/ui/PDFPageVirtualization.ts:129

Getter for cached page positions.

##### Returns

`Map`\<`number`, `number`\>

A map storing page positions.

***

### isThereSpecificPageToRender

#### Get Signature

> **get** **isThereSpecificPageToRender**(): `undefined` \| `null` \| `number`

Defined in: viewer/ui/PDFPageVirtualization.ts:120

Checks if a specific page has been designated for rendering.

##### Returns

`undefined` \| `null` \| `number`

The page number to be rendered if specified, otherwise `undefined` or `null`.

***

### pageObserver

#### Set Signature

> **set** **pageObserver**(`observer`): `void`

Defined in: viewer/ui/PDFPageVirtualization.ts:103

##### Parameters

###### observer

`IntersectionObserver`

##### Returns

`void`

***

### visiblePages

#### Get Signature

> **get** **visiblePages**(): `ReadonlySet`\<`number`\>

Defined in: viewer/ui/PDFPageVirtualization.ts:111

Getter for the visible pages in the viewport.
This returns a read-only set of page numbers that are currently rendered.

##### Returns

`ReadonlySet`\<`number`\>

## Methods

### \_attachScrollListener()

> `private` **\_attachScrollListener**(): `void`

Defined in: viewer/ui/PDFPageVirtualization.ts:136

Attach a scroll listener to dynamically load/unload pages based on the viewport.

#### Returns

`void`

***

### \_calculatePageFromScroll()

> `private` **\_calculatePageFromScroll**(`scrollTop`): `number`

Defined in: viewer/ui/PDFPageVirtualization.ts:307

Determines the page number corresponding to a given scrollTop position.
Uses a binary search on the cached page positions for efficiency.

#### Parameters

##### scrollTop

`number`

The scroll position in pixels.

#### Returns

`number`

The page number that is currently in view.

***

### \_calculatePagesToFillViewport()

> `private` **\_calculatePagesToFillViewport**(): `Promise`\<`number`\>

Defined in: viewer/ui/PDFPageVirtualization.ts:169

Calculate the number of pages required to fill the viewport.

#### Returns

`Promise`\<`number`\>

Number of pages needed to render initially.

***

### \_cleanupOutOfBufferPages()

> `private` **\_cleanupOutOfBufferPages**(`visiblePages`): `void`

Defined in: viewer/ui/PDFPageVirtualization.ts:440

Removes pages from the DOM that are outside the buffer zone.

#### Parameters

##### visiblePages

`number`[]

An array of currently visible pages.

#### Returns

`void`

***

### \_getPagesInBuffer()

> `private` **\_getPagesInBuffer**(`targetPage`): `number`[]

Defined in: viewer/ui/PDFPageVirtualization.ts:352

Gets the page numbers that should be rendered within the buffer range.

#### Parameters

##### targetPage

`number`

The current page in view.

#### Returns

`number`[]

An array of page numbers that should be visible in the viewport.

***

### \_getViewport()

> `private` **\_getViewport**(`pageNumber`): `Promise`\<`PageViewport`\>

Defined in: viewer/ui/PDFPageVirtualization.ts:460

Retrieves the viewport of a specific page for rendering purposes.

#### Parameters

##### pageNumber

`number`

The page number.

#### Returns

`Promise`\<`PageViewport`\>

The viewport object of the specified page.

***

### \_onScaleChange()

> `private` **\_onScaleChange**(): `void`

Defined in: viewer/ui/PDFPageVirtualization.ts:144

#### Returns

`void`

***

### \_removePage()

> `private` **\_removePage**(`pageNumber`): `void`

Defined in: viewer/ui/PDFPageVirtualization.ts:470

Removes a specific page element from the DOM.

#### Parameters

##### pageNumber

`number`

The number of the page to be removed.

#### Returns

`void`

***

### \_renderHighResImage()

> `private` **\_renderHighResImage**(`viewport`, `page`): `Promise`\<\[`string`, `HTMLCanvasElement`\]\>

Defined in: viewer/ui/PDFPageVirtualization.ts:628

Renders a high-resolution image of a PDF page onto a canvas and returns the image as a data URL.
The rendered image is generated using the provided viewport and PDF page. The method returns a tuple
containing the data URL of the rendered image (in PNG format) along with the canvas element used for rendering.

#### Parameters

##### viewport

`PageViewport`

The PageViewport representing the dimensions and scale of the PDF page.

##### page

`PDFPageProxy`

The PDFPageProxy object representing the PDF page to render.

#### Returns

`Promise`\<\[`string`, `HTMLCanvasElement`\]\>

A promise that resolves with a tuple: [dataUrl: string, canvas: HTMLCanvasElement].

***

### \_renderInitialPages()

> `private` **\_renderInitialPages**(): `Promise`\<`void`\>

Defined in: viewer/ui/PDFPageVirtualization.ts:203

Render pages visible in the initial viewport.

#### Returns

`Promise`\<`void`\>

***

### \_renderPage()

> `private` **\_renderPage**(`pageNumber`): `Promise`\<`void`\>

Defined in: viewer/ui/PDFPageVirtualization.ts:371

Renders a specific page onto the canvas within the viewport.

#### Parameters

##### pageNumber

`number`

The page number to render.

#### Returns

`Promise`\<`void`\>

***

### \_scrollHandler()

> `private` **\_scrollHandler**(`event`): `void`

Defined in: viewer/ui/PDFPageVirtualization.ts:149

#### Parameters

##### event

`Event`

#### Returns

`void`

***

### \_setContainerHeight()

> `private` **\_setContainerHeight**(`height`): `void`

Defined in: viewer/ui/PDFPageVirtualization.ts:283

Sets the height of the container based on the total page height.

#### Parameters

##### height

`number`

The computed height to be set.

#### Returns

`void`

***

### \_setContainerWidth()

> `private` **\_setContainerWidth**(`width`): `void`

Defined in: viewer/ui/PDFPageVirtualization.ts:294

Sets the width of the container based on the widest page.

#### Parameters

##### width

`number`

The computed width to be set.

#### Returns

`void`

***

### \_updateVisiblePages()

> `private` **\_updateVisiblePages**(`isScrollingDown`, `targetPage`): `Promise`\<`void`\>

Defined in: viewer/ui/PDFPageVirtualization.ts:333

Updates the pages visible within the viewport dynamically based on scrolling.
Removes pages that are outside the buffer zone and loads new ones as needed.

#### Parameters

##### isScrollingDown

`boolean`

Direction of scrolling.

##### targetPage

`number`

The current page in view.

#### Returns

`Promise`\<`void`\>

***

### appendHighResImageToPageContainer()

> **appendHighResImageToPageContainer**(`pageNumber`): `Promise`\<`void`\>

Defined in: viewer/ui/PDFPageVirtualization.ts:590

Renders a high-resolution version of the specified PDF page as an image and appends it
to the page container. The rendered image is wrapped inside a container div which is then
appended to the element with the ID 'canva-presentation' within the corresponding page container.

#### Parameters

##### pageNumber

`number`

The number of the page to process.

#### Returns

`Promise`\<`void`\>

A promise that resolves once the high-resolution image container has been appended.

***

### calculatePagePositioning()

> **calculatePagePositioning**(): `Promise`\<`Map`\<`number`, `number`\>\>

Defined in: viewer/ui/PDFPageVirtualization.ts:253

Precalculates page positions and sets the container dimensions.
This helps in efficiently determining which pages should be rendered based on scrolling.

#### Returns

`Promise`\<`Map`\<`number`, `number`\>\>

A map storing page positions with their page numbers.

***

### destroy()

> **destroy**(): `void`

Defined in: viewer/ui/PDFPageVirtualization.ts:643

#### Returns

`void`

***

### generateThumbnail()

> **generateThumbnail**(): `Promise`\<`void`\>

Defined in: viewer/ui/PDFPageVirtualization.ts:226

Generates thumbnails for the document.

#### Returns

`Promise`\<`void`\>

***

### redrawVisiblePages()

> **redrawVisiblePages**(`targetPage`): `Promise`\<`void`\>

Defined in: viewer/ui/PDFPageVirtualization.ts:486

Redraws all visible pages based on the updated buffer and scale.

#### Parameters

##### targetPage

`number`

The page number used to determine the visible buffer range.

#### Returns

`Promise`\<`void`\>

A promise that resolves when all visible pages are rendered.

***

### updatePageBuffers()

> **updatePageBuffers**(`pageNumber`): `Promise`\<`void`\>

Defined in: viewer/ui/PDFPageVirtualization.ts:508

Updates the style and dimensions of all page buffers in the container.
Iterates over every element with the class 'a-page-view' and adjusts its position,
width, and height based on the corresponding PDF page's viewport.

#### Parameters

##### pageNumber

`null` | `number`

#### Returns

`Promise`\<`void`\>

A promise that resolves once all page buffers have been updated.
