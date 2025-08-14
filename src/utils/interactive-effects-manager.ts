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

/**
 * Manages interactive effects (hover, cursor changes, etc.) during drawing and text selection.
 * Disables these effects to ensure smooth, unobstructed user experience.
 */
export class InteractiveEffectsManager {
  private static instance: InteractiveEffectsManager;
  private isDisabled: boolean = false;
  private originalStyles: Map<HTMLElement, { cursor: string; pointerEvents: string }> = new Map();
  private affectedElements: Set<HTMLElement> = new Set();

  private constructor() {}

  /**
   * Gets the singleton instance of InteractiveEffectsManager.
   */
  public static getInstance(): InteractiveEffectsManager {
    if (!InteractiveEffectsManager.instance) {
      InteractiveEffectsManager.instance = new InteractiveEffectsManager();
    }
    return InteractiveEffectsManager.instance;
  }

  /**
   * Disables interactive effects for all relevant elements.
   * This includes hover effects, cursor changes, and pointer events.
   */
  public disableInteractiveEffects(): void {
    if (this.isDisabled) return;
    this.isDisabled = true;
    this.disableEffectsForElements();
  }

  /**
   * Re-enables interactive effects for all affected elements.
   */
  public enableInteractiveEffects(): void {
    if (!this.isDisabled) return;
    this.isDisabled = false;
    this.restoreOriginalStyles();
  }

