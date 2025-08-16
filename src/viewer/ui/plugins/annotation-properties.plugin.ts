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

import { BaseAnnotationToolbarPlugin, AnnotationContext } from './annotation-toolbar.plugin';
import { PDF_VIEWER_CLASSNAMES } from '../../../constants/pdf-viewer-selectors';
import { ColorPicker } from '../../components/color-picker.component';
import { createPopper, Instance as PopperInstance } from '@popperjs/core';

/**
 * Plugin for handling annotation properties (color, fill, opacity, thickness, border)
 */
export class AnnotationPropertiesPlugin extends BaseAnnotationToolbarPlugin {
  private propertiesContainer?: HTMLElement;

  // Simple dropdown manager - just track the currently open dropdown
  private static currentlyOpenDropdown: HTMLElement | null = null;

  // Simple method to close any open dropdown
  private static closeOpenDropdown(): void {
    if (AnnotationPropertiesPlugin.currentlyOpenDropdown) {
      AnnotationPropertiesPlugin.currentlyOpenDropdown.style.display = 'none';
      AnnotationPropertiesPlugin.currentlyOpenDropdown = null;
    }
  }

  // Simple method to set a dropdown as open
  public static setDropdownOpen(dropdown: HTMLElement): void {
    // Close any previously open dropdown first
    AnnotationPropertiesPlugin.closeOpenDropdown();
    // Set this one as open
    AnnotationPropertiesPlugin.currentlyOpenDropdown = dropdown;
  }

  // Simple method to close a specific dropdown
  public static closeDropdown(dropdown: HTMLElement): void {
    if (AnnotationPropertiesPlugin.currentlyOpenDropdown === dropdown) {
      AnnotationPropertiesPlugin.currentlyOpenDropdown = null;
    }
    dropdown.style.display = 'none';
  }

  constructor() {
    super('annotation-properties', '1.0.0');
  }

  protected onInitialize(context: AnnotationContext): void {
    // Subscribe to properties panel visibility changes
    context.stateManager.subscribeToProperty('propertiesOpen', (isOpen) => {
      if (this.propertiesContainer) {
        this.propertiesContainer.style.display = isOpen ? 'flex' : 'none';
      }
    });

    // Subscribe to draw config changes
    context.stateManager.subscribeToDrawConfig((newConfig) => {
      this.updatePropertiesDisplay(newConfig);
    });
  }

  protected onRender(container: HTMLElement, context: AnnotationContext): void {
    this.propertiesContainer = document.createElement('div');
    this.propertiesContainer.classList.add(PDF_VIEWER_CLASSNAMES.A_ANNOTATION_SHAPE_PROPERTIES_CONTAINER, PDF_VIEWER_CLASSNAMES.A_TOOLBAR_ITEMS);
    // Set initial display state based on current state
    this.propertiesContainer.style.display = context.stateManager.state.propertiesOpen ? 'flex' : 'none';

    // Get the .a-pdf-viewer container for appending dropdowns
    const pdfViewerContainer = document.querySelector<HTMLElement>(`#${context.containerId} .${PDF_VIEWER_CLASSNAMES.A_PDF_VIEWER}`);
    if (!pdfViewerContainer) {
      console.error('PDF viewer container not found');
      return;
    }

    // Add color picker for stroke color
    const strokeColorPicker = new ColorPicker({
      label: 'Color',
      initialColor: context.stateManager.state.drawConfig.strokeColor,
      onColorSelect: (color) => {
        context.stateManager.updateDrawConfig({ strokeColor: color });
      },
      containerId: context.containerId,
    });
    this.propertiesContainer.appendChild(strokeColorPicker.getElement());

    // Add color picker for fill color
    const fillColorPicker = new ColorPicker({
      label: 'Fill',
      initialColor: context.stateManager.state.drawConfig.fillColor,
      onColorSelect: (color) => {
        context.stateManager.updateDrawConfig({ fillColor: color });
      },
      includeTransparent: true,
      containerId: context.containerId,
    });
    this.propertiesContainer.appendChild(fillColorPicker.getElement());

    // Add opacity slider
    const opacityContainer = this.createSliderControl(
      'Opacity',
      0,
      1,
      context.stateManager.state.drawConfig.opacity,
      (v) => `${Math.round(v * 100)}%`,
      (v) => context.stateManager.updateDrawConfig({ opacity: v }),
      pdfViewerContainer,
    );
    this.propertiesContainer.appendChild(opacityContainer);

    // Add thickness slider
    const thicknessContainer = this.createSliderControl(
      'Thickness',
      1,
      10,
      context.stateManager.state.drawConfig.strokeWidth,
      (v) => `${Math.round(v)} pt`,
      (v) => context.stateManager.updateDrawConfig({ strokeWidth: v }),
      pdfViewerContainer,
    );
    this.propertiesContainer.appendChild(thicknessContainer);

    // Add border style dropdown
    const borderContainer = this.createBorderStyleControl(
      context.stateManager.state.drawConfig.strokeStyle,
      (style) => context.stateManager.updateDrawConfig({ strokeStyle: style }),
      pdfViewerContainer,
    );
    this.propertiesContainer.appendChild(borderContainer);

    // Inject into the main container
    this.injectPropertiesContainer(context);
  }

