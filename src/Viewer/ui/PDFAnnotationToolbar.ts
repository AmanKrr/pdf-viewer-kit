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

import { PDF_VIEWER_CLASSNAMES, PDF_VIEWER_IDS } from '../../constants/pdf-viewer-selectors';
import { IAnnotation } from '../../interface/IAnnotation';
import { ShapeType } from '../../types/geometry';
import { ToolbarButtonConfig } from '../../types/toolbar.types';
import PdfState from './PDFState';
import WebViewer from './WebViewer';

/**
 * A toolbar for creating and configuring annotations using only DOM APIs.
 * No frameworks required.
 */
export class AnnotationToolbar {
  private _color = 'red';
  private _fillColor = 'transparent';
  private _opacity = 1;
  private _thickness = 2;
  private _borderStyle = 'Solid';

  private _toolbarContainer!: HTMLDivElement;
  private _toolbarPropertiesContainer!: HTMLDivElement;
  private _shapeDropdown!: HTMLDivElement;

  private _shapeOptions = {
    rectangle: 'Rectangle',
    circle: 'Ellipse',
    pen_size_1: 'Line',
  };
  private _selectedShape: ShapeType | 'none' = 'none';
  private _selectedShapeIcon = 'none';

  private _isShapeDropdownOpen = false;
  private _isToolbarPropertiesContainerOpen = false;

  private _pdfState: PdfState;
  private _viewer: WebViewer;

  private _onAnnotationCreated = this._handleAnnotationCreated.bind(this);

  private _activeAnnotation: IAnnotation | null = null;

  /**
   * @param viewer    The WebViewer instance containing PDF pages.
   * @param pdfState  Shared PDF state for events and configuration.
   */
  constructor(viewer: WebViewer, pdfState: PdfState) {
    this._viewer = viewer;
    this._pdfState = pdfState;
    this._pdfState.on('ANNOTATION_CREATED', this._onAnnotationCreated);
  }

  /**
   * Callback when an annotation is finished; resets toolbar state.
   */
  private _handleAnnotationCreated(e: any): void {
    this._removeToolbarPropertiesContainer();
    if (this._shapeDropdown) this._shapeDropdown.style.display = 'none';
    this._isShapeDropdownOpen = false;
    const activeBtn = this._toolbarContainer?.querySelector(`.${PDF_VIEWER_CLASSNAMES.A_ANNOTATION_SHAPE_BUTTON}.active`);
    activeBtn?.classList.remove('active');
    this.toogleAnnotationDrawing();
  }

  /**
   * Enable or disable annotation drawing cursors and listeners.
   */
  public toogleAnnotationDrawing(): void {
    for (const page of this._viewer.visiblePageNumbers) {
      const selector = `#${this._pdfState.containerId} #pageContainer-${page} #${PDF_VIEWER_IDS.ANNOTATION_DRAWING_LAYER}`;
      const container = document.querySelector<HTMLElement>(selector);
      if (!container) continue;
      if (this._isToolbarPropertiesContainerOpen) {
        this._initAnnotationListners(true, page);
        container.style.cursor = 'crosshair';
        container.style.pointerEvents = 'all';
      } else {
        this._initAnnotationListners(false, page);
        container.style.removeProperty('cursor');
        container.style.removeProperty('pointer-events');
      }
    }
  }

  /**
   * Registers or unregisters mouse-down listener for new annotations.
   */
  private _initAnnotationListners(enable: boolean, pageNumber: number): void {
    if (this._selectedShape === 'none') return;
    const manager = this._viewer.annotation.isAnnotationManagerRegistered(pageNumber);
    if (!manager) return;
    if (enable) {
      manager._initAnnotation();
    } else {
      manager._initAnnotationCleanup();
    }
  }

  /** Apply current toolbar settings to all visible page annotation managers. */
  private updateDrawConfig(): void {
    for (const page of this._viewer.visiblePageNumbers) {
      const manager = this._viewer.annotation.isAnnotationManagerRegistered(page);
      if (!manager) continue;
      manager.drawConfig = {
        strokeStyle: this._borderStyle,
        strokeColor: this._color,
        fillColor: this._fillColor,
        opacity: this._opacity,
        strokeWidth: this._thickness,
        type: this._selectedShape.toLowerCase() as ShapeType,
      };
    }
  }

