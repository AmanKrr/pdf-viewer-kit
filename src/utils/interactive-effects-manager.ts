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
  public disableInteractiveEffects(containerId: string): void {
    if (this.isDisabled) return;
    this.isDisabled = true;
    this.disableEffectsForElements(containerId);
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
  private disableEffectsForElements(containerId: string): void {
    // Disable effects for annotation elements
    this.disableEffectsForSelector(containerId, '[annotation-id]');
    this.disableEffectsForSelector(containerId, '.a-annotation-layer');
    this.disableEffectsForSelector(containerId, '.a-annotation-toolbar-container');
    this.disableEffectsForSelector(containerId, '[data-resizer-handle]');
    this.disableEffectsForSelector(containerId, '[data-resizer-overlay]');

    // Disable effects for toolbar elements
    this.disableEffectsForSelector(containerId, '.a-toolbar-button');
    this.disableEffectsForSelector(containerId, '.a-annotation-toolbar-right-container');

    // Disable effects for dropdown elements
    this.disableEffectsForSelector(containerId, '.a-annotation-color-picker');
    this.disableEffectsForSelector(containerId, '.a-annotation-dropdown-slider-container');
    this.disableEffectsForSelector(containerId, '.a-annotation-border-dropdown');

    // Disable effects for PDF.js native annotations and elements
    this.disableEffectsForSelector(containerId, '.textLayer');
    this.disableEffectsForSelector(containerId, '.annotationLayer');
    this.disableEffectsForSelector(containerId, '.annotation');
    this.disableEffectsForSelector(containerId, '[data-annotation-id]');
    this.disableEffectsForSelector(containerId, '[data-annotation-type]');
    this.disableEffectsForSelector(containerId, '.linkAnnotation');
    this.disableEffectsForSelector(containerId, '.textAnnotation');
    this.disableEffectsForSelector(containerId, '.highlightAnnotation');
    this.disableEffectsForSelector(containerId, '.underlineAnnotation');
    this.disableEffectsForSelector(containerId, '.strikeOutAnnotation');
    this.disableEffectsForSelector(containerId, '.squigglyAnnotation');
    this.disableEffectsForSelector(containerId, '.popupAnnotation');
    this.disableEffectsForSelector(containerId, '.lineAnnotation');
    this.disableEffectsForSelector(containerId, '.squareAnnotation');
    this.disableEffectsForSelector(containerId, '.circleAnnotation');
    this.disableEffectsForSelector(containerId, '.polylineAnnotation');
    this.disableEffectsForSelector(containerId, '.polygonAnnotation');
    this.disableEffectsForSelector(containerId, '.inkAnnotation');
    this.disableEffectsForSelector(containerId, '.stampAnnotation');
    this.disableEffectsForSelector(containerId, '.fileAttachmentAnnotation');
    this.disableEffectsForSelector(containerId, '.soundAnnotation');
    this.disableEffectsForSelector(containerId, '.movieAnnotation');
    this.disableEffectsForSelector(containerId, '.screenAnnotation');
    this.disableEffectsForSelector(containerId, '.widgetAnnotation');
    this.disableEffectsForSelector(containerId, '.printerMarkAnnotation');
    this.disableEffectsForSelector(containerId, '.trapNetAnnotation');
    this.disableEffectsForSelector(containerId, '.watermarkAnnotation');
    // this.disableEffectsForSelector(containerId, '.3DAnnotation');
    this.disableEffectsForSelector(containerId, '.redactAnnotation');
    this.disableEffectsForSelector(containerId, '.caretAnnotation');
    this.disableEffectsForSelector(containerId, '.projectionAnnotation');
    this.disableEffectsForSelector(containerId, '.richMediaAnnotation');
    this.disableEffectsForSelector(containerId, '.unknownAnnotation');

    // Also disable effects for any element with PDF.js specific attributes
    this.disableEffectsForSelector(containerId, '[data-element-id]');
    this.disableEffectsForSelector(containerId, '[data-l10n-id]');
    this.disableEffectsForSelector(containerId, '[role="button"]');
    this.disableEffectsForSelector(containerId, '[role="link"]');
    this.disableEffectsForSelector(containerId, '[role="textbox"]');
    this.disableEffectsForSelector(containerId, '[role="checkbox"]');
    this.disableEffectsForSelector(containerId, '[role="radio"]');
    this.disableEffectsForSelector(containerId, '[role="combobox"]');
    this.disableEffectsForSelector(containerId, '[role="listbox"]');
    this.disableEffectsForSelector(containerId, '[role="option"]');
    this.disableEffectsForSelector(containerId, '[role="slider"]');
    this.disableEffectsForSelector(containerId, '[role="spinbutton"]');
    this.disableEffectsForSelector(containerId, '[role="tab"]');
    this.disableEffectsForSelector(containerId, '[role="tabpanel"]');
    this.disableEffectsForSelector(containerId, '[role="tree"]');
    this.disableEffectsForSelector(containerId, '[role="treeitem"]');
    this.disableEffectsForSelector(containerId, '[role="grid"]');
    this.disableEffectsForSelector(containerId, '[role="gridcell"]');
    this.disableEffectsForSelector(containerId, '[role="row"]');
    this.disableEffectsForSelector(containerId, '[role="rowheader"]');
    this.disableEffectsForSelector(containerId, '[role="columnheader"]');
    this.disableEffectsForSelector(containerId, '[role="menubar"]');
    this.disableEffectsForSelector(containerId, '[role="menu"]');
    this.disableEffectsForSelector(containerId, '[role="menuitem"]');
    this.disableEffectsForSelector(containerId, '[role="toolbar"]');
    this.disableEffectsForSelector(containerId, '[role="tooltip"]');
    this.disableEffectsForSelector(containerId, '[role="dialog"]');
    this.disableEffectsForSelector(containerId, '[role="alert"]');
    this.disableEffectsForSelector(containerId, '[role="log"]');
    this.disableEffectsForSelector(containerId, '[role="status"]');
    this.disableEffectsForSelector(containerId, '[role="progressbar"]');
    this.disableEffectsForSelector(containerId, '[role="scrollbar"]');
    this.disableEffectsForSelector(containerId, '[role="searchbox"]');
    this.disableEffectsForSelector(containerId, '[role="switch"]');
    this.disableEffectsForSelector(containerId, '[role="tablist"]');
    this.disableEffectsForSelector(containerId, '[role="timer"]');
    this.disableEffectsForSelector(containerId, '[role="marquee"]');
    this.disableEffectsForSelector(containerId, '[role="application"]');
    this.disableEffectsForSelector(containerId, '[role="article"]');
    this.disableEffectsForSelector(containerId, '[role="banner"]');
    this.disableEffectsForSelector(containerId, '[role="complementary"]');
    this.disableEffectsForSelector(containerId, '[role="contentinfo"]');
    this.disableEffectsForSelector(containerId, '[role="form"]');
    this.disableEffectsForSelector(containerId, '[role="main"]');
    this.disableEffectsForSelector(containerId, '[role="navigation"]');
    this.disableEffectsForSelector(containerId, '[role="region"]');
    this.disableEffectsForSelector(containerId, '[role="search"]');
    this.disableEffectsForSelector(containerId, '[role="section"]');
    this.disableEffectsForSelector(containerId, '[role="sectionhead"]');
    this.disableEffectsForSelector(containerId, '[role="separator"]');
    this.disableEffectsForSelector(containerId, '[role="submenu"]');
    this.disableEffectsForSelector(containerId, '[role="text"]');
    this.disableEffectsForSelector(containerId, '[role="treegrid"]');
    this.disableEffectsForSelector(containerId, '[role="presentation"]');
    this.disableEffectsForSelector(containerId, '[role="group"]');
    this.disableEffectsForSelector(containerId, "[role='list']");
    this.disableEffectsForSelector(containerId, '[role="listitem"]');
    this.disableEffectsForSelector(containerId, '[role="definition"]');
    this.disableEffectsForSelector(containerId, '[role="term"]');
    this.disableEffectsForSelector(containerId, '[role="note"]');
    this.disableEffectsForSelector(containerId, '[role="doc-abstract"]');
    this.disableEffectsForSelector(containerId, '[role="doc-acknowledgments"]');
    this.disableEffectsForSelector(containerId, '[role="doc-afterword"]');
    this.disableEffectsForSelector(containerId, '[role="doc-appendix"]');
    this.disableEffectsForSelector(containerId, '[role="doc-backlink"]');
    this.disableEffectsForSelector(containerId, '[role="doc-biblioentry"]');
    this.disableEffectsForSelector(containerId, '[role="doc-bibliography"]');
    this.disableEffectsForSelector(containerId, '[role="doc-biblioref"]');
    this.disableEffectsForSelector(containerId, '[role="doc-chapter"]');
    this.disableEffectsForSelector(containerId, '[role="doc-colophon"]');
    this.disableEffectsForSelector(containerId, '[role="doc-conclusion"]');
    this.disableEffectsForSelector(containerId, '[role="doc-cover"]');
    this.disableEffectsForSelector(containerId, '[role="doc-credit"]');
    this.disableEffectsForSelector(containerId, '[role="doc-credits"]');
    this.disableEffectsForSelector(containerId, '[role="doc-dedication"]');
    this.disableEffectsForSelector(containerId, '[role="doc-endnotes"]');
    this.disableEffectsForSelector(containerId, '[role="doc-epigraph"]');
    this.disableEffectsForSelector(containerId, '[role="doc-epilogue"]');
    this.disableEffectsForSelector(containerId, '[role="doc-errata"]');
    this.disableEffectsForSelector(containerId, '[role="doc-example"]');
    this.disableEffectsForSelector(containerId, '[role="doc-foreword"]');
    this.disableEffectsForSelector(containerId, '[role="doc-glossary"]');
    this.disableEffectsForSelector(containerId, '[role="doc-glossref"]');
    this.disableEffectsForSelector(containerId, '[role="doc-index"]');
    this.disableEffectsForSelector(containerId, '[role="doc-introduction"]');
    this.disableEffectsForSelector(containerId, '[role="doc-noteref"]');
    this.disableEffectsForSelector(containerId, '[role="doc-notice"]');
    this.disableEffectsForSelector(containerId, '[role="doc-pagebreak"]');
    this.disableEffectsForSelector(containerId, '[role="doc-pagelist"]');
    this.disableEffectsForSelector(containerId, '[role="doc-part"]');
    this.disableEffectsForSelector(containerId, '[role="doc-preface"]');
    this.disableEffectsForSelector(containerId, '[role="doc-prologue"]');
    this.disableEffectsForSelector(containerId, '[role="doc-pullquote"]');
    this.disableEffectsForSelector(containerId, '[role="doc-qna"]');
    this.disableEffectsForSelector(containerId, '[role="doc-subtitle"]');
    this.disableEffectsForSelector(containerId, '[role="doc-tip"]');
    this.disableEffectsForSelector(containerId, '[role="doc-toc"]');
    this.disableEffectsForSelector(containerId, '[role="doc-warning"]');
  }

  /**
   * Disables interactive effects for elements matching a CSS selector.
   */
  private disableEffectsForSelector(containerId: string, selector: string): void {
    const elements = document.getElementById(containerId)?.shadowRoot?.querySelectorAll<HTMLElement>(selector);
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
