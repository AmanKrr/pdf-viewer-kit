import { normalizeRect, PdfViewerKit, RectangleConfig } from '../src/index';

document.querySelector<HTMLDivElement>('#app')!.innerHTML = `<div id="view-pdf" style="height: 100vh"></div>`;

PdfViewerKit.unloadAll();

// async function highlight(instances: any) {
//   const { x0, y0, x1, y1 } = { x0: 95.5, y0: 443, x1: 540.5, y1: 478 };
//   const page = await instances._pdfInstance.getPage(84);

//   // 2. build a viewport at your desired scale (e.g. 1 or your zoom)
//   const scale = 1;
//   const viewport = page.getViewport({ scale });

//   // 2️⃣ flip Y on your input coords
//   const pageHeightPts = viewport.height / scale; // back to PDF-points
//   const pdfBL = { x: x0, y: pageHeightPts - y1 };
//   const pdfTR = { x: x1, y: pageHeightPts - y0 };

//   // 3️⃣ map PDF‐space → CSS px
//   const [vx0, vy0, vx1, vy1] = viewport.convertToViewportRectangle([pdfBL.x, pdfBL.y, pdfTR.x, pdfTR.y]);
//   const left = Math.min(vx0, vx1);
//   const top = Math.min(vy0, vy1);
//   const width = Math.abs(vx1 - vx0);
//   const height = Math.abs(vy1 - vy0);

//   console.log(left, top, width, height);

//   setTimeout(async () => {
//     const id = instances.annotation.addAnnotation({
//       pageNumber: 84,
//       x0: left, // top-left corner X
//       x1: width, // rectangle width
//       y0: top, // top-left corner Y
//       y1: height, // rectangle height
//       fillColor: 'yellow',
//       strokeColor: 'red',
//       strokeWidth: 2,
//       strokeStyle: 'Solid',
//       opacity: 0.4,
//       type: 'rectangle',
//       interactive: true,
//     } as RectangleConfig);
//     instances.goToPage(84);
//     console.log('Text: ', await instances.annotation.getTextInsideRectangle(id));
//   }, 1000);
// }

PdfViewerKit.load({
  // document: './pdfs/1750501324621.pdf',
  url: 'http://localhost:3232/noauth-view-pdf',
  containerId: 'view-pdf',
  toolbarOptions: {
    showThumbnail: true,
    showSearch: true,
  },
}).then(async (instances) => {
  if (instances) {
    const { x0, y0, x1, y1 } = { x0: 286.2, y0: 184.082, x1: 316.78, y1: 196.308 };

    // const { height, left, top, width } = normalizeRect(x0, y0, x1, y1);

    setTimeout(async () => {
      const id = instances.annotation.addAnnotation({
        pageNumber: 84,
        x0: x0, // top-left corner X
        x1: x1, // rectangle width
        y0: y0, // top-left corner Y
        y1: y1, // rectangle height
        fillColor: 'rgba(255, 255, 0, 0.3)',
        strokeColor: 'red',
        strokeWidth: 2,
        strokeStyle: 'Solid',
        opacity: 0.4,
        type: 'rectangle',
        interactive: true,
      } as RectangleConfig);
      instances.goToPage(84);
      console.log('Text: ', await instances.annotation.getTextInsideRectangle(id));
      console.log('Annotation config: ', instances.annotation.getAnnotationShapeConfig(id));
      // highlight(instances);
    }, 1000);
    // setTimeout(async () => {
    //   const ids = instances.annotation.addAnnotation({
    //     pageNumber: 84,
    //     x0: 399,
    //     y0: 139,
    //     x1: 534,
    //     y1: 170,
    //     fillColor: 'transparent',
    //     strokeColor: 'red',
    //     strokeWidth: 2,
    //     strokeStyle: 'Solid',
    //     opacity: 1,
    //     type: 'rectangle',
    //     interactive: true,
    //   } as RectangleConfig);
    //   instances.goToPage(84);
    //   console.log('Text: ', await instances.annotation.getTextInsideRectangle(ids));
    //   console.log('Annotation config: ', instances.annotation.getAnnotationShapeConfig(ids));
    //   // highlight(instances);
    // }, 1000);
    // setTimeout(async () => {
    //   const ids = instances.annotation.addAnnotation({
    //     pageNumber: 84,
    //     x0: 99,
    //     y0: 314,
    //     x1: 552,
    //     y1: 368,
    //     fillColor: 'transparent',
    //     strokeColor: 'red',
    //     strokeWidth: 2,
    //     strokeStyle: 'Solid',
    //     opacity: 1,
    //     type: 'rectangle',
    //     interactive: true,
    //   } as RectangleConfig);
    //   instances.goToPage(84);
    //   console.log('Text: ', await instances.annotation.getTextInsideRectangle(ids));
    //   console.log('Annotation config: ', instances.annotation.getAnnotationShapeConfig(ids));
    //   // highlight(instances);
    // }, 1000);
  }
});
