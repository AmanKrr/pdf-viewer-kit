import * as pdfjsLib from 'pdfjs-dist/webpack.mjs';
import PageElement from './PageElement';
import { aPdfViewerClassNames, aPdfViewerIds } from '../../constant/ElementIdClass';
import { PageViewport, PDFPageProxy } from 'pdfjs-dist';

class TextLayer extends PageElement {
  async createTextLayer(pageWrapper: HTMLElement, container: HTMLElement, page: PDFPageProxy, viewport: PageViewport): Promise<HTMLDivElement> {
    const textLayerDiv = PageElement.createLayers(aPdfViewerClassNames._A_TEXT_LAYER, aPdfViewerIds._TEXT_LAYER, viewport);
    pageWrapper.appendChild(textLayerDiv);

    const textContent = await page.getTextContent();
    container.style.setProperty('--scale-factor', `${viewport.scale}`);
    // Render text layer changed after 4.0.379
    // pdfjsLib.renderTextLayer({
    //   textContentSource: textContent,
    //   container: textLayerDiv,
    //   viewport: viewport,
    // });
    // Now need to create instance 4.8.69
    new pdfjsLib.TextLayer({
      textContentSource: textContent,
      container: textLayerDiv,
      viewport: viewport,
    }).render();

    return textLayerDiv;
  }
}

export default TextLayer;
