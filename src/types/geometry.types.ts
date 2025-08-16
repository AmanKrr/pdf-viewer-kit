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

/**
 * Configuration for drawing styles and appearance of annotations.
 */
export interface DrawConfig {
  /** Fill color for shapes (CSS color string) */
  fillColor?: string;
  /** Stroke color for shapes (CSS color string) */
  strokeColor?: string;
  /** Stroke width in pixels */
  strokeWidth?: number;
  /** Opacity value between 0 and 1 */
  opacity?: number;
  /** Stroke style: 'solid', 'dashed', 'dotted' */
  strokeStyle?: string;
}

/**
 * Modern coordinate system using industry standard positioning.
 * Uses left/top with width/height for more intuitive positioning.
 */
export interface ModernRect {
  /** Left position from container edge */
  left: number;
  /** Top position from container edge */
  top: number;
  /** Width of the rectangle */
  width: number;
  /** Height of the rectangle */
  height: number;
}

/**
 * Legacy coordinate system for backward compatibility.
 * Uses x0/y0 (top-left) and x1/y1 (bottom-right) coordinates.
 */
export interface LegacyRect {
  /** Left coordinate (x0) */
  x0: number;
  /** Top coordinate (y0) */
  y0: number;
  /** Right coordinate (x1) */
  x1: number;
  /** Bottom coordinate (y1) */
  y1: number;
}

/**
 * Base configuration shared by all annotation types.
 */
interface BaseConfig extends DrawConfig {
  /** Unique identifier for the annotation */
  id: string;
  /** PDF page number where annotation is placed (1-based) */
  pageNumber: number;
  /** Whether the annotation is interactive/selectable */
  interactive: boolean;
}

/**
 * Modern rectangle configuration using industry standard coordinates.
 */
export interface ModernRectangleConfig extends BaseConfig {
  type: 'rectangle';
  /** Left position from container edge */
  left: number;
  /** Top position from container edge */
  top: number;
  /** Width of the rectangle */
  width: number;
  /** Height of the rectangle */
  height: number;
}

/**
 * Legacy rectangle configuration for backward compatibility.
 */
export interface LegacyRectangleConfig extends BaseConfig {
  type: 'rectangle';
  /** Left coordinate (x0) */
  x0: number;
  /** Top coordinate (y0) */
  y0: number;
  /** Right coordinate (x1) */
  x1: number;
  /** Bottom coordinate (y1) */
  y1: number;
}

/**
 * Union type supporting both modern and legacy rectangle configurations.
 */
export type RectangleConfig = ModernRectangleConfig | LegacyRectangleConfig;

/**
 * Modern ellipse configuration using industry standard coordinates.
 */
export interface ModernEllipseConfig extends BaseConfig {
  type: 'ellipse';
  /** Left position from container edge */
  left: number;
  /** Top position from container edge */
  top: number;
  /** Width of the ellipse */
  width: number;
  /** Height of the ellipse */
  height: number;
}

/**
 * Legacy ellipse configuration for backward compatibility.
 */
export interface LegacyEllipseConfig extends BaseConfig {
  type: 'ellipse';
  /** Center x-coordinate */
  cx: number;
  /** Center y-coordinate */
  cy: number;
  /** Horizontal radius */
  rx: number;
  /** Vertical radius */
  ry: number;
}

/**
 * Union type supporting both modern and legacy ellipse configurations.
 */
export type EllipseConfig = ModernEllipseConfig | LegacyEllipseConfig;

/**
 * Line annotation configuration.
 */
export interface LineConfig extends BaseConfig {
  type: 'line';
  /** Starting x-coordinate */
  x1: number;
  /** Starting y-coordinate */
  y1: number;
  /** Ending x-coordinate */
  x2: number;
  /** Ending y-coordinate */
  y2: number;
}

/**
 * Union type for all supported shape configurations.
 */
export type ShapeConfig = RectangleConfig | EllipseConfig | LineConfig;

/**
 * Supported shape types for annotations.
 */
export type ShapeType = 'rectangle' | 'ellipse' | 'line';
