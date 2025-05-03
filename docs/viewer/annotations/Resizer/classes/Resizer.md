[**pdf-kit v1.5.0**](../../../../README.md)

***

[pdf-kit](../../../../modules.md) / [viewer/annotations/Resizer](../README.md) / Resizer

# Class: Resizer

Defined in: viewer/annotations/Resizer.ts:25

Provides draggable and resizable handles for an SVG annotation.
Supports both <rect> and <ellipse> elements.

## Constructors

### Constructor

> **new Resizer**(`svg`, `element`, `onShapeUpdate`, `constraints`): `Resizer`

Defined in: viewer/annotations/Resizer.ts:57

#### Parameters

##### svg

`SVGSVGElement`

The annotation’s SVG container.

##### element

`SVGGraphicsElement`

The inner <rect> or <ellipse> element to be resized.

##### onShapeUpdate

() => `void`

Callback invoked after resize or drag completes.

##### constraints

`any`

Bounding rectangle for drag/resize constraints.

#### Returns

`Resizer`

## Properties

### \_activeResizerIndex

> `private` **\_activeResizerIndex**: `number` = `-1`

Defined in: viewer/annotations/Resizer.ts:32

***

### \_constraints

> `private` **\_constraints**: `DOMRect`

Defined in: viewer/annotations/Resizer.ts:41

***

### \_element

> `private` **\_element**: `SVGGraphicsElement`

Defined in: viewer/annotations/Resizer.ts:27

***

### \_isDragging

> `private` **\_isDragging**: `boolean` = `false`

Defined in: viewer/annotations/Resizer.ts:33

***

### \_isResizing

> `private` **\_isResizing**: `boolean` = `false`

Defined in: viewer/annotations/Resizer.ts:31

***

### \_kind

> `private` `readonly` **\_kind**: `Kind`

Defined in: viewer/annotations/Resizer.ts:48

***

### \_marginBottom

> `private` **\_marginBottom**: `number` = `0`

Defined in: viewer/annotations/Resizer.ts:38

***

### \_marginLeft

> `private` **\_marginLeft**: `number` = `0`

Defined in: viewer/annotations/Resizer.ts:35

***

### \_marginRight

> `private` **\_marginRight**: `number` = `0`

Defined in: viewer/annotations/Resizer.ts:37

***

### \_marginTop

> `private` **\_marginTop**: `number` = `0`

Defined in: viewer/annotations/Resizer.ts:36

***

### \_onShapeUpdateCallback()

> `private` **\_onShapeUpdateCallback**: () => `void`

Defined in: viewer/annotations/Resizer.ts:40

#### Returns

`void`

***

### \_origCX

> `private` **\_origCX**: `number` = `0`

Defined in: viewer/annotations/Resizer.ts:43

***

### \_origCY

> `private` **\_origCY**: `number` = `0`

Defined in: viewer/annotations/Resizer.ts:44

***

### \_origRX

> `private` **\_origRX**: `number` = `0`

Defined in: viewer/annotations/Resizer.ts:45

***

### \_origRY

> `private` **\_origRY**: `number` = `0`

Defined in: viewer/annotations/Resizer.ts:46

***

### \_overlayLine

> `private` **\_overlayLine**: `SVGLineElement`

Defined in: viewer/annotations/Resizer.ts:49

***

### \_overlayRect

> `private` **\_overlayRect**: `SVGRectElement`

Defined in: viewer/annotations/Resizer.ts:29

***

### \_overlaySvg

> `private` **\_overlaySvg**: `SVGSVGElement`

Defined in: viewer/annotations/Resizer.ts:28

***

### \_resizers

> `private` **\_resizers**: `SVGCircleElement`[] = `[]`

Defined in: viewer/annotations/Resizer.ts:30

***

### \_svg

> `private` **\_svg**: `SVGSVGElement`

Defined in: viewer/annotations/Resizer.ts:26

## Accessors

### constraintsValue

#### Set Signature

> **set** **constraintsValue**(`constraints`): `void`

Defined in: viewer/annotations/Resizer.ts:93

##### Parameters

###### constraints

`DOMRect`

##### Returns

`void`

## Methods

### \_createOverlay()

> `private` **\_createOverlay**(): `void`

Defined in: viewer/annotations/Resizer.ts:163

Creates an overlay SVG element with a dashed outline for dragging.

