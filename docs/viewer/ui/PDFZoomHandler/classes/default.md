[**pdf-kit v1.5.0**](../../../../README.md)

***

[pdf-kit](../../../../modules.md) / [viewer/ui/PDFZoomHandler](../README.md) / default

# Class: default

Defined in: viewer/ui/PDFZoomHandler.ts:34

Handles zooming operations (in, out, fit width, fit page) for the PDF viewer.
Updates PdfState, applies CSS transforms, preserves scroll position,
and coordinates with PageVirtualization for rendering.

## Constructors

### Constructor

> **new default**(`pdfState`, `pageVirtualization`, `options?`): `ZoomHandler`

Defined in: viewer/ui/PDFZoomHandler.ts:46

#### Parameters

##### pdfState

[`default`](../../PDFState/classes/default.md)

Shared PdfState instance for scale and page info.

##### pageVirtualization

[`default`](../../PDFPageVirtualization/classes/default.md)

Manages page measurements and rendering buffers.

##### options?

`ZoomOptions`

Optional zoom limits and step size.

#### Returns

`ZoomHandler`

## Properties

### \_onWindowResize()

> `private` **\_onWindowResize**: () => `void`

Defined in: viewer/ui/PDFZoomHandler.ts:39

#### Returns

`void`

***

### \_options

> `private` **\_options**: `ZoomOptions`

Defined in: viewer/ui/PDFZoomHandler.ts:37

***

### \_pageVirtualization

> `private` **\_pageVirtualization**: [`default`](../../PDFPageVirtualization/classes/default.md)

Defined in: viewer/ui/PDFZoomHandler.ts:36

***

### \_pdfState

> `private` **\_pdfState**: [`default`](../../PDFState/classes/default.md)

Defined in: viewer/ui/PDFZoomHandler.ts:35

## Methods

### \_adjustScrollPosition()

> `private` **\_adjustScrollPosition**(`targetPage`, `relativeScrollOffset`, `previousScale`, `newScale`): `void`

Defined in: viewer/ui/PDFZoomHandler.ts:145

After zoom, reposition scrollTop so that the same logical point
on the page remains visible.

#### Parameters

##### targetPage

`number`

Page index being held constant

##### relativeScrollOffset

`number`

Offset within page before zoom

##### previousScale

`number`

Scale before zoom

##### newScale

`number`

Scale after zoom

#### Returns

`void`

***

### \_applyCssScale()

> `private` **\_applyCssScale**(`scaleFactor`): `void`

Defined in: viewer/ui/PDFZoomHandler.ts:160

Apply CSS scaling by setting a custom property on the main page container.

#### Parameters

##### scaleFactor

`number`

The new zoom factor

#### Returns

`void`

***

### \_getScrollOffsetRelativeToPage()

> `private` **\_getScrollOffsetRelativeToPage**(`targetPage`): `number`

Defined in: viewer/ui/PDFZoomHandler.ts:130

Compute scrollTop minus the top coordinate of the target page,
giving the offset within that page.

#### Parameters

##### targetPage

`number`

Page index to calculate relative scroll for

#### Returns

`number`

***

### \_snapToStep()

> `private` **\_snapToStep**(`scale`): `number`

Defined in: viewer/ui/PDFZoomHandler.ts:62

#### Parameters

##### scale

`number`

#### Returns

`number`

***

### applyZoom()

> **applyZoom**(`newScale`): `Promise`\<`void`\>

Defined in: viewer/ui/PDFZoomHandler.ts:99

Apply a specific zoom level:
1. Calculate scroll offset relative to current page
2. Update PdfState.scale and CSS variables
3. Recompute page layout and buffers
4. Restore scroll to keep the same point in view
5. Emit scaleChange and redraw visible pages

#### Parameters

##### newScale

`number`

Desired scale factor

#### Returns

`Promise`\<`void`\>

***

### destroy()

> **destroy**(): `void`

Defined in: viewer/ui/PDFZoomHandler.ts:210

#### Returns

`void`

***

### fitPage()

> **fitPage**(): `Promise`\<`void`\>

Defined in: viewer/ui/PDFZoomHandler.ts:206

Reset zoom to 1:1 (original size).

#### Returns

`Promise`\<`void`\>

***

### fitWidth()

> **fitWidth**(): `Promise`\<`void`\>

Defined in: viewer/ui/PDFZoomHandler.ts:185

Zoom to fit the width of the widest page into the container.
Calculates original page widths and sets scale accordingly.

#### Returns

`Promise`\<`void`\>

***

### pan()

> **pan**(`deltaX`, `deltaY`): `void`

Defined in: viewer/ui/PDFZoomHandler.ts:173

Pan the view by adjusting scrollLeft/scrollTop.

#### Parameters

##### deltaX

`number`

Horizontal pan in pixels

##### deltaY

`number`

Vertical pan in pixels

#### Returns

`void`

***

### zoomIn()

> **zoomIn**(): `Promise`\<`void`\>

Defined in: viewer/ui/PDFZoomHandler.ts:70

Increase zoom by one step, up to the maximum scale.

#### Returns

`Promise`\<`void`\>

***

### zoomOut()

> **zoomOut**(): `Promise`\<`void`\>

Defined in: viewer/ui/PDFZoomHandler.ts:81

Decrease zoom by one step, down to the minimum scale.

#### Returns

`Promise`\<`void`\>
