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
import { AnnotationContext, BaseAnnotationToolbarPlugin } from './annotation-toolbar.plugin';
import { ShapeType } from '../../../types/geometry.types';
import { createPopper, Instance as PopperInstance } from '@popperjs/core';

export interface ShapeOption {
  id: string;
  name: string;
  type: ShapeType;
  icon: string;
}

/**
 * Plugin for handling shape selection in the annotation toolbar
 */
export class ShapeSelectionPlugin extends BaseAnnotationToolbarPlugin {
  name = 'ShapeSelectionPlugin';

  private shapeButton?: HTMLButtonElement;
  private arrowButton?: HTMLButtonElement;
  private shapeDropdown?: HTMLDivElement;
  private isDropdownOpen = false;
  private isDrawingActive = false;
  private popperInstance?: PopperInstance;

  // Simple dropdown manager for this plugin
  private static currentlyOpenDropdown: HTMLElement | null = null;

  // Simple method to close any open dropdown
  private static closeOpenDropdown(): void {
    if (ShapeSelectionPlugin.currentlyOpenDropdown) {
      ShapeSelectionPlugin.currentlyOpenDropdown.style.display = 'none';
      ShapeSelectionPlugin.currentlyOpenDropdown = null;
    }
  }

  // Simple method to set a dropdown as open
  private static setDropdownOpen(dropdown: HTMLElement): void {
    // Close any previously open dropdown first
    ShapeSelectionPlugin.closeOpenDropdown();
    // Set this one as open
    ShapeSelectionPlugin.currentlyOpenDropdown = dropdown;
  }

  private _boundDrawingFinishedHandler: (() => void) | undefined;
  private _boundAnnotationCreatedHandler: (() => void) | undefined;
  private _boundClickOutsideHandler: ((event: Event) => void) | undefined;

  private shapeOptions: ShapeOption[] = [
    { id: 'rectangle', name: 'Rectangle', type: 'rectangle', icon: 'rectangle' },
    { id: 'ellipse', name: 'Ellipse', type: 'ellipse', icon: 'circle' },
    { id: 'line', name: 'Line', type: 'line', icon: 'pen_size_1' },
  ];

  constructor() {
    super('shape-selection', '1.0.0');
  }

  protected onInitialize(context: AnnotationContext): void {
    // Reset to clean state when initializing
    this.isDrawingActive = false;
    this.isDropdownOpen = false;

    // Subscribe to shape selection changes
    context.stateManager.subscribeToProperty('selectedShape', (newShape) => {
      // If shape is selected, automatically enable drawing
      if (newShape !== 'none') {
        this.setDrawingActive(true);
      }
    });

    // Subscribe to drawing finished events to deactivate buttons
    this._boundDrawingFinishedHandler = () => {
      // Only deactivate drawing, don't reset shape selection
      this.setDrawingActive(false);
      // The selected shape should remain visible in the shape button
    };
    context.viewer.events.on('DRAWING_FINISHED', this._boundDrawingFinishedHandler);

    // Subscribe to annotation created events to reset drawing state
    this._boundAnnotationCreatedHandler = () => {
      // Only deactivate drawing, don't reset shape selection
      this.setDrawingActive(false);
      // The selected shape should remain visible in the shape button
    };
    context.viewer.events.on('ANNOTATION_CREATED', this._boundAnnotationCreatedHandler);

    // Add click outside handler to close dropdown
    this._boundClickOutsideHandler = this._handleClickOutside.bind(this);
    document.addEventListener('click', this._boundClickOutsideHandler);
  }

