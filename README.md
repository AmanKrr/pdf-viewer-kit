# pdf-viewer-kit

PDF-Kit is a versatile, framework-agnostic library designed to render, manipulate, and interact with PDF documents seamlessly. Whether you're building a React, Next.js, Angular, or any other frontend application, PDF-Kit provides you with a well-structured, modular, and feature-rich solution for embedding PDF viewers into your web applications.

Doc: https://github.com/AmanKrr/pdf-kit/wiki

### Overview

**pdf-kit** is an open-source, robust PDF viewer and annotation library built on top of **pdf.js**, fully implemented in TypeScript. The primary goal of pdf-kit is to offer high-performance, customizable PDF viewing and annotation capabilities that closely match the experience provided by commercial libraries like PSPDFKit.

### Features

#### Current Capabilities

* **High-Performance PDF Viewing**: Efficient rendering of PDF documents using pdf.js.
* **Annotations**: Current support includes rectangle, ellipse, and line annotations with drawing and resizing functionalities.
* **Downloadable Annotated PDFs**: Users can export PDFs along with drawn annotations (rectangle, ellipse, and line).
* **Optimized Text Selection**: Enhanced text selection, significantly improving usability over the standard pdf.js implementation.
* **Text Extraction**: Extract text content from drawn rectangle annotations efficiently.
* **Thumbnails**: Fast page navigation via thumbnail previews.
* **Customizable Toolbar**: Users can either modify default toolbar options or pass a fully custom toolbar.
* **Multiple Document Sources**: Fetch documents from URLs, local storage, and authorization-supported endpoints.
* **Memory Efficiency**: Focused optimizations to minimize memory usage during document rendering and interaction.

#### Future Roadmap

* **Additional Annotations**: Expand annotation capabilities beyond rectangles, ellipses, and lines.
* **Text Highlighting**: Introduce and optimize text highlighting features.
* **Tiling**: Implement page tiling for improved memory management, crucial for handling large documents.
* **Fit Page and Fit Width**: Introduce zoom features for enhanced user experience.
* **Search Functionality Enhancements**: Improve search highlight alignment and activate search word suggestions.
* **Real-Time Resizing**: Enhance resizing experience to achieve real-time responsiveness.

### Installation

Install pdf-kit via npm:

```bash
npm install pdf-kit
```

### Quick Start

```typescript
import { PdfKit, RectangleConfig } from 'pdf-kit';

PdfKit.load({
  document: 'adient-test.pdf',
  containerId: 'view-pdf',
  toolbarOptions: {
    showThumbnail: true,
    showSearch: true,
  },
}).then((instances) => {
  if (instances) {
    const annotationId = instances.annotation.addAnnotation({
      pageNumber: 2,
      x0: 151.219,
      y0: 159,
      x1: 212,
      y1: 193,
      fillColor: 'blue',
      strokeColor: 'transparent',
      strokeWidth: 0,
      strokeStyle: 'none',
      opacity: 0.1,
      type: 'rectangle',
    } as RectangleConfig);

    instances.annotation.getTextInsideRectangle(annotationId).then((text: string) => {
      console.log('Extracted Text:', text);
    });
  }
});

// Cleanup
PdfKit.unloadAll();
```

### API Documentation

#### Loading and Unloading

* `PdfKit.load(options: LoadOptions): Promise<WebViewer | undefined>`: Loads and displays a PDF.
* `PdfKit.unload(containerId: string): void`: Cleans up a loaded PDF.
* `PdfKit.unloadAll(): void`: Unloads all PDF instances.

#### Viewer Methods

* Page navigation (`nextPage()`, `previousPage()`, `firstPage()`, `lastPage()`, `goToPage(pageNumber: number)`)
* Zoom controls (`zoomIn()`, `zoomOut()`)
* Search control (`search()`)
* Download PDF (`downloadPdf()`)
* Thumbnail visibility (`toogleThumbnailViewer()`)

#### Annotation Methods

* Add annotations (`addAnnotation(config: ShapeConfig)`)
* Update annotations (`updateAnnotation(annotationId: string, updatedData: Partial<ShapeConfig>)`)
* Delete annotations (`deleteAnnotation(annotationId: string)`)
* Extract text (`getTextInsideRectangle(annotationId: string): Promise<string>`)
* Export annotations (`exportShapes()`)

### Customizing Toolbar

You can either customize the default toolbar or provide your own.

**Example:**

```typescript
const viewer = await PdfKit.load({
  containerId: 'pdf-container',
  document: '/path/to/document.pdf',
  toolbarItems: {
    showAnnotation: true,
    showDownload: true
  }
});
```

### Performance Comparison

*(Coming Soon)*

An upcoming feature will include detailed benchmarks and performance comparisons between **pdf-kit** and **PSPDFKit** to help developers make informed decisions based on their needs.

### Demonstrations

* **Enhanced Text Selection**

https://github.com/user-attachments/assets/75e54d14-8b6f-48a5-94c1-62942d21cf20


### Contribution

Contributions are warmly welcomed! Please submit issues, enhancements, or pull requests via GitHub.

### License

pdf-kit is licensed under the MIT License. See the [[LICENSE](https://chatgpt.com/c/LICENSE)](LICENSE) file for details.
