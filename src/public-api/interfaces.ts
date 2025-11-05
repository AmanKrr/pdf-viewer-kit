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

import { PDFDocumentProxy } from 'pdfjs-dist';
import { Events } from '../types/events.types';

/**
 * Public events that users can listen to.
 * These represent user-facing state changes and actions.
 *
 * Note: We exclude internal events that users shouldn't access,
 * keeping only the events that are meant for public use.
 */
export type PublicEvents = Exclude<Events, 'DRAWING_STARTED' | 'DRAWING_FINISHED' | 'interactiveModeChanged' | 'scaleChange'>;

/**
 * Public interface for PDF viewer instances.
 * Users interact with this interface for all PDF operations.
 */
export interface IPDFViewerInstance {
  /** Unique identifier for this PDF viewer instance */
  readonly instanceId: string;

  /** DOM container ID where this instance is rendered */
  readonly containerId: string;

  /** Whether this instance has been destroyed */
  readonly isDestroyed: boolean;

  /** Whether the PDF is fully loaded and ready */
  readonly isReady: boolean;

  /** Current page number (1-based) */
  readonly currentPage: number;

  /** Total number of pages in the PDF */
  readonly totalPages: number;

  /** Current zoom level */
  readonly currentScale: number;

  /** PDF document instance (null if not loaded) */
  readonly pdfDocument: PDFDocumentProxy | null;

  /** Event emitter for listening to public events */
  readonly events: IPDFViewerEvents;

  /** Annotation management interface */
  readonly annotations: IPDFViewerAnnotations;

  /** Search functionality interface */
  readonly search: IPDFViewerSearch;

  /** Navigation methods */
  goToPage(pageNumber: number): void;
  nextPage(): void;
  previousPage(): void;
  firstPage(): void;
  lastPage(): void;

  /** Zoom methods */
  zoomIn(): Promise<void>;
  zoomOut(): Promise<void>;
  setZoom(scale: number): Promise<void>;

  /** Utility methods */
  download(filename?: string): Promise<void>;
  destroy(): Promise<void>;
}

/**
 * Public interface for PDF viewer events.
 * Provides type-safe event handling for users.
 */
export interface IPDFViewerEvents {
  /** Register an event listener */
  on(event: PublicEvents, listener: EventListener): void;

  /** Remove an event listener */
  off(event: PublicEvents, listener: EventListener): void;

  /** Remove all listeners for a specific event */
  removeAllListeners(event?: PublicEvents): void;
}

/**
 * Public interface for annotation management.
 * Users can create, modify, and delete annotations.
 */
export interface IPDFViewerAnnotations {
  /** Get all annotations for a specific page */
  getAnnotations(pageNumber?: number): IAnnotation[];

  /** Create a new annotation */
  createAnnotation(config: IAnnotationConfig): Promise<string>;

  /** Update an existing annotation */
  updateAnnotation(id: string, updates: Partial<IAnnotationConfig>): Promise<void>;

  /** Delete an annotation */
  deleteAnnotation(id: string): Promise<void>;

  /** Check if annotations are enabled */
  readonly isEnabled: boolean;

  /** Enable/disable annotation mode */
  setEnabled(enabled: boolean): void;

  /** Extract text content from inside a rectangle annotation */
  getTextInsideRectangle(annotationId: string): Promise<string>;

  /** Get the configuration of an existing annotation */
  getAnnotationShapeConfig(annotationId: string): IShapeConfig;

  /** Check if annotation manager is registered for a specific page */
  isPageManagerRegistered(pageNumber: number): boolean;

  /** Get list of pages with registered annotation managers */
  getRegisteredPages(): number[];

  /** Scroll a rectangle on a page into view (centered) */
  scrollRectIntoView(pageNumber: number, rect: { top: number; left: number; width: number; height: number }): void;

  /** Scroll an annotation/highlight into view using annotation-id or DOM id */
  scrollHighlightIntoView(annotationId: string): void;

  /** Scroll a known annotation/highlight element into view (no lookups) */
  scrollHighlightElementIntoView(element: HTMLElement): void;

  /** Wait until the annotation's DOM element is rendered and available */
  waitForAnnotationElement(annotationId: string, timeoutMs?: number): Promise<HTMLElement>;
}

/**
 * Public interface for search functionality.
 * Users can search within PDF content.
 */
export interface IPDFViewerSearch {
  /** Search for text in the PDF */
  search(query: string): Promise<ISearchResult[]>;

  /** Clear current search results */
  clearSearch(): void;

  /** Navigate to next search result */
  nextResult(): void;

  /** Navigate to previous search result */
  previousResult(): void;

  /** Get current search results */
  readonly currentResults: ISearchResult[];

  /** Get current result index */
  readonly currentResultIndex: number;

  /** Check if search is active */
  readonly isActive: boolean;
}

/**
 * Public interface for annotations.
 * Represents a single annotation in the PDF.
 */
export interface IAnnotation {
  /** Unique identifier for the annotation */
  readonly id: string;

  /** Type of annotation */
  readonly type: 'rectangle' | 'ellipse' | 'line' | 'text';

  /** Page number where annotation is placed (1-based) */
  readonly pageNumber: number;

  /** Whether the annotation is currently selected */
  readonly isSelected: boolean;

  /** Whether the annotation is interactive */
  readonly isInteractive: boolean;

