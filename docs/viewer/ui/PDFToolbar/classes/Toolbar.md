[**pdf-kit v1.5.0**](../../../../README.md)

***

[pdf-kit](../../../../modules.md) / [viewer/ui/PDFToolbar](../README.md) / Toolbar

# Class: Toolbar

Defined in: viewer/ui/PDFToolbar.ts:27

Implements the main toolbar UI for the PDF viewer.
Allows navigation, zoom, search, annotations, and download controls.

## Implements

- `IToolbar`

## Constructors

### Constructor

> **new Toolbar**(`viewer`, `pdfState`, `buttons`, `options`): `Toolbar`

Defined in: viewer/ui/PDFToolbar.ts:42

#### Parameters

##### viewer

[`default`](../../WebViewer/classes/default.md)

The WebViewer instance.

##### pdfState

[`default`](../../PDFState/classes/default.md)

Shared state object for PDF interactions.

##### buttons

`ToolbarButtonConfig`[] = `[]`

Optional custom button configurations.

##### options

`ToolbarOptions` = `{}`

ToolbarOptions to enable/disable features.

#### Returns

`Toolbar`

## Properties

### \_annotationToolbar

> `private` **\_annotationToolbar**: [`AnnotationToolbar`](../../PDFAnnotationToolbar/classes/AnnotationToolbar.md)

Defined in: viewer/ui/PDFToolbar.ts:33

***

### \_buttons

> `private` **\_buttons**: `ToolbarButtonConfig`[]

Defined in: viewer/ui/PDFToolbar.ts:29

***

### \_container

> `private` **\_container**: `HTMLElement`

Defined in: viewer/ui/PDFToolbar.ts:28

***

### \_opts

> `private` **\_opts**: `Required`\<`ToolbarOptions`\>

Defined in: viewer/ui/PDFToolbar.ts:30

***

### \_pdfState

> `private` **\_pdfState**: [`default`](../../PDFState/classes/default.md)

Defined in: viewer/ui/PDFToolbar.ts:31

***

### \_searchBarOpen

> `private` **\_searchBarOpen**: `boolean` = `false`

Defined in: viewer/ui/PDFToolbar.ts:34

***

### \_viewer

> `private` **\_viewer**: [`default`](../../WebViewer/classes/default.md)

Defined in: viewer/ui/PDFToolbar.ts:32

## Methods

### \_\_addSeparator()

> `protected` **\_\_addSeparator**(): `HTMLDivElement`

Defined in: viewer/ui/PDFToolbar.ts:270

Creates a visual separator between toolbar items.

#### Returns

`HTMLDivElement`

A separator div element.

***

### \_\_createButton()

> `protected` **\_\_createButton**(`cfg`): `HTMLButtonElement`

Defined in: viewer/ui/PDFToolbar.ts:235

Creates a toolbar button element.

#### Parameters

##### cfg

`ToolbarButtonConfig`

Configuration for the button.

#### Returns

`HTMLButtonElement`

The constructed HTMLButtonElement.

***

### \_\_wrapItem()

> `protected` **\_\_wrapItem**(`itemId`): `HTMLDivElement`

Defined in: viewer/ui/PDFToolbar.ts:259

Wraps a toolbar item for consistent styling.

#### Parameters

##### itemId

`string`

Identifier for the toolbar item.

#### Returns

`HTMLDivElement`

A wrapper div element.

***

### \_closeAnnotationToolbar()

> `private` **\_closeAnnotationToolbar**(): `void`

Defined in: viewer/ui/PDFToolbar.ts:222

Closes the annotation toolbar if open.

#### Returns

`void`

***

### \_defaultButtons()

> `private` **\_defaultButtons**(): `ToolbarButtonConfig`[]

Defined in: viewer/ui/PDFToolbar.ts:96

Builds the default toolbar buttons based on enabled options.

#### Returns

`ToolbarButtonConfig`[]

Array of ToolbarButtonConfig for default buttons.

***

### destroy()

> **destroy**(): `void`

Defined in: viewer/ui/PDFToolbar.ts:318

Destroys the toolbar and its sub-components.

#### Returns

`void`

#### Implementation of

`IToolbar.destroy`

***

### render()

> **render**(`container`): `void`

Defined in: viewer/ui/PDFToolbar.ts:69

Renders the toolbar into the specified container element.

#### Parameters

##### container

`HTMLElement`

The HTML element to host the toolbar.

#### Returns

`void`

#### Implementation of

`IToolbar.render`

***

### \_renderPageNumberControls()

> `private` `static` **\_renderPageNumberControls**(`viewer`): `HTMLElement`

Defined in: viewer/ui/PDFToolbar.ts:282

Renders the "page X of Y" page number control.

#### Parameters

##### viewer

[`default`](../../WebViewer/classes/default.md)

The WebViewer instance.

#### Returns

`HTMLElement`

An HTMLElement containing page navigation controls.
