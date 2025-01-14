import { aPdfViewerClassNames, aPdfViewerIds } from '../constant/ElementIdClass';

class WebUiUtils {
  static showLoading() {
    // Create loading element
    const loadingElement = document.createElement('div');
    loadingElement.classList.add('loading');

    // Create spinner element
    const spinner = document.createElement('div');
    spinner.classList.add('spinner');

    // Append spinner to loading element
    loadingElement.appendChild(spinner);

    // Append loading element to container
    const container = document.createElement('div');
    container.setAttribute('id', aPdfViewerIds._LOADING_CONTAINER);
    container.appendChild(loadingElement);

    return loadingElement;
  }

  static hideLoading(loadingElement: HTMLElement, containerId: string) {
    const pdfContainer = document.querySelector(`#${containerId} .${aPdfViewerClassNames._A_PDF_VIEWER}`);
    if (pdfContainer) {
      pdfContainer.classList.remove(aPdfViewerClassNames._PDF_LOADING);
    }
    if (loadingElement && loadingElement.parentNode) {
      loadingElement.parentNode.removeChild(loadingElement);
    }
  }

  static Observer(callback: (pageNumber: number) => void, containerId: string) {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const pageNumber = entry.target.id.split('-')[1];
            callback(parseInt(pageNumber));
          }
        });
      },
      { threshold: 0.1 },
    ); // Adjust the threshold as needed

    // Query all page containers
    const pageContainers = document.querySelectorAll(`#${containerId} .${aPdfViewerClassNames._A_PAGE_VIEW}`);

    // Observe each page container using the same observer instance
    if (pageContainers) {
      Array.from(pageContainers).forEach((pageContainer) => {
        observer.observe(pageContainer);
      });
    }
  }

  /**
   * Helper function to parse query string (e.g. ?param1=value&param2=...).
   * @param {string} query
   * @returns {Map}
   */
  static parseQueryString(query: any) {
    const params = new Map();
    for (const [key, value] of new URLSearchParams(query)) {
      params.set(key.toLowerCase(), value);
    }
    return params;
  }

  public static getVisiblePages(pdfInstance: any): number[] {
    const pageViewerContainer = document.getElementById(aPdfViewerIds._MAIN_VIEWER_CONTAINER);
    if (!pageViewerContainer) return [];

    const containerRect = pageViewerContainer.getBoundingClientRect();
    const visiblePages: number[] = [];

    for (let pageIndex = 1; pageIndex <= pdfInstance.numPages; pageIndex++) {
      const pageContainer = document.getElementById(`pageContainer-${pageIndex}`);
      if (!pageContainer) continue;

      const pageRect = pageContainer.getBoundingClientRect();
      if (pageRect.bottom > containerRect.top && pageRect.top < containerRect.bottom) {
        visiblePages.push(pageIndex);
      }
    }

    return visiblePages;
  }

  public static async renderPage(pdfInstance: any, pageIndex: number, scale: number, devicePixelRatio: number): Promise<void> {
    const pageContainer = document.getElementById(`pageContainer-${pageIndex}`);
    if (!pageContainer) return;

    const pdfPage = await pdfInstance.getPage(pageIndex);
    const viewport = pdfPage.getViewport({ scale });

    // Update container dimensions
    pageContainer.style.width = `${viewport.width}px`;
    pageContainer.style.height = `${viewport.height}px`;

    const canvas = pageContainer.querySelector('canvas');
    if (!canvas) return;

    const canvasContext = canvas.getContext('2d');
    if (!canvasContext) return;

    // Update canvas dimensions
    canvas.width = viewport.width * devicePixelRatio;
    canvas.height = viewport.height * devicePixelRatio;
    canvas.style.width = `${viewport.width}px`;
    canvas.style.height = `${viewport.height}px`;

    // Apply device pixel ratio scaling
    canvasContext.scale(devicePixelRatio, devicePixelRatio);

    // Render the page onto the canvas
    const renderContext = {
      canvasContext,
      viewport,
      annotationMode: 2, // Enable annotation layer rendering
    };
    await pdfPage.render(renderContext).promise;
  }
}

export default WebUiUtils;
