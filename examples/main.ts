import { PdfViewerKit, RectangleConfig } from '../src/index';

document.querySelector<HTMLDivElement>('#app')!.innerHTML = `<div id="view-pdf"></div>`;

PdfViewerKit.unloadAll();

PdfViewerKit.load({
  document: './pdfs/adient-test.pdf',
  containerId: 'view-pdf',
  toolbarOptions: {
    showThumbnail: true,
    showSearch: true,
  },
}).then((instances) => {
  if (instances) {
    setTimeout(() => {
      instances.annotation.addAnnotation({
        pageNumber: 18,
        x0: 214.5,
        y0: 272,
        x1: 185,
        y1: 47,
        fillColor: 'transparent',
        strokeColor: 'red',
        strokeWidth: 2,
        strokeStyle: 'Solid',
        opacity: 1,
        type: 'rectangle',
        interactive: false,
      } as RectangleConfig);
      instances.goToPage(18);
    }, 1000);
  }
});
