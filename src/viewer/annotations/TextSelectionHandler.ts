// TextSelectionHandler.ts
import { PageViewport } from 'pdfjs-dist';
import { createPopper, Instance as PopperInstance, VirtualElement } from '@popperjs/core';
import { PDF_VIEWER_CLASSNAMES, PDF_VIEWER_IDS } from '../../constants/pdf-viewer-selectors';

type AnnotationType = 'highlight' | 'underline' | 'strike' | 'squiggle';

export class TextSelectionHandler {
  // ─── Static (shared) state ──────────────────────────
  private static toolbar: HTMLElement;
  private static handlers = new Set<TextSelectionHandler>();
  private static activeHandler: TextSelectionHandler | null = null;
  private static isMouseSelecting = false;
  private static currentSelectionRect: DOMRect | null = null;
  private static popperInstance: PopperInstance | null = null;
  private static initialized = false;
  private static containerId: string;
  private static currentSelectionRange: Range | null = null;

  // ─── Per-page instance state ───────────────────────
  private readonly pageWrapper: HTMLElement;
  private readonly textLayerDiv: HTMLElement;
  private readonly annotationLayer: HTMLElement;
  private readonly textDivs: HTMLElement[];
  private readonly viewport: PageViewport;

  constructor(containerId: string, pageWrapper: HTMLElement, textLayerDiv: HTMLElement, annotationLayer: HTMLElement, textDivs: HTMLElement[], viewport: PageViewport) {
    this.pageWrapper = pageWrapper;
    this.textLayerDiv = textLayerDiv;
    this.annotationLayer = annotationLayer;
    this.textDivs = textDivs;
    this.viewport = viewport;
    TextSelectionHandler.containerId = containerId;

    TextSelectionHandler.handlers.add(this);
    TextSelectionHandler.initializeShared();
  }

  // ─── Shared toolbar + listeners setup ──────────────
  private static initializeShared() {
    if (TextSelectionHandler.initialized) return;
    TextSelectionHandler.buildToolbar();

    const container = document.getElementById(TextSelectionHandler.containerId);
    if (!container) {
      console.error(`TextSelectionHandler: Container "${TextSelectionHandler.containerId}" not found.`);
      return;
    }
    const viewer = container.querySelector(`.${PDF_VIEWER_CLASSNAMES.A_VIEWER_WRAPPER}`);
    if (!viewer) {
      console.error(`TextSelectionHandler: Viewer wrapper missing.`);
      return;
    }

    const mainViewerContainer = viewer.querySelector(`#${PDF_VIEWER_IDS.MAIN_VIEWER_CONTAINER}`);
    if (!mainViewerContainer) {
      console.error(`TextSelectionHandler: Main viewer container "${PDF_VIEWER_IDS.MAIN_VIEWER_CONTAINER}" not found.`);
      return;
    }
    mainViewerContainer.appendChild(TextSelectionHandler.toolbar);
    mainViewerContainer.addEventListener('scroll', TextSelectionHandler.onScroll, { passive: true });

    document.addEventListener('pointerdown', TextSelectionHandler.onPointerDown, { passive: true });
    document.addEventListener('pointerup', TextSelectionHandler.onPointerUp);
    document.addEventListener('selectionchange', TextSelectionHandler.onSelectionChange);
    window.addEventListener('resize', TextSelectionHandler.onScroll);

    TextSelectionHandler.initialized = true;
  }

  private static destroyShared() {
    if (!TextSelectionHandler.initialized) return;
    document.removeEventListener('pointerdown', TextSelectionHandler.onPointerDown);
    document.removeEventListener('pointerup', TextSelectionHandler.onPointerUp);
    document.removeEventListener('selectionchange', TextSelectionHandler.onSelectionChange);
    window.removeEventListener('resize', TextSelectionHandler.onScroll);

    TextSelectionHandler.popperInstance?.destroy();
    TextSelectionHandler.toolbar.remove();
    TextSelectionHandler.handlers.clear();
    TextSelectionHandler.activeHandler = null;
    TextSelectionHandler.currentSelectionRect = null;
    TextSelectionHandler.initialized = false;

    const container = document.getElementById(TextSelectionHandler.containerId);
    if (!container) {
      console.error(`TextSelectionHandler: Container "${TextSelectionHandler.containerId}" not found.`);
      return;
    }
    const viewer = container.querySelector(`.${PDF_VIEWER_CLASSNAMES.A_VIEWER_WRAPPER}`);
    if (!viewer) {
      console.error(`TextSelectionHandler: Viewer wrapper missing.`);
      return;
    }

    const mainViewerContainer = viewer.querySelector(`#${PDF_VIEWER_IDS.MAIN_VIEWER_CONTAINER}`);
    if (!mainViewerContainer) {
      console.error(`TextSelectionHandler: Main viewer container "${PDF_VIEWER_IDS.MAIN_VIEWER_CONTAINER}" not found.`);
      return;
    }
    mainViewerContainer.removeEventListener('scroll', TextSelectionHandler.onScroll);
  }

