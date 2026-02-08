# Core Concepts

## Architecture Overview

`pdf-viewer-kit` is designed for performance and extensibility. Unlike basic wrappers around PDF.js, this library implements a custom rendering engine that solves common issues with large documents.

### Key Components

- **PdfViewerKit**: The static entry point. Manages the lifecycle of viewer instances (`load`, `unload`).
- **WebViewer**: The runtime instance. Handles UI interactions, events, and component coordination.
- **PageVirtualization**: Manages DOM nodes. Only creates elements for pages currently near the viewport.
- **TileManager**: The rendering heart. Breaks pages into smaller tiles.

## Tile-Based Rendering

One of the standout features is the **TileManager**. 

### The Problem
Rendering a high-quality PDF page at high zoom levels (e.g., 300%) creates a massive canvas. 
- A standard A4 page at 300% DPI might require a 4000x6000 pixel canvas.
- Mobile devices often crash with canvases larger than 4096px.
- Memory usage spikes, causing sluggishness.

### The Solution: Tiling
Similar to Google Maps, `pdf-viewer-kit` divides the page into a grid of tiles (default 512x512px).
- **Progressive Loading**: Low-resolution placeholders appear instantly, followed by high-res tiles.
- **Visibility Checking**: Only tiles currently in the user's view are rendered.
- **Memory Efficiency**: Off-screen tiles are evicted from the cache.

You can configure this behavior via `LoadOptions.tileConfig`.

## Virtualization

For documents with hundreds or thousands of pages, rendering every page container is impossible.
**PageVirtualization** monitors the scroll position and:
1. Mounts page containers only for the visible range (plus a buffer).
2. Unmounts pages that scroll far out of view.
3. Maintains correct scrollbar height using placeholder heights.

## Instance Isolation

The library supports multiple viewer instances on the same page. Each instance is isolated using Shadow DOM (optional) and unique IDs, ensuring styles and events don't leak or conflict.
