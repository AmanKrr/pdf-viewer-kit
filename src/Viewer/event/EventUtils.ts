import { Events } from '../../types/events.types';
class EventEmitter {
  private events: { [event: string]: Array<(...args: any[]) => void> } = {};

  on(event: Events, listener: (...args: any[]) => void): void {
    if (!this.events[event]) {
      this.events[event] = [];
    }
    this.events[event].push(listener);
  }

  emit(event: Events, ...args: any[]): void {
    if (this.events[event]) {
      this.events[event].forEach((listener) => listener(...args));
    }
  }

  off(event: Events, listener: (...args: any[]) => void): void {
    if (this.events[event]) {
      this.events[event] = this.events[event].filter((l) => l !== listener);
    }
  }
}

export default EventEmitter;