  /** Annotation style properties */
  readonly style: IAnnotationStyle;

  /** Annotation content (for text annotations) */
  readonly content?: string;

  /** Delete this annotation */
  delete(): Promise<void>;

  /** Select this annotation */
  select(): void;

  /** Deselect this annotation */
  deselect(): void;
}

/**
 * Configuration for creating new annotations.
 * Supports both modern and legacy coordinate systems.
 */
export interface IAnnotationConfig {
  /** Type of annotation to create */
  type: 'rectangle' | 'ellipse' | 'line' | 'text';

  /** Page number where to place the annotation (1-based) */
  pageNumber: number;

  /**
   * Modern rectangle coordinates at top-level (preferred for 'rectangle').
   * These are supported by the runtime. If provided, they take precedence.
   */
  left?: number;
  top?: number;
  width?: number;
  height?: number;

  /** Legacy coordinates for backward compatibility */
  x0?: number; // Left/top-left X coordinate
  x1?: number; // Right/bottom-right X coordinate or width
  y0?: number; // Top/top-left Y coordinate
  y1?: number; // Bottom/bottom-right Y coordinate or height

  /** Style properties for the annotation (can be specified directly or in style object) */
  style?: Partial<IAnnotationStyle>;

  /** Direct style properties for backward compatibility */
  fillColor?: string;
  strokeColor?: string;
  strokeWidth?: number;
  opacity?: number;
  strokeStyle?: 'solid' | 'dashed' | 'dotted' | 'Solid' | 'Dashed' | 'Dotted';

  /** Content for text annotations */
  content?: string;

  /** Whether the annotation should be interactive */
  interactive?: boolean;
}

/**
 * Base configuration for all annotation types.
 */
export interface IBaseAnnotationConfig {
  /** Unique identifier for the annotation */
  id: string;

  /** Type of annotation */
  type: 'rectangle' | 'ellipse' | 'line';

  /** Page number where annotation is placed (1-based) */
  pageNumber: number;

  /** Whether the annotation is interactive/selectable */
  interactive: boolean;

  /** Style properties for the annotation */
  style: IAnnotationStyle;
}

/**
 * Rectangle annotation configuration.
 * Supports both modern and legacy coordinate systems.
 */
export interface IRectangleConfig extends IBaseAnnotationConfig {
  type: 'rectangle';

  /** Modern coordinates (preferred) */
  left?: number;
  top?: number;
  width?: number;
  height?: number;

  /** Legacy coordinates for backward compatibility */
  x0?: number; // Left X coordinate
  x1?: number; // Right X coordinate
  y0?: number; // Top Y coordinate
  y1?: number; // Bottom Y coordinate
}

/**
 * Ellipse annotation configuration.
 * Supports both modern and legacy coordinate systems.
 */
export interface IEllipseConfig extends IBaseAnnotationConfig {
  type: 'ellipse';

  /** Modern coordinates (preferred) */
  left?: number;
  top?: number;
  width?: number;
  height?: number;

  /** Legacy coordinates for backward compatibility */
  cx?: number; // Center X coordinate
  cy?: number; // Center Y coordinate
  rx?: number; // Horizontal radius
  ry?: number; // Vertical radius
}

/**
 * Line annotation configuration.
 * Uses legacy coordinate system (x1, y1, x2, y2).
 */
export interface ILineConfig extends IBaseAnnotationConfig {
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
export type IShapeConfig = IRectangleConfig | IEllipseConfig | ILineConfig;

/**
 * Utility type for coordinate conversion.
 * Helps convert between modern and legacy coordinate systems.
 */
export interface ICoordinateConverter {
  /** Convert legacy coordinates to modern format */
  toModern(config: IShapeConfig): IAnnotationPosition;

  /** Convert modern coordinates to legacy format */
  toLegacy(position: IAnnotationPosition, type: 'rectangle' | 'ellipse' | 'line'): Partial<IShapeConfig>;

  /** Validate coordinate consistency */
  validate(config: IAnnotationConfig): boolean;
}

/**
 * Coordinate validation result.
 */
export interface ICoordinateValidation {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  suggestedFix?: IAnnotationConfig;
}

/**
 * Position and size information for annotations.
 */
export interface IAnnotationPosition {
  /** Left position from container edge */
  left: number;

  /** Top position from container edge */
  top: number;

  /** Width of the annotation */
  width: number;

  /** Height of the annotation */
  height: number;
}

/**
 * Style properties for annotations.
 */
export interface IAnnotationStyle {
  /** Fill color (CSS color string) */
  fillColor: string;

  /** Stroke color (CSS color string) */
  strokeColor: string;

  /** Stroke width in pixels */
  strokeWidth: number;

  /** Opacity value between 0 and 1 */
  opacity: number;

  /** Stroke style - supports both modern and legacy values */
  strokeStyle: 'solid' | 'dashed' | 'dotted' | 'Solid' | 'Dashed' | 'Dotted';
}

/**
 * Search result information.
 */
export interface ISearchResult {
  /** Page number where result was found */
  pageNumber: number;

  /** Text content that was found */
  text: string;

  /** Position information for highlighting */
  position: IAnnotationPosition;

  /** Navigate to this search result */
  goTo(): void;
}

/**
 * Generic event listener type.
 */
export type EventListener = (...args: any[]) => void;