  /**
   * Disables interactive effects for specific elements.
   */
  private disableEffectsForElements(): void {
    // Disable effects for annotation elements
    this.disableEffectsForSelector('[annotation-id]');
    this.disableEffectsForSelector('.a-annotation-layer');
    this.disableEffectsForSelector('.a-annotation-toolbar-container');
    this.disableEffectsForSelector('[data-resizer-handle]');
    this.disableEffectsForSelector('[data-resizer-overlay]');

    // Disable effects for toolbar elements
    this.disableEffectsForSelector('.a-toolbar-button');
    this.disableEffectsForSelector('.a-annotation-toolbar-right-container');

    // Disable effects for dropdown elements
    this.disableEffectsForSelector('.a-annotation-color-picker');
    this.disableEffectsForSelector('.a-annotation-dropdown-slider-container');
    this.disableEffectsForSelector('.a-annotation-border-dropdown');

    // Disable effects for PDF.js native annotations and elements
    this.disableEffectsForSelector('.textLayer');
    this.disableEffectsForSelector('.annotationLayer');
    this.disableEffectsForSelector('.annotation');
    this.disableEffectsForSelector('[data-annotation-id]');
    this.disableEffectsForSelector('[data-annotation-type]');
    this.disableEffectsForSelector('.linkAnnotation');
    this.disableEffectsForSelector('.textAnnotation');
    this.disableEffectsForSelector('.highlightAnnotation');
    this.disableEffectsForSelector('.underlineAnnotation');
    this.disableEffectsForSelector('.strikeOutAnnotation');
    this.disableEffectsForSelector('.squigglyAnnotation');
    this.disableEffectsForSelector('.popupAnnotation');
    this.disableEffectsForSelector('.lineAnnotation');
    this.disableEffectsForSelector('.squareAnnotation');
    this.disableEffectsForSelector('.circleAnnotation');
    this.disableEffectsForSelector('.polylineAnnotation');
    this.disableEffectsForSelector('.polygonAnnotation');
    this.disableEffectsForSelector('.inkAnnotation');
    this.disableEffectsForSelector('.stampAnnotation');
    this.disableEffectsForSelector('.fileAttachmentAnnotation');
    this.disableEffectsForSelector('.soundAnnotation');
    this.disableEffectsForSelector('.movieAnnotation');
    this.disableEffectsForSelector('.screenAnnotation');
    this.disableEffectsForSelector('.widgetAnnotation');
    this.disableEffectsForSelector('.printerMarkAnnotation');
    this.disableEffectsForSelector('.trapNetAnnotation');
    this.disableEffectsForSelector('.watermarkAnnotation');
    // this.disableEffectsForSelector('.3DAnnotation');
    this.disableEffectsForSelector('.redactAnnotation');
    this.disableEffectsForSelector('.caretAnnotation');
    this.disableEffectsForSelector('.projectionAnnotation');
    this.disableEffectsForSelector('.richMediaAnnotation');
    this.disableEffectsForSelector('.unknownAnnotation');

    // Also disable effects for any element with PDF.js specific attributes
    this.disableEffectsForSelector('[data-element-id]');
    this.disableEffectsForSelector('[data-l10n-id]');
    this.disableEffectsForSelector('[role="button"]');
    this.disableEffectsForSelector('[role="link"]');
    this.disableEffectsForSelector('[role="textbox"]');
    this.disableEffectsForSelector('[role="checkbox"]');
    this.disableEffectsForSelector('[role="radio"]');
    this.disableEffectsForSelector('[role="combobox"]');
    this.disableEffectsForSelector('[role="listbox"]');
    this.disableEffectsForSelector('[role="option"]');
    this.disableEffectsForSelector('[role="slider"]');
    this.disableEffectsForSelector('[role="spinbutton"]');
    this.disableEffectsForSelector('[role="tab"]');
    this.disableEffectsForSelector('[role="tabpanel"]');
    this.disableEffectsForSelector('[role="tree"]');
    this.disableEffectsForSelector('[role="treeitem"]');
    this.disableEffectsForSelector('[role="grid"]');
    this.disableEffectsForSelector('[role="gridcell"]');
    this.disableEffectsForSelector('[role="row"]');
    this.disableEffectsForSelector('[role="rowheader"]');
    this.disableEffectsForSelector('[role="columnheader"]');
    this.disableEffectsForSelector('[role="menubar"]');
    this.disableEffectsForSelector('[role="menu"]');
    this.disableEffectsForSelector('[role="menuitem"]');
    this.disableEffectsForSelector('[role="toolbar"]');
    this.disableEffectsForSelector('[role="tooltip"]');
    this.disableEffectsForSelector('[role="dialog"]');
    this.disableEffectsForSelector('[role="alert"]');
    this.disableEffectsForSelector('[role="log"]');
    this.disableEffectsForSelector('[role="status"]');
    this.disableEffectsForSelector('[role="progressbar"]');
    this.disableEffectsForSelector('[role="scrollbar"]');
    this.disableEffectsForSelector('[role="searchbox"]');
    this.disableEffectsForSelector('[role="switch"]');
    this.disableEffectsForSelector('[role="tablist"]');
    this.disableEffectsForSelector('[role="timer"]');
    this.disableEffectsForSelector('[role="marquee"]');
    this.disableEffectsForSelector('[role="application"]');
    this.disableEffectsForSelector('[role="article"]');
    this.disableEffectsForSelector('[role="banner"]');
    this.disableEffectsForSelector('[role="complementary"]');
    this.disableEffectsForSelector('[role="contentinfo"]');
    this.disableEffectsForSelector('[role="form"]');
    this.disableEffectsForSelector('[role="main"]');
    this.disableEffectsForSelector('[role="navigation"]');
    this.disableEffectsForSelector('[role="region"]');
    this.disableEffectsForSelector('[role="search"]');
    this.disableEffectsForSelector('[role="section"]');
    this.disableEffectsForSelector('[role="sectionhead"]');
    this.disableEffectsForSelector('[role="separator"]');
    this.disableEffectsForSelector('[role="submenu"]');
    this.disableEffectsForSelector('[role="text"]');
    this.disableEffectsForSelector('[role="treegrid"]');
    this.disableEffectsForSelector('[role="presentation"]');
    this.disableEffectsForSelector('[role="group"]');
    this.disableEffectsForSelector("[role='list']");
    this.disableEffectsForSelector('[role="listitem"]');
    this.disableEffectsForSelector('[role="definition"]');
    this.disableEffectsForSelector('[role="term"]');
    this.disableEffectsForSelector('[role="note"]');
    this.disableEffectsForSelector('[role="doc-abstract"]');
    this.disableEffectsForSelector('[role="doc-acknowledgments"]');
    this.disableEffectsForSelector('[role="doc-afterword"]');
    this.disableEffectsForSelector('[role="doc-appendix"]');
    this.disableEffectsForSelector('[role="doc-backlink"]');
    this.disableEffectsForSelector('[role="doc-biblioentry"]');
    this.disableEffectsForSelector('[role="doc-bibliography"]');
    this.disableEffectsForSelector('[role="doc-biblioref"]');
    this.disableEffectsForSelector('[role="doc-chapter"]');
    this.disableEffectsForSelector('[role="doc-colophon"]');
    this.disableEffectsForSelector('[role="doc-conclusion"]');
    this.disableEffectsForSelector('[role="doc-cover"]');
    this.disableEffectsForSelector('[role="doc-credit"]');
    this.disableEffectsForSelector('[role="doc-credits"]');
    this.disableEffectsForSelector('[role="doc-dedication"]');
    this.disableEffectsForSelector('[role="doc-endnotes"]');
    this.disableEffectsForSelector('[role="doc-epigraph"]');
    this.disableEffectsForSelector('[role="doc-epilogue"]');
    this.disableEffectsForSelector('[role="doc-errata"]');
    this.disableEffectsForSelector('[role="doc-example"]');
    this.disableEffectsForSelector('[role="doc-foreword"]');
    this.disableEffectsForSelector('[role="doc-glossary"]');
    this.disableEffectsForSelector('[role="doc-glossref"]');
    this.disableEffectsForSelector('[role="doc-index"]');
    this.disableEffectsForSelector('[role="doc-introduction"]');
    this.disableEffectsForSelector('[role="doc-noteref"]');
    this.disableEffectsForSelector('[role="doc-notice"]');
    this.disableEffectsForSelector('[role="doc-pagebreak"]');
    this.disableEffectsForSelector('[role="doc-pagelist"]');
    this.disableEffectsForSelector('[role="doc-part"]');
    this.disableEffectsForSelector('[role="doc-preface"]');
    this.disableEffectsForSelector('[role="doc-prologue"]');
    this.disableEffectsForSelector('[role="doc-pullquote"]');
    this.disableEffectsForSelector('[role="doc-qna"]');
    this.disableEffectsForSelector('[role="doc-subtitle"]');
    this.disableEffectsForSelector('[role="doc-tip"]');
    this.disableEffectsForSelector('[role="doc-toc"]');
    this.disableEffectsForSelector('[role="doc-warning"]');
  }

