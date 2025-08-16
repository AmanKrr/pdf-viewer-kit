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
 * Event types specific to a PDF viewer instance.
 *
 * These events represent various state changes and actions that can occur
 * within a single PDF viewer instance, ensuring complete isolation between instances.
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
 *
 * Events from one instance cannot affect other instances, providing
 * complete isolation for multi-instance PDF viewing scenarios.
 * Each emitter maintains its own set of listeners and event handling.
 */
export class InstanceEventEmitter {
  private readonly _instanceId: string;
  private readonly _events: Map<InstanceEventType, Array<(...args: any[]) => void>> = new Map();
  private _isDestroyed = false;

  /**
   * Creates a new event emitter for a specific PDF instance.
   *
   * @param instanceId - Unique identifier for the PDF instance
   */
  constructor(instanceId: string) {
    this._instanceId = instanceId;
  }

  /**
   * Gets the instance ID this emitter belongs to.
   *
   * @returns The unique identifier of the PDF instance
   */
  get instanceId(): string {
    return this._instanceId;
  }

  /**
   * Registers an event listener for this instance only.
   *
   * The listener will receive events specific to this PDF instance,
   * ensuring complete isolation from other instances.
   *
   * @param event - The event type to listen for
   * @param listener - Function to call when the event occurs
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
   * Emits an event to listeners registered on this instance only.
   *
   * Automatically enriches event data with instance ID and timestamp
   * for debugging and tracking purposes.
   *
   * @param event - The event type to emit
   * @param args - Additional data to pass to event listeners
   */
  emit(event: InstanceEventType, ...args: any[]): void {
    if (this._isDestroyed) {
      return;
    }

    const listeners = this._events.get(event);
    if (listeners) {
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
   * Removes a specific event listener.
   *
   * @param event - The event type to remove the listener from
   * @param listener - The specific listener function to remove
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
   * Removes all listeners for a specific event or all events.
   *
   * @param event - Optional event type. If not specified, removes all listeners
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
   * Gets the number of listeners for a specific event.
   *
   * @param event - The event type to count listeners for
   * @returns The number of registered listeners for the event
   */
  listenerCount(event: InstanceEventType): number {
    const listeners = this._events.get(event);
    return listeners ? listeners.length : 0;
  }

  /**
   * Gets all registered event types.
   *
   * @returns Array of all event types that have registered listeners
   */
  get eventTypes(): InstanceEventType[] {
    return Array.from(this._events.keys());
  }

  /**
   * Gets the total number of registered listeners across all events.
   *
   * @returns The total count of all registered listeners
   */
  get totalListenerCount(): number {
    let total = 0;
    for (const listeners of this._events.values()) {
      total += listeners.length;
    }
    return total;
  }

  /**
   * Destroys this event emitter and cleans up all listeners.
   *
   * After destruction, the emitter cannot be used and all
   * event handling is permanently disabled.
   */
  destroy(): void {
    if (this._isDestroyed) {
      return;
    }

    this._isDestroyed = true;
    this._events.clear();
  }

  /**
   * Checks if this emitter has been destroyed.
   *
   * @returns True if the emitter has been destroyed, false otherwise
   */
  get isDestroyed(): boolean {
    return this._isDestroyed;
  }
}