  private static buildToolbar() {
    const tb = document.createElement('div');
    tb.className = 'text-annotation-toolbar';
    tb.style.display = 'none';
    tb.innerHTML = `
      <button type="button" class="tool-button" data-type="highlight" title="Highlight">
        <span class="material-symbols-outlined">format_ink_highlighter</span>
      </button>
      <button type="button" class="tool-button" data-type="underline" title="Underline">
        <span class="material-symbols-outlined">format_underlined</span>
      </button>
      <button type="button" class="tool-button" data-type="strike" title="Strikethrough">
        <span class="material-symbols-outlined">format_strikethrough</span>
      </button>
      <button type="button" class="tool-button" data-type="squiggle" title="Squiggly Underline">
        <span class="material-symbols-outlined">format_underlined_squiggle</span>
      </button>
    `;
    tb.addEventListener('click', (e) => {
      const btn = (e.target as HTMLElement).closest('button');
      if (!btn) return;
      TextSelectionHandler.activeHandler?.applyAnnotation(btn.dataset.type as AnnotationType);
    });
    TextSelectionHandler.toolbar = tb;
  }

  // ─── Pointer & selection events ────────────────────
  private static onPointerDown = (evt: PointerEvent) => {
    if (evt.isPrimary && evt.pointerType === 'mouse') {
      TextSelectionHandler.isMouseSelecting = true;
    }
  };

  private static onPointerUp = () => {
    if (!TextSelectionHandler.isMouseSelecting) return;
    requestAnimationFrame(() => {
      TextSelectionHandler.processSelection();
      TextSelectionHandler.isMouseSelecting = false;
    });
  };

  private static onSelectionChange = () => {
    if (!TextSelectionHandler.isMouseSelecting) {
      TextSelectionHandler.hideToolbar();
    }
  };

  private static onScroll = () => {
    console.log('Scroll event detected, updating toolbar position');
    TextSelectionHandler.popperInstance?.update();
  };

  private static processSelection() {
    const sel = window.getSelection();
    if (!sel || sel.isCollapsed) {
      return TextSelectionHandler.hideToolbar();
    }

    const range = sel.getRangeAt(0);
    const handler = Array.from(TextSelectionHandler.handlers).find((h) => h.textLayerDiv.contains(range.startContainer) && h.textLayerDiv.contains(range.endContainer));
    if (!handler) {
      sel.removeAllRanges();
      return TextSelectionHandler.hideToolbar();
    }

    const rects = Array.from(range.getClientRects());
    if (rects.length === 0) {
      return TextSelectionHandler.hideToolbar();
    }

    TextSelectionHandler.activeHandler = handler;
    // keep the Range alive for dynamic positioning
    TextSelectionHandler.currentSelectionRange = range;
    TextSelectionHandler.showToolbarAt(); // no args any more
  }

  private static showToolbarAt() {
    if (!TextSelectionHandler.currentSelectionRange) return;

    const virtualElement: VirtualElement = {
      getBoundingClientRect: () => {
        // always grab the *first* client rect of our live range
        const rects = Array.from(TextSelectionHandler.currentSelectionRange!.getClientRects());
        return rects[0] || { top: 0, left: 0, bottom: 0, right: 0, width: 0, height: 0, x: 0, y: 0, toJSON() {} };
      },
    };

    TextSelectionHandler.popperInstance?.destroy();

    TextSelectionHandler.popperInstance = createPopper(virtualElement, TextSelectionHandler.toolbar, {
      placement: 'top',
      modifiers: [
        { name: 'offset', options: { offset: [0, 6] } },
        { name: 'flip', options: { fallbackPlacements: ['bottom'] } },
      ],
    });

    TextSelectionHandler.toolbar.style.display = 'flex';
  }

  private static hideToolbar() {
    TextSelectionHandler.toolbar.style.display = 'none';
    TextSelectionHandler.popperInstance?.destroy();
    TextSelectionHandler.activeHandler = null;
    TextSelectionHandler.currentSelectionRect = null;
  }

  public applyAnnotation(type: AnnotationType) {
    const sel = window.getSelection();
    if (!sel || sel.isCollapsed) {
      return TextSelectionHandler.hideToolbar();
    }
    const range = sel.getRangeAt(0);
    const clientRects = Array.from(range.getClientRects());
    sel.removeAllRanges();
    TextSelectionHandler.hideToolbar();

    // Get the container's current position in viewport space
    const containerRect = this.annotationLayer.getBoundingClientRect();

    const frag = document.createDocumentFragment();
    clientRects.forEach((r) => {
      const div = document.createElement('div');
      Object.assign(div.style, {
        position: 'absolute',
        left: `${r.left - containerRect.left}px`,
        top: `${r.top - containerRect.top}px`,
        width: `${r.width}px`,
        height: `${r.height}px`,
        pointerEvents: 'none',
      });
      div.classList.add(`annot-${type}`);
      frag.appendChild(div);
    });
    this.annotationLayer.appendChild(frag);

    // now persist in PDF coords if needed
    const quads = clientRects.map((r) => {
      const [x1, y1] = this.viewport.convertToPdfPoint(r.left, r.top);
      const [x2, y2] = this.viewport.convertToPdfPoint(r.right, r.bottom);
      return { x1, y1, x2, y2, type };
    });
    this.persist(quads);
  }

  private persist(quads: Array<{ x1: number; y1: number; x2: number; y2: number; type: AnnotationType }>) {
    // ➜ hook into your AnnotationManager / storage here
  }

  public destroy() {
    TextSelectionHandler.handlers.delete(this);
    if (TextSelectionHandler.handlers.size === 0) {
      TextSelectionHandler.destroyShared();
    }
  }
}
