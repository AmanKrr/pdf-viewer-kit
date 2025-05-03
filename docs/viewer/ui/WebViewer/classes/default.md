[**pdf-kit v1.5.0**](../../../../README.md)

***

[pdf-kit](../../../../modules.md) / [viewer/ui/WebViewer](../README.md) / default

# Class: default

Defined in: viewer/ui/WebViewer.ts:38

Manages the PDF viewer instance and provides various functionalities, including:
- Page navigation
- Zooming
- Searching
- Toolbar interactions

## Constructors

### Constructor

> **new default**(`pdfInstance`, `viewerOptions`, `parentContainer`, `pageParentContainer`): `WebViewer`

Defined in: viewer/ui/WebViewer.ts:61

Initializes the WebViewer instance.

#### Parameters

##### pdfInstance

`PDFDocumentProxy`

The PDF.js document instance.

##### viewerOptions

`ViewerLoadOptions`

Configuration for the viewer.

##### parentContainer

`HTMLElement`

The parent container where the viewer is rendered.

##### pageParentContainer

`HTMLElement`

The container holding the PDF pages.

#### Returns

`WebViewer`

## Properties

### \_annotationService

> `private` **\_annotationService**: [`AnnotationService`](../../../services/AnnotationService/classes/AnnotationService.md)

Defined in: viewer/ui/WebViewer.ts:45

***

### \_bindScrollHandler()

> `private` **\_bindScrollHandler**: (`event`) => `void`

Defined in: viewer/ui/WebViewer.ts:47

#### Parameters

##### event

`Event`

#### Returns

`void`

***

### \_cachedSideBarElement

> `private` **\_cachedSideBarElement**: `undefined` \| `HTMLElement`

Defined in: viewer/ui/WebViewer.ts:43

***

### \_downloadManager

> `private` **\_downloadManager**: [`DownloadManager`](../../../manager/PDFDownloadManager/classes/DownloadManager.md)

Defined in: viewer/ui/WebViewer.ts:48

***

### \_intersectionObserver?

> `private` `optional` **\_intersectionObserver**: `IntersectionObserver`

Defined in: viewer/ui/WebViewer.ts:51

***

### \_pageVirtualization

> `private` **\_pageVirtualization**: [`default`](../../PDFPageVirtualization/classes/default.md)

Defined in: viewer/ui/WebViewer.ts:39

***

### \_pdfInstance

> `private` **\_pdfInstance**: `PDFDocumentProxy`

Defined in: viewer/ui/WebViewer.ts:41

***

### \_pdfState

> `private` **\_pdfState**: [`default`](../../PDFState/classes/default.md)

Defined in: viewer/ui/WebViewer.ts:42

***

### \_toolbar

> `private` **\_toolbar**: `undefined` \| [`Toolbar`](../../PDFToolbar/classes/Toolbar.md)

Defined in: viewer/ui/WebViewer.ts:46

***

### \_viewerOptions

> `private` **\_viewerOptions**: `ViewerLoadOptions`

Defined in: viewer/ui/WebViewer.ts:40

***

### \_zoomHandler

> `private` **\_zoomHandler**: [`default`](../../PDFZoomHandler/classes/default.md)

Defined in: viewer/ui/WebViewer.ts:44

***

### ready

> **ready**: `Promise`\<`void`\>

Defined in: viewer/ui/WebViewer.ts:50

## Accessors

### annotation

#### Get Signature

> **get** **annotation**(): [`AnnotationService`](../../../services/AnnotationService/classes/AnnotationService.md)

Defined in: viewer/ui/WebViewer.ts:185

##### Returns

[`AnnotationService`](../../../services/AnnotationService/classes/AnnotationService.md)

***

### currentPageNumber

#### Get Signature

> **get** **currentPageNumber**(): `number`

Defined in: viewer/ui/WebViewer.ts:176

##### Returns

`number`

The currently active page number.

***

### totalPages

#### Get Signature

> **get** **totalPages**(): `number`

Defined in: viewer/ui/WebViewer.ts:181

##### Returns

`number`

The total number of pages in the PDF document.

***

### visiblePageNumbers

#### Get Signature

> **get** **visiblePageNumbers**(): `ReadonlySet`\<`number`\>

