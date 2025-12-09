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

import { BasePropertyPlugin, BasePropertyPluginConfig } from './base-property.plugin';
import { AnnotationContext } from './annotation-toolbar.plugin';
import { ColorPicker } from '../../components/color-picker.component';

/**
 * Configuration for color property plugin
 */
export interface ColorPropertyPluginConfig extends BasePropertyPluginConfig {
  /** Whether to include a transparent option (default: false) */
  includeTransparent?: boolean;
}

/**
 * Plugin for stroke color control
 */
export class ColorPropertyPlugin extends BasePropertyPlugin {
  private colorPicker?: ColorPicker;
  private colorConfig: ColorPropertyPluginConfig;

  constructor(config: ColorPropertyPluginConfig = {}) {
    super('color-property', config);
    this.colorConfig = config;
  }

  protected renderPropertyControl(container: HTMLElement, context: AnnotationContext): void {
    const label = this.config.label || 'Color';
    const includeTransparent = this.colorConfig.includeTransparent ?? false;

    this.colorPicker = new ColorPicker({
      label,
      initialColor: context.stateManager.state.drawConfig.strokeColor,
      onColorSelect: (color) => {
        context.stateManager.updateDrawConfig({ strokeColor: color });
      },
      includeTransparent,
      containerId: context.containerId,
    });

    container.appendChild(this.colorPicker.getElement());
  }

  protected onDrawConfigChange(drawConfig: any): void {
    // Update color picker if stroke color changes from external source
    if (this.colorPicker && drawConfig.strokeColor) {
      // ColorPicker component handles its own updates via state subscription
    }
  }

  protected onDestroy(): void {
    // Clean up color picker and remove dropdown from DOM
    if (this.colorPicker) {
      this.colorPicker.destroy();
      this.colorPicker = undefined;
    }
    super.onDestroy();
  }
}
