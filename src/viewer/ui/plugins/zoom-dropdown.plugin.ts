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
import { createPopper, Instance as PopperInstance } from '@popperjs/core';

/**
 * Zoom dropdown plugin with percentage options and fit modes
 * Shows current zoom level with dropdown for preset values
 */
export class ZoomDropdownPlugin extends BaseToolbarPlugin {
  private _button?: HTMLButtonElement;
  private _dropdown?: HTMLDivElement;
  private _isOpen = false;
  private _popperInstance?: PopperInstance;

  // Preset zoom levels (in percentage)
  private readonly ZOOM_LEVELS = [25, 50, 100, 125, 150, 200, 400, 800, 1600];

  constructor() {
    super('zoomDropdown', {
      priority: ToolbarPluginPriority.NORMAL - 1, // Before zoom in/out buttons
      showSeparatorBefore: true,
    });
  }

  protected onInitialize(context: ToolbarPluginContext): void {
    // Close dropdown when clicking outside
    document.addEventListener('click', this.handleOutsideClick.bind(this));

    // Listen to scale change events to update button text
    context.viewer.events.on('scaleChange', () => {
      this.onUpdate(context);
    });
  }

  protected onRender(_container: HTMLElement, context: ToolbarPluginContext): HTMLElement {
    const wrapper = document.createElement('div');
    wrapper.className = 'a-zoom-dropdown-wrapper';

    // Create button showing current zoom
    this._button = document.createElement('button');
    this._button.className = 'a-toolbar-button a-zoom-dropdown-button';
    this._button.textContent = this.getCurrentZoomText(context);
    this._button.setAttribute('aria-label', 'Zoom options');
    this._button.onclick = (e) => {
      e.stopPropagation();
      this.toggleDropdown();
    };

    wrapper.appendChild(this._button);

    // Create dropdown and append to shadow DOM (not to wrapper)
    this._dropdown = this.createDropdown(context);

    // Get the .a-pdf-viewer container from shadow DOM for appending dropdowns
    const pdfViewerContainer = document.getElementById(context.containerId)?.shadowRoot?.querySelector<HTMLElement>(`.a-pdf-viewer`);
    if (pdfViewerContainer) {
      pdfViewerContainer.appendChild(this._dropdown);
    } else {
      console.error('PDF viewer container not found for zoom dropdown');
    }

    return wrapper;
  }

  protected onUpdate(context: ToolbarPluginContext): void {
    // Update button text with current zoom
    if (this._button) {
      this._button.textContent = this.getCurrentZoomText(context);
    }

    // Update active state in dropdown
    if (this._dropdown) {
      const currentZoom = Math.round(context.viewer.state.scale * 100);
      const options = this._dropdown.querySelectorAll('.a-zoom-option');
      options.forEach((option) => {
        const zoomValue = option.getAttribute('data-zoom');
        if (zoomValue && parseInt(zoomValue) === currentZoom) {
          option.classList.add('active');
        } else {
          option.classList.remove('active');
        }
      });
    }
  }

  protected onDestroy(): void {
    document.removeEventListener('click', this.handleOutsideClick.bind(this));

    // Destroy Popper instance
    if (this._popperInstance) {
      this._popperInstance.destroy();
      this._popperInstance = undefined;
    }

    // Remove dropdown from DOM
    if (this._dropdown && this._dropdown.parentElement) {
      this._dropdown.parentElement.removeChild(this._dropdown);
    }

    this._button = undefined;
    this._dropdown = undefined;
  }

  private createDropdown(context: ToolbarPluginContext): HTMLDivElement {
    const dropdown = document.createElement('div');
    dropdown.className = 'a-zoom-dropdown a-zoom-dropdown-hidden';

    const currentZoom = Math.round(context.viewer.state.scale * 100);

    // Add zoom percentage options
    this.ZOOM_LEVELS.forEach((level) => {
      const option = document.createElement('div');
      option.className = 'a-zoom-option';
      option.setAttribute('data-zoom', level.toString());
      option.textContent = `${level}%`;

      if (level === currentZoom) {
        option.classList.add('active');
      }

      option.onclick = async (e) => {
        e.stopPropagation();
        await this.setZoom(context, level / 100);
        this.closeDropdown();
      };

      dropdown.appendChild(option);
    });

    // Add separator
    const separator = document.createElement('div');
    separator.className = 'a-zoom-dropdown-separator';
    dropdown.appendChild(separator);

    // Add fit options
    const fitOptions = [
      {
        icon: 'zoom-in',
        text: 'Zoom in',
        action: () => context.viewer.zoomIn(),
      },
      {
        icon: 'zoom-out',
        text: 'Zoom out',
        action: () => context.viewer.zoomOut(),
      },
      {
        icon: 'fit-width',
        text: 'Fit to width',
        action: () => this.fitToWidth(context),
      },
      {
        icon: 'fit-page',
        text: 'Fit to page',
        action: () => this.fitToPage(context),
      },
    ];

    fitOptions.forEach((opt) => {
      const option = document.createElement('div');
      option.className = 'a-zoom-option a-zoom-fit-option';

      const icon = document.createElement('span');
      icon.className = `a-toolbar-icon ${opt.icon}-icon`;

      const text = document.createElement('span');
      text.textContent = opt.text;

      option.appendChild(icon);
      option.appendChild(text);

      option.onclick = (e) => {
        e.stopPropagation();
        opt.action();
        this.closeDropdown();
      };

      dropdown.appendChild(option);
    });

    return dropdown;
  }

