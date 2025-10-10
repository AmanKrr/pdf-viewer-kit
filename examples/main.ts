import { PdfViewerKit, IAnnotationConfig } from '../src/index';

document.querySelector<HTMLDivElement>('#app')!.innerHTML = `<div id="view-pdf" style="height: 100vh"></div>`;

PdfViewerKit.unloadAll();

PdfViewerKit.load({
  document: './pdfs/SourceDocument-4.pdf',
  containerId: 'view-pdf',
  toolbarOptions: {
    showThumbnail: false,
    showSearch: true,
  },
}).then(async (instances) => {
  if (instances) {
    const { x0, y0, x1, y1 } = { x0: 286.2, y0: 184.082, x1: 316.78, y1: 196.308 };
    const id = await instances.annotations.createAnnotation({
      pageNumber: 84,
      x0: x0,
      x1: x1,
      y0: y0,
      y1: y1,
      fillColor: 'rgba(255, 255, 0, 0.3)',
      strokeColor: 'red',
      strokeWidth: 2,
      strokeStyle: 'Solid',
      opacity: 0.4,
      type: 'rectangle',
      interactive: true,
    } as IAnnotationConfig);
    instances.goToPage(84);
  }
});