#### Returns

`void`

***

### \_createResizerHandles()

> `private` **\_createResizerHandles**(): `void`

Defined in: viewer/annotations/Resizer.ts:191

Creates eight circular handles for resizing.

#### Returns

`void`

***

### \_cursorForHandle()

> `private` **\_cursorForHandle**(`index`): `string`

Defined in: viewer/annotations/Resizer.ts:227

#### Parameters

##### index

`number`

Handle index (0–7)

#### Returns

`string`

CSS cursor for the given handle

***

### \_onDragStart()

> `private` **\_onDragStart**(`event`): `void`

Defined in: viewer/annotations/Resizer.ts:471

Called when the overlay’s outline is pressed to drag the annotation.

#### Parameters

##### event

`MouseEvent`

#### Returns

`void`

***

### \_onHandleMouseDown()

> `private` **\_onHandleMouseDown**(`event`, `index`): `void`

Defined in: viewer/annotations/Resizer.ts:286

Called when a resize handle is pressed.

#### Parameters

##### event

`MouseEvent`

##### index

`number`

#### Returns

`void`

***

### \_onLineDragStart()

> `private` **\_onLineDragStart**(`event`): `void`

Defined in: viewer/annotations/Resizer.ts:409

#### Parameters

##### event

`MouseEvent`

#### Returns

`void`

***

### \_onLineMouseDown()

> `private` **\_onLineMouseDown**(`event`, `index`): `void`

Defined in: viewer/annotations/Resizer.ts:318

#### Parameters

##### event

`any`

##### index

`number`

#### Returns

`void`

***

### \_resizeRect()

> `private` **\_resizeRect**(`index`, `initialLeft`, `initialTop`, `initialWidth`, `initialHeight`, `dx`, `dy`): `void`

Defined in: viewer/annotations/Resizer.ts:528

Handles resizing logic for rectangles and ellipses.

#### Parameters

##### index

`number`

##### initialLeft

`number`

##### initialTop

`number`

##### initialWidth

`number`

##### initialHeight

`number`

##### dx

`number`

##### dy

`number`

#### Returns

`void`

***

### \_updateEllipse()

> `private` **\_updateEllipse**(`newWidth`, `newHeight`): `void`

Defined in: viewer/annotations/Resizer.ts:621

Adjusts an ellipse’s cx, cy, rx, ry after resize.

#### Parameters

##### newWidth

`number`

##### newHeight

`number`

#### Returns

`void`

***

### \_updateHandlePositions()

> `private` **\_updateHandlePositions**(`width`, `height`): `void`

Defined in: viewer/annotations/Resizer.ts:265

Positions the eight handles at the corners and midpoints of the overlay.

#### Parameters

##### width

`number`

##### height

`number`

#### Returns

`void`

***

### \_updateOverlayDimensions()

> `private` **\_updateOverlayDimensions**(`x`, `y`, `width`, `height`): `void`

Defined in: viewer/annotations/Resizer.ts:254

Updates the overlay outline and repositions the handles.
Note that here the overlay’s internal coordinate system has (0,0) at its top‐left.

#### Parameters

##### x

`number`

##### y

`number`

##### width

`number`

##### height

`number`

#### Returns

`void`

***

### \_updateSvgAndRect()

> `private` **\_updateSvgAndRect**(`newLeft`, `newTop`, `newWidth`, `newHeight`): `void`

Defined in: viewer/annotations/Resizer.ts:650

Updates the svg container’s absolute position and size—and then adjusts the inner rect.

The inner rect is always placed using the stored margins:
  - x = marginLeft
  - y = marginTop
  - width = (svg width) – (marginLeft + marginRight)
  - height = (svg height) – (marginTop + marginBottom)

#### Parameters

##### newLeft

`number`

##### newTop

`number`

##### newWidth

`number`

##### newHeight

`number`

#### Returns

`void`

***

### removeResizers()

> **removeResizers**(): `void`

Defined in: viewer/annotations/Resizer.ts:153

Removes the overlay and all its handles.

#### Returns

`void`

***

### syncOverlayToSvg()

> **syncOverlayToSvg**(): `void`

Defined in: viewer/annotations/Resizer.ts:100

Syncs the overlay’s position and size to the annotation svg’s current absolute position and dimensions.

#### Returns

`void`
