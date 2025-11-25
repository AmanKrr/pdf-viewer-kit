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

import { PDFPageProxy, RenderTask } from 'pdfjs-dist';
import TextLayer from '../../../viewer/ui/text-layer.component';
import AnnotationLayer from '../../../viewer/ui/annotation-layer.component';

export interface CachedPageInfo {
  pageNumber: number;
  pdfPageProxy: PDFPageProxy | null;
  pageWrapperDiv: HTMLDivElement;
  canvasElement?: HTMLCanvasElement;
  renderTask?: RenderTask;
  highResImageBitmap?: ImageBitmap;
  highResRenderTask?: RenderTask;
  textLayer?: TextLayer;
  annotationLayer?: AnnotationLayer;
  isVisible: boolean;
  isFullyRendered: boolean;
  renderFailed: boolean;
  isTransitioningToFullRender: boolean;
  renderedScale?: number;
}

export interface RenderQueueItem {
  pageInfo: CachedPageInfo;
  priority: number;
  timestamp: number;
}
