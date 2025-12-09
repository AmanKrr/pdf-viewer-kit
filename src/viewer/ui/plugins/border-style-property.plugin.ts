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

export type BorderStyle = 'Solid' | 'Dashed' | 'Dotted';

/**
 * Configuration for border style property plugin
 */
export interface BorderStylePropertyPluginConfig extends BasePropertyPluginConfig {
  /** Available border styles (default: ['Solid', 'Dashed', 'Dotted']) */
  styles?: BorderStyle[];
}

/**
 * Plugin for border/stroke style control
 */
export class BorderStylePropertyPlugin extends BasePropertyPlugin {
  private borderConfig: BorderStylePropertyPluginConfig;
  private button?: HTMLButtonElement;
  private dropdown?: HTMLElement;
  private currentStyle: BorderStyle = 'Solid';
  private popperInstance?: PopperInstance;

  constructor(config: BorderStylePropertyPluginConfig = {}) {
    super('border-style-property', config);
    this.borderConfig = {
      styles: config.styles ?? ['Solid', 'Dashed', 'Dotted'],
    };
  }

  protected renderPropertyControl(container: HTMLElement, context: AnnotationContext): void {
    const label = this.config.label || 'Border';
    const styles = this.borderConfig.styles!;

    container.classList.add(PDF_VIEWER_CLASSNAMES.A_ANNOTATION_SHAPE_PROPERTIES_BORDER);

    // Label
    const labelElement = document.createElement('label');
    labelElement.textContent = `${label}:`;
    container.appendChild(labelElement);

    // Button to show current style
    this.button = document.createElement('button');
    this.button.style.display = 'flex';
    this.button.style.alignItems = 'center';
    this.button.style.justifyContent = 'center';
    this.button.style.border = '1px solid #ccc';
    this.button.style.borderRadius = '4px';
    this.button.style.cursor = 'pointer';
    this.button.style.background = '#2e2e2e';
    this.button.style.color = '#fff';
    this.button.style.padding = '4px 8px';

    this.currentStyle = context.stateManager.state.drawConfig.strokeStyle || 'Solid';
    this.button.textContent = this.currentStyle;
    container.appendChild(this.button);

    // Create dropdown
    this.createDropdown(styles, context);

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

  private createDropdown(styles: BorderStyle[], context: AnnotationContext): void {
    const pdfViewerContainer = this.getPdfViewerContainer(context);
    if (!pdfViewerContainer) return;

    this.dropdown = document.createElement('div');
    this.dropdown.classList.add(PDF_VIEWER_CLASSNAMES.A_ANNOTATION_BORDER_DROPDOWN);
    this.dropdown.style.display = 'none';

    styles.forEach((style) => {
      const row = document.createElement('div');
      row.classList.add(PDF_VIEWER_CLASSNAMES.A_ANNOTATION_BORDER_DROPDOWN_OPTION);
      row.style.padding = '4px';
      row.style.cursor = 'pointer';
      row.innerHTML = `<div style="flex:1;height:0;border-top:2px ${
        style === 'Solid' ? 'solid' : style === 'Dashed' ? 'dashed' : 'dotted'
      } #2e2e2e"></div>`;

      row.onclick = () => {
        this.currentStyle = style;
        this.button!.textContent = style;
        this.closeDropdown();
        context.stateManager.updateDrawConfig({ strokeStyle: style });
      };

      row.addEventListener('mouseenter', () => {
        row.style.background = '#f0f0f0';
      });

      row.addEventListener('mouseleave', () => {
        row.style.background = 'transparent';
      });

      this.dropdown!.appendChild(row);
    });

    // Inject dropdown to PDF viewer container
    pdfViewerContainer.appendChild(this.dropdown);
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
    if (drawConfig.strokeStyle && drawConfig.strokeStyle !== this.currentStyle) {
      this.currentStyle = drawConfig.strokeStyle;
      if (this.button) {
        this.button.textContent = this.currentStyle;
      }
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