  /**
   * Construct and attach the annotation toolbar UI.
   */
  public render(): void {
    this._toolbarContainer = document.createElement('div');
    this._toolbarContainer.classList.add(PDF_VIEWER_CLASSNAMES.A_ANNOTATON_TOOLBAR_CONTAINER, PDF_VIEWER_CLASSNAMES.A_TOOLBAR_ITEMS);

    this._createGoBackButton();

    const rightContainer = document.createElement('div');
    rightContainer.classList.add('a-annotation-toolbar-right-container');
    rightContainer.style.display = 'flex';
    rightContainer.style.alignItems = 'center';
    this._toolbarContainer.appendChild(rightContainer);

    const shapeSelectContainer = document.createElement('div');
    shapeSelectContainer.style.position = 'relative';
    rightContainer.appendChild(shapeSelectContainer);

    const shapeButtonContainer = document.createElement('div');
    shapeButtonContainer.classList.add(PDF_VIEWER_CLASSNAMES.A_ANNOTATION_SHAPE_BUTTON);
    shapeSelectContainer.appendChild(shapeButtonContainer);

    const shapeMainButton = this.createToolbarButton({
      id: 'annotationShape',
      iconClass: 'annotation-shape-icon material-symbols-outlined',
      tooltip: 'Shape',
      onClick: () => {},
    });
    shapeMainButton.onclick = () => {
      if (this._selectedShape === 'none') return;
      this._isToolbarPropertiesContainerOpen = !this._isToolbarPropertiesContainerOpen;
      this._pdfState.isAnnotationConfigurationPropertiesEnabled = this._isToolbarPropertiesContainerOpen;
      shapeMainButton.parentElement?.classList.toggle('active');
      if (this._isToolbarPropertiesContainerOpen) {
        this._createToolbarPropertiesContainer();
        this._injectToolbarContainers(true, true);
        this._toolbarPropertiesContainer.style.removeProperty('display');
      } else {
        this._removeToolbarPropertiesContainer();
        this._shapeDropdown.style.display = 'none';
        this._isShapeDropdownOpen = false;
      }
      this.toogleAnnotationDrawing();
      this.updateDrawConfig();
    };
    if (this._selectedShape !== 'none') {
      (shapeMainButton.firstChild as HTMLSpanElement).textContent = this._selectedShapeIcon;
    }

    const shapeArrowButton = document.createElement('button');
    shapeArrowButton.classList.add(PDF_VIEWER_CLASSNAMES.A_ANNOTATION_SHAPE_ARROWDOWN);
    shapeArrowButton.innerHTML = `<span class="material-symbols-outlined">arrow_drop_down</span>`;
    shapeArrowButton.onclick = () => this._toggleShapeDropdown(shapeArrowButton);

    shapeButtonContainer.append(shapeMainButton, shapeArrowButton);

    this._shapeDropdown = document.createElement('div');
    this._shapeDropdown.classList.add(PDF_VIEWER_CLASSNAMES.A_ANNOTATION_SHAPE_DROPDOWN);

    for (const [shape, name] of Object.entries(this._shapeOptions)) {
      const item = document.createElement('div');
      item.style.padding = '5px';
      item.style.cursor = 'pointer';
      item.onclick = () => {
        this._isToolbarPropertiesContainerOpen = true;
        this._pdfState.isAnnotationConfigurationPropertiesEnabled = true;
        shapeMainButton.parentElement?.classList.add('active');
        if (!this._toolbarPropertiesContainer) {
          this._createToolbarPropertiesContainer();
          this._injectToolbarContainers(true, true);
          (this._toolbarPropertiesContainer as HTMLElement).style.removeProperty('display');
        }
        this._selectShape(shape, name as ShapeType);
        (shapeMainButton.firstChild as HTMLSpanElement).textContent = shape;
        this.toogleAnnotationDrawing();
      };
      item.innerHTML = `<span class="material-symbols-outlined">${shape}</span><span>${name}</span>`;
      this._shapeDropdown.appendChild(item);
    }

    this._createToolbarPropertiesContainer();
    this._injectToolbarContainers(true, true);
  }

  /**
   * Insert toolbar elements into the PDF viewer DOM.
   */
  private _injectToolbarContainers(insertToolbar: boolean, insertProps: boolean): void {
    const viewWrapper = document.querySelector<HTMLElement>(`#${this._pdfState.containerId} .${PDF_VIEWER_CLASSNAMES.A_PDF_VIEWER} .${PDF_VIEWER_CLASSNAMES.A_VIEWER_WRAPPER}`);
    const pdfContainer = viewWrapper?.parentElement;
    if (!viewWrapper || !pdfContainer) return;
    if (insertToolbar) pdfContainer.insertBefore(this._toolbarContainer, viewWrapper);
    if (insertProps) pdfContainer.insertBefore(this._toolbarPropertiesContainer, viewWrapper);
  }

