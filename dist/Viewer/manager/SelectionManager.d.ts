export interface ISelectable {
    id: string;
    type: string;
}
export declare class SelectionManager {
    private selectedShape;
    private listeners;
    /**
     * Sets the currently selected shape.
     * @param shape The shape to select or null to clear selection.
     */
    setSelected(shape: ISelectable | null): void;
    /**
     * Returns the currently selected shape.
     */
    getSelected(): ISelectable | null;
    /**
     * Registers a listener that will be notified when the selection changes.
     * Returns a function that, when called, unsubscribes the listener.
     * @param listener A callback function receiving the new selection.
     */
    onSelectionChange(listener: (selected: ISelectable | null) => void): () => void;
    /**
     * Notifies all registered listeners of a selection change.
     */
    private notifyListeners;
}