  private createSliderControl(
    label: string,
    min: number,
    max: number,
    initialValue: number,
    displayValueFn: (v: number) => string,
    onValueChange: (v: number) => void,
    pdfViewerContainer: HTMLElement,
  ): HTMLElement {
    const container = document.createElement('div');
    container.classList.add(PDF_VIEWER_CLASSNAMES.A_ANNOTATION_SHAPE_PROPERTIES);
    container.classList.add(label === 'Opacity' ? PDF_VIEWER_CLASSNAMES.A_ANNOTATION_SHAPE_PROPERTIES_OPACITY : PDF_VIEWER_CLASSNAMES.A_ANNOTATION_SHAPE_PROPERTIES_THICKNESS);
    container.style.position = 'relative';
    container.style.display = 'flex';
    container.style.alignItems = 'center';

    const labelElement = document.createElement('label');
    labelElement.innerText = `${label}:`;
    container.appendChild(labelElement);

    const button = document.createElement('button');
    button.style.display = 'flex';
    button.style.alignItems = 'center';
    button.style.cursor = 'pointer';
    button.style.border = '1px solid #ccc';
    button.style.borderRadius = '4px';
    button.style.padding = '4px 8px';
    button.style.backgroundColor = '#2e2e2e';
    button.style.color = '#fff';
    button.textContent = displayValueFn(initialValue);
    container.appendChild(button);

    const dropdown = document.createElement('div');
    dropdown.classList.add(PDF_VIEWER_CLASSNAMES.A_ANNOTATION_DROPDOWN_SLIDER_CONTAINER);
    dropdown.style.display = 'none';
    // dropdown.style.zIndex = '10000';

    const track = document.createElement('div');
    track.style.position = 'relative';
    track.style.height = '4px';
    track.style.background = '#888';
    track.style.borderRadius = '2px';
    track.style.cursor = 'pointer';
    track.style.width = '140px';
    dropdown.appendChild(track);

    const thumb = document.createElement('div');
    thumb.style.position = 'absolute';
    thumb.style.top = '-5px';
    thumb.style.width = '14px';
    thumb.style.height = '14px';
    thumb.style.borderRadius = '50%';
    thumb.style.background = '#2e2e2e';
    thumb.style.cursor = 'grab';
    track.appendChild(thumb);

    const valueLabel = document.createElement('div');
    valueLabel.style.textAlign = 'right';
    valueLabel.textContent = displayValueFn(initialValue);
    dropdown.appendChild(valueLabel);

    let currentValue = initialValue;
    let dragging = false;
    let popperInstance: PopperInstance | undefined;

    function updateThumb(val: number) {
      const w = track.clientWidth;
      const ratio = (val - min) / (max - min);
      thumb.style.left = `${ratio * w - thumb.clientWidth / 2}px`;
    }

    updateThumb(initialValue);

    thumb.onpointerdown = (e) => {
      dragging = true;
      thumb.setPointerCapture(e.pointerId);
      thumb.style.cursor = 'grabbing';
    };

    thumb.onpointermove = (e) => {
      if (!dragging) return;
      const rect = track.getBoundingClientRect();
      let x = e.clientX - rect.left;
      x = Math.max(0, Math.min(rect.width, x));
      currentValue = min + (x / rect.width) * (max - min);
      updateThumb(currentValue);
      button.textContent = displayValueFn(currentValue);
      valueLabel.textContent = displayValueFn(currentValue);
      onValueChange(currentValue);
    };

    thumb.onpointerup = (e) => {
      dragging = false;
      thumb.releasePointerCapture(e.pointerId);
      thumb.style.cursor = 'grab';
    };

    track.onclick = (e) => {
      if (e.target === thumb) return;
      const rect = track.getBoundingClientRect();
      let x = e.clientX - rect.left;
      x = Math.max(0, Math.min(rect.width, x));
      currentValue = min + (x / rect.width) * (max - min);
      updateThumb(currentValue);
      button.textContent = displayValueFn(currentValue);
      valueLabel.textContent = displayValueFn(currentValue);
      onValueChange(currentValue);
    };

    button.onclick = () => {
      // already class hace display flex no need to give block
      const isVisible = dropdown.style.display === '';

      if (isVisible) {
        // Hide dropdown using the dropdown manager
        AnnotationPropertiesPlugin.closeDropdown(dropdown);

        // Clean up Popper instance
        if (popperInstance) {
          popperInstance.destroy();
          popperInstance = undefined;
        }
      } else {
        // Show dropdown with Popper.js positioning
        // already class hace display flex no need to give block
        dropdown.style.display = '';

        // Close any previously open dropdown and set this one as open
        AnnotationPropertiesPlugin.setDropdownOpen(dropdown);

        // Create Popper instance
        popperInstance = createPopper(button, dropdown, {
          placement: 'bottom-start',
          modifiers: [
            { name: 'offset', options: { offset: [0, 8] } },
            { name: 'preventOverflow', options: { boundary: 'viewport', padding: 8 } },
            { name: 'flip', options: { fallbackPlacements: ['top-start', 'bottom-end', 'top-end'] } },
          ],
        });

        // Update Popper positioning
        popperInstance.update();

        // Ensure thumb is properly positioned after dropdown becomes visible
        // This fixes the issue where track.clientWidth was 0 when updateThumb was called
        setTimeout(() => {
          updateThumb(currentValue);
        }, 0);
      }
    };

    document.addEventListener('click', (ev) => {
      // Check if click is outside both the container AND the dropdown
      const target = ev.target as Node;
      if (!container.contains(target) && !dropdown.contains(target)) {
        // Only hide dropdown if it's actually visible
        if (dropdown.style.display === '') {
          // Use the dropdown manager to properly track this dropdown as closed
          AnnotationPropertiesPlugin.closeDropdown(dropdown);

          // Clean up Popper instance
          if (popperInstance) {
            popperInstance.destroy();
            popperInstance = undefined;
          }
        }
      }
    });

    // Inject dropdown directly to .a-pdf-viewer container
    if (pdfViewerContainer) {
      pdfViewerContainer.appendChild(dropdown);
    }

    return container;
  }

