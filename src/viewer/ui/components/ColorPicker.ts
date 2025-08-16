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

import { PDF_VIEWER_CLASSNAMES } from '../../../constants/pdf-viewer-selectors';
import { ToolbarComponent } from './ToolbarComponent';
import { AnnotationPropertiesPlugin } from '../plugins/AnnotationPropertiesPlugin';
import { createPopper, Instance as PopperInstance } from '@popperjs/core';

export interface ColorPickerConfig {
  label: 'Color' | 'Fill';
  initialColor: string;
  onColorSelect: (color: string) => void;
  includeTransparent?: boolean;
  containerId: string;
}

/**
 * Color picker component for annotation toolbar
 * Handles color selection with predefined swatches and custom color support
 */
export class ColorPicker extends ToolbarComponent {
  private config: ColorPickerConfig;
  private dropdown!: HTMLDivElement;
  private colorButton!: HTMLButtonElement;
  private isDropdownOpen = false;
  private popperInstance?: PopperInstance;

  constructor(config: ColorPickerConfig) {
    super();
    this.config = config;
  }

  protected createElement(): HTMLElement {
    const container = document.createElement('div');
    container.classList.add(
      PDF_VIEWER_CLASSNAMES.A_ANNOTATION_SHAPE_PROPERTIES,
      this.config.label === 'Color' ? PDF_VIEWER_CLASSNAMES.A_ANNOTATION_SHAPE_PROPERTIES_COLOR : PDF_VIEWER_CLASSNAMES.A_ANNOTATION_SHAPE_PROPERTIES_FILL,
    );
    container.style.position = 'relative';
    container.style.display = 'flex';
    container.style.alignItems = 'center';

    const label = document.createElement('label');
    label.innerText = `${this.config.label}:`;
    container.appendChild(label);

    // Create color button and dropdown
    this.colorButton = this.createColorButton();
    this.dropdown = this.createDropdown();

    container.appendChild(this.colorButton);

    // Initialize event listeners and inject dropdown
    this.initialize();

    return container;
  }

  protected initialize(): void {
    this.setupEventListeners();
    this.injectDropdown();
  }

  private createColorButton(): HTMLButtonElement {
    const button = document.createElement('button');
    button.style.borderRadius = '4px';
    button.style.border = '1px solid #ccc';
    button.style.background = this.config.initialColor;
    button.style.cursor = 'pointer';
    button.style.width = '24px';
    button.style.height = '24px';
    return button;
  }

  private createDropdown(): HTMLDivElement {
    const dropdown = document.createElement('div');
    dropdown.classList.add(PDF_VIEWER_CLASSNAMES.A_ANNOTATION_COLOR_PICKER);
    dropdown.style.display = 'none';
    // Popper.js will handle positioning
    // dropdown.style.position = 'absolute'; // REMOVED - Popper.js handles positioning
    dropdown.style.zIndex = '10000';
    dropdown.style.background = '#fff';
    dropdown.style.border = '1px solid #ccc';
    dropdown.style.borderRadius = '4px';
    dropdown.style.padding = '8px';
    dropdown.style.boxShadow = '0 2px 8px rgba(0,0,0,0.15)';
    dropdown.style.minWidth = '200px';
    dropdown.style.pointerEvents = 'auto';

    const swatches = ['#FF0000', '#FF9900', '#FFFF00', '#00FF00', '#00FFFF', '#0000FF', '#FF00FF', '#FFFFFF', '#C0C0C0', '#000000'];
    if (this.config.includeTransparent) {
      swatches.unshift('transparent');
    }

    const swatchGrid = document.createElement('div');
    swatchGrid.style.display = 'grid';
    swatchGrid.style.gridTemplateColumns = 'repeat(5, 24px)';
    swatchGrid.style.gridGap = '8px';
    dropdown.appendChild(swatchGrid);

    swatches.forEach((hex) => {
      const swatch = this.createColorSwatch(hex);
      swatchGrid.appendChild(swatch);
    });

    if (this.config.includeTransparent) {
      const customRow = this.createCustomColorRow();
      dropdown.appendChild(customRow);
    }

    return dropdown;
  }

  private createColorSwatch(hex: string): HTMLDivElement {
    const swatch = document.createElement('div');
    swatch.classList.add(PDF_VIEWER_CLASSNAMES.A_ANNOTATION_COLOR_PICKER_OPTION);
    swatch.style.width = '24px';
    swatch.style.height = '24px';
    swatch.style.borderRadius = '4px';
    swatch.style.cursor = 'pointer';
    swatch.style.border = '1px solid #ccc';

    if (hex === 'transparent') {
      swatch.style.background = `
        linear-gradient(45deg, #bbb 25%, transparent 25%) 0 0 / 8px 8px,
        linear-gradient(45deg, transparent 75%, #bbb 75%) 0 0 / 8px 8px,
        #fff
      `;
    } else {
      swatch.style.background = hex;
    }

    swatch.addEventListener('click', () => {
      this.selectColor(hex);
    });

    return swatch;
  }

