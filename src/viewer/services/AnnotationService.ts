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

import { EllipseConfig, LineConfig, RectangleConfig, ShapeConfig } from '../../types/geometry.types';
import WebViewer from '../ui/WebViewer';
import { AnnotationManager } from '../manager/AnnotationManager';
import { ShapeAnno } from './AnnotationExportService';
import { toShapeAnnos } from '../../utils/annotation-utils';
import { PDF_VIEWER_CLASSNAMES } from '../../constants/pdf-viewer-selectors';

/**
 * Service to manage annotations across pages.
 * Listens for creation/deletion events and keeps per-page annotations synchronized.
 */
export class AnnotationService {
  private _annotations: Map<number, ShapeConfig[]> = new Map();
  private _annotationManagers: Map<number, AnnotationManager> = new Map();
  private _goTo: (pageNumber: number) => void;
  private _webViewer: WebViewer;
  private _onCreated = (annotationData: ShapeConfig) => this._updateAnnotationMap(annotationData);
  private _onDeleted = (id: string) => this._deleteAnnotation(id);

  /**
   * @param pdfState  Shared PDF state, emits ANNOTATION_CREATED/DELETED events.
   * @param pdfViewer WebViewer for navigation (goToPage).
   */
  constructor(webViewer: WebViewer) {
    this._webViewer = webViewer;
    this._goTo = this._webViewer.goToPage.bind(webViewer);

    this.events.on('ANNOTATION_CREATED', this._onCreated);
    this.events.on('ANNOTATION_DELETED', this._onDeleted);
  }

  get instance() {
    return this._webViewer;
  }

  get instanceId(): string {
    return this._webViewer.instanceId;
  }

  get containerId(): string {
    return this._webViewer.containerId;
  }

  get state() {
    return this._webViewer.state;
  }

  get pdfDocument() {
    return this._webViewer.pdfDocument!;
  }

  get events() {
    return this._webViewer.events;
  }

  /**
   * Checks if an AnnotationManager is registered for the given page.
   *
   * @param page  Page number to check.
   * @returns The AnnotationManager instance or undefined.
   */
  public isAnnotationManagerRegistered(page: number): AnnotationManager | undefined {
    return this._annotationManagers.get(page);
  }

  /**
   * Registers an AnnotationManager for a page.
   * Renders any existing annotations for that page immediately.
   *
   * @param page     Page number.
   * @param manager  AnnotationManager instance.
   */
  public registerAnnotationManager(page: number, manager: AnnotationManager): void {
    this._annotationManagers.set(page, manager);

    // Use annotation state manager for UI-related annotation state
    const annotationState = this._webViewer.annotationState;
    if (annotationState?.state.isAnnotationEnabled) {
      manager._initAnnotation();
    }

    const pageAnnotations = this._annotations.get(page);
    if (pageAnnotations) {
      for (const annotation of pageAnnotations) {
        manager.addAnnotation(annotation);
      }
    }
  }

  /**
   * Unregisters the AnnotationManager for a page and cleans up.
   *
   * @param page  Page number.
   */
  public unregisterAnnotationManager(page: number): void {
    const manager = this._annotationManagers.get(page);
    manager?.destroy();
    this._annotationManagers.delete(page);

    // Use annotation state manager for UI-related annotation state
    const annotationState = this._webViewer.annotationState;
    if (annotationState?.state.isAnnotationEnabled) {
      manager?._initAnnotationCleanup();
    }
  }

  /**
   * Waits until the page container element for the given page number appears in the DOM.
   *
   * @param page - 1-based page number whose container to wait for.
   * @param timeoutMs - Maximum time in milliseconds to wait (default: 5000).
   * @returns Promise that resolves with the HTMLElement once found.
   * @throws Error if the element does not appear within the specified timeout.
   */
  private _waitForPageContainer(page: number, timeoutMs = 5000): Promise<HTMLElement> {
    return new Promise((resolve, reject) => {
      const id = `#pageContainer-${this.instanceId}-${page}[data-page-number="${page}"]`;
      const start = performance.now();

      const check = () => {
        const elapsed = performance.now() - start;
        if (elapsed > timeoutMs) {
          return reject(new Error(`Timed out after ${timeoutMs}ms waiting for pageContainer-${page}`));
        }
        const el = document.getElementById(id);
        if (el) {
          return resolve(el);
        }
        requestAnimationFrame(check);
      };

      check();
    });
  }

