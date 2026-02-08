# Customization

The `PDF Viewer Kit` is designed to be flexible. You can customize the toolbar, performance settings, and visual appearance.

## Toolbar Customization

You can control which toolbar items are visible using `toolbarOptions` during initialization.

```typescript
const viewer = await PdfViewerKit.load({
  containerId: 'pdf-container',
  document: '/sample.pdf',
  toolbarOptions: {
    showThumbnail: true,  // Show sidebar button
    showDownload: false,  // Hide download button
    showZoom: true,       // Show zoom controls
    showSearch: true,     // Show search button
    showPrint: false      // Hide print button
  }
});
```

### Completely Hiding the Toolbar

If you want to build your own UI, you can disable the default toolbar entirely.

```typescript
const viewer = await PdfViewerKit.load({
  // ...
  disableToolbar: true
});
```

## Performance Tuning (Tiling)

For large documents, you can fine-tune the tiling engine.

```typescript
const viewer = await PdfViewerKit.load({
  // ...
  enableTiling: true,
  tileConfig: {
    // Larger tiles = less overhead but more memory per tile
    tileSize: 1024, 
    
    // Render lower resolution first (blur-up effect)
    progressiveRendering: true,
    
    // Number of max tiles to keep in memory
    maxCachedTiles: 200,

    // Enable for Retina displays
    enableHighDPI: true
  }
});
```

## UI Styling

The viewer uses CSS variables for easy theming. You can override these in your own CSS.

```css
:root {
  /* Change the toolbar background */
  --pdf-toolbar-bg: #1a1a1a;
  
  /* Change the accent color */
  --pdf-accent-color: #8b5cf6;
  
  /* Change the selection color */
  --pdf-selection-color: rgba(139, 92, 246, 0.3);
}
```

## Custom Annotation Toolbar

You can also customize the annotation toolbar if expanding its capabilities.

```typescript
const viewer = await PdfViewerKit.load({
  // ...
  annotationToolbarOptions: {
    position: 'top', // 'top' | 'bottom'
    tools: ['highlight', 'underline', 'strikeout', 'ink']
  }
});
```
