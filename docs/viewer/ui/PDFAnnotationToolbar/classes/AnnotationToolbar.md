[**pdf-kit v1.5.0**](../../../../README.md)

***

[pdf-kit](../../../../modules.md) / [viewer/ui/PDFAnnotationToolbar](../README.md) / AnnotationToolbar

# Class: AnnotationToolbar

Defined in: viewer/ui/PDFAnnotationToolbar.ts:29

A toolbar for creating and configuring annotations using only DOM APIs.
No frameworks required.

## Constructors

### Constructor

> **new AnnotationToolbar**(`viewer`, `pdfState`): `AnnotationToolbar`

Defined in: viewer/ui/PDFAnnotationToolbar.ts:63

#### Parameters

##### viewer

[`default`](../../WebViewer/classes/default.md)

The WebViewer instance containing PDF pages.

##### pdfState

[`default`](../../PDFState/classes/default.md)

Shared PDF state for events and configuration.

#### Returns

`AnnotationToolbar`

## Properties

### \_activeAnnotation

> `private` **\_activeAnnotation**: `null` \| [`IAnnotation`](../../../../interface/IAnnotation/interfaces/IAnnotation.md) = `null`

Defined in: viewer/ui/PDFAnnotationToolbar.ts:56

***

### \_borderStyle

> `private` **\_borderStyle**: `string` = `'Solid'`

Defined in: viewer/ui/PDFAnnotationToolbar.ts:34

***

### \_color

> `private` **\_color**: `string` = `'red'`

Defined in: viewer/ui/PDFAnnotationToolbar.ts:30

***

### \_fillColor

> `private` **\_fillColor**: `string` = `'transparent'`

Defined in: viewer/ui/PDFAnnotationToolbar.ts:31

***

### \_isShapeDropdownOpen

> `private` **\_isShapeDropdownOpen**: `boolean` = `false`

Defined in: viewer/ui/PDFAnnotationToolbar.ts:48

***

### \_isToolbarPropertiesContainerOpen

> `private` **\_isToolbarPropertiesContainerOpen**: `boolean` = `false`

Defined in: viewer/ui/PDFAnnotationToolbar.ts:49

***

### \_onAnnotationCreated()

> `private` **\_onAnnotationCreated**: (`e`) => `void`

Defined in: viewer/ui/PDFAnnotationToolbar.ts:54

Callback when an annotation is finished; resets toolbar state.

#### Parameters

##### e

`any`

#### Returns

`void`

***

### \_opacity

> `private` **\_opacity**: `number` = `1`

Defined in: viewer/ui/PDFAnnotationToolbar.ts:32

***

### \_pdfState

> `private` **\_pdfState**: [`default`](../../PDFState/classes/default.md)

Defined in: viewer/ui/PDFAnnotationToolbar.ts:51

***

### \_popper

> `private` **\_popper**: `null` \| `Instance` = `null`

Defined in: viewer/ui/PDFAnnotationToolbar.ts:57

***

### \_selectedShape

> `private` **\_selectedShape**: `ShapeType` \| `"none"` = `'none'`

Defined in: viewer/ui/PDFAnnotationToolbar.ts:45

***

### \_selectedShapeIcon

> `private` **\_selectedShapeIcon**: `string` = `'none'`

Defined in: viewer/ui/PDFAnnotationToolbar.ts:46

***

### \_shapeDropdown

> `private` **\_shapeDropdown**: `HTMLDivElement`

Defined in: viewer/ui/PDFAnnotationToolbar.ts:38

***

### \_shapeOptions

> `private` **\_shapeOptions**: `object`

Defined in: viewer/ui/PDFAnnotationToolbar.ts:40

#### circle

> **circle**: `string` = `'Ellipse'`

#### pen\_size\_1

> **pen\_size\_1**: `string` = `'Line'`

#### rectangle

> **rectangle**: `string` = `'Rectangle'`

***

### \_thickness

> `private` **\_thickness**: `number` = `2`

Defined in: viewer/ui/PDFAnnotationToolbar.ts:33

***

### \_toolbarContainer

> `private` **\_toolbarContainer**: `HTMLDivElement`

Defined in: viewer/ui/PDFAnnotationToolbar.ts:36

***

### \_toolbarPropertiesContainer

> `private` **\_toolbarPropertiesContainer**: `HTMLDivElement`

Defined in: viewer/ui/PDFAnnotationToolbar.ts:37

***

### \_viewer

> `private` **\_viewer**: [`default`](../../WebViewer/classes/default.md)

Defined in: viewer/ui/PDFAnnotationToolbar.ts:52

## Methods

### \_createBorderDropdown()

> `private` **\_createBorderDropdown**(`labelText`, `initialStyle`, `onSelect`): `HTMLDivElement`

Defined in: viewer/ui/PDFAnnotationToolbar.ts:577

Create a dropdown to select border style: Solid, Dashed, or Dotted.

#### Parameters

##### labelText

`"Border"`

##### initialStyle

`string`

##### onSelect

(`style`) => `void`

#### Returns

`HTMLDivElement`

***

### \_createColorDropdown()

> `private` **\_createColorDropdown**(`labelText`, `initialColor`, `onColorSelect`, `includeTransparent`): `HTMLDivElement`

Defined in: viewer/ui/PDFAnnotationToolbar.ts:376

Create a color picker dropdown (stroke or fill).

#### Parameters

##### labelText

`"Color"` | `"Fill"`

##### initialColor

`string`

##### onColorSelect

(`val`) => `void`

##### includeTransparent

`boolean` = `false`

#### Returns

`HTMLDivElement`

***

### \_createDropdownSlider()

