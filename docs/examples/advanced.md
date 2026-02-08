# Advanced Features

## Customizing the Toolbar

You can customize which items appear in the toolbar using `toolbarItems`.

```typescript
const options = {
  // ...
  toolbarItems: {
    showPageControls: true,
    showZoom: false, // Hide zoom buttons
    showDownload: true,
    showPrint: false,
    showSearch: true
  }
};
```

## Handling Annotations

Listen for annotation events to sync with your backend.

```typescript
const instance = await PdfViewerKit.load(options);

instance.events.on('ANNOTATION_CREATED', (annotation) => {
  console.log('New annotation:', annotation);
  // specific logic to save to database
  saveAnnotationToDB(annotation);
});

instance.events.on('ANNOTATION_UPDATED', (annotation) => {
  console.log('Annotation modified:', annotation);
});
```

## Performance Tuning (Large Files)

For very large blueprints or high-DPI documents, tweaking `tileConfig` is recommended.

```typescript
const options = {
  // ...
  enableTiling: true,
  tileConfig: {
    tileSize: 1024, // Larger tiles = fewer draw calls
    maxCachedTiles: 50, // Limit memory usage
    progressiveRendering: true // Show low-res preview
  }
};
```
