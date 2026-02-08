# API Reference

## PdfViewerKit

The static entry point for the library.

### Methods

#### `load(options: LoadOptions): Promise<IPDFViewerInstance>`

Loads a PDF document into a container.

- **options**: Configuration object for the viewer.
- **Returns**: A promise that resolves to the viewer instance facade.

#### `getInstance(instanceId: string): IPDFViewerInstance | undefined`

Retrieve an active viewer instance by its ID.

#### `getAllInstances(): IPDFViewerInstance[]`

Retrieve all active viewer instances.

#### `unload(instanceId: string): Promise<void>`

Unload and destroy a specific viewer instance.

#### `detach(containerId: string): Promise<void>`

Unload the viewer associated with a specific DOM container.

---

## IPDFViewerInstance

The main interface for interacting with a running viewer instance.

### Properties

| Property | Type | Description |
| :--- | :--- | :--- |
| `instanceId` | `string` | Unique identifier for this instance. |
| `containerId` | `string` | ID of the DOM element containing the viewer. |
| `currentPage` | `number` | The current page number (1-based). |
| `totalPages` | `number` | Total number of pages in the document. |
| `currentScale` | `number` | Current zoom level (1.0 = 100%). |
| `isReady` | `boolean` | True if the document is fully loaded. |
| `isDestroyed` | `boolean` | True if the instance has been destroyed. |

### Methods

#### Navigation

- **`nextPage(): void`**: Go to the next page.
- **`previousPage(): void`**: Go to the previous page.
- **`firstPage(): void`**: Go to the first page.
- **`lastPage(): void`**: Go to the last page.
- **`goToPage(pageNumber: number): void`**: Jump to a specific page.

#### Zoom

- **`zoomIn(): Promise<void>`**: Increase zoom level (adds 0.5 to scale).
- **`zoomOut(): Promise<void>`**: Decrease zoom level (subtracts 0.5 from scale).
- **`setZoom(scale: number): Promise<void>`**: Set exact zoom level.

#### Actions

- **`download(filename?: string): Promise<void>`**: Download the PDF with annotations.
- **`destroy(): Promise<void>`**: Clean up the instance.

### Sub-Modules

The instance exposes specialized interfaces for distinct features:

- **`events`**: Event handling system.
- **`annotations`**: Annotation management.
- **`search`**: Text search functionality.
- **`toolbar`**: Toolbar customization.

---

## LoadOptions

Configuration object passed to `PdfViewerKit.load()`.

| Option | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `containerId` | `string` | **Required** | ID of the DOM element to mount the viewer. |
| `document` | `string` \| `URL` | - | URL to the PDF file. |
| `data` | `ArrayBuffer` \| `Uint8Array` | - | Binary PDF data (alternative to `document`). |
| `initialZoomLevel` | `number` | - | Initial zoom level (e.g., 1.5). |
| `maxDefaultZoomLevel` | `number` | 5.0 | Maximum allowed zoom level. |
| `enableTiling` | `boolean` | `true` | Enable Google Maps-style progressive rendering. |
| `disableTextSelection` | `boolean` | `false` | Prevent text selection. |
| `printMode` | `boolean` | `false` | Enable print capability. |
| `password` | `string` | - | Password for encrypted PDFs. |
| `withCredentials` | `boolean` | `false` | Send cookies with cross-origin requests. |
| `toolbarOptions` | `object` | - | Customize toolbar visibility (see below). |

### Tile Configuration (`tileConfig`)

Fine-tune the rendering engine.

| Option | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `tileSize` | `number` | `512` | Size of each tile in pixels. |
| `maxCachedTiles` | `number` | `100` | Limits memory usage by evicting old tiles. |
| `progressiveRendering` | `boolean` | `true` | Show low-res preview while high-res loads. |
| `enableHighDPI` | `boolean` | `true` | Render sharper tiles on retina screens. |

### Toolbar Options

| Option | Default | Description |
| :--- | :--- | :--- |
| `showThumbnail` | `true` | Show sidebar toggle button. |
| `showDownload` | `true` | Show download button. |
| `showZoom` | `true` | Show zoom in/out buttons. |
| `showSearch` | `true` | Show search button. |
| `showPrint` | `true` | Show print button. |

---

## Events

Listen to these events via `instance.events.on()`.

| Event | Payload | Description |
| :--- | :--- | :--- |
| `ANNOTATION_CREATED` | `{ id, type, pageNumber }` | New annotation added. |
| `ANNOTATION_UPDATED` | `{ id, updates }` | Annotation modified. |
| `ANNOTATION_DELETED` | `{ id }` | Annotation removed. |
| `ANNOTATION_SELECTED` | `{ annotation }` | Annotation selected. |
| `ANNOTATION_DESELECT` | - | Annotation deselected. |