  private getCurrentZoomText(context: ToolbarPluginContext): string {
    const zoomPercent = Math.round(context.viewer.state.scale * 100);
    return `${zoomPercent}%`;
  }

  private async setZoom(context: ToolbarPluginContext, scale: number): Promise<void> {
    // Use the zoom handler's applyZoom method via reflection
    const zoomHandler = (context.viewer as any)._zoomHandler;
    if (zoomHandler && typeof zoomHandler.applyZoom === 'function') {
      await zoomHandler.applyZoom(scale);
    }
  }

  private toggleDropdown(): void {
    if (this._isOpen) {
      this.closeDropdown();
    } else {
      this.openDropdown();
    }
  }

  private openDropdown(): void {
    if (!this._dropdown || !this._button) return;

    // Destroy existing Popper instance if any
    if (this._popperInstance) {
      this._popperInstance.destroy();
      this._popperInstance = undefined;
    }

    // Create new Popper instance
    this._popperInstance = createPopper(this._button, this._dropdown, {
      placement: 'bottom-start',
      modifiers: [
        {
          name: 'offset',
          options: {
            offset: [0, 8], // [x, y] offset
          },
        },
        {
          name: 'preventOverflow',
          options: {
            boundary: 'viewport',
            padding: 8,
          },
        },
        {
          name: 'flip',
          options: {
            fallbackPlacements: ['top-start', 'bottom-end', 'top-end'],
          },
        },
      ],
    });

    // Show dropdown
    this._dropdown.style.display = 'block';
    this._dropdown.classList.remove('a-zoom-dropdown-hidden');
    this._isOpen = true;

    // Update Popper position after showing
    if (this._popperInstance) {
      this._popperInstance.update();
    }
  }

  private closeDropdown(): void {
    if (!this._dropdown) return;

    // Hide dropdown
    this._dropdown.style.display = 'none';
    this._dropdown.classList.add('a-zoom-dropdown-hidden');
    this._isOpen = false;

    // Destroy Popper instance
    if (this._popperInstance) {
      this._popperInstance.destroy();
      this._popperInstance = undefined;
    }
  }

  private handleOutsideClick(event: MouseEvent): void {
    if (this._isOpen && this._dropdown && !this._dropdown.contains(event.target as Node) && event.target !== this._button) {
      this.closeDropdown();
    }
  }

  private async fitToWidth(context: ToolbarPluginContext): Promise<void> {
    try {
      // Get the PDF viewer container
      const container = document
        .getElementById(context.containerId)
        ?.shadowRoot?.querySelector<HTMLElement>(`.a-pdf-viewer`);

      if (!container) {
        console.error('PDF viewer container not found');
        return;
      }

      // Get container width
      const containerWidth = container.getBoundingClientRect().width;
      const PADDING = 20; // Horizontal padding

      // Get the current page to determine width
      const currentPageNum = context.viewer.state.currentPage;
      const pdfDocument = context.viewer.pdfDocument;

      if (!pdfDocument) {
        console.error('PDF document not loaded');
        return;
      }

      // Get page at scale 1.0 to determine original width
      const page = await pdfDocument.getPage(currentPageNum);
      const viewport = page.getViewport({ scale: 1.0 });
      const pageWidth = viewport.width;

      // Calculate target scale to fit width
      const targetScale = (containerWidth - PADDING) / pageWidth;

      // Apply the zoom
      await this.setZoom(context, targetScale);
    } catch (error) {
      console.error('Error in fitToWidth:', error);
    }
  }

  private async fitToPage(context: ToolbarPluginContext): Promise<void> {
    try {
      // Get the PDF viewer container
      const container = document
        .getElementById(context.containerId)
        ?.shadowRoot?.querySelector<HTMLElement>(`.a-pdf-viewer`);

      if (!container) {
        console.error('PDF viewer container not found');
        return;
      }

      // Get container dimensions
      const containerRect = container.getBoundingClientRect();
      const containerWidth = containerRect.width;
      const containerHeight = containerRect.height;

      const PADDING = 40; // Total padding (horizontal and vertical)
      const TOOLBAR_HEIGHT = 50; // Approximate toolbar height

      // Get the current page to determine dimensions
      const currentPageNum = context.viewer.state.currentPage;
      const pdfDocument = context.viewer.pdfDocument;

      if (!pdfDocument) {
        console.error('PDF document not loaded');
        return;
      }

      // Get page at scale 1.0 to determine original dimensions
      const page = await pdfDocument.getPage(currentPageNum);
      const viewport = page.getViewport({ scale: 1.0 });
      const pageWidth = viewport.width;
      const pageHeight = viewport.height;

      // Calculate scales for both width and height
      const scaleWidth = (containerWidth - PADDING) / pageWidth;
      const scaleHeight = (containerHeight - TOOLBAR_HEIGHT - PADDING) / pageHeight;

      // Use the smaller scale to ensure the entire page fits
      const targetScale = Math.min(scaleWidth, scaleHeight);

      // Apply the zoom
      await this.setZoom(context, targetScale);
    } catch (error) {
      console.error('Error in fitToPage:', error);
    }
  }
}