> `private` **\_createDropdownSlider**(`labelText`, `min`, `max`, `initialValue`, `displayValueFn`, `onValueChange`): `HTMLDivElement`

Defined in: viewer/ui/PDFAnnotationToolbar.ts:458

Create a slider dropdown for numeric values (opacity or thickness).

#### Parameters

##### labelText

`"Opacity"` | `"Thickness"`

##### min

`number`

##### max

`number`

##### initialValue

`number`

##### displayValueFn

(`v`) => `string`

##### onValueChange

(`v`) => `void`

#### Returns

`HTMLDivElement`

***

### \_createGoBackButton()

> `private` **\_createGoBackButton**(): `void`

Defined in: viewer/ui/PDFAnnotationToolbar.ts:252

Create the Back button for the toolbar.

#### Returns

`void`

***

### \_createToolbarPropertiesContainer()

> `private` **\_createToolbarPropertiesContainer**(): `void`

Defined in: viewer/ui/PDFAnnotationToolbar.ts:276

Create the properties panel (color, fill, opacity, thickness, border).

#### Returns

`void`

***

### \_deselectColorPicker()

> `private` **\_deselectColorPicker**(): `void`

Defined in: viewer/ui/PDFAnnotationToolbar.ts:676

Remove active selection styles from color pickers.

#### Returns

`void`

***

### \_handleAnnotationCreated()

> `private` **\_handleAnnotationCreated**(`e`): `void`

Defined in: viewer/ui/PDFAnnotationToolbar.ts:72

Callback when an annotation is finished; resets toolbar state.

#### Parameters

##### e

`any`

#### Returns

`void`

***

### \_initAnnotationListners()

> `private` **\_initAnnotationListners**(`enable`, `pageNumber`): `void`

Defined in: viewer/ui/PDFAnnotationToolbar.ts:104

Registers or unregisters mouse-down listener for new annotations.

#### Parameters

##### enable

`boolean`

##### pageNumber

`number`

#### Returns

`void`

***

### \_injectToolbarContainers()

> `private` **\_injectToolbarContainers**(`insertToolbar`, `insertProps`): `void`

Defined in: viewer/ui/PDFAnnotationToolbar.ts:219

Insert toolbar elements into the PDF viewer DOM.

#### Parameters

##### insertToolbar

`boolean`

##### insertProps

`boolean`

#### Returns

`void`

***

### \_popover()

> `private` **\_popover**(`isVisible`, `button`, `dropdown`): `void`

Defined in: viewer/ui/PDFAnnotationToolbar.ts:342

#### Parameters

##### isVisible

`boolean`

##### button

`HTMLButtonElement`

##### dropdown

`HTMLDivElement`

#### Returns

`void`

***

### \_removeShapeDropdown()

> `private` **\_removeShapeDropdown**(): `void`

Defined in: viewer/ui/PDFAnnotationToolbar.ts:244

Remove the shape dropdown from the DOM.

#### Returns

`void`

***

### \_removeToolbarContainer()

> `private` **\_removeToolbarContainer**(): `void`

Defined in: viewer/ui/PDFAnnotationToolbar.ts:228

Remove the main toolbar from the DOM.

#### Returns

`void`

***

### \_removeToolbarPropertiesContainer()

> `private` **\_removeToolbarPropertiesContainer**(): `void`

Defined in: viewer/ui/PDFAnnotationToolbar.ts:235

Remove the properties panel from the DOM.

#### Returns

`void`

***

### \_selectShape()

> `private` **\_selectShape**(`icon`, `shape`): `void`

Defined in: viewer/ui/PDFAnnotationToolbar.ts:636

Set the selected shape and update toolbar accordingly.

#### Parameters

##### icon

`string`

##### shape

`ShapeType`

#### Returns

`void`

***

### \_toggleShapeDropdown()

> `private` **\_toggleShapeDropdown**(`button`): `void`

Defined in: viewer/ui/PDFAnnotationToolbar.ts:652

Toggle the visibility of the shape dropdown menu.

#### Parameters

##### button

`HTMLButtonElement`

#### Returns

`void`

***

### createToolbarButton()

> **createToolbarButton**(`config`): `HTMLElement`

Defined in: viewer/ui/PDFAnnotationToolbar.ts:684

Create a generic toolbar button element.

#### Parameters

##### config

`ToolbarButtonConfig`

#### Returns

`HTMLElement`

***

### destroy()

> **destroy**(): `void`

Defined in: viewer/ui/PDFAnnotationToolbar.ts:695

Cleanup toolbar and event handlers.

#### Returns

`void`

***

### handleBackClick()

> `private` **handleBackClick**(): `void`

Defined in: viewer/ui/PDFAnnotationToolbar.ts:671

Handle Back button click: destroy toolbar and reset state.

#### Returns

`void`

***

### parentWrapper()

> **parentWrapper**(`config`): `HTMLElement`

Defined in: viewer/ui/PDFAnnotationToolbar.ts:267

Wrap a toolbar button in a consistent container for layout & tooltip.

#### Parameters

##### config

`any`

#### Returns

`HTMLElement`

***

### render()

> **render**(): `void`

Defined in: viewer/ui/PDFAnnotationToolbar.ts:134

Construct and attach the annotation toolbar UI.

#### Returns

`void`

***

### toogleAnnotationDrawing()

> **toogleAnnotationDrawing**(): `void`

Defined in: viewer/ui/PDFAnnotationToolbar.ts:84

Enable or disable annotation drawing cursors and listeners.

#### Returns

`void`

***

### updateDrawConfig()

> `private` **updateDrawConfig**(): `void`

Defined in: viewer/ui/PDFAnnotationToolbar.ts:116

Apply current toolbar settings to all visible page annotation managers.

#### Returns

`void`
