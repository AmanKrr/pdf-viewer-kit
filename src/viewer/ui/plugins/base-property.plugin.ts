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

/**
 * Configuration for a base property plugin
 */
export interface BasePropertyPluginConfig {
  /** Plugin priority for ordering (higher = rendered first, default: 0) */
  priority?: number;
  /** Custom label for the property control */
  label?: string;
}

/**
 * Shared dropdown manager for all property plugins
 * Ensures only one dropdown is open at a time across all property controls
 */
export class PropertyDropdownManager {
  private static currentlyOpenDropdown: HTMLElement | null = null;
  private static currentlyOpenPopper: any | null = null;

  /**
   * Close any currently open dropdown
   */
  static closeOpenDropdown(): void {
    if (PropertyDropdownManager.currentlyOpenDropdown) {
      PropertyDropdownManager.currentlyOpenDropdown.style.display = 'none';
      PropertyDropdownManager.currentlyOpenDropdown = null;
    }

    if (PropertyDropdownManager.currentlyOpenPopper) {
      PropertyDropdownManager.currentlyOpenPopper.destroy();
      PropertyDropdownManager.currentlyOpenPopper = null;
    }
  }

  /**
   * Set a dropdown as the currently open one
   */
  static setDropdownOpen(dropdown: HTMLElement, popperInstance?: any): void {
    // Close any previously open dropdown first
    PropertyDropdownManager.closeOpenDropdown();
    // Set this one as open
    PropertyDropdownManager.currentlyOpenDropdown = dropdown;
    PropertyDropdownManager.currentlyOpenPopper = popperInstance;
  }

  /**
   * Close a specific dropdown
   */
  static closeDropdown(dropdown: HTMLElement): void {
    if (PropertyDropdownManager.currentlyOpenDropdown === dropdown) {
      PropertyDropdownManager.currentlyOpenDropdown = null;
    }
    dropdown.style.display = 'none';

    if (PropertyDropdownManager.currentlyOpenPopper) {
      PropertyDropdownManager.currentlyOpenPopper.destroy();
      PropertyDropdownManager.currentlyOpenPopper = null;
    }
  }

  /**
   * Check if a dropdown is currently open
   */
  static isDropdownOpen(dropdown: HTMLElement): boolean {
    return PropertyDropdownManager.currentlyOpenDropdown === dropdown;
  }
}

/**
 * Base class for all property plugins
 * Provides shared functionality for property controls
 */
export abstract class BasePropertyPlugin extends BaseAnnotationToolbarPlugin {
  protected propertyContainer?: HTMLElement;
  protected config: BasePropertyPluginConfig;
  public readonly priority: number;

  constructor(name: string, config: BasePropertyPluginConfig = {}) {
    super(name, '1.0.0');
    this.config = config;
    this.priority = config.priority ?? 0;
  }

  protected onInitialize(context: AnnotationContext): void {
    // Subscribe to properties panel visibility changes
    context.stateManager.subscribeToProperty('propertiesOpen', (isOpen) => {
      if (this.propertyContainer) {
        this.propertyContainer.style.display = isOpen ? 'flex' : 'none';
      }
    });

    // Subscribe to draw config changes
    context.stateManager.subscribeToDrawConfig((newConfig) => {
      this.onDrawConfigChange(newConfig);
    });
  }

  protected onRender(container: HTMLElement, context: AnnotationContext): void {
    // Create property container
    this.propertyContainer = document.createElement('div');
    this.propertyContainer.classList.add(
      PDF_VIEWER_CLASSNAMES.A_ANNOTATION_SHAPE_PROPERTIES
    );
    this.propertyContainer.style.position = 'relative';
    this.propertyContainer.style.display = context.stateManager.state.propertiesOpen ? 'flex' : 'none';
    this.propertyContainer.style.alignItems = 'center';

    // Let subclass render the property control
    this.renderPropertyControl(this.propertyContainer, context);

    // Inject into container
    this.injectPropertyContainer(context);
  }

  protected onUpdate(context: AnnotationContext): void {
    if (this.propertyContainer) {
      const isVisible = context.stateManager.state.propertiesOpen;
      this.propertyContainer.style.display = isVisible ? 'flex' : 'none';
    }
  }

  protected onDestroy(): void {
    if (this.propertyContainer) {
      this.propertyContainer.remove();
      this.propertyContainer = undefined;
    }
  }

  /**
   * Inject property container into the properties container in the DOM
   */
  protected injectPropertyContainer(context: AnnotationContext): void {
    if (!this.propertyContainer) return;

    const propertiesContainer = document
      .getElementById(context.containerId)
      ?.shadowRoot?.querySelector<HTMLElement>(
        `.${PDF_VIEWER_CLASSNAMES.A_ANNOTATION_SHAPE_PROPERTIES_CONTAINER}`
      );

    if (propertiesContainer) {
      propertiesContainer.appendChild(this.propertyContainer);
    }
  }

  /**
   * Get the PDF viewer container for dropdown positioning
   */
  protected getPdfViewerContainer(context: AnnotationContext): HTMLElement | null {
    return document
      .getElementById(context.containerId)
      ?.shadowRoot?.querySelector<HTMLElement>(`.${PDF_VIEWER_CLASSNAMES.A_PDF_VIEWER}`) || null;
  }

  /**
   * Get the shadow root for event listeners
   */
  protected getShadowRoot(): ShadowRoot | Document {
    const shadowRoot = document.getElementById(this.context?.containerId || '')?.shadowRoot;
    return shadowRoot || document;
  }

  /**
   * Subclasses must implement this to render their specific property control
   */
  protected abstract renderPropertyControl(container: HTMLElement, context: AnnotationContext): void;

  /**
   * Called when draw config changes - subclasses can override to update their UI
   */
  protected onDrawConfigChange(drawConfig: any): void {
    // Default: do nothing, subclasses can override
  }
}
