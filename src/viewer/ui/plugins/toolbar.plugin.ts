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

import WebViewer from '../web-viewer.component';

/**
 * Context object passed to toolbar plugins for rendering and interaction
 */
export interface ToolbarPluginContext {
  viewer: WebViewer;
  containerId: string;
  instanceId: string;
  shadowRoot: ShadowRoot | null;
}

/**
 * Plugin priority levels to control rendering order
 */
export enum ToolbarPluginPriority {
  HIGHEST = 0,
  HIGH = 25,
  NORMAL = 50,
  LOW = 75,
  LOWEST = 100,
}

/**
 * Base interface for toolbar plugins
 */
export interface ToolbarPlugin {
  /** Unique name identifier for the plugin */
  readonly name: string;
  /** Plugin version for compatibility checking */
  readonly version: string;
  /** Whether the plugin is currently active */
  readonly isActive: boolean;
  /** Priority for rendering order (lower numbers render first) */
  readonly priority: ToolbarPluginPriority;
  /** Whether to show a separator before this plugin */
  readonly showSeparatorBefore?: boolean;
  /** Whether this plugin should be positioned on the right side */
  readonly alignRight?: boolean;

  /** Initialize the plugin */
  initialize(context: ToolbarPluginContext): void;
  /** Render the plugin UI into the specified container */
  render(container: HTMLElement, context: ToolbarPluginContext): HTMLElement;
  /** Update the plugin when state changes */
  update?(context: ToolbarPluginContext): void;
  /** Clean up plugin resources */
  destroy(): void;
}

/**
 * Base class for toolbar plugins
 * Provides common functionality and lifecycle management
 */
export abstract class BaseToolbarPlugin implements ToolbarPlugin {
  public readonly name: string;
  public readonly version: string;
  public readonly priority: ToolbarPluginPriority;
  public readonly showSeparatorBefore?: boolean;
  public readonly alignRight?: boolean;

  protected _isActive = false;
  protected _context?: ToolbarPluginContext;
  protected _element?: HTMLElement;

  constructor(
    name: string,
    options: {
      version?: string;
      priority?: ToolbarPluginPriority;
      showSeparatorBefore?: boolean;
      alignRight?: boolean;
    } = {},
  ) {
    this.name = name;
    this.version = options.version || '1.0.0';
    this.priority = options.priority || ToolbarPluginPriority.NORMAL;
    this.showSeparatorBefore = options.showSeparatorBefore;
    this.alignRight = options.alignRight;
  }

  get isActive(): boolean {
    return this._isActive;
  }

  initialize(context: ToolbarPluginContext): void {
    this._context = context;
    this._isActive = true;
    this.onInitialize(context);
  }

  render(container: HTMLElement, context: ToolbarPluginContext): HTMLElement {
    if (!this._isActive) {
      throw new Error(`Plugin ${this.name} is not initialized`);
    }
    this._element = this.onRender(container, context);
    return this._element;
  }

  update(context: ToolbarPluginContext): void {
    if (this._isActive && this.onUpdate) {
      this.onUpdate(context);
    }
  }

  destroy(): void {
    this._isActive = false;
    this.onDestroy();
    this._context = undefined;
    this._element = undefined;
  }

  /**
   * Get the current plugin context
   */
  protected get context(): ToolbarPluginContext | undefined {
    return this._context;
  }

  /**
   * Get the plugin's rendered element
   */
  protected get element(): HTMLElement | undefined {
    return this._element;
  }

  /**
   * Override these methods in subclasses
   */
  protected abstract onInitialize(context: ToolbarPluginContext): void;
  protected abstract onRender(container: HTMLElement, context: ToolbarPluginContext): HTMLElement;
  protected onUpdate?(context: ToolbarPluginContext): void;
  protected abstract onDestroy(): void;
}

/**
 * Plugin manager for toolbar
 * Handles plugin registration, lifecycle, and communication
 */
export class ToolbarPluginManager {
  private plugins: Map<string, ToolbarPlugin> = new Map();
  private context?: ToolbarPluginContext;

  /**
   * Register a plugin with the manager
   */
  registerPlugin(plugin: ToolbarPlugin): void {
    if (this.plugins.has(plugin.name)) {
      console.warn(`Toolbar plugin ${plugin.name} is already registered`);
      return;
    }

    this.plugins.set(plugin.name, plugin);

    // Initialize plugin if context is available
    if (this.context) {
      plugin.initialize(this.context);
    }
  }

  /**
   * Register multiple plugins at once
   */
  registerPlugins(plugins: ToolbarPlugin[]): void {
    plugins.forEach((plugin) => this.registerPlugin(plugin));
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
  getPlugin(name: string): ToolbarPlugin | undefined {
    return this.plugins.get(name);
  }

  /**
   * Get all registered plugins sorted by priority
   */
  getAllPlugins(): ToolbarPlugin[] {
    return Array.from(this.plugins.values()).sort((a, b) => a.priority - b.priority);
  }

  /**
   * Set the plugin context
   */
  setContext(context: ToolbarPluginContext): void {
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
      throw new Error('Toolbar plugin context not set');
    }

    // Clear the container
    container.innerHTML = '';

    // Sort plugins by priority and filter only active ones
    const sortedPlugins = this.getAllPlugins();
    const activePlugins = sortedPlugins.filter((p) => p.isActive);

    // Track if we've added any plugins to the left side (non-alignRight)
    let hasLeftSidePlugins = false;
    let isFirstRightAlignedPlugin = true;

    activePlugins.forEach((plugin, index) => {
      // Smart separator logic
      if (plugin.showSeparatorBefore) {
        const shouldAddSeparator = this.shouldAddSeparator(plugin, index, hasLeftSidePlugins, isFirstRightAlignedPlugin);

        if (shouldAddSeparator) {
          const separator = this.createSeparator();
          container.appendChild(separator);
        }
      }

      // Create wrapper for the plugin
      const wrapper = this.createPluginWrapper(plugin);

      // Render plugin and append to wrapper
      const element = plugin.render(wrapper, this.context!);
      wrapper.appendChild(element);

      // Apply right alignment if requested
      if (plugin.alignRight) {
        if (isFirstRightAlignedPlugin && hasLeftSidePlugins) {
          wrapper.style.marginLeft = 'auto';
          isFirstRightAlignedPlugin = false;
        }
      } else {
        hasLeftSidePlugins = true;
      }

      container.appendChild(wrapper);
    });
  }

  /**
   * Determine if a separator should be added before a plugin
   */
  private shouldAddSeparator(
    plugin: ToolbarPlugin,
    currentIndex: number,
    hasLeftSidePlugins: boolean,
    isFirstRightAlignedPlugin: boolean
  ): boolean {
    // Don't add separator if this is the first plugin
    if (currentIndex === 0) {
      return false;
    }

    // If this is a right-aligned plugin and it's the first right-aligned one
    if (plugin.alignRight && isFirstRightAlignedPlugin) {
      // Only add separator if there are left-side plugins before it
      return hasLeftSidePlugins;
    }

    // For all other cases, add separator (there's at least one plugin before)
    return true;
  }

  /**
   * Create a wrapper element for a plugin
   */
  private createPluginWrapper(plugin: ToolbarPlugin): HTMLDivElement {
    const wrapper = document.createElement('div');
    wrapper.classList.add('a-toolbar-item', `${plugin.name}-item`);
    return wrapper;
  }

  /**
   * Create a separator element
   */
  private createSeparator(): HTMLDivElement {
    const separator = document.createElement('div');
    separator.classList.add('a-toolbar-separator');
    return separator;
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