  /** Remove the main toolbar from the DOM. */
  private _removeToolbarContainer(): void {
    this._toolbarContainer?.remove();
    // @ts-ignore
    this._toolbarContainer = undefined;
  }

  /** Remove the properties panel from the DOM. */
  private _removeToolbarPropertiesContainer(): void {
    this._toolbarPropertiesContainer?.remove();
    // @ts-ignore
    this._toolbarPropertiesContainer = undefined;
    this._isToolbarPropertiesContainerOpen = false;
    this._pdfState.isAnnotationConfigurationPropertiesEnabled = false;
  }

  /** Remove the shape dropdown from the DOM. */
  private _removeShapeDropdown(): void {
    this._shapeDropdown?.remove();
    // @ts-ignore
    this._shapeDropdown = undefined;
    this._isShapeDropdownOpen = false;
  }

  /** Create the Back button for the toolbar. */
  private _createGoBackButton(): void {
    const backButton = this.createToolbarButton({
      id: 'annotationToolbarBackButton',
      iconClass: 'a-annotation-toolbar-back-icon',
      tooltip: 'Back',
      onClick: () => this.handleBackClick(),
    });
    const wrapper = this.parentWrapper({});
    wrapper.appendChild(backButton);
    this._toolbarContainer.appendChild(wrapper);
  }

  /**
   * Wrap a toolbar button in a consistent container for layout & tooltip.
   */
  public parentWrapper(config: any): HTMLElement {
    const wrapper = document.createElement('div');
    wrapper.setAttribute('class', `${PDF_VIEWER_CLASSNAMES.A_TOOLBAR_ITEM} ${PDF_VIEWER_CLASSNAMES.A_TOOLBAR_TOOLTIP}`.trim());
    return wrapper;
  }

  /**
   * Create the properties panel (color, fill, opacity, thickness, border).
   */
  private _createToolbarPropertiesContainer(): void {
    this._toolbarPropertiesContainer = document.createElement('div');
    this._toolbarPropertiesContainer.classList.add(PDF_VIEWER_CLASSNAMES.A_ANNOTATION_SHAPE_PROPERTIES_CONTAINER, PDF_VIEWER_CLASSNAMES.A_TOOLBAR_ITEMS);
    this._toolbarPropertiesContainer.style.display = 'none';

    this._toolbarPropertiesContainer.appendChild(
      this._createColorDropdown('Color', this._color, (val) => {
        if (val === 'custom') alert('Open custom color dialog...');
        else {
          this._color = val;
          this.updateDrawConfig();
        }
      }),
    );

    this._toolbarPropertiesContainer.appendChild(
      this._createColorDropdown(
        'Fill',
        this._fillColor,
        (val) => {
          if (val === 'custom') alert('Open custom fill dialog...');
          else {
            this._fillColor = val;
            this.updateDrawConfig();
          }
        },
        true,
      ),
    );

    this._toolbarPropertiesContainer.appendChild(
      this._createDropdownSlider(
        'Opacity',
        0,
        1,
        this._opacity,
        (v) => `${Math.round(v * 100)}%`,
        (v) => {
          this._opacity = v;
          this.updateDrawConfig();
        },
      ),
    );

    this._toolbarPropertiesContainer.appendChild(
      this._createDropdownSlider(
        'Thickness',
        1,
        10,
        this._thickness,
        (v) => `${Math.round(v)} pt`,
        (v) => {
          this._thickness = v;
          this.updateDrawConfig();
        },
      ),
    );

    this._toolbarPropertiesContainer.appendChild(
      this._createBorderDropdown('Border', this._borderStyle, (style) => {
        this._borderStyle = style;
        this.updateDrawConfig();
      }),
    );
  }