  /**
   * Disables interactive effects for elements matching a CSS selector.
   */
  private disableEffectsForSelector(selector: string): void {
    const elements = document.querySelectorAll<HTMLElement>(selector);
    if (elements) {
      elements.forEach((element) => {
        this.disableEffectsForElement(element);
      });
    }
  }

  /**
   * Disables interactive effects for a specific element.
   */
  private disableEffectsForElement(element: HTMLElement): void {
    if (this.affectedElements.has(element)) return;

    // Store original styles
    this.originalStyles.set(element, {
      cursor: element.style.cursor || '',
      pointerEvents: element.style.pointerEvents || '',
    });

    // Disable interactive effects
    element.style.cursor = 'default';
    element.style.pointerEvents = 'none';

    // Store affected element
    this.affectedElements.add(element);
  }

  /**
   * Restores original styles for all affected elements.
   */
  private restoreOriginalStyles(): void {
    this.affectedElements.forEach((element) => {
      const originalStyle = this.originalStyles.get(element);
      if (originalStyle) {
        element.style.cursor = originalStyle.cursor;
        element.style.pointerEvents = originalStyle.pointerEvents;
      }
    });
    this.originalStyles.clear();
    this.affectedElements.clear();
  }

  /**
   * Checks if interactive effects are currently disabled.
   */
  public get isInteractiveEffectsDisabled(): boolean {
    return this.isDisabled;
  }
}