  /**
   * Waits until a text-layer element appears within the given container.
   *
   * @param container - The parent HTMLElement under which to look for the text layer.
   * @param timeoutMs - Maximum time in milliseconds to wait (default: 5000).
   * @returns Promise that resolves with the text-layer HTMLElement once found.
   * @throws Error if the text layer does not appear within the specified timeout.
   */
  private _waitForTextLayer(container: HTMLElement, timeoutMs = 5000): Promise<HTMLElement> {
    return new Promise((resolve, reject) => {
      const start = performance.now();
      const className = PDF_VIEWER_CLASSNAMES.ATEXT_LAYER;

      const existing = container.querySelector<HTMLElement>(`.${className}`);
      if (existing) {
        return resolve(existing);
      }

      const mo = new MutationObserver(() => {
        const found = container.querySelector<HTMLElement>(`.${className}`);
        if (found) {
          mo.disconnect();
          resolve(found);
        } else if (performance.now() - start > timeoutMs) {
          mo.disconnect();
          reject(new Error(`Timed out after ${timeoutMs}ms waiting for text layer`));
        }
      });

      mo.observe(container, { childList: true, subtree: true });
    });
  }

  /**
   * Waits until an SVG element with the given annotation-id attribute
   * appears under the specified container.
   *
   * @param container - The parent HTMLElement under which to look for the SVG.
   * @param annotationId - The annotation-id attribute to match.
   * @param timeoutMs - Maximum time in milliseconds to wait (default: 5000).
   * @returns Promise that resolves with the SVGGraphicsElement once found.
   * @throws Error if the SVG element does not appear within the specified timeout.
   */
  private _waitForAnnotationEl(container: HTMLElement, annotationId: string, timeoutMs = 5000): Promise<SVGGraphicsElement> {
    return new Promise((resolve, reject) => {
      const selector = `svg[annotation-id="${annotationId}"]`;
      const start = performance.now();

      const poll = () => {
        const elapsed = performance.now() - start;
        if (elapsed > timeoutMs) {
          return reject(new Error(`Timed out after ${timeoutMs}ms waiting for annotation "${annotationId}"`));
        }
        const el = container.querySelector<SVGGraphicsElement>(selector);
        if (el) {
          return resolve(el);
        }
        requestAnimationFrame(poll);
      };

      poll();
    });
  }

  /**
   * Retrieves all text runs that intersect the bounding box of a rectangle annotation.
   *
   * @param annotationId - ID of an existing rectangle annotation.
   * @returns Promise that resolves to the concatenated text inside the rectangle,
   *          preserving word order and line breaks.
   * @throws Error if no rectangle with the given ID exists.
   */
  public async getTextInsideRectangle(annotationId: string): Promise<string> {
    // 1. Find the page containing the rectangle annotation
    let pageNumber: number | undefined;
    for (const [page, configs] of this._annotations.entries()) {
      if (configs.some((c) => c.id === annotationId && c.type === 'rectangle')) {
        pageNumber = page;
        break;
      }
    }
    if (pageNumber == null) {
      throw new Error(`No rectangle annotation found with id "${annotationId}"`);
    }

    // 2. Navigate to the page and await necessary DOM elements
    this._goTo(pageNumber);
    const pageContainer = await this._waitForPageContainer(pageNumber);
    const textLayerDiv = await this._waitForTextLayer(pageContainer);
    const svgEl = await this._waitForAnnotationEl(pageContainer, annotationId);

    // 3. Determine bounding box of the rectangle
    const shapeEl = svgEl.querySelector<SVGGraphicsElement>('rect') || svgEl;
    const box = shapeEl.getBoundingClientRect();

    // 4. Collect candidate text runs that intersect the box
    const runs = Array.from(textLayerDiv.querySelectorAll<HTMLElement>('span, div'));
    const candidateRuns = runs.filter((run) => {
      const r = run.getBoundingClientRect();
      return r.right >= box.left && r.left <= box.right && r.bottom >= box.top && r.top <= box.bottom;
    });

    // 5. Split runs into words and keep those whose rect intersects
    const wordRects: { text: string; rect: DOMRect }[] = [];
    for (const run of candidateRuns) {
      const textNode = run.firstChild;
      const fullText = run.textContent ?? '';
      if (!textNode || textNode.nodeType !== Node.TEXT_NODE) continue;

      for (const match of fullText.matchAll(/\S+/g)) {
        const word = match[0];
        const start = match.index!;
        const end = start + word.length;

        const range = document.createRange();
        range.setStart(textNode, start);
        range.setEnd(textNode, end);

        for (const r of Array.from(range.getClientRects())) {
          if (r.right >= box.left && r.left <= box.right && r.bottom >= box.top && r.top <= box.bottom) {
            wordRects.push({ text: word, rect: r });
            break;
          }
        }
        range.detach();
      }
    }

    // 6. Sort words by vertical then horizontal position
    wordRects.sort((a, b) => {
      const vDiff = a.rect.top - b.rect.top;
      if (Math.abs(vDiff) > a.rect.height / 2) return vDiff;
      return a.rect.left - b.rect.left;
    });

    // 7. Concatenate words, inserting spaces and line breaks
    let result = '';
    let prevTop: number | null = null;
    for (const { text, rect } of wordRects) {
      if (prevTop !== null) {
        if (Math.abs(rect.top - prevTop) > rect.height / 2) {
          result += '\n';
        } else {
          result += ' ';
        }
      }
      result += text;
      prevTop = rect.top;
    }

    return result;
  }