  /**
   * Create a color picker dropdown (stroke or fill).
   */
  private _createColorDropdown(labelText: 'Color' | 'Fill', initialColor: string, onColorSelect: (val: string) => void, includeTransparent = false): HTMLDivElement {
    const container = document.createElement('div');
    container.classList.add(PDF_VIEWER_CLASSNAMES.A_ANNOTATION_SHAPE_PROPERTIES);
    container.classList.add(labelText === 'Color' ? PDF_VIEWER_CLASSNAMES.A_ANNOTATION_SHAPE_PROPERTIES_COLOR : PDF_VIEWER_CLASSNAMES.A_ANNOTATION_SHAPE_PROPERTIES_FILL);
    container.style.position = 'relative';
    container.style.display = 'flex';
    container.style.alignItems = 'center';

    const label = document.createElement('label');
    label.innerText = `${labelText}:`;
    container.appendChild(label);

    const button = document.createElement('button');
    button.style.borderRadius = '4px';
    button.style.border = '1px solid #ccc';
    button.style.background = initialColor;
    button.style.cursor = 'pointer';
    button.onclick = () => {
      dropdown.style.display = dropdown.style.display === 'none' ? 'block' : 'none';
    };
    container.appendChild(button);

    const dropdown = document.createElement('div');
    dropdown.classList.add(PDF_VIEWER_CLASSNAMES.A_ANNOTATION_COLOR_PICKER);

    const swatches = ['#FF0000', '#FF9900', '#FFFF00', '#00FF00', '#00FFFF', '#0000FF', '#FF00FF', '#FFFFFF', '#C0C0C0', '#000000'];
    if (includeTransparent) swatches.unshift('transparent');

    const swatchGrid = document.createElement('div');
    swatchGrid.style.display = 'grid';
    swatchGrid.style.gridTemplateColumns = 'repeat(5, 24px)';
    swatchGrid.style.gridGap = '8px';
    dropdown.appendChild(swatchGrid);

    swatches.forEach((hex) => {
      const swatch = document.createElement('div');
      swatch.classList.add(PDF_VIEWER_CLASSNAMES.A_ANNOTATION_COLOR_PICKER_OPTION);
      if (hex === 'transparent') {
        swatch.style.background = `
          linear-gradient(45deg, #bbb 25%, transparent 25%) 0 0 / 8px 8px,
          linear-gradient(45deg, transparent 75%, #bbb 75%) 0 0 / 8px 8px,
          #fff`;
      } else {
        swatch.style.background = hex;
      }
      swatch.onclick = () => {
        button.style.background = hex;
        this._deselectColorPicker();
        swatch.classList.toggle('active');
        dropdown.style.display = 'none';
        onColorSelect(hex);
      };
      swatchGrid.appendChild(swatch);
    });

    const customRow = document.createElement('div');
    customRow.style.display = 'flex';
    customRow.style.alignItems = 'center';
    customRow.style.marginTop = '8px';
    customRow.style.cursor = 'pointer';

    customRow.innerHTML = `<span>Custom Colors</span><span style="font-weight:bold;width:16px;text-align:center;">+</span>`;
    customRow.onclick = () => {
      dropdown.style.display = 'none';
      onColorSelect('custom');
    };
    dropdown.appendChild(customRow);

    document.addEventListener('click', (ev) => {
      if (!container.contains(ev.target as Node)) dropdown.style.display = 'none';
    });

    container.appendChild(dropdown);
    return container;
  }

