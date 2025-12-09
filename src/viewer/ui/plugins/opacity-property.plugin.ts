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

import { BasePropertyPlugin, BasePropertyPluginConfig, PropertyDropdownManager } from './base-property.plugin';
import { AnnotationContext } from './annotation-toolbar.plugin';
import { PDF_VIEWER_CLASSNAMES } from '../../../constants/pdf-viewer-selectors';
import { createPopper, Instance as PopperInstance } from '@popperjs/core';

/**
 * Configuration for opacity property plugin
 */
export interface OpacityPropertyPluginConfig extends BasePropertyPluginConfig {
  /** Minimum opacity value (default: 0) */
  min?: number;
  /** Maximum opacity value (default: 1) */
  max?: number;
  /** Step value for slider (default: 0.01) */
  step?: number;
  /** Custom display format function (default: shows as percentage) */
  displayFormat?: (value: number) => string;
}

/**
 * Plugin for opacity control with slider
 */
export class OpacityPropertyPlugin extends BasePropertyPlugin {
  private opacityConfig: OpacityPropertyPluginConfig;
  private button?: HTMLButtonElement;
  private dropdown?: HTMLElement;
  private thumb?: HTMLElement;
  private track?: HTMLElement;
  private valueLabel?: HTMLElement;
  private currentValue: number = 1;
  private popperInstance?: PopperInstance;

  constructor(config: OpacityPropertyPluginConfig = {}) {
    super('opacity-property', config);
    this.opacityConfig = {
      min: config.min ?? 0,
      max: config.max ?? 1,
      step: 0.01,
      displayFormat: config.displayFormat ?? ((v) => `${Math.round(v * 100)}%`),
    };
  }

  protected renderPropertyControl(container: HTMLElement, context: AnnotationContext): void {
    const label = this.config.label || 'Opacity';
    const { min, max, displayFormat } = this.opacityConfig;

    container.classList.add(PDF_VIEWER_CLASSNAMES.A_ANNOTATION_SHAPE_PROPERTIES_OPACITY);

    // Label
    const labelElement = document.createElement('label');
    labelElement.innerText = `${label}:`;
    container.appendChild(labelElement);

    // Button to show current value
    this.button = document.createElement('button');
    this.button.style.display = 'flex';
    this.button.style.alignItems = 'center';
    this.button.style.cursor = 'pointer';
    this.button.style.border = '1px solid #ccc';
    this.button.style.borderRadius = '4px';
    this.button.style.padding = '4px 8px';
    this.button.style.backgroundColor = '#2e2e2e';
    this.button.style.color = '#fff';

    this.currentValue = context.stateManager.state.drawConfig.opacity;
    this.button.textContent = displayFormat!(this.currentValue);
    container.appendChild(this.button);

    // Create dropdown
    this.createDropdown(context, min!, max!, displayFormat!);

    // Button click handler
    this.button.onclick = () => this.toggleDropdown();

    // Outside click handler
    const clickTarget = this.getShadowRoot();
    clickTarget.addEventListener('click', (ev) => {
      const target = ev.target as Node;
      if (!container.contains(target) && !this.dropdown!.contains(target)) {
        if (this.dropdown!.style.display === '') {
          this.closeDropdown();
        }
      }
    });
  }

