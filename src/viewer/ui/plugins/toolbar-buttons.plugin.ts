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

import { BaseToolbarPlugin, ToolbarPluginContext, ToolbarPluginPriority } from './toolbar.plugin';

/**
 * Base class for toolbar button plugins
 */
abstract class ToolbarButtonPlugin extends BaseToolbarPlugin {
  protected createButton(config: {
    id: string;
    iconClass: string;
    tooltip: string;
    onClick: () => void;
  }): HTMLButtonElement {
    const btn = document.createElement('button');
    btn.classList.add('a-toolbar-button', `${config.id}-button`);
    btn.setAttribute('title', config.tooltip);

    const icon = document.createElement('span');
    icon.classList.add('a-toolbar-icon', config.iconClass);
    btn.appendChild(icon);

    btn.addEventListener('click', config.onClick);

    return btn;
  }

  protected onInitialize(_context: ToolbarPluginContext): void {
    // Default implementation - override if needed
  }

  protected onDestroy(): void {
    // Default implementation - override if needed
  }
}

/**
 * Thumbnail toggle button plugin
 */
export class ThumbnailButtonPlugin extends ToolbarButtonPlugin {
  constructor() {
    super('thumbnail', {
      priority: ToolbarPluginPriority.HIGHEST,
    });
  }

  protected onRender(_container: HTMLElement, context: ToolbarPluginContext): HTMLElement {
    return this.createButton({
      id: 'thumbnail',
      iconClass: 'thumbnail-icon',
      tooltip: 'Toggle Thumbnails',
      onClick: () => context.viewer.toogleThumbnailViewer(),
    });
  }
}

/**
 * First page button plugin
 */
export class FirstPageButtonPlugin extends ToolbarButtonPlugin {
  constructor() {
    super('firstPage', {
      priority: ToolbarPluginPriority.HIGH,
      showSeparatorBefore: true,
    });
  }

  protected onRender(_container: HTMLElement, context: ToolbarPluginContext): HTMLElement {
    return this.createButton({
      id: 'firstPage',
      iconClass: 'first-page-icon',
      tooltip: 'First Page',
      onClick: () => context.viewer.firstPage(),
    });
  }
}

/**
 * Previous page button plugin
 */
export class PreviousPageButtonPlugin extends ToolbarButtonPlugin {
  constructor() {
    super('previousPage', {
      priority: ToolbarPluginPriority.HIGH + 1,
    });
  }

  protected onRender(_container: HTMLElement, context: ToolbarPluginContext): HTMLElement {
    return this.createButton({
      id: 'previousPage',
      iconClass: 'previous-page-icon',
      tooltip: 'Previous Page',
      onClick: () => context.viewer.previousPage(),
    });
  }
}

/**
 * Next page button plugin
 */
export class NextPageButtonPlugin extends ToolbarButtonPlugin {
  constructor() {
    super('nextPage', {
      priority: ToolbarPluginPriority.HIGH + 2,
    });
  }

  protected onRender(_container: HTMLElement, context: ToolbarPluginContext): HTMLElement {
    return this.createButton({
      id: 'nextPage',
      iconClass: 'next-page-icon',
      tooltip: 'Next Page',
      onClick: () => context.viewer.nextPage(),
    });
  }
}

/**
 * Last page button plugin
 */
export class LastPageButtonPlugin extends ToolbarButtonPlugin {
  constructor() {
    super('lastPage', {
      priority: ToolbarPluginPriority.HIGH + 3,
    });
  }

  protected onRender(_container: HTMLElement, context: ToolbarPluginContext): HTMLElement {
    return this.createButton({
      id: 'lastPage',
      iconClass: 'last-page-icon',
      tooltip: 'Last Page',
      onClick: () => context.viewer.lastPage(),
    });
  }
}

/**
 * Zoom in button plugin
 */
export class ZoomInButtonPlugin extends ToolbarButtonPlugin {
  constructor() {
    super('zoomIn', {
      priority: ToolbarPluginPriority.NORMAL,
      showSeparatorBefore: true,
    });
  }

  protected onRender(_container: HTMLElement, context: ToolbarPluginContext): HTMLElement {
    return this.createButton({
      id: 'zoomIn',
      iconClass: 'zoom-in-icon',
      tooltip: 'Zoom In',
      onClick: () => context.viewer.zoomIn(),
    });
  }
}

/**
 * Zoom out button plugin
 */
export class ZoomOutButtonPlugin extends ToolbarButtonPlugin {
  constructor() {
    super('zoomOut', {
      priority: ToolbarPluginPriority.NORMAL + 1,
    });
  }

  protected onRender(_container: HTMLElement, context: ToolbarPluginContext): HTMLElement {
    return this.createButton({
      id: 'zoomOut',
      iconClass: 'zoom-out-icon',
      tooltip: 'Zoom Out',
      onClick: () => context.viewer.zoomOut(),
    });
  }
}

/**
 * Search button plugin
 */
export class SearchButtonPlugin extends ToolbarButtonPlugin {
  private _searchBarOpen = false;

  constructor() {
    super('search', {
      priority: ToolbarPluginPriority.LOW,
      alignRight: true,
    });
  }

  protected onRender(_container: HTMLElement, context: ToolbarPluginContext): HTMLElement {
    return this.createButton({
      id: 'search',
      iconClass: 'search-icon',
      tooltip: 'Search',
      onClick: () => {
        // Close annotation toolbar if open
        const annotationState = context.viewer.annotationState;
        if (annotationState?.state.isAnnotationEnabled) {
          annotationState.setState({ isAnnotationEnabled: false });
        }

        context.viewer.search();
        this._searchBarOpen = !this._searchBarOpen;
      },
    });
  }
}

/**
 * Annotation button plugin
 */
export class AnnotationButtonPlugin extends ToolbarButtonPlugin {
  private _annotationToolbar: any; // Reference to annotation toolbar instance

  constructor(annotationToolbar: any) {
    super('annotation', {
      priority: ToolbarPluginPriority.LOW + 1,
    });
    this._annotationToolbar = annotationToolbar;
  }

  protected onRender(_container: HTMLElement, context: ToolbarPluginContext): HTMLElement {
    const btn = this.createButton({
      id: 'annotation',
      iconClass: 'annotation-icon',
      tooltip: 'Annotations',
      onClick: () => {
        const annotationState = context.viewer.annotationState;
        if (annotationState) {
          const newState = !annotationState.state.isAnnotationEnabled;
          annotationState.setState({ isAnnotationEnabled: newState });

          btn.classList.toggle('active');

          if (newState) {
            this._annotationToolbar.render();
          } else {
            this._annotationToolbar.destroy();
          }
        }
      },
    });

    return btn;
  }
}

/**
 * Download button plugin (currently commented out in original)
 */
export class DownloadButtonPlugin extends ToolbarButtonPlugin {
  constructor() {
    super('download', {
      priority: ToolbarPluginPriority.LOW + 2,
    });
  }

  protected onRender(_container: HTMLElement, context: ToolbarPluginContext): HTMLElement {
    return this.createButton({
      id: 'download',
      iconClass: 'download-icon',
      tooltip: 'Download PDF with Annotations',
      onClick: async () => {
        try {
          await context.viewer.downloadPdf();
        } catch (error) {
          console.error('Download failed:', error);
        }
      },
    });
  }
}
