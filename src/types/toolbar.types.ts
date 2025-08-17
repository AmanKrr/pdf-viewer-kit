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

import WebViewer from '../viewer/ui/web-viewer.component';

/**
 * Contract for a pluggable toolbar implementation.
 */
export interface IToolbar {
  /** Render toolbar UI into the given container element */
  render(container: HTMLElement): void;
  /** Tear down any DOM or event listeners created in render() */
  destroy(): void;
}

/**
 * Fine‑grain show/hide toggles and CSS namespace for default toolbar.
 */
export interface ToolbarOptions {
  /** Show "First Page" button */
  showFirstPage?: boolean;
  /** Show "Previous/Next Page" buttons */
  showPrevNext?: boolean;
  /** Show "Last Page" button */
  showLastPage?: boolean;
  /** Show "Page Number" control */
  showPageNumber?: boolean;
  /** Show "Zoom In/Out" buttons */
  showZoom?: boolean;
  /** Show "Search" button */
  showSearch?: boolean;
  /** Show "Thumbnail" toggle button */
  showThumbnail?: boolean;
  /** Show "Annotation" toggle button */
  showAnnotation?: boolean;
  /** Prefix for all toolbar CSS classes */
  classPrefix?: string;
  /** Show "Download" button */
  showDownload?: boolean;
}

/**
 * Standard toolbar actions that can be performed
 */
export type ToolbarAction =
  | 'firstPage'
  | 'lastPage'
  | 'previousPage'
  | 'nextPage'
  | 'zoomIn'
  | 'zoomOut'
  | 'currentPageNumber'
  | 'search'
  | 'thumbnail'
  | 'annotation'
  | 'download'
  | 'custom';

/**
 * Event data for toolbar button interactions
 */
export interface ToolbarButtonEvent {
  type: 'click' | 'keydown' | 'input';
  target: EventTarget;
  viewer: WebViewer;
  data?: unknown;
}

/**
 * Configuration for each button or custom element in the toolbar.
 */
export interface ToolbarButtonConfig<T = unknown> {
  /** Unique key/id for this item (used in CSS classes) */
  id: string;
  /** CSS class(es) for icon; ignored if using `render` */
  iconClass?: string;
  /** Tooltip text (title attribute) */
  tooltip?: string;
  /** Standard action type for built-in functionality */
  action?: ToolbarAction;
  /** Standard click handler; ignored if using `render` */
  onClick?: (viewer: WebViewer, event?: ToolbarButtonEvent, data?: T) => void | Promise<void>;
  /** Alternative: return your own element instead of button+icon */
  render?: (viewer: WebViewer) => HTMLElement;
  /** Insert a separator just before this item */
  isSeparatorBefore?: boolean;
  /** Break to right side of toolbar */
  breakBefore?: boolean;
  /** Additional CSS classes for the button */
  additionalClasses?: string[];
  /** Whether the button should be disabled initially */
  disabled?: boolean;
  /** Custom data to pass to onClick handler */
  customData?: T;
}

/**
 * Extended toolbar button configuration with validation
 */
export interface ValidatedToolbarButtonConfig<T = unknown> extends ToolbarButtonConfig<T> {
  /** Validated action type */
  action: ToolbarAction;
  /** Required onClick handler for action-based buttons */
  onClick: (viewer: WebViewer, event?: ToolbarButtonEvent, data?: T) => void | Promise<void>;
}

/**
 * Toolbar button state
 */
export interface ToolbarButtonState {
  /** Whether the button is currently active/selected */
  isActive: boolean;
  /** Whether the button is currently disabled */
  isDisabled: boolean;
  /** Whether the button is currently loading */
  isLoading: boolean;
}

/**
 * Toolbar theme configuration
 */
export interface ToolbarTheme {
  /** Primary color for buttons and highlights */
  primaryColor: string;
  /** Secondary color for borders and backgrounds */
  secondaryColor: string;
  /** Background color for the toolbar */
  backgroundColor: string;
  /** Text color for labels and text */
  textColor: string;
  /** Border color for separators and dividers */
  borderColor: string;
}