  protected onRender(container: HTMLElement, context: AnnotationContext): void {
    // Reset to clean state when rendering
    this.isDrawingActive = false;
    this.isDropdownOpen = false;

    const shapeSelectContainer = document.createElement('div');
    shapeSelectContainer.style.position = 'relative';
    container.appendChild(shapeSelectContainer);

    const shapeButtonContainer = document.createElement('div');
    shapeButtonContainer.classList.add(PDF_VIEWER_CLASSNAMES.A_ANNOTATION_SHAPE_BUTTON);
    shapeSelectContainer.appendChild(shapeButtonContainer);

    // Create main shape button
    this.shapeButton = this.createShapeButton(context);
    shapeButtonContainer.appendChild(this.shapeButton);

    // Create dropdown arrow
    this.arrowButton = this.createArrowButton(context);
    shapeButtonContainer.appendChild(this.arrowButton);

    // Create shape dropdown and append to .a-pdf-viewer
    this.shapeDropdown = this.createShapeDropdown(context);

    // Get the .a-pdf-viewer container for appending dropdowns
    const pdfViewerContainer = document.getElementById(context.containerId)?.shadowRoot?.querySelector<HTMLElement>(`.a-pdf-viewer`);
    if (pdfViewerContainer) {
      pdfViewerContainer.appendChild(this.shapeDropdown);
    } else {
      console.error('PDF viewer container not found for shape dropdown injection');
    }

    // Initialize button states after buttons are created
    this.updateButtonStates();
  }

  private createShapeButton(context: AnnotationContext): HTMLButtonElement {
    const button = document.createElement('button');
    button.classList.add('a-toolbar-button');
    button.setAttribute('title', 'Select Shape');

    const icon = document.createElement('span');
    icon.className = 'annotation-shape-icon material-symbols-outlined';
    icon.textContent = '';
    button.appendChild(icon);

    button.addEventListener('click', (e) => {
      // Prevent event propagation to avoid conflicts
      e.preventDefault();
      e.stopPropagation();

      const currentShape = context.stateManager.state.selectedShape;

      if (currentShape !== 'none') {
        if (this.isDrawingActive) {
          // Shape is active and drawing - deactivate it (but keep the shape)
          this.setDrawingActive(false);
          // DON'T reset the shape - just close properties panel
          context.stateManager.setState({
            propertiesOpen: false, // Close properties panel
          });
          // Update button to show deactivated state but keep the shape icon
          this.updateShapeButton(currentShape); // Keep the current shape
        } else {
          // Shape is selected but not active - reactivate it
          this.setDrawingActive(true);
          context.stateManager.setState({
            propertiesOpen: true, // Open properties panel
          });
        }
      }
      // No shape selected - do nothing (user must use arrow button to select)
    });

    return button;
  }

  private createArrowButton(context: AnnotationContext): HTMLButtonElement {
    const button = document.createElement('button');
    button.classList.add(PDF_VIEWER_CLASSNAMES.A_ANNOTATION_SHAPE_ARROWDOWN);
    button.innerHTML = '<span class="material-symbols-outlined">arrow_drop_down</span>';
    button.setAttribute('title', 'Select shape type (Rectangle, Ellipse, Line)');

    // Make arrow button always prominent
    button.style.cursor = 'pointer';
    button.style.opacity = '1';

    button.addEventListener('click', (e) => {
      // CRITICAL: Prevent event propagation and default behavior
      e.preventDefault();
      e.stopPropagation();

      // Use a small timeout to ensure click outside handler doesn't interfere
      setTimeout(() => {
        this.toggleShapeDropdown();
      }, 0);
    });

    return button;
  }

  private createShapeDropdown(context: AnnotationContext): HTMLDivElement {
    const dropdown = document.createElement('div');
    dropdown.classList.add(PDF_VIEWER_CLASSNAMES.A_ANNOTATION_SHAPE_DROPDOWN);
    dropdown.style.display = 'none';

    this.shapeOptions.forEach((shape) => {
      const item = this.createShapeOption(shape, context);
      dropdown.appendChild(item);
    });

    return dropdown;
  }

  private createShapeOption(shape: ShapeOption, context: AnnotationContext): HTMLDivElement {
    const item = document.createElement('div');
    item.style.padding = '5px';

    item.innerHTML = `
      <span class="material-symbols-outlined">${shape.icon}</span>
      <span>${shape.name}</span>
    `;

    item.addEventListener('click', (e) => {
      // Prevent event propagation
      e.preventDefault();
      e.stopPropagation();

      context.stateManager.setState({
        selectedShape: shape.type,
        selectedShapeIcon: shape.icon,
        propertiesOpen: true, // Always open properties when a shape is selected
      });

      // Automatically enable drawing for the selected shape
      this.setDrawingActive(true);

      this.hideShapeDropdown();
    });

    item.addEventListener('mouseenter', () => {
      item.style.background = '#f0f0f0';
    });

    item.addEventListener('mouseleave', () => {
      item.style.background = 'transparent';
    });

    return item;
  }

