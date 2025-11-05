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

import { InteractiveEffectsManager } from '../../utils/interactive-effects-manager';

export interface ISelectable {
  id: string;
  type: string; // e.g. 'rectangle', 'circle', etc.
}

export class SelectionManager {
  private selectedShape: ISelectable | null = null;
  private listeners: Array<(selected: ISelectable | null) => void> = [];

  // Text selection management
  private isSelectingText: boolean = false;
  private selectionTimeout: NodeJS.Timeout | null = null;
  private interactiveEffectsManager: InteractiveEffectsManager;
  private isDrawingInProgress: boolean = false;

  // Global click handler for deselection
  private containerId: string;
  private globalClickHandler?: (event: Event) => void;

  constructor(containerId: string) {
    this.containerId = containerId;
    this.interactiveEffectsManager = InteractiveEffectsManager.getInstance();
    this._setupTextSelectionDetection();
  }

  /**
   * Sets the currently selected shape.
   * @param shape The shape to select or null to clear selection.
   */
  public setSelected(shape: ISelectable | null): void {
    this.selectedShape = shape;
    this._notifyListeners();
  }

  /**
   * Returns the currently selected shape.
   */
  public getSelected(): ISelectable | null {
    return this.selectedShape;
  }

  /**
   * Registers a listener that will be notified when the selection changes.
   * Returns a function that, when called, unsubscribes the listener.
   * @param listener A callback function receiving the new selection.
   */
  public onSelectionChange(listener: (selected: ISelectable | null) => void): () => void {
    this.listeners.push(listener);
    // Return an unsubscribe function.
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  /**
   * Sets the drawing state to manage interactive effects during drawing.
   * @param isDrawing Whether drawing is in progress.
   */
  public setDrawingState(isDrawing: boolean): void {
    if (!this.containerId) return;
    this.isDrawingInProgress = isDrawing;

    if (isDrawing) {
      // Reset text selection state when drawing starts to ensure clean state
      if (this.isSelectingText) {
        this.isSelectingText = false;
        if (this.selectionTimeout) {
          clearTimeout(this.selectionTimeout);
          this.selectionTimeout = null;
        }
      }
      this.interactiveEffectsManager.disableInteractiveEffects(this.containerId);
    } else {
      // Always re-enable effects when drawing finishes, regardless of text selection state
      // This ensures that drawing tools work properly on subsequent attempts
      this.interactiveEffectsManager.enableInteractiveEffects();
    }
  }

  /**
   * Returns whether text selection is currently active.
   */
  public isTextSelectionActive(): boolean {
    return this.isSelectingText;
  }

  /**
   * Returns whether drawing is currently in progress.
   */
  public isDrawingActive(): boolean {
    return this.isDrawingInProgress;
  }

  /**
   * Returns the current state information for debugging.
   */
  public getCurrentState(): { isSelectingText: boolean; isDrawingInProgress: boolean; effectsDisabled: boolean } {
    return {
      isSelectingText: this.isSelectingText,
      isDrawingInProgress: this.isDrawingInProgress,
      effectsDisabled: this.interactiveEffectsManager.isInteractiveEffectsDisabled,
    };
  }

  /**
   * Manually re-enable interactive effects (useful for external control).
   */
  public reEnableInteractiveEffects(): void {
    if (!this.isDrawingInProgress) {
      this.interactiveEffectsManager.enableInteractiveEffects();
    }
  }

  /**
   * Sets up the global click handler for deselection.
   * This should be called once during initialization.
   */
  public setupGlobalClickHandler(containerId: string): void {
    this.containerId = containerId;
    this._addGlobalClickHandler();
  }

  /**
   * Removes the global click handler.
   * This should be called during cleanup.
   */
  public removeGlobalClickHandler(): void {
    if (!this.containerId) return;
    if (this.globalClickHandler) {
      const containerRoot = document.getElementById(this.containerId)?.shadowRoot;
      const container = containerRoot as unknown as HTMLElement | null;
      if (container) {
        container.removeEventListener('click', this.globalClickHandler, false);
      }
      this.globalClickHandler = undefined;
    }
  }

  /**
   * Sets up the global click handler for deselection.
   */
  private _addGlobalClickHandler(): void {
    if (!this.containerId) return;

    const containerRoot = document.getElementById(this.containerId)?.shadowRoot;
    const container = containerRoot as unknown as HTMLElement | null;
    if (!container) return;

    this.globalClickHandler = (event: Event) => {
      // Check if the click target is part of an annotation
      const target = event.target as HTMLElement;
      const isAnnotationClick =
        target.closest('[annotation-id]') ||
        target.closest('.a-annotation-layer') ||
        target.closest('.a-annotation-toolbar-container') ||
        target.closest('svg') ||
        target.tagName === 'svg' ||
        target.hasAttribute('annotation-id') ||
        // Check if target is a resizer handle or overlay
        target.hasAttribute('data-resizer-handle') ||
        target.closest('[data-resizer-overlay]');

      // If click is not on an annotation and we have a selection, deselect
      // But only if we're not in the middle of drawing
      if (!isAnnotationClick && this.selectedShape && !this.isDrawingInProgress) {
        this.setSelected(null);
      }
    };

    // Use bubble phase instead of capture to run after other handlers
    // This prevents the race condition where deselection happens before selection is set
    container.addEventListener('click', this.globalClickHandler, false);
  }

  /**
   * Sets up text selection detection to manage interactive effects.
   */
  private _setupTextSelectionDetection(): void {
    if (!this.containerId) return;
    // Listen for text selection start/end
    document.addEventListener('selectionchange', () => {
      if (!this.containerId) return;
      const selection = window.getSelection();
      const hasSelection = selection && selection.toString().length > 0;

      if (hasSelection && !this.isSelectingText) {
        // ACTUAL text selection started - disable effects
        this.isSelectingText = true;
        this.interactiveEffectsManager.disableInteractiveEffects(this.containerId);
      } else if (!hasSelection && this.isSelectingText) {
        // Text selection ended - re-enable effects
        this.isSelectingText = false;
        if (this.selectionTimeout) {
          clearTimeout(this.selectionTimeout);
        }
        this.selectionTimeout = setTimeout(() => {
          // Only re-enable if we're not currently drawing
          if (!this.isDrawingInProgress) {
            this.interactiveEffectsManager.enableInteractiveEffects();
          }
        }, 100); // Reduced delay to 100ms for better responsiveness
      }
    });

    // Listen for mouse down to detect potential text selection start and handle annotation interaction
    document.addEventListener('mousedown', (event) => {
      const target = event.target as HTMLElement;

      // If clicking on an annotation or annotation-related element
      if (this._isAnnotationElement(target)) {
        // Immediately re-enable interactive effects
        if (this.isSelectingText) {
          this.isSelectingText = false;
          if (this.selectionTimeout) {
            clearTimeout(this.selectionTimeout);
          }
          // Re-enable effects immediately when clicking on annotations
          if (!this.isDrawingInProgress) {
            this.interactiveEffectsManager.enableInteractiveEffects();
          }
        }
        return; // Don't proceed with text selection logic for annotations
      }

      // Also check if this is a PDF.js element that we might have missed
      const isPdfElement =
        target.closest('.textLayer') ||
        target.closest('.annotationLayer') ||
        target.closest('.annotation') ||
        target.closest('[data-element-id]') ||
        target.closest('[data-l10n-id]');

      if (isPdfElement && this.isSelectingText) {
        this.isSelectingText = false;
        if (this.selectionTimeout) {
          clearTimeout(this.selectionTimeout);
        }
        // Force re-enable effects for PDF.js elements
        if (!this.isDrawingInProgress) {
          this.interactiveEffectsManager.enableInteractiveEffects();
        }
        return;
      }

      // Skip if clicking on interactive elements
      if (this._isInteractiveElement(target)) {
        return;
      }

      // If clicking on text content, prepare for potential selection
      // but don't disable effects yet - wait for actual selection
      if (this._isTextContent(target)) {
        // Mark that we might be starting text selection
        // Effects will be disabled when selection actually starts
        return;
      }
    });
  }

  /**
   * Checks if an element is an interactive element that should not trigger text selection mode.
   */
  private _isInteractiveElement(element: HTMLElement): boolean {
    // Check if element is part of the toolbar or annotation system
    const isToolbarElement =
      element.closest('.a-annotation-toolbar-container') ||
      element.closest('.a-toolbar-button') ||
      element.closest('.a-annotation-toolbar-right-container') ||
      element.closest('.a-annotation-shape-button') ||
      element.closest('.a-annotation-shape-dropdown') ||
      element.closest('.a-annotation-shape-properties') ||
      element.closest('.a-annotation-color-picker') ||
      element.closest('.a-annotation-dropdown-slider-container') ||
      element.closest('.a-annotation-border-dropdown');

    // Check if element is part of the annotation system
    const isAnnotationElement =
      element.closest('[annotation-id]') || element.closest('.a-annotation-layer') || element.closest('[data-resizer-handle]') || element.closest('[data-resizer-overlay]');

    // Check if element is a button or input
    const isInteractiveTag = element.tagName === 'BUTTON' || element.tagName === 'INPUT' || element.tagName === 'SELECT' || element.tagName === 'A';

    return !!(isToolbarElement || isAnnotationElement || isInteractiveTag);
  }

  /**
   * Checks if an element is an annotation element that should immediately re-enable interactive effects.
   */
  private _isAnnotationElement(element: HTMLElement): boolean {
    // Check if element is part of our annotation system
    const isOurAnnotation =
      element.closest('[annotation-id]') || element.closest('.a-annotation-layer') || element.closest('[data-resizer-handle]') || element.closest('[data-resizer-overlay]');

    // Check if element is part of PDF.js annotation system
    const isPdfAnnotation =
      element?.closest('.annotation') ||
      element?.closest('.linkAnnotation') ||
      element?.closest('.textAnnotation') ||
      element?.closest('.highlightAnnotation') ||
      element?.closest('.underlineAnnotation') ||
      element?.closest('.strikeOutAnnotation') ||
      element?.closest('.squigglyAnnotation') ||
      element?.closest('.popupAnnotation') ||
      element?.closest('.lineAnnotation') ||
      element?.closest('.squareAnnotation') ||
      element?.closest('.circleAnnotation') ||
      element?.closest('.polylineAnnotation') ||
      element?.closest('.polygonAnnotation') ||
      element?.closest('.inkAnnotation') ||
      element?.closest('.stampAnnotation') ||
      element?.closest('.fileAttachmentAnnotation') ||
      element?.closest('.soundAnnotation') ||
      element?.closest('.movieAnnotation') ||
      element?.closest('.screenAnnotation') ||
      element?.closest('.widgetAnnotation') ||
      element?.closest('.printerMarkAnnotation') ||
      element?.closest('.trapNetAnnotation') ||
      element?.closest('.watermarkAnnotation') ||
      // element?.closest('.3DAnnotation') ||
      element?.closest('.redactAnnotation') ||
      element?.closest('.caretAnnotation') ||
      element?.closest('.projectionAnnotation') ||
      element?.closest('.richMediaAnnotation') ||
      element?.closest('.unknownAnnotation') ||
      element?.closest('[data-annotation-id]') ||
      element?.closest('[data-annotation-type]') ||
      element?.closest('[role="button"]') ||
      element?.closest('[role="link"]') ||
      element?.closest('[role="textbox"]') ||
      element?.closest('[role="checkbox"]') ||
      element?.closest('[role="radio"]') ||
      element?.closest('[role="combobox"]') ||
      element?.closest('[role="listbox"]') ||
      element?.closest('[role="option"]') ||
      element?.closest('[role="slider"]') ||
      element?.closest('[role="spinbutton"]') ||
      element?.closest('[role="tab"]') ||
      element?.closest('[role="tabpanel"]') ||
      element?.closest('[role="tree"]') ||
      element?.closest('[role="treeitem"]') ||
      element?.closest('[role="grid"]') ||
      element?.closest('[role="gridcell"]') ||
      element?.closest('[role="row"]') ||
      element?.closest('[role="rowheader"]') ||
      element?.closest('[role="columnheader"]') ||
      element?.closest('[role="menubar"]') ||
      element?.closest('[role="menu"]') ||
      element?.closest('[role="menuitem"]') ||
      element?.closest('[role="toolbar"]') ||
      element?.closest('[role="tooltip"]') ||
      element?.closest('[role="dialog"]') ||
      element?.closest('[role="alert"]') ||
      element?.closest('[role="log"]') ||
      element?.closest('[role="status"]') ||
      element?.closest('[role="progressbar"]') ||
      element?.closest('[role="scrollbar"]') ||
      element?.closest('[role="searchbox"]') ||
      element?.closest('[role="switch"]') ||
      element?.closest('[role="tablist"]') ||
      element?.closest('[role="timer"]') ||
      element?.closest('[role="marquee"]') ||
      element?.closest('[role="application"]') ||
      element?.closest('[role="article"]') ||
      element?.closest('[role="banner"]') ||
      element?.closest('[role="complementary"]') ||
      element?.closest('[role="contentinfo"]') ||
      element?.closest('[role="form"]') ||
      element?.closest('[role="main"]') ||
      element?.closest('[role="navigation"]') ||
      element?.closest('[role="region"]') ||
      element?.closest('[role="search"]') ||
      element?.closest('[role="section"]') ||
      element?.closest('[role="sectionhead"]') ||
      element?.closest('[role="separator"]') ||
      element?.closest('[role="submenu"]') ||
      element?.closest('[role="text"]') ||
      element?.closest('[role="treegrid"]') ||
      element?.closest('[role="presentation"]') ||
      element?.closest('[role="group"]') ||
      element?.closest('[role="list"]') ||
      element?.closest('[role="listitem"]') ||
      element?.closest('[role="definition"]') ||
      element?.closest('[role="term"]') ||
      element?.closest('[role="note"]') ||
      element?.closest('[role="doc-abstract"]') ||
      element?.closest('[role="doc-acknowledgments"]') ||
      element?.closest('[role="doc-afterword"]') ||
      element?.closest('[role="doc-appendix"]') ||
      element?.closest('[role="doc-backlink"]') ||
      element?.closest('[role="doc-biblioentry"]') ||
      element?.closest('[role="doc-bibliography"]') ||
      element?.closest('[role="doc-biblioref"]') ||
      element?.closest('[role="doc-chapter"]') ||
      element?.closest('[role="doc-colophon"]') ||
      element?.closest('[role="doc-conclusion"]') ||
      element?.closest('[role="doc-cover"]') ||
      element?.closest('[role="doc-credit"]') ||
      element?.closest('[role="doc-credits"]') ||
      element?.closest('[role="doc-dedication"]') ||
      element?.closest('[role="doc-endnotes"]') ||
      element?.closest('[role="doc-epigraph"]') ||
      element?.closest('[role="doc-epilogue"]') ||
      element?.closest('[role="doc-errata"]') ||
      element?.closest('[role="doc-example"]') ||
      element?.closest('[role="doc-foreword"]') ||
      element?.closest('[role="doc-glossary"]') ||
      element?.closest('[role="doc-glossref"]') ||
      element?.closest('[role="doc-index"]') ||
      element?.closest('[role="doc-introduction"]') ||
      element?.closest('[role="doc-noteref"]') ||
      element?.closest('[role="doc-notice"]') ||
      element?.closest('[role="doc-pagebreak"]') ||
      element?.closest('[role="doc-pagelist"]') ||
      element?.closest('[role="doc-part"]') ||
      element?.closest('[role="doc-preface"]') ||
      element?.closest('[role="doc-prologue"]') ||
      element?.closest('[role="doc-pullquote"]') ||
      element?.closest('[role="doc-qna"]') ||
      element?.closest('[role="doc-subtitle"]') ||
      element?.closest('[role="doc-tip"]') ||
      element?.closest('[role="doc-toc"]') ||
      element?.closest('[role="doc-warning"]');

    return !!(isOurAnnotation || isPdfAnnotation);
  }

  /**
   * Checks if an element contains text content that could be selected.
   */
  private _isTextContent(element: HTMLElement): boolean {
    // Check if element is part of the PDF text layer
    const isTextLayer = element.closest('.textLayer');

    // Check if element contains actual text content
    const hasTextContent = element.textContent && element.textContent.trim().length > 0;

    return !!(isTextLayer && hasTextContent);
  }

  /**
   * Notifies all registered listeners of a selection change.
   */
  private _notifyListeners(): void {
    this.listeners.forEach((listener) => listener(this.selectedShape));
  }
}
