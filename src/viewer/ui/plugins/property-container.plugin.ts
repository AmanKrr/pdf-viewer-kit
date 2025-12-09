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

export interface PropertyContainerPluginConfig {
  /** Whether to show properties by default (useful when shape selection is disabled) */
  showByDefault?: boolean;
}

/**
 * Plugin that creates and manages the properties container
 * This container is where individual property plugins will inject their controls
 */
export class PropertyContainerPlugin extends BaseAnnotationToolbarPlugin {
  public readonly priority = 500; // Higher than property plugins (100-60) but lower than shape selection (1000)
  private propertiesContainer?: HTMLElement;
  private config: PropertyContainerPluginConfig;

  constructor(config: PropertyContainerPluginConfig = {}) {
    super('property-container', '1.0.0');
    this.config = config;
  }

  protected onInitialize(context: AnnotationContext): void {
    // Subscribe to properties panel visibility changes
    context.stateManager.subscribeToProperty('propertiesOpen', (isOpen) => {
      if (this.propertiesContainer) {
        this.propertiesContainer.style.display = isOpen ? 'flex' : 'none';
      }
    });
  }

  protected onRender(_container: HTMLElement, context: AnnotationContext): void {
    // Create the properties container that individual property plugins will use
    this.propertiesContainer = document.createElement('div');
    this.propertiesContainer.classList.add(
      PDF_VIEWER_CLASSNAMES.A_ANNOTATION_SHAPE_PROPERTIES_CONTAINER,
      PDF_VIEWER_CLASSNAMES.A_TOOLBAR_ITEMS
    );

    // Determine if properties should be visible
    // If showByDefault is true, show properties even if propertiesOpen is false
    // This is useful when shape selection is disabled
    const shouldShow = this.config.showByDefault || context.stateManager.state.propertiesOpen;
    this.propertiesContainer.style.display = shouldShow ? 'flex' : 'none';

    // If showing by default, update state to reflect this
    if (this.config.showByDefault && !context.stateManager.state.propertiesOpen) {
      context.stateManager.setState({ propertiesOpen: true });
    }

    // Inject the properties container into the DOM
    this.injectPropertiesContainer(context);
  }

  private injectPropertiesContainer(context: AnnotationContext): void {
    if (!this.propertiesContainer) return;

    const viewWrapper = document
      .getElementById(context.containerId)
      ?.shadowRoot?.querySelector<HTMLElement>(
        `.${PDF_VIEWER_CLASSNAMES.A_PDF_VIEWER} .${PDF_VIEWER_CLASSNAMES.A_VIEWER_WRAPPER}`
      );
    const pdfContainer = viewWrapper?.parentElement;

    if (viewWrapper && pdfContainer) {
      pdfContainer.insertBefore(this.propertiesContainer, viewWrapper);
    }
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
