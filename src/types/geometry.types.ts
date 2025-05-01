export interface DrawConfig {
  fillColor?: string;
  strokeColor?: string;
  strokeWidth?: number;
  opacity?: number;
  strokeStyle?: string;
}

interface BaseConfig extends DrawConfig {
  id: string;
  pageNumber: number;
}

export interface RectangleConfig extends BaseConfig {
  type: 'rectangle';
  x0: number;
  y0: number;
  x1: number;
  y1: number;
}

export interface EllipseConfig extends BaseConfig {
  type: 'ellipse';
  cx: number;
  cy: number;
  rx: number;
  ry: number;
}
export interface LineConfig extends BaseConfig {
  type: 'line';
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

// export interface PolygonConfig extends BaseConfig {
//   type: 'polygon';
//   points: { x: number; y: number }[];
// }

// Now, the union type:
export type ShapeConfig = RectangleConfig | EllipseConfig | LineConfig;

export type ShapeType = 'rectangle' | 'ellipse' | 'line';