  private createDropdown(
    context: AnnotationContext,
    min: number,
    max: number,
    displayFormat: (v: number) => string
  ): void {
    const pdfViewerContainer = this.getPdfViewerContainer(context);
    if (!pdfViewerContainer) return;

    this.dropdown = document.createElement('div');
    this.dropdown.classList.add(PDF_VIEWER_CLASSNAMES.A_ANNOTATION_DROPDOWN_SLIDER_CONTAINER);
    this.dropdown.style.display = 'none';

    // Track
    this.track = document.createElement('div');
    this.track.style.position = 'relative';
    this.track.style.height = '4px';
    this.track.style.background = '#888';
    this.track.style.borderRadius = '2px';
    this.track.style.cursor = 'pointer';
    this.track.style.width = '140px';
    this.dropdown.appendChild(this.track);

    // Thumb
    this.thumb = document.createElement('div');
    this.thumb.style.position = 'absolute';
    this.thumb.style.top = '-5px';
    this.thumb.style.width = '14px';
    this.thumb.style.height = '14px';
    this.thumb.style.borderRadius = '50%';
    this.thumb.style.background = '#2e2e2e';
    this.thumb.style.cursor = 'grab';
    this.track.appendChild(this.thumb);

    // Value label
    this.valueLabel = document.createElement('div');
    this.valueLabel.style.textAlign = 'right';
    this.valueLabel.style.minWidth = '40px';
    this.valueLabel.style.marginLeft = '10px';
    this.valueLabel.textContent = displayFormat(this.currentValue);
    this.dropdown.appendChild(this.valueLabel);

    this.updateThumb(this.currentValue, min, max);

    // Thumb drag handlers
    let dragging = false;
    this.thumb.onpointerdown = (e) => {
      dragging = true;
      this.thumb!.setPointerCapture(e.pointerId);
      this.thumb!.style.cursor = 'grabbing';
    };

    this.thumb.onpointermove = (e) => {
      if (!dragging) return;
      this.handleSliderMove(e.clientX, min, max, displayFormat, context);
    };

    this.thumb.onpointerup = (e) => {
      dragging = false;
      this.thumb!.releasePointerCapture(e.pointerId);
      this.thumb!.style.cursor = 'grab';
    };

    // Track click
    this.track.onclick = (e) => {
      if (e.target === this.thumb) return;
      this.handleSliderMove(e.clientX, min, max, displayFormat, context);
    };

    // Inject dropdown to PDF viewer container
    pdfViewerContainer.appendChild(this.dropdown);
  }

  private handleSliderMove(
    clientX: number,
    min: number,
    max: number,
    displayFormat: (v: number) => string,
    context: AnnotationContext
  ): void {
    const rect = this.track!.getBoundingClientRect();
    let x = clientX - rect.left;
    x = Math.max(0, Math.min(rect.width, x));
    this.currentValue = min + (x / rect.width) * (max - min);

    this.updateThumb(this.currentValue, min, max);
    this.button!.textContent = displayFormat(this.currentValue);
    this.valueLabel!.textContent = displayFormat(this.currentValue);
    context.stateManager.updateDrawConfig({ opacity: this.currentValue });
  }

  private updateThumb(value: number, min: number, max: number): void {
    if (!this.track || !this.thumb) return;
    const w = this.track.clientWidth;
    const ratio = (value - min) / (max - min);
    this.thumb.style.left = `${ratio * w - this.thumb.clientWidth / 2}px`;
  }

  private toggleDropdown(): void {
    if (!this.dropdown || !this.button) return;

    const isVisible = this.dropdown.style.display === '';

    if (isVisible) {
      this.closeDropdown();
    } else {
      // Show dropdown
      PropertyDropdownManager.setDropdownOpen(this.dropdown);
      this.dropdown.style.display = '';

      // Create Popper instance
      this.popperInstance = createPopper(this.button, this.dropdown, {
        placement: 'bottom-start',
        modifiers: [
          { name: 'offset', options: { offset: [0, 8] } },
          { name: 'preventOverflow', options: { boundary: 'viewport', padding: 8 } },
          { name: 'flip', options: { fallbackPlacements: ['top-start', 'bottom-end', 'top-end'] } },
        ],
      });

      this.popperInstance.update();

      // Fix thumb position after dropdown becomes visible
      setTimeout(() => {
        this.updateThumb(this.currentValue, this.opacityConfig.min!, this.opacityConfig.max!);
      }, 0);
    }
  }

  private closeDropdown(): void {
    if (!this.dropdown) return;
    PropertyDropdownManager.closeDropdown(this.dropdown);
    if (this.popperInstance) {
      this.popperInstance.destroy();
      this.popperInstance = undefined;
    }
  }

  protected onDrawConfigChange(drawConfig: any): void {
    if (drawConfig.opacity !== undefined && drawConfig.opacity !== this.currentValue) {
      this.currentValue = drawConfig.opacity;
      if (this.button && this.opacityConfig.displayFormat) {
        this.button.textContent = this.opacityConfig.displayFormat(this.currentValue);
      }
      this.updateThumb(this.currentValue, this.opacityConfig.min!, this.opacityConfig.max!);
    }
  }

  protected onDestroy(): void {
    if (this.dropdown) {
      this.dropdown.remove();
      this.dropdown = undefined;
    }
    if (this.popperInstance) {
      this.popperInstance.destroy();
      this.popperInstance = undefined;
    }
    super.onDestroy();
  }
}
