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

import { ShapeType } from './geometry.types';
import { AnnotationToolbarPlugin } from '../viewer/ui/plugins/annotation-toolbar.plugin';

/**
 * Shape option configuration for annotation toolbar
 */
export interface ShapeOption {
  /** Unique identifier for the shape */
  id: string;
  /** Display name for the shape */
  name: string;
  /** Shape type for rendering */
  type: ShapeType;
  /** Material Icons icon name */
  icon: string;
  /** Default configuration for this shape */
  defaultConfig?: {
    strokeColor?: string;
    fillColor?: string;
    strokeWidth?: number;
    opacity?: number;
    strokeStyle?: 'Solid' | 'Dashed';
  };
}

/**
 * Configuration for individual property plugins
 * Provides fine-grained control over each property plugin
 */
export interface PropertyPluginConfig {
  /** Color property plugin */
  color?: boolean | { priority?: number; label?: string; includeTransparent?: boolean };
  /** Fill property plugin */
  fill?: boolean | { priority?: number; label?: string; includeTransparent?: boolean };
  /** Opacity property plugin */
  opacity?: boolean | { priority?: number; label?: string; min?: number; max?: number; displayFormat?: (v: number) => string };
  /** Thickness property plugin */
  thickness?: boolean | { priority?: number; label?: string; min?: number; max?: number; displayFormat?: (v: number) => string };
  /** Border style property plugin */
  border?: boolean | { priority?: number; label?: string; styles?: Array<'Solid' | 'Dashed' | 'Dotted'> };
}

/**
 * Configuration options for annotation toolbar
 */
export interface AnnotationToolbarOptions {
  /**
   * Enable shape selection panel
   * @default true
   */
  enableShapeSelection?: boolean;

  /**
   * Custom shape options to display in shape selection dropdown
   * If not provided, defaults to [rectangle, ellipse, line]
   */
  shapeOptions?: ShapeOption[];

  /**
   * Individual property plugin configuration
   * Provides fine-grained control over each property plugin
   * If not provided, all property plugins are enabled with defaults
   */
  propertyPlugins?: PropertyPluginConfig;

  /**
   * Custom plugins to add to the annotation toolbar
   * These will be rendered after built-in plugins
   */
  customPlugins?: AnnotationToolbarPlugin[];

  /**
   * Show delete button in toolbar
   * @default true
   */
  showDeleteButton?: boolean;

  /**
   * Show back button in toolbar
   * @default true
   */
  showBackButton?: boolean;
}

/**
 * Default shape options
 */
export const DEFAULT_SHAPE_OPTIONS: ShapeOption[] = [
  {
    id: 'rectangle',
    name: 'Rectangle',
    type: 'rectangle',
    icon: 'rectangle',
  },
  {
    id: 'ellipse',
    name: 'Ellipse',
    type: 'ellipse',
    icon: 'circle',
  },
  {
    id: 'line',
    name: 'Line',
    type: 'line',
    icon: 'pen_size_1',
  },
];

/**
 * Default property plugins configuration
 * All property plugins enabled with default settings
 */
export const DEFAULT_PROPERTY_PLUGINS: PropertyPluginConfig = {
  color: true,
  fill: true,
  opacity: true,
  thickness: true,
  border: true,
};