Defined in: viewer/ui/WebViewer.ts:171

##### Returnss

visible page numbers in the PDF viewer.

##### Returns

`ReadonlySet`\<`number`\>

## Methods

### \_addEvents()

> `private` **\_addEvents**(): `void`

Defined in: viewer/ui/WebViewer.ts:141

Adds event listeners for scrolling and updates page number input dynamically.

#### Returns

`void`

***

### \_onScroll()

> `private` **\_onScroll**(`event`): `void`

Defined in: viewer/ui/WebViewer.ts:148

#### Parameters

##### event

`Event`

#### Returns

`void`

***

### \_syncThumbnailScrollWithMainPageContainer()

> `private` **\_syncThumbnailScrollWithMainPageContainer**(): `void`

Defined in: viewer/ui/WebViewer.ts:155

Synchronizes the thumbnail sidebar scroll position with the currently viewed page.

#### Returns

`void`

***

### \_updateCurrentPageInput()

> `private` **\_updateCurrentPageInput**(): `void`

Defined in: viewer/ui/WebViewer.ts:326

Updates the current page number input field in the toolbar.

#### Returns

`void`

***

### destroy()

> **destroy**(): `void`

Defined in: viewer/ui/WebViewer.ts:370

#### Returns

`void`

***

### downloadPdf()

> **downloadPdf**(): `void`

Defined in: viewer/ui/WebViewer.ts:264

#### Returns

`void`

***

### firstPage()

> **firstPage**(): `void`

Defined in: viewer/ui/WebViewer.ts:242

Navigates to the first page of the PDF.

#### Returns

`void`

***

### goToPage()

> **goToPage**(`pageNumber`): `void`

Defined in: viewer/ui/WebViewer.ts:307

Navigates to a specific page in the PDF viewer.

#### Parameters

##### pageNumber

`number`

The target page number.

#### Returns

`void`

***

### lastPage()

> **lastPage**(): `void`

Defined in: viewer/ui/WebViewer.ts:252

Navigates to the last page of the PDF.

#### Returns

`void`

***

### nextPage()

> **nextPage**(): `void`

Defined in: viewer/ui/WebViewer.ts:216

Navigates to the next page in the PDF viewer.
If already on the last page, does nothing.

#### Returns

`void`

***

### observer()

> `private` **observer**(`callback`): `void`

Defined in: viewer/ui/WebViewer.ts:109

#### Parameters

##### callback

(`pageNumber`) => `void`

#### Returns

`void`

***

### previousPage()

> **previousPage**(): `void`

Defined in: viewer/ui/WebViewer.ts:232

Navigates to the previous page in the PDF viewer.
If already on the first page, does nothing.

#### Returns

`void`

***

### search()

> **search**(): `void`

Defined in: viewer/ui/WebViewer.ts:271

Toggles the visibility of the search box in the viewer.

#### Returns

`void`

***

### toogleThumbnailViewer()

> **toogleThumbnailViewer**(): `void`

Defined in: viewer/ui/WebViewer.ts:192

Toggles the visibility of the thumbnail viewer sidebar.

#### Returns

`void`

***

### toolbarButtonClick()

> **toolbarButtonClick**(`buttonName`, `event`): `Promise`\<`void`\>

Defined in: viewer/ui/WebViewer.ts:339

Handles toolbar button clicks and executes corresponding actions.

#### Parameters

##### buttonName

`string`

The name of the toolbar button clicked.

##### event

The event object associated with the action.

`Event` | `MouseEvent`

#### Returns

`Promise`\<`void`\>

***

### zoomIn()

> **zoomIn**(): `Promise`\<`void`\>

Defined in: viewer/ui/WebViewer.ts:282

Zooms into the PDF by increasing the scale.
The scale increases by 0.5 per zoom-in action, with a maximum limit of 4.0.

#### Returns

`Promise`\<`void`\>

***

### zoomOut()

> **zoomOut**(): `Promise`\<`void`\>

Defined in: viewer/ui/WebViewer.ts:290

Zooms out of the PDF by decreasing the scale.
The scale decreases by 0.5 per zoom-out action, with a minimum limit of 0.5.

#### Returns

`Promise`\<`void`\>