  private createBorderStyleControl(initialStyle: string, onSelect: (style: 'Solid' | 'Dashed' | 'Dotted') => void, pdfViewerContainer: HTMLElement): HTMLElement {
    const styles: Array<'Solid' | 'Dashed' | 'Dotted'> = ['Solid', 'Dashed', 'Dotted'];

    const container = document.createElement('div');
    container.classList.add(PDF_VIEWER_CLASSNAMES.A_ANNOTATION_SHAPE_PROPERTIES, PDF_VIEWER_CLASSNAMES.A_ANNOTATION_SHAPE_PROPERTIES_BORDER);
    container.style.position = 'relative';
    container.style.display = 'flex';
    container.style.alignItems = 'center';

    const label = document.createElement('label');
    label.textContent = 'Border:';
    container.appendChild(label);

    const btn = document.createElement('button');
    btn.style.display = 'flex';
    btn.style.alignItems = 'center';
    btn.style.justifyContent = 'center';
    btn.style.border = '1px solid #ccc';
    btn.style.borderRadius = '4px';
    btn.style.cursor = 'pointer';
    btn.style.background = '#2e2e2e';
    btn.style.color = '#fff';
    btn.style.padding = '4px 8px';
    btn.textContent = initialStyle;
    container.appendChild(btn);

    const dropdown = document.createElement('div');
    dropdown.classList.add(PDF_VIEWER_CLASSNAMES.A_ANNOTATION_BORDER_DROPDOWN);
    dropdown.style.display = 'none';
    // dropdown.style.zIndex = '10000';

    let popperInstance: PopperInstance | undefined;

    styles.forEach((style) => {
      const row = document.createElement('div');
      row.classList.add(PDF_VIEWER_CLASSNAMES.A_ANNOTATION_BORDER_DROPDOWN_OPTION);
      row.style.padding = '4px';
      row.style.cursor = 'pointer';
      row.innerHTML = `<div style="flex:1;height:0;border-top:2px ${style === 'Solid' ? 'solid' : style === 'Dashed' ? 'dashed' : 'dotted'} #2e2e2e"></div>`;

      row.onclick = () => {
        btn.textContent = style;
        dropdown.style.display = 'none';

        // Clean up Popper instance
        if (popperInstance) {
          popperInstance.destroy();
          popperInstance = undefined;
        }

        onSelect(style);
      };

      row.addEventListener('mouseenter', () => {
        row.style.background = '#f0f0f0';
      });

      row.addEventListener('mouseleave', () => {
        row.style.background = 'transparent';
      });

      dropdown.appendChild(row);
    });

    btn.onclick = () => {
      // already class have display flex no need to give block
      const isVisible = dropdown.style.display === '';

      if (isVisible) {
        // Hide dropdown using the dropdown manager
        AnnotationPropertiesPlugin.closeDropdown(dropdown);

        // Clean up Popper instance
        if (popperInstance) {
          popperInstance.destroy();
          popperInstance = undefined;
        }
      } else {
        // Show dropdown with Popper.js positioning
        // already class hace display flex no need to give block
        dropdown.style.display = '';

        // Close any previously open dropdown and set this one as open
        AnnotationPropertiesPlugin.setDropdownOpen(dropdown);

        // Create Popper instance
        popperInstance = createPopper(btn, dropdown, {
          placement: 'bottom-start',
          modifiers: [
            { name: 'offset', options: { offset: [0, 8] } },
            { name: 'preventOverflow', options: { boundary: 'viewport', padding: 8 } },
            { name: 'flip', options: { fallbackPlacements: ['top-start', 'bottom-end', 'top-end'] } },
          ],
        });

        // Update Popper positioning
        popperInstance.update();
      }
    };

    document.addEventListener('click', (ev) => {
      // Check if click is outside both the container AND the dropdown
      const target = ev.target as Node;
      if (!container.contains(target) && !dropdown.contains(target)) {
        // Only hide dropdown if it's actually visible
        if (dropdown.style.display === '') {
          // Use the dropdown manager to properly track this dropdown as closed
          AnnotationPropertiesPlugin.closeDropdown(dropdown);

          // Clean up Popper instance
          if (popperInstance) {
            popperInstance.destroy();
            popperInstance = undefined;
          }
        }
      }
    });

    // Inject dropdown directly to .a-pdf-viewer container
    if (pdfViewerContainer) {
      pdfViewerContainer.appendChild(dropdown);
    }

    return container;
  }

  private injectPropertiesContainer(context: AnnotationContext): void {
    if (!this.propertiesContainer) return;

    const viewWrapper = document.querySelector<HTMLElement>(`#${context.containerId} .${PDF_VIEWER_CLASSNAMES.A_PDF_VIEWER} .${PDF_VIEWER_CLASSNAMES.A_VIEWER_WRAPPER}`);
    const pdfContainer = viewWrapper?.parentElement;

    if (viewWrapper && pdfContainer) {
      pdfContainer.insertBefore(this.propertiesContainer, viewWrapper);
    }
  }

  private updatePropertiesDisplay(drawConfig: any): void {
    // This method can be used to update the properties display
    // when the draw config changes from external sources
  }

  protected onUpdate(context: AnnotationContext): void {
    // Update properties display if needed
    if (this.propertiesContainer) {
      const isVisible = context.stateManager.state.propertiesOpen;
      this.propertiesContainer.style.display = isVisible ? 'flex' : 'none';
    }
  }

  protected onDestroy(): void {
    if (this.propertiesContainer) {
      this.propertiesContainer.remove();
      this.propertiesContainer = undefined;
    }
  }
}
