# Basic Usage Example

This example demonstrates how to load a PDF with minimal configuration.

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Basic PDF Viewer</title>
    <!-- Import Styles -->
    <link rel="stylesheet" href="/node_modules/pdf-viewer-kit/dist/pdf-viewer-kit.css">
    <style>
        #viewer-container {
            width: 100%;
            height: 100vh;
            overflow: hidden;
        }
    </style>
</head>
<body>
    <div id="viewer-container"></div>

    <script type="module">
        import { PdfViewerKit } from '/node_modules/pdf-viewer-kit/dist/pdfkitviewer.es.js';

        // Initialize
        PdfViewerKit.load({
            containerId: 'viewer-container',
            document: '/path/to/your/document.pdf',
            toolbarOptions: {
                showThumbnail: true,
                showDownload: true,
                showZoom: true
            }
        }).then(instance => {
            console.log('PDF Loaded:', instance);
        });
    </script>
</body>
</html>
```
