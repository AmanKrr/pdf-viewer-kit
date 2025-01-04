import { Events } from '../../types/events.types';
declare class EventEmitter {
    private events;
    on(event: Events, listener: (...args: any[]) => void): void;
    emit(event: Events, ...args: any[]): void;
    off(event: Events, listener: (...args: any[]) => void): void;
}
export default EventEmitter;