  private toggleShapeDropdown(): void {
    if (this.isDropdownOpen) {
      this.hideShapeDropdown();
    } else {
      this.showShapeDropdown();
    }
  }

  private showShapeDropdown(): void {
    if (!this.shapeDropdown || !this.shapeButton) {
      console.error('ShapeSelectionPlugin: Missing shape button or dropdown');
      return;
    }

    // First, close any currently open dropdown
    ShapeSelectionPlugin.closeOpenDropdown();

    // Clean up any existing popper instance
    if (this.popperInstance) {
      this.popperInstance.destroy();
      this.popperInstance = undefined;
    }

    // Create new Popper instance
    this.popperInstance = createPopper(this.shapeButton, this.shapeDropdown, {
      placement: 'bottom-start',
      modifiers: [
        {
          name: 'offset',
          options: {
            offset: [0, 8], // [x, y] offset
          },
        },
        {
          name: 'preventOverflow',
          options: {
            boundary: 'viewport',
            padding: 8,
          },
        },
        {
          name: 'flip',
          options: {
            fallbackPlacements: ['top-start', 'bottom-end', 'top-end'],
          },
        },
      ],
    });

    // Show dropdown
    this.shapeDropdown.style.display = 'block';
    this.isDropdownOpen = true;

    // Register this dropdown as open
    ShapeSelectionPlugin.setDropdownOpen(this.shapeDropdown);

    // Update Popper position after showing
    if (this.popperInstance) {
      this.popperInstance.update();
    }
  }

  private hideShapeDropdown(): void {
    if (!this.shapeDropdown) {
      return;
    }

    // Hide dropdown
    this.shapeDropdown.style.display = 'none';
    this.isDropdownOpen = false;

    // Clean up popper instance
    if (this.popperInstance) {
      this.popperInstance.destroy();
      this.popperInstance = undefined;
    }

    // Clear the currently open dropdown if it's this one
    if (ShapeSelectionPlugin.currentlyOpenDropdown === this.shapeDropdown) {
      ShapeSelectionPlugin.currentlyOpenDropdown = null;
    }
  }

  private updateShapeButton(shape: ShapeType | 'none'): void {
    if (this.shapeButton && shape !== 'none') {
      const icon = this.shapeButton.querySelector('span');
      if (icon) {
        const shapeOption = this.shapeOptions.find((opt) => opt.type === shape);
        if (shapeOption) {
          icon.textContent = shapeOption.icon;
          // Update tooltip to show current state
          if (this.isDrawingActive) {
            this.shapeButton.setAttribute('title', `${shapeOption.name} drawing is active - Click to deactivate`);
          } else {
            this.shapeButton.setAttribute('title', `${shapeOption.name} selected - Click to enable drawing`);
          }
        }
      }
    } else if (this.shapeButton) {
      // Reset to default state
      const icon = this.shapeButton.querySelector('span');
      if (icon) {
        icon.textContent = '';
        this.shapeButton.setAttribute('title', 'Select a shape first using the arrow button');
      }
    }
  }

  /**
   * Set the drawing active state and update button appearances
   */
  private setDrawingActive(active: boolean): void {
    this.isDrawingActive = active;

    // If deactivating drawing, also close properties panel
    if (!active && this.context) {
      this.context.stateManager.setState({
        propertiesOpen: false,
      });
    }

    // Update button states to reflect the new drawing state
    this.updateButtonStates();
  }

