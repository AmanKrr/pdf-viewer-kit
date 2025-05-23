import { PdfViewerKit } from '../src/index';

document.querySelector<HTMLDivElement>('#app')!.innerHTML = `<div id="view-pdf"></div>`;

PdfViewerKit.load({
  document: './pdfs/adient-test.pdf',
  containerId: 'view-pdf',
  toolbarOptions: {
    showThumbnail: true,
    showSearch: true,
  },
}).then((instances) => {});
