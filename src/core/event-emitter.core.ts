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
 * Event types specific to a PDF viewer instance
 */
export type InstanceEventType =
  | 'pdfLoaded'
  | 'pdfLoadError'
  | 'instanceDestroyed'
  | 'scaleChange'
  | 'pageChange'
  | 'loadingChange'
  | 'pdfInstanceChange'
  | 'annotationModeChange'
  | 'annotationPropertiesChange'
  | 'rotationChange'
  | 'passwordRequired'
  | 'loadProgress'
  | 'ANNOTATION_SELECTED'
  | 'ANNOTATION_CREATED'
  | 'ANNOTATION_DELETED'
  | 'ANNOTATION_UPDATED'
  | 'DRAWING_STARTED'
  | 'DRAWING_FINISHED'
  | 'interactiveModeChanged';

/**
 * Event emitter that is completely isolated to a single PDF instance.
 * Events from one instance cannot affect other instances.
 */
export class InstanceEventEmitter {
  private readonly _instanceId: string;
  private readonly _events: Map<InstanceEventType, Array<(...args: any[]) => void>> = new Map();
  private _isDestroyed = false;

  constructor(instanceId: string) {
    this._instanceId = instanceId;
  }

  /**
   * Gets the instance ID this emitter belongs to
   */
  get instanceId(): string {
    return this._instanceId;
  }

  /**
   * Registers an event listener for this instance only
   */
  on(event: InstanceEventType, listener: (...args: any[]) => void): void {
    if (this._isDestroyed) {
      console.warn(`Cannot add listener to destroyed event emitter for instance ${this._instanceId}`);
      return;
    }

    if (!this._events.has(event)) {
      this._events.set(event, []);
    }

    this._events.get(event)!.push(listener);
  }

  /**
   * Emits an event to listeners registered on this instance only
   */
  emit(event: InstanceEventType, ...args: any[]): void {
    if (this._isDestroyed) {
      return;
    }

    const listeners = this._events.get(event);
    if (listeners) {
      // Add instance ID to all event data for debugging
      const eventData = {
        instanceId: this._instanceId,
        timestamp: Date.now(),
        ...args[0],
      };

      listeners.forEach((listener) => {
        try {
          listener(eventData);
        } catch (error) {
          console.error(`Error in event listener for ${event} in instance ${this._instanceId}:`, error);
        }
      });
    }
  }

  /**
   * Removes a specific event listener
   */
  off(event: InstanceEventType, listener: (...args: any[]) => void): void {
    if (this._isDestroyed) {
      return;
    }

    const listeners = this._events.get(event);
    if (listeners) {
      const index = listeners.indexOf(listener);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  /**
   * Removes all listeners for a specific event
   */
  removeAllListeners(event?: InstanceEventType): void {
    if (this._isDestroyed) {
      return;
    }

    if (event) {
      this._events.delete(event);
    } else {
      this._events.clear();
    }
  }

  /**
   * Gets the number of listeners for a specific event
   */
  listenerCount(event: InstanceEventType): number {
    const listeners = this._events.get(event);
    return listeners ? listeners.length : 0;
  }

  /**
   * Gets all registered event types
   */
  get eventTypes(): InstanceEventType[] {
    return Array.from(this._events.keys());
  }

  /**
   * Gets the total number of registered listeners
   */
  get totalListenerCount(): number {
    let total = 0;
    for (const listeners of this._events.values()) {
      total += listeners.length;
    }
    return total;
  }

  /**
   * Destroys this event emitter and cleans up all listeners
   */
  destroy(): void {
    if (this._isDestroyed) {
      return;
    }

    this._isDestroyed = true;
    this._events.clear();
  }

  /**
   * Checks if this emitter has been destroyed
   */
  get isDestroyed(): boolean {
    return this._isDestroyed;
  }
}
