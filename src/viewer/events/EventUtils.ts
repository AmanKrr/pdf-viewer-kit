/*
  Copyright 2025 Aman Kumar

  Licensed under the Apache License, Version 2.0 (the "License");
  You may not use this file except in compliance with the License.
  You may obtain a copy of the License at

      http://www.apache.org/licenses/LICENSE-2.0

  Unless required by applicable law or agreed to in writing, software
  distributed under the License is distributed on an "AS IS" BASIS,
  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
  See the License for the specific language governing permissions and
  limitations under the License.
*/

import { Events } from '../../types/events.types';

/**
 * A simple event emitter class for managing event-driven programming.
 * It allows registering event listeners, emitting events, and removing event listeners.
 */
class EventEmitter {
  /** Stores registered event listeners. */
  private events: { [event: string]: Array<(...args: any[]) => void> } = {};

  /**
   * Registers an event listener for a specific event.
   *
   * @param {Events} event - The event name.
   * @param {(...args: any[]) => void} listener - The callback function to execute when the event is emitted.
   */
  on(event: Events, listener: (...args: any[]) => void): void {
    if (!this.events[event]) {
      this.events[event] = [];
    }
    this.events[event].push(listener);
  }

  /**
   * Emits an event, triggering all registered listeners with the provided arguments.
   *
   * @param {Events} event - The event name.
   * @param {...any[]} args - Arguments to pass to the event listeners.
   */
  emit(event: Events, ...args: any[]): void {
    if (this.events[event]) {
      this.events[event].forEach((listener) => listener(...args));
    }
  }

  /**
   * Removes a specific listener for an event.
   *
   * @param {Events} event - The event name.
   * @param {(...args: any[]) => void} listener - The listener function to remove.
   */
  off(event: Events, listener: (...args: any[]) => void): void {
    if (this.events[event]) {
      this.events[event] = this.events[event].filter((l) => l !== listener);
    }
  }

  /**
   * Removes **all** listeners.
   * If you pass an event name, only that event’s handlers are cleared;
   * otherwise **every** event is wiped out.
   */
  public removeAllListeners(event?: Events): void {
    if (event) {
      delete this.events[event];
    } else {
      this.events = {};
    }
  }
}

export default EventEmitter;
