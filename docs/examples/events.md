# Event Handling

The `PDF Viewer Kit` emits various events that let you react to user interactions and state changes. You can listen to these events using the `events` property on the viewer instance.

## Listening to Events

Use the `on` method to subscribe to events and `off` to unsubscribe.

```typescript
import { PdfViewerKit } from 'pdf-viewer-kit';

const viewer = await PdfViewerKit.load({ /* ... */ });

// Listen for annotation creation
viewer.events.on('ANNOTATION_CREATED', (annotation) => {
  console.log(`New annotation: ${annotation.id}`);
});
```

## Supported Events

### Annotation Events

| Event Name | Description | Payload |
| :--- | :--- | :--- |
| `ANNOTATION_CREATED` | Fired when a new annotation is drawn. | `{ id: string, type: string, pageNumber: number }` |
| `ANNOTATION_UPDATED` | Fired when an annotation is modified. | `{ id: string, updates: any }` |
| `ANNOTATION_DELETED` | Fired when an annotation is removed. | `{ id: string }` |
| `ANNOTATION_SELECTED` | Fired when an annotation is selected. | `{ id: string }` |
| `ANNOTATION_DESELECT` | Fired when an annotation is deselected. | `{ id: string }` |


