// SelectionManager.ts
export interface ISelectable {
  id: string;
  type: string; // e.g. 'rectangle', 'circle', etc.
  // You can extend this interface with additional properties if needed.
}

export class SelectionManager {
  private selectedShape: ISelectable | null = null;
  private listeners: Array<(selected: ISelectable | null) => void> = [];

  /**
   * Sets the currently selected shape.
   * @param shape The shape to select or null to clear selection.
   */
  public setSelected(shape: ISelectable | null): void {
    this.selectedShape = shape;
    this.notifyListeners();
  }

  /**
   * Returns the currently selected shape.
   */
  public getSelected(): ISelectable | null {
    return this.selectedShape;
  }

  /**
   * Registers a listener that will be notified when the selection changes.
   * Returns a function that, when called, unsubscribes the listener.
   * @param listener A callback function receiving the new selection.
   */
  public onSelectionChange(listener: (selected: ISelectable | null) => void): () => void {
    this.listeners.push(listener);
    // Return an unsubscribe function.
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  /**
   * Notifies all registered listeners of a selection change.
   */
  private notifyListeners(): void {
    this.listeners.forEach((listener) => listener(this.selectedShape));
  }
}
