# Getting Started

## Installation

Install `pdf-viewer-kit` and its peer dependency `pdfjs-dist`:

```bash
npm install pdf-viewer-kit pdfjs-dist
# or
pnpm add pdf-viewer-kit pdfjs-dist
# or
yarn add pdf-viewer-kit pdfjs-dist
```

## Basic Usage

1. **Prepare your HTML container:**

```html
<div id="pdf-container" style="width: 100%; height: 100vh;"></div>
```

2. **Initialize the Viewer:**

```typescript
import { PdfViewerKit } from 'pdf-viewer-kit';

// Ensure standard CSS is imported (if using a bundler)
import 'pdf-viewer-kit/dist/pdf-viewer-kit.css'; 

async function initViewer() {
  try {
    const viewer = await PdfViewerKit.load({
      containerId: 'pdf-container',
      document: 'https://mozilla.github.io/pdf.js/web/compressed.tracemonkey-pldi-09.pdf',
      // Optional: Enable tiling for better performance
      enableTiling: true, 
      tileConfig: {
        tileSize: 512,
        progressiveRendering: true
      }
    });

    console.log('Viewer initialized:', viewer.instanceId);
  } catch (error) {
    console.error('Failed to load PDF:', error);
  }
}

initViewer();
```

## Next Steps

- Learn about [Core Concepts](./core-concepts.md)
- Check out the [API Reference](../api/reference.md)
- See [Examples](../examples/basic.md)
