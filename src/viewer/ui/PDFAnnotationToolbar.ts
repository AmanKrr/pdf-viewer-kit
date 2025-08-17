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

import { PDF_VIEWER_CLASSNAMES, PDF_VIEWER_IDS } from '../../constants/pdf-viewer-selectors';
import { IAnnotation } from '../../interface/IAnnotation';
import { ShapeType } from '../../types/geometry.types';
import { ToolbarButtonConfig } from '../../types/toolbar.types';
import WebViewer from './web-viewer.component';
import { Instance as PopperInstance } from '@popperjs/core';
import { AnnotationToolbarStateManager, DrawConfig } from './annotation-toolbar-state.component';
import { AnnotationToolbarPluginManager } from './plugins/annotation-toolbar.plugin';
import { ShapeSelectionPlugin } from './plugins/shape-selection.plugin';
import { AnnotationPropertiesPlugin } from './plugins/annotation-properties.plugin';

/**
 * A toolbar for creating and configuring annotations using only DOM APIs.
 * No frameworks required.
 */
export class AnnotationToolbar {
  private _stateManager: AnnotationToolbarStateManager;
  private _pluginManager: AnnotationToolbarPluginManager;
  private _popper: PopperInstance | null = null;

  private _toolbarContainer!: HTMLElement | undefined;
  private _toolbarPropertiesContainer!: HTMLElement | undefined;

  private _viewer: WebViewer;
  private _onAnnotationCreated = this._handleAnnotationCreated.bind(this);
  private _activeAnnotation: IAnnotation | null = null;

  /**
   * @param viewer    The WebViewer instance containing PDF pages.
   * @param stateManager The annotation state manager from WebViewer.
   */
  constructor(viewer: WebViewer, stateManager: AnnotationToolbarStateManager) {
    this._viewer = viewer;

    // Use the shared state manager from WebViewer
    this._stateManager = stateManager;

    // Initialize plugin manager
    this._pluginManager = new AnnotationToolbarPluginManager();

    // Register default plugins
    this._pluginManager.registerPlugin(new ShapeSelectionPlugin());
    this._pluginManager.registerPlugin(new AnnotationPropertiesPlugin());

    // Set the plugin context with the shared state manager
    this._pluginManager.setContext({
      viewer: this._viewer,
      stateManager: this._stateManager,
      containerId: this.containerId,
      instanceId: this.instanceId,
    });

    // Set up event listeners
    this.events.on('ANNOTATION_CREATED', this._onAnnotationCreated);

    // Subscribe to state changes for automatic updates
    this._setupStateSubscriptions();
  }

  get state() {
    return this._viewer.state;
  }

  get instance() {
    return this._viewer;
  }

  get containerId() {
    return this._viewer.containerId;
  }

  get instanceId() {
    return this._viewer.instanceId;
  }

  get events() {
    return this._viewer.events;
  }

  get stateManager() {
    return this._stateManager;
  }

  /**
   * Set up subscriptions to state changes for automatic updates
   */
  private _setupStateSubscriptions(): void {
    // Update draw config when state changes
    this._stateManager.subscribeToDrawConfig((newConfig, oldConfig) => {
      this._updateDrawConfig(newConfig);
    });

    // Toggle annotation drawing when properties open/close
    this._stateManager.subscribeToProperty('propertiesOpen', (isOpen) => {
      this._toggleAnnotationDrawing(isOpen);
    });

    // Update annotation drawing when shape changes
    this._stateManager.subscribeToProperty('selectedShape', (newShape) => {
      if (newShape !== 'none') {
        this._updateAnnotationDrawingForShape(newShape);
      }
    });

    // Update plugins when any state changes
    this._stateManager.subscribe((prevState, newState) => {
      this._updatePlugins();
    });
  }

  /**
   * Callback when an annotation is finished; resets toolbar state.
   */
  private _handleAnnotationCreated(e: any): void {
    this._stateManager.setState({
      propertiesOpen: false,
      // Don't reset selectedShape - keep it so user can continue drawing with same shape
      // selectedShape: 'none',
      // selectedShapeIcon: 'none',
    });

    this._removeToolbarPropertiesContainer();
    this._toggleAnnotationDrawing(false);
  }

  /**
   * Enable or disable annotation drawing cursors and listeners.
   */
  private _toggleAnnotationDrawing(enable: boolean): void {
    for (const page of this._viewer.visiblePageNumbers) {
      const selector = `#${this.containerId} [data-page-number="${page}"] #${PDF_VIEWER_IDS.ANNOTATION_DRAWING_LAYER}-${this.instanceId}`;
      const container = document.querySelector<HTMLElement>(selector);
      if (!container) continue;

      if (enable) {
        this._initAnnotationListeners(true, page);
        container.style.cursor = 'crosshair';
        container.style.pointerEvents = 'all';
      } else {
        this._initAnnotationListeners(false, page);
        container.style.removeProperty('cursor');
        container.style.removeProperty('pointer-events');
      }
    }
  }

  /**
   * Update annotation drawing for a specific shape
   */
  private _updateAnnotationDrawingForShape(shape: ShapeType): void {
    // Update the draw config type
    this._stateManager.updateDrawConfig({ type: shape });

    // Enable drawing if properties are open
    if (this._stateManager.state.propertiesOpen) {
      this._toggleAnnotationDrawing(true);
    }
  }

  /**
   * Update all plugins with current state
   */
  private _updatePlugins(): void {
    this._pluginManager.updatePlugins();
  }

