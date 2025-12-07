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

import WebViewer from './web-viewer.component';
import { IToolbar, ToolbarOptions } from '../../types/toolbar.types';
import { AnnotationToolbar } from './annotation-toolbar.component';
import { ToolbarPluginManager, ToolbarPluginContext, ToolbarPlugin } from './plugins/toolbar.plugin';
import {
  ThumbnailButtonPlugin,
  FirstPageButtonPlugin,
  PreviousPageButtonPlugin,
  NextPageButtonPlugin,
  LastPageButtonPlugin,
  ZoomInButtonPlugin,
  ZoomOutButtonPlugin,
  SearchButtonPlugin,
  AnnotationButtonPlugin,
  DownloadButtonPlugin,
} from './plugins/toolbar-buttons.plugin';
import { PageNumberPlugin } from './plugins/page-number.plugin';

/**
 * Implements the main toolbar UI for the PDF viewer.
 * Allows navigation, zoom, search, annotations, and download controls.
 * Uses a plugin-based architecture for complete extensibility.
 */
export class Toolbar implements IToolbar {
  private _viewer: WebViewer;
  private _container!: HTMLElement;
  private _opts: Required<ToolbarOptions>;
  private _annotationToolbar: AnnotationToolbar;

  // Plugin-based architecture
  private _pluginManager: ToolbarPluginManager;
  private _pageNumberPlugin?: PageNumberPlugin;

  /**
   * Creates a new toolbar instance with the specified configuration.
   *
   * @param viewer - The WebViewer instance to control
   * @param customPlugins - Optional array of custom plugins to add
   * @param options - Toolbar options to enable/disable specific features
   */
  constructor(viewer: WebViewer, customPlugins: ToolbarPlugin[] = [], options: ToolbarOptions = {}) {
    this._viewer = viewer;

    this._opts = {
      showFirstPage: true,
      showPrevNext: true,
      showLastPage: true,
      showPageNumber: true,
      showZoom: true,
      showSearch: false,
      showThumbnail: false,
      showAnnotation: true,
      showDownload: false,
      classPrefix: 'a-toolbar',
      ...options,
    };

    this._annotationToolbar = new AnnotationToolbar(this._viewer, this._viewer.annotationState);

    // Initialize plugin manager
    this._pluginManager = new ToolbarPluginManager();

    // Initialize default plugins
    this._initializePlugins();

    // Register custom plugins if provided
    if (customPlugins.length > 0) {
      this._pluginManager.registerPlugins(customPlugins);
    }
  }

  /**
   * Gets the instance ID of the associated viewer.
   */
  get instanceId(): string {
    return this._viewer.instanceId;
  }

  /**
   * Gets the container ID of the associated viewer.
   */
  get containerId(): string {
    return this._viewer.containerId;
  }

  /**
   * Gets the WebViewer instance associated with this toolbar.
   */
  get instance(): WebViewer {
    return this._viewer;
  }

  /**
   * Gets the plugin manager for this toolbar.
   * Allows external code to register custom plugins.
   */
  get pluginManager(): ToolbarPluginManager {
    return this._pluginManager;
  }

  /**
   * Initialize default toolbar plugins based on options
   */
  private _initializePlugins(): void {
    const plugins: ToolbarPlugin[] = [];

    // Add plugins based on configuration
    if (this._opts.showThumbnail) {
      plugins.push(new ThumbnailButtonPlugin());
    }

    if (this._opts.showFirstPage) {
      plugins.push(new FirstPageButtonPlugin());
    }

    if (this._opts.showPrevNext) {
      plugins.push(new PreviousPageButtonPlugin());
      plugins.push(new NextPageButtonPlugin());
    }

    if (this._opts.showLastPage) {
      plugins.push(new LastPageButtonPlugin());
    }

    if (this._opts.showPageNumber) {
      this._pageNumberPlugin = new PageNumberPlugin();
      plugins.push(this._pageNumberPlugin);
    }

    if (this._opts.showZoom) {
      plugins.push(new ZoomInButtonPlugin());
      plugins.push(new ZoomOutButtonPlugin());
    }

    if (this._opts.showSearch) {
      plugins.push(new SearchButtonPlugin());
    }

    if (this._opts.showAnnotation) {
      plugins.push(new AnnotationButtonPlugin(this._annotationToolbar));
    }

    if (this._opts.showDownload) {
      plugins.push(new DownloadButtonPlugin());
    }

    // Register all plugins
    this._pluginManager.registerPlugins(plugins);
  }

  /**
   * Renders the toolbar into the specified container element.
   *
   * @param container - The HTML element to host the toolbar
   */
  public render(container: HTMLElement): void {
    this._container = container;
    container.innerHTML = '';

    // Use plugin-based rendering
    const shadowRoot = document.getElementById(this.containerId)?.shadowRoot as ShadowRoot | null;
    const context: ToolbarPluginContext = {
      viewer: this._viewer,
      containerId: this.containerId,
      instanceId: this.instanceId,
      shadowRoot,
    };

    this._pluginManager.setContext(context);
    this._pluginManager.renderPlugins(container);
  }

  /**
   * Update the toolbar state (e.g., page number)
   */
  public update(): void {
    this._pluginManager.updatePlugins();

    // Update page number plugin specifically
    if (this._pageNumberPlugin) {
      this._pageNumberPlugin.updatePageNumber(this._viewer.currentPageNumber);
    }
  }

  /**
   * Destroys the toolbar and its sub-components.
   */
  public destroy(): void {
    if (this._container) {
      this._container.innerHTML = '';
    }
    this._annotationToolbar.destroy();
    this._pluginManager.destroy();
  }
}