  /**
   * Update the visual state of both buttons based on current state
   */
  private updateButtonStates(): void {
    if (!this.context) {
      return;
    }

    const hasShape = this.context.stateManager.state.selectedShape !== 'none';
    const selectedShape = this.context.stateManager.state.selectedShape;

    if (this.shapeButton) {
      if (hasShape && this.isDrawingActive) {
        // Shape selected and drawing active - button is active
        this.shapeButton.style.cursor = 'pointer';
        this.shapeButton.style.opacity = '1';
        this.shapeButton.style.background = '#4b4b4b'; // Dark gray background to match arrow button active color
        this.shapeButton.style.color = 'white'; // White text for active state
        this.shapeButton.parentElement?.classList.add('active'); // Add CSS class for consistency
      } else if (hasShape && !this.isDrawingActive) {
        // Shape selected but drawing inactive - button is clickable to re-enable
        this.shapeButton.style.cursor = 'pointer';
        this.shapeButton.style.opacity = '1';
        this.shapeButton.style.background = ''; // Normal background
        this.shapeButton.style.color = ''; // Reset text color
        this.shapeButton.parentElement?.classList.remove('active'); // Remove CSS class
      } else {
        // No shape selected - button is inactive
        this.shapeButton.style.cursor = 'default';
        this.shapeButton.style.opacity = '0.6';
        this.shapeButton.style.background = '';
        this.shapeButton.style.color = ''; // Reset text color
        this.shapeButton.parentElement?.classList.remove('active'); // Remove CSS class
      }
    }

    if (this.arrowButton) {
      // Arrow button is always active for shape selection
      this.arrowButton.style.cursor = 'pointer';
      this.arrowButton.style.opacity = '1';
      this.arrowButton.style.background = '';
    }

    // Also update the shape button icon and tooltip to ensure consistency
    if (hasShape) {
      this.updateShapeButton(selectedShape);
    } else {
      // No shape selected - reset to default
      this.updateShapeButton('none');
    }
  }

  protected onUpdate(context: AnnotationContext): void {
    // Update button states which will also update the shape button icon and tooltip
    this.updateButtonStates();
  }

  /**
   * Reset the plugin state
   */
  private resetState(): void {
    this.isDrawingActive = false;
    this.isDropdownOpen = false;
    this.updateButtonStates();
  }

  protected onDestroy(): void {
    // Remove click outside handler properly
    if (this._boundClickOutsideHandler) {
      document.removeEventListener('click', this._boundClickOutsideHandler);
      this._boundClickOutsideHandler = undefined;
    }

    // Remove drawing finished event listener
    if (this.context?.viewer.events && this._boundDrawingFinishedHandler) {
      this.context.viewer.events.off('DRAWING_FINISHED', this._boundDrawingFinishedHandler);
      this._boundDrawingFinishedHandler = undefined;
    }

    // Remove annotation created event listener
    if (this.context?.viewer.events && this._boundAnnotationCreatedHandler) {
      this.context.viewer.events.off('ANNOTATION_CREATED', this._boundAnnotationCreatedHandler);
      this._boundAnnotationCreatedHandler = undefined;
    }

    // Clean up Popper.js instance
    if (this.popperInstance) {
      this.popperInstance.destroy();
      this.popperInstance = undefined;
    }

    // Remove dropdown from document body if it exists
    if (this.shapeDropdown && this.shapeDropdown.parentNode) {
      this.shapeDropdown.parentNode.removeChild(this.shapeDropdown);
    }

    // Clear references
    this.shapeDropdown = undefined;
    this.shapeButton = undefined;
    this.arrowButton = undefined;
    this.isDropdownOpen = false;
    this.isDrawingActive = false;

    // Reset state
    this.resetState();
  }

  private _handleClickOutside(event: Event): void {
    if (!this.isDropdownOpen || !this.shapeDropdown || !this.shapeButton) {
      return;
    }

    const target = event.target as HTMLElement;

    // Check if click is on the shape button, arrow button, or dropdown
    const isOnShapeButton = this.shapeButton.contains(target);
    const isOnArrowButton = this.arrowButton?.contains(target) || target.closest(`.${PDF_VIEWER_CLASSNAMES.A_ANNOTATION_SHAPE_ARROWDOWN}`);
    const isOnDropdown = this.shapeDropdown.contains(target);

    // Only hide if click is truly outside all related elements
    if (!isOnShapeButton && !isOnArrowButton && !isOnDropdown) {
      this.hideShapeDropdown();
    }
  }
}
