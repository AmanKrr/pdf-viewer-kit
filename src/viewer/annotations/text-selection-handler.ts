/*
  Copyright 2025 Aman Kumar

  Licensed under the Apache License, Version 2.0 (the "License");
  you may not use this file except in compliance with the License.
  You may obtain a copy of the License at

      http://www.apache.org/licenses/LICENSE-2.0

  Unless required by applicable law or agreed to in writing, software
  distributed under the License is distributed on an "AS IS" BASIS,
  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
  See the License for the specific language governing permissions and
  limitations under the License.
*/

import { PageViewport } from 'pdfjs-dist';
import { createPopper, Instance as PopperInstance, VirtualElement } from '@popperjs/core';
import { PDF_VIEWER_CLASSNAMES, PDF_VIEWER_IDS } from '../../constants/pdf-viewer-selectors';

/**
 * Types of text annotations that can be applied to selected text.
 */
type AnnotationType = 'highlight' | 'underline' | 'strike' | 'squiggle';

/**
 * Handles text selection and annotation creation in the PDF viewer.
 *
 * Manages text selection events, displays annotation toolbar, and creates
 * text-based annotations like highlights, underlines, etc. Uses a shared
 * static state for global event handling and toolbar management.
 */
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
  private static instanceId: string;
  private static currentSelectionRange: Range | null = null;

  // ─── Per-page instance state ───────────────────────
  private readonly pageWrapper: HTMLElement;
  private readonly textLayerDiv: HTMLElement;
  private readonly annotationLayer: HTMLElement;
  private readonly textDivs: HTMLElement[];
  private readonly viewport: PageViewport;

  /**
   * Creates a new text selection handler for a specific page.
   *
   * @param containerId - The container ID where the handler operates
   * @param instanceId - The PDF viewer instance ID
   * @param pageWrapper - The page wrapper element
   * @param textLayerDiv - The text layer div element
   * @param annotationLayer - The annotation layer element
   * @param textDivs - Array of text div elements
   * @param viewport - The PDF page viewport
   */
  constructor(
    containerId: string,
    instanceId: string,
    pageWrapper: HTMLElement,
    textLayerDiv: HTMLElement,
    annotationLayer: HTMLElement,
    textDivs: HTMLElement[],
    viewport: PageViewport,
  ) {
    this.pageWrapper = pageWrapper;
    this.textLayerDiv = textLayerDiv;
    this.annotationLayer = annotationLayer;
    this.textDivs = textDivs;
    this.viewport = viewport;
    TextSelectionHandler.containerId = containerId;
    TextSelectionHandler.instanceId = instanceId;

    TextSelectionHandler.handlers.add(this);
    TextSelectionHandler.initializeShared();
  }

  // ─── Shared toolbar + listeners setup ──────────────
  /**
   * Initializes shared static state and event listeners.
   * Only runs once for the first handler instance.
   */
  private static initializeShared() {
    if (TextSelectionHandler.initialized) return;
    TextSelectionHandler.buildToolbar();

    const container = document.getElementById(TextSelectionHandler.containerId)?.shadowRoot;
    if (!container) {
      console.error(`TextSelectionHandler: Container "${TextSelectionHandler.containerId}" not found.`);
      return;
    }
    const viewer = container.querySelector(`.${PDF_VIEWER_CLASSNAMES.A_VIEWER_WRAPPER}`);
    if (!viewer) {
      console.error(`TextSelectionHandler: Viewer wrapper missing.`);
      return;
    }

    const mainViewerContainer = viewer.querySelector(`#${PDF_VIEWER_IDS.MAIN_VIEWER_CONTAINER}-${TextSelectionHandler.instanceId}`);
    if (!mainViewerContainer) {
      console.error(`TextSelectionHandler: Main viewer container "${PDF_VIEWER_IDS.MAIN_VIEWER_CONTAINER}-${TextSelectionHandler.instanceId}" not found.`);
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

  /**
   * Cleans up shared static state and event listeners.
   */
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

    const container = document.getElementById(TextSelectionHandler.containerId)?.shadowRoot;
    if (!container) {
      console.error(`TextSelectionHandler: Container "${TextSelectionHandler.containerId}" not found.`);
      return;
    }
    const viewer = container.querySelector(`.${PDF_VIEWER_CLASSNAMES.A_VIEWER_WRAPPER}`);
    if (!viewer) {
      console.error(`TextSelectionHandler: Viewer wrapper missing.`);
      return;
    }

    const mainViewerContainer = viewer.querySelector(`#${PDF_VIEWER_IDS.MAIN_VIEWER_CONTAINER}-${TextSelectionHandler.instanceId}`);
    if (!mainViewerContainer) {
      console.error(`TextSelectionHandler: Main viewer container "${PDF_VIEWER_IDS.MAIN_VIEWER_CONTAINER}-${TextSelectionHandler.instanceId}" not found.`);
      return;
    }
    mainViewerContainer.removeEventListener('scroll', TextSelectionHandler.onScroll);
  }

  /**
   * Builds the text annotation toolbar with highlight, underline, strike, and squiggle options.
   * The toolbar is created once and shared across all handler instances.
   */
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
  /**
   * Handles pointer down events to detect when mouse selection begins.
   * @param evt - The pointer event that occurred
   */
  private static onPointerDown = (evt: PointerEvent) => {
    if (evt.isPrimary && evt.pointerType === 'mouse') {
      TextSelectionHandler.isMouseSelecting = true;
    }
  };

  /**
   * Handles pointer up events to process text selection after mouse selection completes.
   */
  private static onPointerUp = () => {
    if (!TextSelectionHandler.isMouseSelecting) return;
    requestAnimationFrame(() => {
      TextSelectionHandler.processSelection();
      TextSelectionHandler.isMouseSelecting = false;
    });
  };

  /**
   * Handles selection change events to hide toolbar when selection is cleared.
   */
  private static onSelectionChange = () => {
    if (!TextSelectionHandler.isMouseSelecting) {
      TextSelectionHandler.hideToolbar();
    }
  };

  /**
   * Handles scroll and resize events to update toolbar positioning.
   */
  private static onScroll = () => {
    TextSelectionHandler.popperInstance?.update();
  };

  /**
   * Processes the current text selection to determine if toolbar should be shown.
   * Finds the appropriate handler for the selected text and shows the annotation toolbar.
   */
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

  /**
   * Shows the annotation toolbar positioned above the current text selection.
   * Uses Popper.js for intelligent positioning and flipping.
   */
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

  /**
   * Hides the annotation toolbar and cleans up the current selection state.
   */
  private static hideToolbar() {
    TextSelectionHandler.toolbar.style.display = 'none';
    TextSelectionHandler.popperInstance?.destroy();
    TextSelectionHandler.activeHandler = null;
    TextSelectionHandler.currentSelectionRect = null;
  }

  /**
   * Applies the specified annotation type to the currently selected text.
   * Creates visual annotation elements and converts coordinates to PDF space for persistence.
   *
   * @param type - The type of annotation to apply (highlight, underline, strike, or squiggle)
   */
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

  /**
   * Persists the annotation data in PDF coordinates.
   * This is a placeholder method that should be hooked into the AnnotationManager or storage system.
   *
   * @param quads - Array of annotation quads with PDF coordinates and type information
   */
  private persist(quads: Array<{ x1: number; y1: number; x2: number; y2: number; type: AnnotationType }>) {
    // ➜ hook into your AnnotationManager / storage here
  }

  /**
   * Destroys this handler instance and cleans up shared resources if this is the last handler.
   * Should be called when a page is removed to prevent memory leaks.
   */
  public destroy() {
    TextSelectionHandler.handlers.delete(this);
    if (TextSelectionHandler.handlers.size === 0) {
      TextSelectionHandler.destroyShared();
    }
  }
}
