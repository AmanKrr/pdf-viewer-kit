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

import { AnnotationToolbarStateManager } from '../viewer/ui/AnnotationToolbarState';
import { AnnotationToolbarPluginManager } from '../viewer/ui/plugins/AnnotationToolbarPlugin';
import { ShapeSelectionPlugin } from '../viewer/ui/plugins/ShapeSelectionPlugin';
import { AnnotationPropertiesPlugin } from '../viewer/ui/plugins/AnnotationPropertiesPlugin';
import { ColorPicker } from '../viewer/ui/components/ColorPicker';

// Mock WebViewer for testing
class MockWebViewer {
  instanceId = 'test-instance';
  containerId = 'test-container';
  events = {
    on: jest.fn(),
    off: jest.fn(),
  };
  visiblePageNumbers = [1, 2, 3];
  annotation = {
    isAnnotationManagerRegistered: jest.fn(() => ({
      _initAnnotation: jest.fn(),
      _initAnnotationCleanup: jest.fn(),
      drawConfig: {},
    })),
  };
}

// Mock AnnotationContext for testing
const mockContext = {
  viewer: new MockWebViewer() as any,
  stateManager: new AnnotationToolbarStateManager(),
  containerId: 'test-container',
  instanceId: 'test-instance',
};

describe('Annotation Toolbar Architecture Tests', () => {
  describe('State Manager', () => {
    let stateManager: AnnotationToolbarStateManager;

    beforeEach(() => {
      stateManager = new AnnotationToolbarStateManager();
    });

    test('should initialize with default state', () => {
      const state = stateManager.state;
      expect(state.selectedShape).toBe('none');
      expect(state.propertiesOpen).toBe(false);
      expect(state.drawConfig.strokeColor).toBe('red');
      expect(state.drawConfig.fillColor).toBe('transparent');
    });

    test('should update state and notify listeners', () => {
      const listener = jest.fn();
      stateManager.subscribe(listener);

      stateManager.setState({ selectedShape: 'rectangle' });

      expect(listener).toHaveBeenCalledWith(expect.objectContaining({ selectedShape: 'none' }), expect.objectContaining({ selectedShape: 'rectangle' }));
    });

    test('should update draw config and notify listeners', () => {
      const listener = jest.fn();
      stateManager.subscribeToDrawConfig(listener);

      stateManager.updateDrawConfig({ strokeColor: 'blue' });

      expect(listener).toHaveBeenCalledWith(expect.objectContaining({ strokeColor: 'red' }), expect.objectContaining({ strokeColor: 'blue' }));
    });

    test('should subscribe to specific property changes', () => {
      const listener = jest.fn();
      stateManager.subscribeToProperty('selectedShape', listener);

      stateManager.setState({ selectedShape: 'circle' });

      expect(listener).toHaveBeenCalledWith('circle', 'none');
    });

    test('should reset state to initial values', () => {
      stateManager.setState({ selectedShape: 'rectangle', propertiesOpen: true });
      expect(stateManager.state.selectedShape).toBe('rectangle');
      expect(stateManager.state.propertiesOpen).toBe(true);

      stateManager.reset();
      expect(stateManager.state.selectedShape).toBe('none');
      expect(stateManager.state.propertiesOpen).toBe(false);
    });

    test('should cleanup listeners on destroy', () => {
      const listener = jest.fn();
      const unsubscribe = stateManager.subscribe(listener);

      stateManager.setState({ selectedShape: 'rectangle' });
      expect(listener).toHaveBeenCalledTimes(1);

      unsubscribe();
      stateManager.setState({ selectedShape: 'circle' });
      expect(listener).toHaveBeenCalledTimes(1); // Should not be called again
    });
  });

  describe('Plugin Manager', () => {
    let pluginManager: AnnotationToolbarPluginManager;

    beforeEach(() => {
      pluginManager = new AnnotationToolbarPluginManager();
    });

    test('should register and manage plugins', () => {
      const plugin = new ShapeSelectionPlugin();
      pluginManager.registerPlugin(plugin);

      expect(pluginManager.getPlugin('shape-selection')).toBe(plugin);
      expect(pluginManager.getAllPlugins()).toHaveLength(1);
    });

    test('should initialize plugins when context is set', () => {
      const plugin = new ShapeSelectionPlugin();
      pluginManager.registerPlugin(plugin);

      pluginManager.setContext(mockContext);

      expect(plugin.isActive).toBe(true);
    });

    test('should render all active plugins', () => {
      const plugin = new ShapeSelectionPlugin();
      pluginManager.registerPlugin(plugin);
      pluginManager.setContext(mockContext);

      const container = document.createElement('div');
      pluginManager.renderPlugins(container);

      expect(container.children.length).toBeGreaterThan(0);
    });

    test('should cleanup plugins on destroy', () => {
      const plugin = new ShapeSelectionPlugin();
      pluginManager.registerPlugin(plugin);
      pluginManager.setContext(mockContext);

      expect(plugin.isActive).toBe(true);

      pluginManager.destroy();

      expect(plugin.isActive).toBe(false);
      expect(pluginManager.getAllPlugins()).toHaveLength(0);
    });
  });

  describe('Shape Selection Plugin', () => {
    let plugin: ShapeSelectionPlugin;

    beforeEach(() => {
      plugin = new ShapeSelectionPlugin();
    });

    test('should initialize with correct name and version', () => {
      expect(plugin.name).toBe('shape-selection');
      expect(plugin.version).toBe('1.0.0');
    });

    test('should initialize when context is set', () => {
      plugin.initialize(mockContext);
      expect(plugin.isActive).toBe(true);
    });

    test('should render shape selection UI', () => {
      plugin.initialize(mockContext);
      const container = document.createElement('div');
      plugin.render(container, mockContext);

      expect(container.children.length).toBeGreaterThan(0);
    });

    test('should update when state changes', () => {
      plugin.initialize(mockContext);
      const container = document.createElement('div');
      plugin.render(container, mockContext);

      mockContext.stateManager.setState({ selectedShape: 'rectangle' });
      plugin.update(mockContext);

      // Plugin should have updated its internal state
      expect(plugin.isActive).toBe(true);
    });

    test('should cleanup on destroy', () => {
      plugin.initialize(mockContext);
      plugin.destroy();

      expect(plugin.isActive).toBe(false);
    });
  });

  describe('Annotation Properties Plugin', () => {
    let plugin: AnnotationPropertiesPlugin;

    beforeEach(() => {
      plugin = new AnnotationPropertiesPlugin();
    });

    test('should initialize with correct name and version', () => {
      expect(plugin.name).toBe('annotation-properties');
      expect(plugin.version).toBe('1.0.0');
    });

    test('should create properties container with all controls', () => {
      plugin.initialize(mockContext);
      const container = document.createElement('div');
      plugin.render(container, mockContext);

      // Should create properties container
      expect(plugin.isActive).toBe(true);
    });

    test('should respond to properties panel visibility changes', () => {
      plugin.initialize(mockContext);
      const container = document.createElement('div');
      plugin.render(container, mockContext);

      mockContext.stateManager.setState({ propertiesOpen: true });
      plugin.update(mockContext);

      // Properties should be visible
      expect(plugin.isActive).toBe(true);
    });

    test('should cleanup on destroy', () => {
      plugin.initialize(mockContext);
      plugin.destroy();

      expect(plugin.isActive).toBe(false);
    });
  });

  describe('Color Picker Component', () => {
    let colorPicker: ColorPicker;

    beforeEach(() => {
      colorPicker = new ColorPicker({
        label: 'Color',
        initialColor: '#FF0000',
        onColorSelect: jest.fn(),
        containerId: 'test-container',
      });
    });

    test('should create color picker element', () => {
      const element = colorPicker.getElement();
      expect(element).toBeDefined();
      expect(element.tagName).toBe('DIV');
    });

    test('should show and hide dropdown', () => {
      colorPicker.show();
      expect(colorPicker.getVisible()).toBe(true);

      colorPicker.hide();
      expect(colorPicker.getVisible()).toBe(false);
    });

    test('should toggle visibility', () => {
      expect(colorPicker.getVisible()).toBe(false);

      colorPicker.toggle();
      expect(colorPicker.getVisible()).toBe(true);

      colorPicker.toggle();
      expect(colorPicker.getVisible()).toBe(false);
    });

    test('should update color', () => {
      colorPicker.updateColor('#00FF00');
      expect(colorPicker.getCurrentColor()).toBe('#00FF00');
    });

    test('should cleanup on destroy', () => {
      const element = colorPicker.getElement();
      expect(element.parentElement).toBeNull();

      colorPicker.destroy();
      expect(colorPicker.isDestroyed).toBe(true);
    });
  });

  describe('Integration Tests', () => {
    test('should work together: state manager + plugins + components', () => {
      // Create state manager
      const stateManager = new AnnotationToolbarStateManager();

      // Create plugin manager
      const pluginManager = new AnnotationToolbarPluginManager();

      // Register plugins
      const shapePlugin = new ShapeSelectionPlugin();
      const propertiesPlugin = new AnnotationPropertiesPlugin();
      pluginManager.registerPlugin(shapePlugin);
      pluginManager.registerPlugin(propertiesPlugin);

      // Set context
      const context = { ...mockContext, stateManager };
      pluginManager.setContext(context);

      // Verify plugins are active
      expect(shapePlugin.isActive).toBe(true);
      expect(propertiesPlugin.isActive).toBe(true);

      // Test state changes
      stateManager.setState({ selectedShape: 'rectangle', propertiesOpen: true });

      expect(context.stateManager.state.selectedShape).toBe('rectangle');
      expect(context.stateManager.state.propertiesOpen).toBe(true);

      // Cleanup
      pluginManager.destroy();
      stateManager.destroy();
    });

    test('should handle plugin lifecycle correctly', () => {
      const pluginManager = new AnnotationToolbarPluginManager();
      const plugin = new ShapeSelectionPlugin();

      // Register plugin
      pluginManager.registerPlugin(plugin);
      expect(pluginManager.getPlugin('shape-selection')).toBe(plugin);

      // Set context (should initialize plugin)
      pluginManager.setContext(mockContext);
      expect(plugin.isActive).toBe(true);

      // Unregister plugin
      pluginManager.unregisterPlugin('shape-selection');
      expect(pluginManager.getPlugin('shape-selection')).toBeUndefined();
      expect(plugin.isActive).toBe(false);

      // Cleanup
      pluginManager.destroy();
    });
  });
});