  /**
   * Create a slider dropdown for numeric values (opacity or thickness).
   */
  private _createDropdownSlider(
    labelText: 'Opacity' | 'Thickness',
    min: number,
    max: number,
    initialValue: number,
    displayValueFn: (v: number) => string,
    onValueChange: (v: number) => void,
  ): HTMLDivElement {
    const container = document.createElement('div');
    container.classList.add(PDF_VIEWER_CLASSNAMES.A_ANNOTATION_SHAPE_PROPERTIES);
    container.classList.add(labelText === 'Opacity' ? PDF_VIEWER_CLASSNAMES.A_ANNOTATION_SHAPE_PROPERTIES_OPACITY : PDF_VIEWER_CLASSNAMES.A_ANNOTATION_SHAPE_PROPERTIES_THICKNESS);
    container.style.position = 'relative';
    container.style.display = 'flex';
    container.style.alignItems = 'center';

    const label = document.createElement('label');
    label.innerText = `${labelText}:`;
    container.appendChild(label);

    const button = document.createElement('button');
    button.style.display = 'flex';
    button.style.alignItems = 'center';
    button.style.cursor = 'pointer';
    button.style.border = '1px solid #ccc';
    button.style.borderRadius = '4px';
    button.style.padding = '4px 8px';
    button.style.backgroundColor = '#2e2e2e';
    button.style.color = '#fff';
    let currentValue = initialValue;
    button.textContent = displayValueFn(currentValue);
    container.appendChild(button);

    const dropdown = document.createElement('div');
    dropdown.classList.add(PDF_VIEWER_CLASSNAMES.A_ANNOTATION_DROPDOWN_SLIDER_CONTAINER);
    dropdown.style.display = 'none';

    const track = document.createElement('div');
    track.style.position = 'relative';
    track.style.height = '4px';
    track.style.background = '#888';
    track.style.borderRadius = '2px';
    track.style.cursor = 'pointer';
    track.style.width = '140px';
    dropdown.appendChild(track);

    const thumb = document.createElement('div');
    thumb.style.position = 'absolute';
    thumb.style.top = '-5px';
    thumb.style.width = '14px';
    thumb.style.height = '14px';
    thumb.style.borderRadius = '50%';
    thumb.style.background = '#2e2e2e';
    thumb.style.cursor = 'grab';
    track.appendChild(thumb);

    const valueLabel = document.createElement('div');
    valueLabel.style.textAlign = 'right';
    valueLabel.textContent = displayValueFn(currentValue);
    dropdown.appendChild(valueLabel);

    function updateThumb(val: number) {
      const w = track.clientWidth;
      const ratio = (val - min) / (max - min);
      thumb.style.left = `${ratio * w - thumb.clientWidth / 2}px`;
    }
    updateThumb(initialValue);

    let dragging = false;
    thumb.onpointerdown = (e) => {
      dragging = true;
      thumb.setPointerCapture(e.pointerId);
      thumb.style.cursor = 'grabbing';
    };
    thumb.onpointermove = (e) => {
      if (!dragging) return;
      const rect = track.getBoundingClientRect();
      let x = e.clientX - rect.left;
      x = Math.max(0, Math.min(rect.width, x));
      currentValue = min + (x / rect.width) * (max - min);
      updateThumb(currentValue);
      button.textContent = displayValueFn(currentValue);
      valueLabel.textContent = displayValueFn(currentValue);
      onValueChange(currentValue);
    };
    thumb.onpointerup = (e) => {
      dragging = false;
      thumb.releasePointerCapture(e.pointerId);
      thumb.style.cursor = 'grab';
    };
    track.onclick = (e) => {
      if (e.target === thumb) return;
      const rect = track.getBoundingClientRect();
      let x = e.clientX - rect.left;
      x = Math.max(0, Math.min(rect.width, x));
      currentValue = min + (x / rect.width) * (max - min);
      updateThumb(currentValue);
      button.textContent = displayValueFn(currentValue);
      onValueChange(currentValue);
    };

    button.onclick = () => {
      dropdown.style.display = dropdown.style.display === 'none' ? '' : 'none';
    };
    document.addEventListener('click', (ev) => {
      if (!container.contains(ev.target as Node)) dropdown.style.display = 'none';
      if (currentValue === initialValue) {
        updateThumb(initialValue);
      }
    });
    container.appendChild(dropdown);
    return container;
  }

  /**
   * Create a dropdown to select border style: Solid, Dashed, or Dotted.
   */
  private _createBorderDropdown(labelText: 'Border', initialStyle: string, onSelect: (style: 'Solid' | 'Dashed' | 'Dotted') => void): HTMLDivElement {
    const styles: Array<'Solid' | 'Dashed' | 'Dotted'> = ['Solid', 'Dashed', 'Dotted'];

    const container = document.createElement('div');
    container.classList.add(PDF_VIEWER_CLASSNAMES.A_ANNOTATION_SHAPE_PROPERTIES, PDF_VIEWER_CLASSNAMES.A_ANNOTATION_SHAPE_PROPERTIES_BORDER);
    container.style.position = 'relative';
    container.style.display = 'flex';
    container.style.alignItems = 'center';

    const label = document.createElement('label');
    label.textContent = `${labelText}:`;
    container.appendChild(label);

    const btn = document.createElement('button');
    btn.style.display = 'flex';
    btn.style.alignItems = 'center';
    btn.style.justifyContent = 'center';
    btn.style.border = '1px solid #ccc';
    btn.style.borderRadius = '4px';
    btn.style.cursor = 'pointer';
    btn.style.background = '#2e2e2e';
    btn.style.color = '#fff';
    btn.style.padding = '4px 8px';
    btn.style.minWidth = '65px';
    btn.textContent = initialStyle;
    container.appendChild(btn);

    const dropdown = document.createElement('div');
    dropdown.classList.add(PDF_VIEWER_CLASSNAMES.A_ANNOTATION_BORDER_DROPDOWN);
    dropdown.style.display = 'none';
    container.appendChild(dropdown);

    styles.forEach((style) => {
      const row = document.createElement('div');
      row.classList.add(PDF_VIEWER_CLASSNAMES.A_ANNOTATION_BORDER_DROPDOWN_OPTION);
      row.innerHTML = `<div style="flex:1;height:0;border-top:2px ${style === 'Solid' ? 'solid' : style === 'Dashed' ? 'dashed' : 'dotted'} #2e2e2e"></div>`;
      row.onclick = () => {
        btn.textContent = style;
        dropdown.style.display = 'none';
        onSelect(style);
      };
      dropdown.appendChild(row);
    });

    btn.onclick = () => {
      dropdown.style.display = dropdown.style.display === 'none' ? '' : 'none';
    };
    document.addEventListener('click', (ev) => {
      if (!container.contains(ev.target as Node)) dropdown.style.display = 'none';
    });
    return container;
  }

