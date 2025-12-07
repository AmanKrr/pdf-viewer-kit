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

// Core interfaces
export type { IPDFViewerInstance, IPDFViewerEvents, IPDFViewerAnnotations, IPDFViewerSearch, IPDFViewerToolbar } from './interfaces';

// Annotation system
export type { IAnnotation, IAnnotationConfig, IAnnotationPosition, IAnnotationStyle } from './interfaces';

// Shape configurations
export type { IShapeConfig, IRectangleConfig, IEllipseConfig, ILineConfig } from './interfaces';

// Coordinate system
export type { ICoordinateConverter, ICoordinateValidation } from './interfaces';

// Search system
export type { ISearchResult } from './interfaces';

// Event system
export type { PublicEvents, EventListener } from './interfaces';

// Facade implementation
export { PDFViewerInstanceFacade } from './facade';

// Toolbar Plugin System
export type { ToolbarPlugin, ToolbarPluginContext } from '../internal';
export { ToolbarPluginPriority, BaseToolbarPlugin, ToolbarPluginManager } from '../internal';
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
} from '../internal';
export { PageNumberPlugin } from '../internal';

// Annotation Toolbar Plugin System
export type { AnnotationToolbarPlugin, AnnotationContext } from '../internal';
export { BaseAnnotationToolbarPlugin, AnnotationToolbarPluginManager } from '../internal';
