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
 * CSS selectors and class names used throughout the PDF viewer.
 *
 * This file centralizes all DOM element identifiers and CSS class names
 * to ensure consistency and make maintenance easier. These constants
 * are used for DOM queries, styling, and element identification.
 */

/**
 * DOM element IDs for major viewer components.
 *
 * These IDs are used to identify specific containers and elements
 * within the PDF viewer structure.
 */
export const PDF_VIEWER_IDS = {
  TOOLBAR_CONTAINER: 'toolbar-container',
  TOOLBAR_GROUP_ONE: 'toolbar-group-one',
  TOOLBAR_GROUP_TWO: 'toolbar-group-two',
  MAIN_VIEWER_CONTAINER: 'main-viewer-container',
  MAIN_PAGE_VIEWER_CONTAINER: 'main-page-viewer-container',
  TEXT_LAYER: 'text-layer',
  ANNOTATION_LAYER: 'annotation-layer',
  ANNOTATION_DRAWING_LAYER: 'annotation-drawing-layer',
  LOADING_CONTAINER: 'loading-container',
  ERROR_CONTAINER: 'error-container',
  INPUT_PAGE_NUMBER: 'input-page-number-container',
  CURRENT_PAGE_INPUT: 'current-page-input',
};

/**
 * CSS class names for styling and element identification.
 *
 * These class names are used for:
 * - Styling elements with CSS
 * - Identifying elements in JavaScript
 * - Applying visual states and themes
 * - Managing responsive behavior
 */
export const PDF_VIEWER_CLASSNAMES = {
  PDF_LOADING: 'pdf-loading',
  PDF_ERROR: 'pdf-error',
  A_PDF_VIEWER: 'a-pdf-viewer',
  A_TOOLBAR_CONTAINER: 'a-toolbar-container',
  A_TOOLBAR_ITEMS: 'a-toolbar-items',
  A_VIEWER_WRAPPER: 'a-viewer-wrapper',
  A_VIEWER_CONTAINER: 'a-viewer-container',
  A_PAGE_CONTAINER: 'a-page-container',
  A_PAGE_VIEW: 'a-page-view',
  ATEXT_LAYER: 'a-text-layer',
  AANNOTATION_LAYER: 'a-annotation-layer',
  AANNOTATION_DRAWING_LAYER: 'a-annotation-drawing-layer',
  A_TOOLBAR_ITEM: 'a-toolbar-item',
  TOOLBAR_GROUP: 'toolbar-group',
  A_TOOLBAR_TOOLTIP: 'a-toolbar-tooltip',
  A_TOOLBAR_BUTTON: 'a-toolbar-button',
  A_TOOLBAR_ICON: 'a-toolbar-icon',
  A_FIRST_PAGE_CONTAINER: 'a-first-page-container',
  A_PREVIOUS_PAGE_CONTAINER: 'a-previous-page-container',
  A_NEXT_PAGE_CONTAINER: 'a-next-page-container',
  A_LAST_PAGE_CONTAINER: 'a-last-page-container',
  A_ZOOM_CONTAINER: 'a-zoom-container',
  A_ROTATE_CONTAINER: 'a-rotate-container',
  A_PRINT_CONTAINER: 'a-print-container',
  A_DOWNLOAD_CONTAINER: 'a-download-container',
  A_SEARCH_CONTAINER: 'a-search-container',
  A_PAGE_NUMBER_CONTAINER: 'a-page-number-container',
  A_PAGE_INPUT_CONTAINER: 'a-page-input-container',
  A_CURRENT_PAGE_NUMBER_INPUT_FIELD: 'a-current-page-number-input-field',
  A_SIDEBAR_CONTAINER: 'a-sidebar-container',
  A_INNER_SIDEBAR_CONTAINER_CONTENT: 'a-inner-sidebar-container-content',
  A_ANNOTATON_TOOLBAR_CONTAINER: 'a-annotation-toolbar-container',
  A_ANNOTATION_SHAPE_BUTTON: 'a-annotation-shape-button',
  A_ANNOTATION_SHAPE_ARROWDOWN: 'a-annotation-shape-arrowdown',
  A_ANNOTATION_SHAPE_DROPDOWN: 'a-annotation-shape-dropdown',
  A_ANNOTATION_SHAPE_PROPERTIES_CONTAINER: 'a-annotation-shape-properties-container',
  A_ANNOTATION_SHAPE_PROPERTIES: 'a-annotation-shape-properties',
  A_ANNOTATION_SHAPE_PROPERTIES_THICKNESS: 'a-annotation-shape-properties-thickness',
  A_ANNOTATION_SHAPE_PROPERTIES_COLOR: 'a-annotation-shape-properties-color',
  A_ANNOTATION_SHAPE_PROPERTIES_FILL: 'a-annotation-shape-properties-fill',
  A_ANNOTATION_SHAPE_PROPERTIES_OPACITY: 'a-annotation-shape-properties-opacity',
  A_ANNOTATION_SHAPE_PROPERTIES_BORDER: 'a-annotation-shape-properties-border',
  A_ANNOTATION_DROPDOWN_SLIDER_CONTAINER: 'a-annotation-dropdown-slider-container',
  A_ANNOTATION_BORDER_DROPDOWN: 'a-annotation-border-dropdown',
  A_ANNOTATION_BORDER_DROPDOWN_OPTION: 'a-annotation-border-dropdown-option',
  A_ANNOTATION_COLOR_PICKER: 'a-annotation-color-picker',
  A_ANNOTATION_COLOR_PICKER_OPTION: 'a-annotation-color-picker-option',
  A_ANNOTATION_COLOR_PICKER_OPTION_SELECTED: 'a-annotation-color-picker-option-selected',
};
