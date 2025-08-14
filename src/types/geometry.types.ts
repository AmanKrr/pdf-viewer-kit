export interface DrawConfig {
  fillColor?: string;
  strokeColor?: string;
  strokeWidth?: number;
  opacity?: number;
  strokeStyle?: string;
}

// Modern coordinate system (industry standard)
export interface ModernRect {
  left: number;
  top: number;
  width: number;
  height: number;
}

// Legacy coordinate system (backward compatibility)
export interface LegacyRect {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
}

interface BaseConfig extends DrawConfig {
  id: string;
  pageNumber: number;
  interactive: boolean;
}

// Modern rectangle configuration (industry standard)
export interface ModernRectangleConfig extends BaseConfig {
  type: 'rectangle';
  left: number;
  top: number;
  width: number;
  height: number;
}

// Legacy rectangle configuration (backward compatibility)
export interface LegacyRectangleConfig extends BaseConfig {
  type: 'rectangle';
  x0: number;
  y0: number;
  x1: number;
  y1: number;
}

// Union type for backward compatibility
export type RectangleConfig = ModernRectangleConfig | LegacyRectangleConfig;

// Modern ellipse configuration (industry standard)
export interface ModernEllipseConfig extends BaseConfig {
  type: 'ellipse';
  left: number;
  top: number;
  width: number;
  height: number;
}

// Legacy ellipse configuration (backward compatibility)
export interface LegacyEllipseConfig extends BaseConfig {
  type: 'ellipse';
  cx: number;
  cy: number;
  rx: number;
  ry: number;
}

// Union type for backward compatibility
export type EllipseConfig = ModernEllipseConfig | LegacyEllipseConfig;
export interface LineConfig extends BaseConfig {
  type: 'line';
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

export type ShapeConfig = RectangleConfig | EllipseConfig | LineConfig;

export type ShapeType = 'rectangle' | 'ellipse' | 'line';