  /**
   * Registers or unregisters mouse-down listener for new annotations.
   */
  private _initAnnotationListeners(enable: boolean, pageNumber: number): void {
    const currentState = this._stateManager.state;
    if (currentState.selectedShape === 'none') return;

    const manager = this._viewer.annotation.isAnnotationManagerRegistered(pageNumber);
    if (!manager) return;

    if (enable) {
      manager._initAnnotation();
    } else {
      manager._initAnnotationCleanup();
    }
  }

  /** Apply current toolbar settings to all visible page annotation managers. */
  private _updateDrawConfig(drawConfig: DrawConfig): void {
    for (const page of this._viewer.visiblePageNumbers) {
      const manager = this._viewer.annotation.isAnnotationManagerRegistered(page);
      if (!manager) continue;

      manager.drawConfig = drawConfig;
    }
  }

  /**
   * Construct and attach the annotation toolbar UI.
   */
  public render(): void {
    this._toolbarContainer = document.createElement('div');
    this._toolbarContainer.classList.add(PDF_VIEWER_CLASSNAMES.A_ANNOTATON_TOOLBAR_CONTAINER, PDF_VIEWER_CLASSNAMES.A_TOOLBAR_ITEMS);

    this._createGoBackButton();

    const rightContainer = document.createElement('div');
    rightContainer.classList.add('a-annotation-toolbar-right-container');
    rightContainer.style.display = 'flex';
    rightContainer.style.alignItems = 'center';
    this._toolbarContainer.appendChild(rightContainer);

    // Update plugin context with current state
    this._pluginManager.setContext({
      viewer: this._viewer,
      stateManager: this._stateManager,
      containerId: this.containerId,
      instanceId: this.instanceId,
    });

    // Render plugins
    this._pluginManager.renderPlugins(rightContainer);

    // Properties panel is now handled by AnnotationPropertiesPlugin
    this._injectToolbarContainers(true, false);
  }

  /**
   * Insert toolbar elements into the PDF viewer DOM.
   */
  private _injectToolbarContainers(insertToolbar: boolean, insertProps: boolean): void {
    const viewWrapper = document.querySelector<HTMLElement>(`#${this.containerId} .${PDF_VIEWER_CLASSNAMES.A_PDF_VIEWER} .${PDF_VIEWER_CLASSNAMES.A_VIEWER_WRAPPER}`);
    const pdfContainer = viewWrapper?.parentElement;
    if (!viewWrapper || !pdfContainer) return;

    if (insertToolbar && this._toolbarContainer) {
      pdfContainer.insertBefore(this._toolbarContainer, viewWrapper);
    }
    if (insertProps && this._toolbarPropertiesContainer) {
      pdfContainer.insertBefore(this._toolbarPropertiesContainer, viewWrapper);
    }
  }

  /** Remove the main toolbar from the DOM. */
  private _removeToolbarContainer(): void {
    if (this._toolbarContainer) {
      this._toolbarContainer.remove();
      this._toolbarContainer = undefined;
    }
  }

  /** Remove the properties panel from the DOM. */
  private _removeToolbarPropertiesContainer(): void {
    // Properties panel is now handled by AnnotationPropertiesPlugin
    // No manual cleanup needed
  }

  /** Create the Back button for the toolbar. */
  private _createGoBackButton(): void {
    const backButton = this.createToolbarButton({
      id: 'annotationToolbarBackButton',
      iconClass: 'a-annotation-toolbar-back-icon',
      tooltip: 'Back',
      onClick: () => this.handleBackClick(),
    });
    const wrapper = this.parentWrapper({});
    wrapper.appendChild(backButton);
    this._toolbarContainer?.appendChild(wrapper);
  }

  /** Handle Back button click: destroy toolbar and reset state. */
  private handleBackClick(): void {
    this.destroy();
  }

  /**
   * Wrap a toolbar button in a consistent container for layout & tooltip.
   */
  public parentWrapper(config: any): HTMLElement {
    const wrapper = document.createElement('div');
    wrapper.setAttribute('class', `${PDF_VIEWER_CLASSNAMES.A_TOOLBAR_ITEM} ${PDF_VIEWER_CLASSNAMES.A_TOOLBAR_TOOLTIP}`.trim());
    return wrapper;
  }

  /**
   * Create a generic toolbar button element.
   */
  public createToolbarButton(config: ToolbarButtonConfig): HTMLElement {
    const button = document.createElement('button');
    button.classList.add('a-toolbar-button');
    const icon = document.createElement('span');
    icon.className = `a-toolbar-icon ${config.iconClass}`;
    button.appendChild(icon);
    button.addEventListener('click', () => config.onClick?.(this._viewer));
    return button;
  }

  /** Cleanup toolbar and event handlers. */
  public destroy(): void {
    this.events.off('ANNOTATION_CREATED', this._onAnnotationCreated);

    // Reset state
    this._stateManager.reset();

    // Deactivate plugins (don't destroy them completely, so they can be reactivated)
    this._pluginManager.deactivate();

    // Update viewer state through annotation state manager
    const annotationState = this._viewer.annotationState;
    if (annotationState) {
      annotationState.setState({ isAnnotationEnabled: false });
    }

    // Clean up UI
    const btn = document.querySelector<HTMLElement>(`#${this.containerId} .${PDF_VIEWER_CLASSNAMES.A_TOOLBAR_BUTTON} .annotation-icon`)?.parentElement;
    btn?.classList.remove('active');

    this._removeToolbarContainer();
    this._removeToolbarPropertiesContainer();

    // Disable annotation drawing
    this._toggleAnnotationDrawing(false);

    // Clean up popper
    this._popper?.destroy();
    this._popper = null;
  }
}
