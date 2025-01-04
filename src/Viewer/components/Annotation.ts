import * as pdfjsLib from "pdfjs-dist/webpack.mjs";
import { PageViewport, PDFPageProxy } from "pdfjs-dist";
import { aPdfViewerClassNames, aPdfViewerIds } from "../../constant/ElementIdClass";
import TextLayer from "./TextLayer";
import { PDFLinkService } from "../service/LinkService";

class Annotation extends TextLayer {
  async createAnnotationLayer(
    pageWrapper: HTMLElement,
    textLayer: HTMLElement,
    page: PDFPageProxy,
    viewport: PageViewport,
    pdfLinkService: PDFLinkService
  ) {
    const annotationLayerDiv = TextLayer.createLayers(aPdfViewerClassNames._A_ANNOTATION_LAYER, aPdfViewerIds._ANNOTATION_LAYER, viewport);
    pageWrapper.appendChild(textLayer);
    const annotationContent = await page.getAnnotations();
    // pageNumber === 1 && console.log('Check', pdfjsLib);
    // console.log(annotationContent);

    // Render the annotation layer
    const AnnotaionLayers = new pdfjsLib.AnnotationLayer({
      viewport: viewport.clone({ dontFlip: true }),
      div: annotationLayerDiv,
      annotations: annotationContent,
      page: page,
    });

    AnnotaionLayers.render({
      viewport: viewport.clone({ dontFlip: true }),
      div: annotationLayerDiv,
      annotations: annotationContent,
      page: page,
      linkService: pdfLinkService,
      renderInteractiveForms: true,
    });
    pageWrapper.appendChild(annotationLayerDiv);
    // const annotation = pdfjsLib.Annotation({
    //   subtype: "Text",
    //   rect: [100, 100, 200, 200], // Example position
    //   contents: "Example annotation text",
    // });
    // page.addAnnotation(annotation);
  }
}

export default Annotation;
