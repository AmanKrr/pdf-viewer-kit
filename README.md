# PDF Viewer Kit

> A framework-agnostic, high-performance PDF rendering library for modern web applications.

[![npm version](https://img.shields.io/npm/v/pdf-viewer-kit.svg)](https://www.npmjs.com/package/pdf-viewer-kit)
[![License](https://img.shields.io/npm/l/pdf-viewer-kit.svg)](https://github.com/AmanKrr/pdf-viewer-kit/blob/main/LICENSE)

**PDF Viewer Kit** is a powerful library designed to render, manipulate, and interact with PDF documents seamlessly. It features a unique **tile-based rendering engine** (similar to Google Maps) that handles large documents and high zoom levels with exceptional performance.

## 🚀 Features

- **Framework Agnostic**: Works validation with React, Vue, Angular, Svelte, or Vanilla JS.
- **Progressive Rendering**: Split pages into tiles for fast loading and low memory usage.
- **Smart Virtualization**: Only renders visible pages, supporting documents with 1000+ pages.
- **Rich Interaction**: Built-in support for annotations, text selection, search, and more.
- **TypeScript Ready**: Written in TypeScript with full type definitions.

## 📚 Documentation

Complete documentation is available at **[Documentation Site Link]** (or locally via `npm run docs:dev`).

- [Getting Started](docs/guide/getting-started.md)
- [Core Concepts](docs/guide/core-concepts.md)
- [API Reference](docs/api/reference.md)
- [Examples](docs/examples/basic.md)

## 📦 Installation

```bash
npm install pdf-viewer-kit pdfjs-dist
```

## ⚡ Quick Start

```typescript
import { PdfViewerKit } from 'pdf-viewer-kit';
import 'pdf-viewer-kit/dist/pdf-viewer-kit.css'; 

const viewer = await PdfViewerKit.load({
  containerId: 'pdf-container',
  document: 'path/to/document.pdf'
});
```

## 🛠 Development

1. **Install dependencies**:
   ```bash
   pnpm install
   ```

2. **Run development server**:
   ```bash
   pnpm dev
   ```

3. **Run documentation site**:
   ```bash
   pnpm docs:dev
   ```

## 📄 License

Apache-2.0 © [Aman Kumar](https://github.com/AmanKrr)