  /**
   * Set the selected shape and update toolbar accordingly.
   */
  private _selectShape(icon: string, shape: ShapeType): void {
    this._selectedShapeIcon = icon;
    this._selectedShape = shape;
    this._isShapeDropdownOpen = false;
    this._shapeDropdown.style.display = 'none';
    this.updateDrawConfig();

    const propsPanel = this._toolbarContainer.nextElementSibling as HTMLDivElement;
    if (propsPanel) {
      propsPanel.style.display = shape ? 'flex' : 'none';
    }
  }

  /**
   * Toggle the visibility of the shape dropdown menu.
   */
  private _toggleShapeDropdown(button: HTMLButtonElement): void {
    if (!this._isShapeDropdownOpen) {
      if (this._shapeDropdown.style.display === 'none') {
        this._shapeDropdown.style.display = 'block';
        return;
      }
      const viewWrapper = document.querySelector<HTMLElement>(`#${this._pdfState.containerId} .${PDF_VIEWER_CLASSNAMES.A_PDF_VIEWER} .${PDF_VIEWER_CLASSNAMES.A_VIEWER_WRAPPER}`);
      const pdfContainer = viewWrapper?.parentElement;
      if (viewWrapper && pdfContainer) {
        this._isShapeDropdownOpen = true;
        pdfContainer.insertBefore(this._shapeDropdown, viewWrapper);
      }
    } else {
      this._isShapeDropdownOpen = false;
      this._shapeDropdown.style.display = 'none';
    }
  }

  /** Handle Back button click: destroy toolbar and reset state. */
  private handleBackClick(): void {
    this.destroy();
  }

  /** Remove active selection styles from color pickers. */
  private _deselectColorPicker(): void {
    const picker = this._toolbarPropertiesContainer.querySelector(`.${PDF_VIEWER_CLASSNAMES.A_ANNOTATION_COLOR_PICKER}`);
    picker?.querySelectorAll(`.${PDF_VIEWER_CLASSNAMES.A_ANNOTATION_COLOR_PICKER_OPTION}`).forEach((opt) => opt.classList.remove('active'));
  }

  /**
   * Create a generic toolbar button element.
   */
  public createToolbarButton(config: ToolbarButtonConfig): HTMLElement {
    const button = document.createElement('button');
    button.classList.add('a-toolbar-button');
    const icon = document.createElement('span');
    icon.className = `a-toolbar-icon ${config.iconClass}`;
    button.appendChild(icon);
    button.addEventListener('click', () => config.onClick?.(null));
    return button;
  }

  /** Cleanup toolbar and event handlers. */
  public destroy(): void {
    this._pdfState.off('ANNOTATION_CREATED', this._onAnnotationCreated);
    this._pdfState.isAnnotationEnabled = false;
    const btn = document.querySelector<HTMLElement>(`#${this._pdfState.containerId} .${PDF_VIEWER_CLASSNAMES.A_TOOLBAR_BUTTON} .annotation-icon`)?.parentElement;
    btn?.classList.remove('active');
    this._removeToolbarContainer();
    this._removeToolbarPropertiesContainer();
    this._removeShapeDropdown();
    this.toogleAnnotationDrawing();
    this._pdfState.isAnnotationEnabled = false;
  }
}
