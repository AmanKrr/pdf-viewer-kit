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
 * Internal API exports for the PDF viewer library.
 *
 * This module contains all internal implementation details, classes,
 * and types that should NOT be used by end users. This is for
 * internal library development only.
 *
 * WARNING: Do not import from this module in user code!
 * Use the public API from the main index.ts instead.
 */

// Core internal classes
export { PDFViewerInstance } from '../core/viewer-core/viewer-instance.core';
export { PDFViewerManager } from '../core/viewer-core/viewer-manager.core';
export { InstanceWebViewer } from '../core/viewer-core/viewer.core';
export { InstanceState } from '../core/viewer-core/viewer-state.core';
export { InstanceEventEmitter } from '../core/event/event-emitter.core';
export { InstanceCanvasPool } from '../core/canvas/canvas-pool.core';

// UI components
export { default as WebViewer } from '../viewer/ui/web-viewer.component';
export { default as PageElement } from '../viewer/ui/page-element.component';
export { default as PageVirtualization } from '../viewer/ui/page-virtualization.component';
export { default as ZoomHandler } from '../viewer/ui/zoom-handler.component';
export { default as SearchBar } from '../viewer/ui/searchbar.component';
export { default as ThumbnailViewer } from '../viewer/ui/thumbnail-viewer.component';
export { ThumbnailManager } from '../viewer/ui/thumbnail-manager.component';
export { Toolbar } from '../viewer/ui/toolbar.component';
export { AnnotationToolbar } from '../viewer/ui/annotation-toolbar.component';
export { AnnotationToolbarStateManager } from '../viewer/ui/annotation-toolbar-state.component';

// Toolbar Plugins
export type { ToolbarPlugin, ToolbarPluginContext } from '../viewer/ui/plugins/toolbar.plugin';
export { ToolbarPluginPriority, BaseToolbarPlugin, ToolbarPluginManager } from '../viewer/ui/plugins/toolbar.plugin';
export {
  ThumbnailButtonPlugin,
  FirstPageButtonPlugin,
  PreviousPageButtonPlugin,
  NextPageButtonPlugin,
  LastPageButtonPlugin,
  ZoomInButtonPlugin,
  ZoomOutButtonPlugin,
  SearchButtonPlugin,
  AnnotationButtonPlugin,
  DownloadButtonPlugin,
} from '../viewer/ui/plugins/toolbar-buttons.plugin';
export { PageNumberPlugin } from '../viewer/ui/plugins/page-number.plugin';
export { ZoomDropdownPlugin } from '../viewer/ui/plugins/zoom-dropdown.plugin';

// Annotation Toolbar Plugins
export type { AnnotationToolbarPlugin, AnnotationContext } from '../viewer/ui/plugins/annotation-toolbar.plugin';
export { BaseAnnotationToolbarPlugin, AnnotationToolbarPluginManager } from '../viewer/ui/plugins/annotation-toolbar.plugin';
export { ShapeSelectionPlugin } from '../viewer/ui/plugins/shape-selection.plugin';

// Individual Property Plugins
export { BasePropertyPlugin, PropertyDropdownManager } from '../viewer/ui/plugins/base-property.plugin';
export { PropertyContainerPlugin } from '../viewer/ui/plugins/property-container.plugin';
export type { PropertyContainerPluginConfig } from '../viewer/ui/plugins/property-container.plugin';
export { ColorPropertyPlugin } from '../viewer/ui/plugins/color-property.plugin';
export { FillPropertyPlugin } from '../viewer/ui/plugins/fill-property.plugin';
export { OpacityPropertyPlugin } from '../viewer/ui/plugins/opacity-property.plugin';
export { ThicknessPropertyPlugin } from '../viewer/ui/plugins/thickness-property.plugin';
export { BorderStylePropertyPlugin } from '../viewer/ui/plugins/border-style-property.plugin';

// Services
export { AnnotationService } from '../viewer/services/annotation.service';
export { PasswordManagerService } from '../viewer/services/password-manager.service';
export { ErrorHandlerService } from '../viewer/services/error-handler.service';
export { PDFLinkService as LinkService } from '../viewer/services/link.service';

// Managers
export { AnnotationManager } from '../viewer/managers/annotation-manager.manager';
export { SelectionManager } from '../viewer/managers/selection.manager';
export { default as SearchHighlighter } from '../viewer/managers/search-highlighter.manager';
export { default as SearchIndexManager } from '../viewer/managers/search-index.manager';
export { default as SearchTrieManager } from '../viewer/managers/search-trie.manager';
export { DownloadManager } from '../viewer/managers/download-manager';

// Annotations
export { Annotation } from '../viewer/annotations/annotation';
export { RectangleAnnotation } from '../viewer/annotations/rectangle-annotation';
export { EllipseAnnotation } from '../viewer/annotations/ellipse-annotation';
export { LineAnnotation } from '../viewer/annotations/line-annotation';
export { AnnotationFactory } from '../viewer/annotations/annotation-factory';
export { Resizer } from '../viewer/annotations/resizer';

// Types
export * from '../types/events.types';
export * from '../types/geometry.types';
export * from '../types/page-virtualization.types';
export * from '../types/thumbnail.types';
export * from '../types/toolbar.types';
export * from '../types/annotation-toolbar.types';
export * from '../types/webpdf.types';

// Utils
export * from '../utils/annotation-utils';
export * from '../utils/debug-utils';
export * from '../utils/logger-utils';
export * from '../utils/web-ui-utils';
export * from '../utils/worker-factory';

// Constants
export * from '../constants/geometry-constants';
export * from '../constants/pdf-viewer-selectors';

// Interfaces
export * from '../interface/IAnnotation';
export * from '../interface/IPDFLinkService';
