[**pdf-kit v1.5.0**](../../../../README.md)

***

[pdf-kit](../../../../modules.md) / [viewer/manager/PDFDownloadManager](../README.md) / DownloadManager

# Class: DownloadManager

Defined in: viewer/manager/PDFDownloadManager.ts:25

Manages downloading of the current PDF, optionally embedding annotations.

## Constructors

### Constructor

> **new DownloadManager**(`_annotationService`, `_pdfState`, `_sourceUrl?`, `_cacheSource?`): `DownloadManager`

Defined in: viewer/manager/PDFDownloadManager.ts:32

#### Parameters

##### \_annotationService

[`AnnotationService`](../../../services/AnnotationService/classes/AnnotationService.md)

Service holding and exporting annotations.

##### \_pdfState

[`default`](../../../ui/PDFState/classes/default.md)

Shared PdfState instance.

##### \_sourceUrl?

`string`

Optional URL to fetch PDF if in-memory bytes unavailable.

##### \_cacheSource?

`boolean` = `false`

If true, reuse original bytes; otherwise clone for GC.

#### Returns

`DownloadManager`

## Properties

### \_annotationService

> `private` `readonly` **\_annotationService**: [`AnnotationService`](../../../services/AnnotationService/classes/AnnotationService.md)

Defined in: viewer/manager/PDFDownloadManager.ts:33

Service holding and exporting annotations.

***

### \_cacheSource

> `private` `readonly` **\_cacheSource**: `boolean` = `false`

Defined in: viewer/manager/PDFDownloadManager.ts:36

If true, reuse original bytes; otherwise clone for GC.

***

### \_pdfState

> `private` `readonly` **\_pdfState**: [`default`](../../../ui/PDFState/classes/default.md)

Defined in: viewer/manager/PDFDownloadManager.ts:34

Shared PdfState instance.

***

### \_sourceUrl?

> `private` `readonly` `optional` **\_sourceUrl**: `string`

Defined in: viewer/manager/PDFDownloadManager.ts:35

Optional URL to fetch PDF if in-memory bytes unavailable.

## Methods

### \_buildViewportMap()

> `private` **\_buildViewportMap**(): `Promise`\<`Map`\<`number`, `PageViewport`\>\>

Defined in: viewer/manager/PDFDownloadManager.ts:83

Builds a map of PageViewport objects for each PDF page,
using the current zoom scale from PdfState.

#### Returns

`Promise`\<`Map`\<`number`, `PageViewport`\>\>

***

### \_getOriginalBytes()

> `private` **\_getOriginalBytes**(): `Promise`\<`ArrayBuffer`\>

Defined in: viewer/manager/PDFDownloadManager.ts:58

Retrieves the source PDF bytes from memory or via HTTP fetch.

#### Returns

`Promise`\<`ArrayBuffer`\>

***

### \_triggerBrowserDownload()

> `private` **\_triggerBrowserDownload**(`bytes`, `filename`): `void`

Defined in: viewer/manager/PDFDownloadManager.ts:101

Triggers the browser's download mechanism for the given PDF bytes.

#### Parameters

##### bytes

`Uint8Array`

The PDF file data.

##### filename

`string`

Name (without extension) for the downloaded file.

#### Returns

`void`

***

### download()

> **download**(`filename`): `Promise`\<`void`\>

Defined in: viewer/manager/PDFDownloadManager.ts:45

Initiates a download of the PDF.
If annotations exist, they will be embedded into a copy of the PDF.

#### Parameters

##### filename

`string` = `''`

Optional filename (without extension); defaults to timestamp.

#### Returns

`Promise`\<`void`\>