  /**
   * Creates and saves a new annotation, navigates to its page,
   * and renders it if the page manager is registered.
   *
   * @param annotationInput  Annotation data without 'id'.
   * @returns Generated annotation id.
   */
  public addAnnotation(annotationInput: Omit<ShapeConfig, 'id'>): string {
    const annotation = {
      ...annotationInput,
      id: this._generateUniqueId(),
    } as ShapeConfig;

    const page = annotation.pageNumber;

    const pageAnnotations = this._annotations.get(page) ?? [];
    pageAnnotations.push(annotation);
    this._annotations.set(page, pageAnnotations);

    const manager = this._annotationManagers.get(page);
    if (manager) {
      manager.addAnnotation(annotation);
    }

    return annotation.id;
  }

  /**
   * Return annotation shape configuration.
   *
   * @param annotationId - ID of an existing shape
   */
  public getAnnotationShapeConfig(annotationId: string) {
    for (const annotations of this._annotations.values()) {
      const annotation = annotations.find((anno) => anno.id === annotationId);
      if (annotation) {
        return { ...annotation } as ShapeConfig;
      }
    }
    throw new Error(`Annotation with id "${annotationId}" not found`);
  }

  /**
   * Updates an existing annotation's properties.
   *
   * @param annotationId  ID of the annotation to update.
   * @param updatedData   Partial data to merge into the annotation.
   */
  public updateAnnotation(annotationId: string, updatedData: Partial<ShapeConfig>): void {
    for (const [page, annotations] of this._annotations.entries()) {
      const idx = annotations.findIndex((anno) => anno.id === annotationId);
      if (idx !== -1) {
        annotations[idx] = { ...annotations[idx], ...updatedData } as ShapeConfig;
        const manager = this._annotationManagers.get(page);
        manager?.updateAnnotation(annotations[idx]);
        return;
      }
    }
    throw new Error('Annotation not found');
  }

  /**
   * Deletes an annotation by its ID from storage and view.
   *
   * @param annotationId  ID of the annotation to delete.
   */
  public deleteAnnotation(annotationId: string): void {
    this._deleteAnnotation(annotationId);
  }

  /**
   * Exports all current annotations as ShapeAnno objects,
   * applying current PDF scale.
   *
   * @returns Array of ShapeAnno ready for saving or download.
   */
  public exportShapes(): ShapeAnno[] {
    const configs = this._collectAllConfigs();
    return toShapeAnnos(configs, this.state.scale);
  }

  /**
   * Removes event listeners and destroys all managers.
   */
  public destroy(): void {
    this.events.off('ANNOTATION_CREATED', this._onCreated);
    this.events.off('ANNOTATION_DELETED', this._onDeleted);

    for (const manager of this._annotationManagers.values()) {
      manager.destroy();
    }
    this._annotationManagers.clear();
    this._annotations.clear();
  }

  /**
   * Internal: delete annotation logic for both storage and manager.
   */
  private _deleteAnnotation(annotationId: string): void {
    for (const [page, annotations] of this._annotations.entries()) {
      const idx = annotations.findIndex((anno) => anno.id === annotationId);
      if (idx !== -1) {
        annotations.splice(idx, 1);
        const manager = this._annotationManagers.get(page);
        manager?.deleteAnnotation(annotationId);
        return;
      }
    }
    throw new Error('Annotation not found');
  }

  /**
   * Internal: updates or adds annotation in the map when created externally.
   */
  private _updateAnnotationMap(annotationData: ShapeConfig): void {
    if (annotationData.pageNumber == null) {
      throw new Error('Page number not found!');
    }
    const page = annotationData.pageNumber;
    const pageAnnotations = this._annotations.get(page) || [];
    const idx = pageAnnotations.findIndex((anno) => anno.id === annotationData.id);

    if (idx >= 0) {
      pageAnnotations[idx] = annotationData;
    } else {
      pageAnnotations.push(annotationData);
    }
    this._annotations.set(page, pageAnnotations);
  }

  /**
   * Internal: collect all live ShapeConfig from registered managers.
   */
  private _collectAllConfigs(): Array<RectangleConfig | EllipseConfig | LineConfig> {
    const all: Array<RectangleConfig | EllipseConfig | LineConfig> = [];
    for (const manager of this._annotationManagers.values()) {
      all.push(...manager.getAnnotations.map((anno) => anno.getConfig() as any));
    }
    return all;
  }

  /**
   * Internal: generate a unique identifier for a new annotation.
   */
  private _generateUniqueId(): string {
    return 'anno-' + Math.random().toString(36).substr(2, 9) + '-' + Date.now().toString();
  }
}
