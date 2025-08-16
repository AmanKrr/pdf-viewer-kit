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

import { ShapeType } from '../../types/geometry.types';

export interface DrawConfig {
  strokeStyle: 'Solid' | 'Dashed' | 'Dotted';
  strokeColor: string;
  fillColor: string;
  opacity: number;
  strokeWidth: number;
  type: ShapeType;
}

export interface AnnotationToolbarState {
  selectedShape: ShapeType | 'none';
  selectedShapeIcon: string;
  propertiesOpen: boolean;
  shapeDropdownOpen: boolean;
  drawConfig: DrawConfig;
  isAnnotationEnabled: boolean;
}

export type StateChangeListener = (prevState: AnnotationToolbarState, newState: AnnotationToolbarState) => void;

/**
 * Centralized state manager for the annotation toolbar
 * Provides reactive state updates and change notifications
 */
export class AnnotationToolbarStateManager {
  private _state: AnnotationToolbarState;
  private _listeners: Map<string, StateChangeListener[]> = new Map();

  constructor(initialState?: Partial<AnnotationToolbarState>) {
    this._state = {
      selectedShape: 'none',
      selectedShapeIcon: 'none',
      propertiesOpen: false,
      shapeDropdownOpen: false,
      drawConfig: {
        strokeStyle: 'Solid',
        strokeColor: 'red',
        fillColor: 'transparent',
        opacity: 1,
        strokeWidth: 2,
        type: 'rectangle',
      },
      isAnnotationEnabled: false,
      ...initialState,
    };
  }

  get state(): Readonly<AnnotationToolbarState> {
    return { ...this._state };
  }

  /**
   * Update state with partial changes and notify listeners
   */
  setState(updates: Partial<AnnotationToolbarState>): void {
    const prevState = { ...this._state };
    this._state = { ...this._state, ...updates };
    this._notifyListeners(prevState, this._state);
  }

  /**
   * Update specific draw config properties
   */
  updateDrawConfig(updates: Partial<DrawConfig>): void {
    const prevState = { ...this._state };
    this._state.drawConfig = { ...this._state.drawConfig, ...updates };
    this._notifyListeners(prevState, this._state);
  }

  /**
   * Subscribe to state changes
   */
  subscribe(listener: StateChangeListener, key?: string): () => void {
    const eventKey = key || 'default';
    if (!this._listeners.has(eventKey)) {
      this._listeners.set(eventKey, []);
    }
    this._listeners.get(eventKey)!.push(listener);

    // Return unsubscribe function
    return () => {
      const listeners = this._listeners.get(eventKey);
      if (listeners) {
        const index = listeners.indexOf(listener);
        if (index > -1) {
          listeners.splice(index, 1);
        }
      }
    };
  }

  /**
   * Subscribe to specific state property changes
   */
  subscribeToProperty<K extends keyof AnnotationToolbarState>(
    property: K,
    listener: (newValue: AnnotationToolbarState[K], oldValue: AnnotationToolbarState[K]) => void,
  ): () => void {
    return this.subscribe((prevState, newState) => {
      if (prevState[property] !== newState[property]) {
        listener(newState[property], prevState[property]);
      }
    }, `property:${property}`);
  }

  /**
   * Subscribe to draw config changes
   */
  subscribeToDrawConfig(listener: (newConfig: DrawConfig, oldConfig: DrawConfig) => void): () => void {
    return this.subscribe((prevState, newState) => {
      if (JSON.stringify(prevState.drawConfig) !== JSON.stringify(newState.drawConfig)) {
        listener(newState.drawConfig, prevState.drawConfig);
      }
    }, 'drawConfig');
  }

  private _notifyListeners(prevState: AnnotationToolbarState, newState: AnnotationToolbarState): void {
    // Notify all listeners
    this._listeners.forEach((listeners, key) => {
      listeners.forEach((listener) => {
        try {
          listener(prevState, newState);
        } catch (error) {
          console.error(`Error in state change listener for key "${key}":`, error);
        }
      });
    });
  }

  /**
   * Reset state to initial values
   */
  reset(): void {
    const prevState = { ...this._state };
    this._state = {
      selectedShape: 'none',
      selectedShapeIcon: 'none',
      propertiesOpen: false,
      shapeDropdownOpen: false,
      drawConfig: {
        strokeStyle: 'Solid',
        strokeColor: 'red',
        fillColor: 'transparent',
        opacity: 1,
        strokeWidth: 2,
        type: 'rectangle',
      },
      isAnnotationEnabled: false,
    };
    this._notifyListeners(prevState, this._state);
  }

  /**
   * Clean up all listeners
   */
  destroy(): void {
    this._listeners.clear();
  }
}
