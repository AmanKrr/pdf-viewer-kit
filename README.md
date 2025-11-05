# PDF Viewer Kit 🚀

[![npm version](https://badge.fury.io/js/pdf-viewer-kit.svg)](https://badge.fury.io/js/pdf-viewer-kit)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8+-blue.svg)](https://www.typescriptlang.org/)
[![Build Status](https://img.shields.io/badge/build-passing-brightgreen.svg)](https://github.com/AmanKrr/pdf-viewer-kit)

**PDF Viewer Kit** is a modern, high-performance, framework-agnostic, lightweight PDF viewer and annotation library built with TypeScript. Built on top of **pdf.js**, it provides PDF viewing capabilities with basic annotation features, canvas pooling, and a robust public API.

> ⚠️ **Note**
>
> `1.0.0-canvas-pooling.1` is a **beta release**.
>
> It is highly recommended to use this version, as it is mostly stable and will be promoted to a **stable release** soon.

## ✨ Features

### 🎯 **Core PDF Viewing**

- **High-Performance Rendering**: Optimized PDF rendering using pdf.js with canvas pooling
- **Multi-Instance Support**: Load multiple PDF documents simultaneously with complete isolation
- **Responsive Design**: Adaptive layout that works on all device sizes
- **Memory Efficient**: Advanced memory management with canvas pooling and image bitmap optimization

### 🖊️ **Advanced Annotation System**

- **Multiple Annotation Types**: Rectangle, Ellipse, Line, and Text Selection annotations
- **Interactive Drawing**: Real-time annotation drawing with visual feedback
- **Smart Selection**: Intelligent annotation selection with resize handles
- **State-Based UI**: Dynamic toolbar and button visibility based on annotation state
- **Delete Confirmation**: User-friendly deletion with confirmation popups
- **Legacy Support**: Backward compatibility with both modern and legacy coordinate formats

### 🔧 **Developer Experience**

- **TypeScript First**: Full TypeScript support with comprehensive type definitions
- **Runtime Protection**: JavaScript runtime protection with facade pattern
- **Clean API**: Professional, well-organized public API with proper namespacing
- **Event System**: Comprehensive event system for all PDF viewer interactions
- **Modular Architecture**: Clean separation of concerns with internal/external APIs

### 🎨 **UI & Customization**

- **Customizable Toolbar**: Flexible toolbar system with plugin architecture
- **Theme Support**: CSS custom properties for easy theming
- **Responsive Layout**: Adaptive design that works on all screen sizes

## 🚀 Quick Start

### Installation

```bash
npm install pdf-viewer-kit
# or
yarn add pdf-viewer-kit
# or
pnpm add pdf-viewer-kit
```

### Basic Usage

```typescript
import { PdfViewerKit } from 'pdf-viewer-kit';

// Load a PDF document
const instance = await PdfViewerKit.load({
  containerId: 'pdf-container',
  url: 'https://example.com/document.pdf',
});

// Access viewer functionality
instance.goToPage(5);
instance.zoomIn();
instance.nextPage();
```

### Advanced Usage with Annotations

```typescript
import { PdfViewerKit, PDFViewerKit } from 'pdf-viewer-kit';

// Load PDF with options
const instance = await PdfViewerKit.load({
  containerId: 'pdf-container',
  url: 'document.pdf',
  toolbarOptions: {
    showThumbnail: true,
    showSearch: true,
    showAnnotation: true,
  },
});

// Create annotations
const annotationId = await instance.annotations.createAnnotation({
  type: 'rectangle',
  pageNumber: 1,
  position: {
    left: 100,
    top: 100,
    width: 200,
    height: 100,
  },
  style: {
    fillColor: 'rgba(0, 123, 255, 0.3)',
    strokeColor: '#007bff',
    strokeWidth: 2,
    opacity: 0.8,
  },
});

// Extract text from annotation area
const extractedText = await instance.annotations.getTextInsideRectangle(annotationId);
console.log('Extracted text:', extractedText);

// Listen to events
instance.events.on(PDFViewerKit.Events.ANNOTATION_CREATED, (annotation) => {
  console.log('New annotation created:', annotation.id);
});
```

## 📚 API Reference

### Core Classes

#### `PdfViewerKit`

The main entry point for the library.

```typescript
// Load PDF document
static async load(options: LoadOptions): Promise<IPDFViewerInstance>

// Get existing instance
static getInstance(instanceId: string): IPDFViewerInstance | undefined

// Get instance by container
static getInstanceByContainer(containerId: string): IPDFViewerInstance | undefined

// Get all instances
static getAllInstances(): IPDFViewerInstance[]

// Unload instance
static async unload(instanceId: string): Promise<void>

// Unload all instances
static async unloadAll(): Promise<void>
```

#### `IPDFViewerInstance`

Represents a loaded PDF viewer instance.

```typescript
// Properties
instanceId: string
containerId: string
isReady: boolean
currentPage: number
totalPages: number
currentScale: number
pdfDocument: PDFDocumentProxy | null

// Methods
goToPage(pageNumber: number): void
nextPage(): void
previousPage(): void
zoomIn(): void
zoomOut(): void

// Services
events: IPDFViewerEvents
annotations: IPDFViewerAnnotations
search: IPDFViewerSearch
```

### Annotation System

#### `IPDFViewerAnnotations`

Manages all annotation operations.

```typescript
// Create annotations
createAnnotation(config: IAnnotationConfig): Promise<string>

// Get annotations
getAnnotations(pageNumber: number): IAnnotation[]

// Delete annotations
deleteAnnotation(annotationId: string): void

// Text extraction
getTextInsideRectangle(annotationId: string): Promise<string>

// Get annotation configuration
getAnnotationShapeConfig(annotationId: string): IShapeConfig

// Utility methods
isPageManagerRegistered(pageNumber: number): boolean
getRegisteredPages(): number[]
```

#### Annotation Types

```typescript
// Rectangle annotation
interface IRectangleConfig {
  type: 'rectangle';
  pageNumber: number;
  position: {
    left: number;
    top: number;
    width: number;
    height: number;
  };
  // OR legacy format
  x0?: number;
  y0?: number;
  x1?: number;
  y1?: number;
  style: IAnnotationStyle;
}

// Ellipse annotation
interface IEllipseConfig {
  type: 'ellipse';
  pageNumber: number;
  position: {
    left: number;
    top: number;
    width: number;
    height: number;
  };
  style: IAnnotationStyle;
}

// Line annotation
interface ILineConfig {
  type: 'line';
  pageNumber: number;
  position: {
    startX: number;
    startY: number;
    endX: number;
    endY: number;
  };
  style: IAnnotationStyle;
}
```

### Event System

#### Available Events

```typescript
// Annotation events
'ANNOTATION_SELECTED';
'ANNOTATION_CREATED';
'ANNOTATION_DELETED';
'ANNOTATION_DESELECT';
'ANNOTATION_UPDATED';
```

#### Event Usage

```typescript
// Listen to events
instance.events.on('ANNOTATION_CREATED', (annotation) => {
  console.log('Annotation created:', annotation);
});

// Remove specific listener
instance.events.off('ANNOTATION_CREATED', listener);

// Remove all listeners for an event
instance.events.removeAllListeners('ANNOTATION_CREATED');
```

### Namespace Access

```typescript
import { PDFViewerKit } from 'pdf-viewer-kit';

// Access organized functionality
PDFViewerKit.Viewer.load(options); // Main viewer class
PDFViewerKit.Events.ANNOTATION_CREATED; // Event constants
PDFViewerKit.Utils.normalizeRect(coords); // Utility functions
```

## 🎨 Customization

### Toolbar Configuration

```typescript
const instance = await PdfViewerKit.load({
  containerId: 'pdf-container',
  url: 'document.pdf',
  toolbarOptions: {
    showThumbnail: true,
    showSearch: true,
    showAnnotation: true,
    showDownload: true,
    showZoom: true,
    showPageNavigation: true,
  },
});
```

### Custom Styling

```css
/* Customize annotation colors */
:root {
  --annotation-fill-color: rgba(0, 123, 255, 0.3);
  --annotation-stroke-color: #007bff;
  --annotation-selected-color: #ff6b6b;
}

/* Customize toolbar appearance */
.pdf-viewer-toolbar {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
}
```

### Plugin System

```typescript
// Create custom toolbar plugins
class CustomPlugin extends BaseAnnotationToolbarPlugin {
  initialize(context: AnnotationContext) {
    // Custom initialization logic
  }

  render() {
    // Custom rendering logic
  }
}
```

## 🔧 Advanced Configuration

### Load Options

```typescript
interface LoadOptions {
  containerId: string;
  url?: string;
  document?: ArrayBuffer | Uint8Array;
  password?: string;
  toolbarOptions?: ToolbarOptions;
}
```

## 📱 Multi-Instance Support

```typescript
// Load multiple PDFs simultaneously
const instance1 = await PdfViewerKit.load({
  containerId: 'pdf-container-1',
  url: 'document1.pdf',
});

const instance2 = await PdfViewerKit.load({
  containerId: 'pdf-container-2',
  url: 'document2.pdf',
});

// Each instance is completely isolated
instance1.goToPage(5);
instance2.zoomIn();

// Get all instances
const allInstances = PdfViewerKit.getAllInstances();
console.log('Active instances:', allInstances.length);
```

## 🚀 Performance Features

### Canvas Pooling

- **Memory Optimization**: Reuses canvas elements to reduce memory allocation
- **Performance Boost**: Faster rendering and smoother interactions
- **Configurable**: Adjustable pool size based on your needs

### Page Virtualization

- **Efficient Memory Usage**: Only renders visible pages
- **Smooth Scrolling**: Handles large documents without performance degradation
- **Smart Caching**: Intelligent page caching for optimal performance

### Image Bitmap Pooling

- **Reduced Memory Pressure**: Efficient handling of PDF images
- **Faster Rendering**: Optimized image processing pipeline
- **Better UX**: Smoother page transitions and zoom operations

## 🧪 Examples

### Basic PDF Viewer

```html
<!DOCTYPE html>
<html>
  <head>
    <title>PDF Viewer Kit - Basic Example</title>
  </head>
  <body>
    <div id="pdf-container" style="width: 100%; height: 600px;"></div>

    <script type="module">
      import { PdfViewerKit } from 'pdf-viewer-kit';

      PdfViewerKit.load({
        containerId: 'pdf-container',
        url: 'sample.pdf',
      });
    </script>
  </body>
</html>
```

### Advanced Annotation Example

```typescript
import { PdfViewerKit, PDFViewerKit } from 'pdf-viewer-kit';

class PDFAnnotationManager {
  private instance: any;

  async initialize() {
    this.instance = await PdfViewerKit.load({
      containerId: 'pdf-container',
      url: 'document.pdf',
      toolbarOptions: {
        showAnnotation: true,
        showThumbnail: true,
      },
    });

    this.setupEventListeners();
  }

  private setupEventListeners() {
    // Listen to annotation events
    this.instance.events.on(PDFViewerKit.Events.ANNOTATION_CREATED, (annotation) => {
      this.onAnnotationCreated(annotation);
    });

    this.instance.events.on(PDFViewerKit.Events.ANNOTATION_DELETED, (annotation) => {
      this.onAnnotationDeleted(annotation);
    });
  }

  async createRectangleAnnotation(page: number, x: number, y: number, width: number, height: number) {
    return await this.instance.annotations.createAnnotation({
      type: 'rectangle',
      pageNumber: page,
      position: { left: x, top: y, width, height },
      style: {
        fillColor: 'rgba(255, 0, 0, 0.3)',
        strokeColor: '#ff0000',
        strokeWidth: 2,
      },
    });
  }

  private onAnnotationCreated(annotation: any) {
    console.log('Annotation created:', annotation);
    // Update UI, save to database, etc.
  }

  private onAnnotationDeleted(annotation: any) {
    console.log('Annotation deleted:', annotation);
    // Update UI, remove from database, etc.
  }
}

// Usage
const manager = new PDFAnnotationManager();
manager.initialize();
```

### 🖊️ Annotations — Detailed Examples

#### Create Rectangle, Ellipse, and Line

```typescript
// Rectangle (modern coordinates)
const rectId = await instance.annotations.createAnnotation({
  type: 'rectangle',
  pageNumber: 1,
  left: 120,
  top: 160,
  width: 220,
  height: 120,
  style: {
    fillColor: 'rgba(0, 123, 255, 0.2)',
    strokeColor: '#007bff',
    strokeWidth: 2,
    opacity: 0.9,
    strokeStyle: 'solid',
  },
  interactive: false,
});

// Ellipse (modern coordinates)
const ellipseId = await instance.annotations.createAnnotation({
  type: 'ellipse',
  pageNumber: 2,
  left: 200,
  top: 220,
  width: 180,
  height: 120,
  style: {
    fillColor: 'rgba(255, 193, 7, 0.25)',
    strokeColor: '#ffc107',
    strokeWidth: 2,
    opacity: 0.9,
    strokeStyle: 'dashed',
  },
  interactive: false,
});

// Line (legacy coordinates)
const lineId = await instance.annotations.createAnnotation({
  type: 'line',
  pageNumber: 3,
  x1: 100,
  y1: 120,
  x2: 320,
  y2: 260,
  style: {
    fillColor: 'transparent',
    strokeColor: '#28a745',
    strokeWidth: 3,
    opacity: 1,
    strokeStyle: 'solid',
  },
  interactive: false,
});
```

#### Interactive Drawing (real-time)

You can let users draw annotations interactively by setting `interactive: true`. The user will get crosshair cursor feedback and real-time shape sizing while dragging.

```typescript
// Start interactive rectangle drawing on a page
await instance.annotations.createAnnotation({
  type: 'rectangle',
  pageNumber: instance.currentPage,
  // initial values are optional in interactive mode
  style: { fillColor: 'rgba(255,0,0,0.2)', strokeColor: '#ff0000', strokeWidth: 2, opacity: 0.9, strokeStyle: 'solid' },
  interactive: true,
});

// Similarly for ellipse and line
await instance.annotations.createAnnotation({
  type: 'ellipse',
  pageNumber: instance.currentPage,
  style: { fillColor: 'rgba(0,0,0,0.1)', strokeColor: '#000', strokeWidth: 2, opacity: 1, strokeStyle: 'solid' },
  interactive: true,
});
await instance.annotations.createAnnotation({
  type: 'line',
  pageNumber: instance.currentPage,
  x1: 0,
  y1: 0,
  x2: 0,
  y2: 0,
  style: { fillColor: 'transparent', strokeColor: '#000', strokeWidth: 2, opacity: 1, strokeStyle: 'solid' },
  interactive: true,
});
```

Listen to viewer events to track drawing lifecycle and react in your UI:

```typescript
import { PDFViewerKit } from 'pdf-viewer-kit';

instance.events.on(PDFViewerKit.Events.ANNOTATION_CREATED, (anno) => {
  console.log('Created', anno.id, anno.type);
});
instance.events.on(PDFViewerKit.Events.ANNOTATION_UPDATED, (anno) => {
  console.log('Updated', anno.id);
});
instance.events.on(PDFViewerKit.Events.ANNOTATION_DELETED, (anno) => {
  console.log('Deleted', anno.id);
});
```

#### Text Selection Annotations (Highlight/Underline/Strike/Squiggle)

The viewer includes a built-in text selection toolbar. Select text on a page, then choose an action (Highlight, Underline, Strike, Squiggle) from the mini toolbar that appears. The visual annotation is applied immediately, and coordinates are tracked in PDF space under the hood.

- Ensure annotations are enabled (default when `toolbarOptions.showAnnotation` is true)
- Users select text directly in the PDF; no extra code is required

Optional helpers you can use afterwards:

```typescript
// Scroll a created highlight (by its id) into view
instance.annotations.scrollHighlightIntoView('your-annotation-id');

// Wait for annotation DOM element and then style or attach listeners
const el = await instance.annotations.waitForAnnotationElement('your-annotation-id');
el.classList.add('my-custom-highlight');
```

#### Delete Confirmation

- When the built-in Annotation Toolbar’s Delete button is pressed, a confirmation popup is shown automatically.
- Pressing the Delete key while an annotation is selected also triggers the same confirmation flow.

No extra code is required. If you delete programmatically, you can call:

```typescript
await instance.annotations.deleteAnnotation(rectId);
```

#### Customize Toolbar With Annotation Options

Enable the annotation tools in the main toolbar and use the built-in annotation toolbar with shape selection and properties pickers.

```typescript
const instance = await PdfViewerKit.load({
  containerId: 'pdf-container',
  url: 'document.pdf',
  toolbarOptions: {
    showAnnotation: true, // shows the annotation tools entry
    showSearch: true,
    showThumbnail: true,
  },
});
```

The annotation toolbar supports:

- Shape selection (Rectangle, Ellipse, Line)
- Property editing (fill, stroke, width, opacity, style)
- Delete with confirmation
- Continuous drawing of the same shape after creation

#### Manage Annotation State Programmatically

```typescript
// Enable/disable annotation features globally
instance.annotations.setEnabled(true);

// Get annotations on current page
const annos = instance.annotations.getAnnotations(instance.currentPage);

// Read configuration of an annotation (position, style)
const cfg = instance.annotations.getAnnotationShapeConfig(rectId);

// Extract text from inside a rectangle
const text = await instance.annotations.getTextInsideRectangle(rectId);
```

## 🏗️ Architecture

### Core Components

```
PDF Viewer Kit
├── Core System
│   ├── PdfViewerKit (Main class)
│   ├── PDFViewerInstance (Instance management)
│   └── EventEmitter (Event system)
├── Viewer Components
│   ├── WebViewer (Main viewer)
│   ├── PageVirtualization (Page management)
│   └── Toolbar (User interface)
├── Annotation System
│   ├── AnnotationService (Core logic)
│   ├── AnnotationManager (Page-level management)
│   └── Annotation Types (Rectangle, Ellipse, Line)
├── Performance Features
│   ├── CanvasPool (Memory optimization)
│   ├── ImageBitmapPool (Image handling)
│   └── PageVirtualization (Efficient rendering)
└── Public API
    ├── Facade Pattern (Runtime protection)
    ├── TypeScript Interfaces (Type safety)
    └── Namespace Organization (Clean API)
```

### Design Patterns

- **Facade Pattern**: Clean public API with runtime protection
- **Observer Pattern**: Event-driven architecture for loose coupling
- **Factory Pattern**: Annotation creation and management
- **Pool Pattern**: Memory optimization with canvas and image pooling
- **Strategy Pattern**: Flexible annotation rendering and interaction

## 🔒 Security Features

### Runtime Protection

- **JavaScript Safety**: Prevents direct access to internal properties
- **Facade Pattern**: Controlled access to library functionality
- **Type Safety**: Full TypeScript support with strict typing

### Input Validation

- **Coordinate Validation**: Ensures annotation coordinates are valid
- **File Validation**: Secure PDF file handling
- **Event Validation**: Safe event emission and handling

## 📊 Browser Support

| Browser | Version | Support         |
| ------- | ------- | --------------- |
| Chrome  | 90+     | ✅ Full Support |
| Firefox | 88+     | ✅ Full Support |
| Safari  | 14+     | ✅ Full Support |
| Edge    | 90+     | ✅ Full Support |

## 🚀 Getting Started

### 1. Installation

```bash
npm install pdf-viewer-kit
```

### 2. Basic Setup

```html
<div id="pdf-container"></div>
```

```typescript
import { PdfViewerKit } from 'pdf-viewer-kit';

const instance = await PdfViewerKit.load({
  containerId: 'pdf-container',
  url: 'your-document.pdf',
});
```

### 3. Add Annotations

```typescript
const annotationId = await instance.annotations.createAnnotation({
  type: 'rectangle',
  pageNumber: 1,
  position: { left: 100, top: 100, width: 200, height: 100 },
  style: { fillColor: 'rgba(0, 123, 255, 0.3)' },
});
```

### 4. Listen to Events

```typescript
instance.events.on('ANNOTATION_CREATED', (annotation) => {
  console.log('Annotation created:', annotation);
});
```

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### Development Setup

```bash
# Clone the repository
git clone https://github.com/AmanKrr/pdf-viewer-kit.git

# Install dependencies
npm install

# Start development server
npm run dev

# Build the library
npm run build

# Run tests
npm test
```

### Code Style

- **TypeScript**: Strict typing with comprehensive interfaces
- **ESLint**: Consistent code style and quality
- **Prettier**: Automatic code formatting
- **Conventional Commits**: Standardized commit messages

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- **pdf.js**: The foundation for PDF rendering
- **TypeScript**: For type safety and developer experience
- **Canvas API**: For high-performance graphics
- **Open Source Community**: For inspiration and contributions

## 📞 Support

- **Documentation**: [Wiki](https://github.com/AmanKrr/pdf-viewer-kit/wiki)
- **Issues**: [GitHub Issues](https://github.com/AmanKrr/pdf-viewer-kit/issues)
- **Discussions**: [GitHub Discussions](https://github.com/AmanKrr/pdf-viewer-kit/discussions)

---

**Made with ❤️ by [Aman Kumar](https://github.com/AmanKrr)**

_PDF Viewer Kit - Lightweight PDF viewing and annotation for modern web applications_
