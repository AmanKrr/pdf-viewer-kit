import { Events } from '../../types/events.types';
/**
 * A simple event emitter class for managing event-driven programming.
 * It allows registering event listeners, emitting events, and removing event listeners.
 */
declare class EventEmitter {
    /** Stores registered event listeners. */
    private events;
    /**
     * Registers an event listener for a specific event.
     *
     * @param {Events} event - The event name.
     * @param {(...args: any[]) => void} listener - The callback function to execute when the event is emitted.
     */
    on(event: Events, listener: (...args: any[]) => void): void;
    /**
     * Emits an event, triggering all registered listeners with the provided arguments.
     *
     * @param {Events} event - The event name.
     * @param {...any[]} args - Arguments to pass to the event listeners.
     */
    emit(event: Events, ...args: any[]): void;
    /**
     * Removes a specific listener for an event.
     *
     * @param {Events} event - The event name.
     * @param {(...args: any[]) => void} listener - The listener function to remove.
     */
    off(event: Events, listener: (...args: any[]) => void): void;
    /**
     * Removes **all** listeners.
     * If you pass an event name, only that event’s handlers are cleared;
     * otherwise **every** event is wiped out.
     */
    removeAllListeners(event?: Events): void;
}
export default EventEmitter;
//# sourceMappingURL=EventUtils.d.ts.map