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

export interface ISelectable {
  id: string;
  type: string; // e.g. 'rectangle', 'circle', etc.
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
    this._notifyListeners();
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
  private _notifyListeners(): void {
    this.listeners.forEach((listener) => listener(this.selectedShape));
  }
}