  private createCustomColorRow(): HTMLDivElement {
    const customRow = document.createElement('div');
    customRow.style.display = 'flex';
    customRow.style.alignItems = 'center';
    customRow.style.marginTop = '8px';
    customRow.style.cursor = 'pointer';
    customRow.style.padding = '4px';
    customRow.style.borderRadius = '4px';

    customRow.innerHTML = `<span>Custom Colors</span><span style="font-weight:bold;width:16px;text-align:center;">+</span>`;

    customRow.addEventListener('click', () => {
      this.hideDropdown();
      this.config.onColorSelect('custom');
    });

    customRow.addEventListener('mouseenter', () => {
      customRow.style.background = '#f0f0f0';
    });

    customRow.addEventListener('mouseleave', () => {
      customRow.style.background = 'transparent';
    });

    return customRow;
  }

  private injectDropdown(): void {
    // Use the old working logic: append to .a-pdf-viewer container
    const pdfViewerContainer = document.querySelector<HTMLElement>(`#${this.config.containerId} .a-pdf-viewer`);
    if (pdfViewerContainer) {
      pdfViewerContainer.appendChild(this.dropdown);
    } else {
      console.error('PDF viewer container not found for ColorPicker dropdown injection');
    }
  }

  private setupEventListeners(): void {
    this.colorButton.addEventListener('click', (e) => {
      e.stopPropagation();
      e.preventDefault();
      this.toggleDropdown();
    });

    // Close dropdown when clicking outside
    document.addEventListener('click', (e) => {
      if (!this.element.contains(e.target as Node)) {
        this.hideDropdown();
        // Use the simple dropdown manager instead
        // AnnotationPropertiesPlugin.closeActiveDropdown();
      }
    });

    // Close dropdown when pressing Escape
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        this.hideDropdown();
      }
    });
  }

  private toggleDropdown(): void {
    // Check if this dropdown is actually visible in the DOM
    const isActuallyVisible = this.dropdown.style.display === 'block';

    // If our internal state doesn't match the DOM state, sync them
    if (this.isDropdownOpen !== isActuallyVisible) {
      this.isDropdownOpen = isActuallyVisible;
    }

    if (this.isDropdownOpen) {
      this.hideDropdown();
    } else {
      this.showDropdown();
    }
  }

  private showDropdown(): void {
    // Use the simple dropdown manager to close any previously open dropdown
    // This will be handled by the AnnotationPropertiesPlugin

    // Also ensure our own dropdown is properly reset
    this.isDropdownOpen = false;

    // Position dropdown using Popper.js
    if (this.colorButton) {
      // Destroy any existing Popper instance
      if (this.popperInstance) {
        this.popperInstance.destroy();
      }

      // Create new Popper instance
      this.popperInstance = createPopper(this.colorButton, this.dropdown, {
        placement: 'bottom-start',
        modifiers: [
          { name: 'offset', options: { offset: [0, 8] } },
          { name: 'preventOverflow', options: { boundary: 'viewport', padding: 8 } },
          { name: 'flip', options: { fallbackPlacements: ['top-start', 'bottom-end', 'top-end'] } },
        ],
      });

      // Show dropdown
      this.dropdown.style.display = 'block';
      this.isDropdownOpen = true;

      // Update Popper positioning
      this.popperInstance.update();

      // Use the simple dropdown manager to close any previously open dropdown
      AnnotationPropertiesPlugin.setDropdownOpen(this.dropdown);
    } else {
      console.error('ColorPicker: No color button found');
    }
  }

  /**
   * Called when this dropdown is closed by the dropdown manager
   * This ensures internal state stays synchronized
   */
  public forceClose(): void {
    this.dropdown.style.display = 'none';
    this.isDropdownOpen = false;
  }

  private hideDropdown(): void {
    // Use the dropdown manager to properly track this dropdown as closed
    AnnotationPropertiesPlugin.closeDropdown(this.dropdown);

    // Reset internal state
    this.isDropdownOpen = false;

    // Clean up Popper instance
    if (this.popperInstance) {
      this.popperInstance.destroy();
      this.popperInstance = undefined;
    }
  }

  private selectColor(color: string): void {
    this.colorButton.style.background = color;
    this.hideDropdown();
    this.config.onColorSelect(color);
  }

  /**
   * Update the current color
   */
  updateColor(color: string): void {
    this.colorButton.style.background = color;
  }

  /**
   * Get the current selected color
   */
  getCurrentColor(): string {
    return this.colorButton.style.background;
  }

  protected onDestroy(): void {
    // Clean up Popper instance
    if (this.popperInstance) {
      this.popperInstance.destroy();
      this.popperInstance = undefined;
    }

    // Remove dropdown from DOM
    if (this.dropdown && this.dropdown.parentNode) {
      this.dropdown.parentNode.removeChild(this.dropdown);
    }
  }
}
