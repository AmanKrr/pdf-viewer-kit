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

import { AnnotationToolbarStateManager } from '../annotation-toolbar-state.component';
import WebViewer from '../web-viewer';

/**
 * Context object passed to plugins for rendering and interaction
 */
export interface AnnotationContext {
  viewer: WebViewer;
  stateManager: AnnotationToolbarStateManager;
  containerId: string;
  instanceId: string;
}

/**
 * Base interface for annotation toolbar plugins
 */
export interface AnnotationToolbarPlugin {
  /** Unique name identifier for the plugin */
  readonly name: string;
  /** Plugin version for compatibility checking */
  readonly version: string;
  /** Whether the plugin is currently active */
  readonly isActive: boolean;

  /** Initialize the plugin */
  initialize(context: AnnotationContext): void;
  /** Render the plugin UI into the specified container */
  render(container: HTMLElement, context: AnnotationContext): void;
  /** Update the plugin when state changes */
  update?(context: AnnotationContext): void;
  /** Clean up plugin resources */
  destroy(): void;
}

/**
 * Base class for annotation toolbar plugins
 * Provides common functionality and lifecycle management
 */
export abstract class BaseAnnotationToolbarPlugin implements AnnotationToolbarPlugin {
  public readonly name: string;
  public readonly version: string;
  protected _isActive = false;
  protected _context?: AnnotationContext;

  constructor(name: string, version: string = '1.0.0') {
    this.name = name;
    this.version = version;
  }

  get isActive(): boolean {
    return this._isActive;
  }

  initialize(context: AnnotationContext): void {
    this._context = context;
    this._isActive = true;
    this.onInitialize(context);
  }

  render(container: HTMLElement, context: AnnotationContext): void {
    if (!this._isActive) {
      throw new Error(`Plugin ${this.name} is not initialized`);
    }
    this.onRender(container, context);
  }

  update(context: AnnotationContext): void {
    if (this._isActive && this.onUpdate) {
      this.onUpdate(context);
    }
  }

  destroy(): void {
    this._isActive = false;
    this.onDestroy();
    this._context = undefined;
  }

  /**
   * Get the current plugin context
   */
  protected get context(): AnnotationContext | undefined {
    return this._context;
  }

  /**
   * Override these methods in subclasses
   */
  protected abstract onInitialize(context: AnnotationContext): void;
  protected abstract onRender(container: HTMLElement, context: AnnotationContext): void;
  protected onUpdate?(context: AnnotationContext): void;
  protected abstract onDestroy(): void;
}

/**
 * Plugin manager for annotation toolbar
 * Handles plugin registration, lifecycle, and communication
 */
export class AnnotationToolbarPluginManager {
  private plugins: Map<string, AnnotationToolbarPlugin> = new Map();
  private context?: AnnotationContext;

  /**
   * Register a plugin with the manager
   */
  registerPlugin(plugin: AnnotationToolbarPlugin): void {
    if (this.plugins.has(plugin.name)) {
      console.warn(`Plugin ${plugin.name} is already registered`);
      return;
    }

    this.plugins.set(plugin.name, plugin);

    // Initialize plugin if context is available
    if (this.context) {
      plugin.initialize(this.context);
    }
  }

  /**
   * Unregister a plugin
   */
  unregisterPlugin(name: string): void {
    const plugin = this.plugins.get(name);
    if (plugin) {
      plugin.destroy();
      this.plugins.delete(name);
    }
  }

  /**
   * Get a registered plugin by name
   */
  getPlugin(name: string): AnnotationToolbarPlugin | undefined {
    return this.plugins.get(name);
  }

  /**
   * Get all registered plugins
   */
  getAllPlugins(): AnnotationToolbarPlugin[] {
    return Array.from(this.plugins.values());
  }

  /**
   * Set the plugin context
   */
  setContext(context: AnnotationContext): void {
    this.context = context;

    // Initialize all plugins with the new context
    this.plugins.forEach((plugin) => {
      if (!plugin.isActive) {
        plugin.initialize(context);
      }
    });
  }

  /**
   * Render all active plugins into a container
   */
  renderPlugins(container: HTMLElement): void {
    if (!this.context) {
      throw new Error('Plugin context not set');
    }

    this.plugins.forEach((plugin) => {
      if (plugin.isActive) {
        plugin.render(container, this.context!);
      }
    });
  }

  /**
   * Update all plugins with current context
   */
  updatePlugins(): void {
    if (!this.context) return;

    this.plugins.forEach((plugin) => {
      if (plugin.isActive && plugin.update) {
        plugin.update(this.context!);
      }
    });
  }

  /**
   * Deactivate all plugins without removing them (for toolbar recreation)
   */
  deactivate(): void {
    this.plugins.forEach((plugin) => plugin.destroy());
    this.context = undefined;
  }

  /**
   * Destroy all plugins and clean up
   */
  destroy(): void {
    this.plugins.forEach((plugin) => plugin.destroy());
    this.plugins.clear();
    this.context = undefined;
  }
}
