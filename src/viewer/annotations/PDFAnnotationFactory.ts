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

import PdfState from '../ui/PDFState';
import { IAnnotation } from '../../interface/IAnnotation';
import { ShapeType } from '../../types/geometry.types';
import { RectangleAnnotation } from './RectangleAnnotation';
import { EllipseAnnotation } from './EllipseAnnotation';
import { LineAnnotation } from './LineAnnotation';
import { InstanceEventEmitter } from '../../core/InstanceEventEmitter';
import { InstanceState } from '../../core/InstanceState';

/**
 * Options for creating a new annotation via AnnotationFactory.
 */
export interface CreateAnnotationOptions {
  /** The shape type to create ('rectangle', 'ellipse', or 'line') */
  type: ShapeType;
  /** Container element into which the annotation SVG will be inserted */
  annotationDrawerContainer: HTMLElement;
  /** Shared PdfState instance for scale and event handling */
  instances: {
    events: InstanceEventEmitter;
    state: InstanceState;
    instanceId: string;
    containerId: string;
  };
  /** Fill color for shapes (CSS color string) */
  fillColor: string;
  /** Stroke color for shapes (CSS color string) */
  strokeColor: string;
  /** Stroke width in CSS pixels */
  strokeWidth: number;
  /** Opacity of the annotation (0–1) */
  opacity: number;
  /** Stroke style: 'solid' | 'dashed' | 'dotted' */
  strokeStyle: string;
  /** Optional ID to assign to the annotation */
  id?: string;
}

/**
 * Factory class for creating shape annotations.
 */
export class AnnotationFactory {
  /**
   * Creates an annotation instance based on the specified options.
   *
   * @param options - Configuration for the annotation to create.
   * @returns An IAnnotation instance corresponding to the requested shape.
   * @throws Error if the specified shape type is not supported.
   */
  public static createAnnotation(options: CreateAnnotationOptions): IAnnotation {
    const { type, annotationDrawerContainer, instances, fillColor, strokeColor, strokeWidth, strokeStyle, opacity, id } = options;

    switch (type) {
      case 'rectangle':
        return new RectangleAnnotation(annotationDrawerContainer, instances, fillColor, strokeColor, strokeWidth, strokeStyle, opacity, id);
      case 'ellipse':
        return new EllipseAnnotation(annotationDrawerContainer, instances, fillColor, strokeColor, strokeWidth, strokeStyle, opacity, id);
      case 'line':
        return new LineAnnotation(annotationDrawerContainer, instances, strokeColor, strokeWidth, strokeStyle, opacity, id);
      default:
        throw new Error(`Unsupported shape type: ${type}`);
    }
  }
}
