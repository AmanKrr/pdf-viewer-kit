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
 * Debug flag for enabling/disabling debug logging.
 * Set to true for local troubleshooting and development.
 */
const IS_DEBUG = false;

/**
 * Logs debug messages to the console when debug mode is enabled.
 *
 * @param args - Arguments to log (same as console.log)
 */
export function debugLog(...args: any[]): void {
  if (IS_DEBUG) {
    console.log('[PDF-Viewer]', ...args);
  }
}

/**
 * Logs debug warnings to the console when debug mode is enabled.
 *
 * @param args - Arguments to log (same as console.warn)
 */
export function debugWarn(...args: any[]): void {
  if (IS_DEBUG) {
    console.warn('[PDF-Viewer]', ...args);
  }
}

/**
 * Reports errors to the console with context information.
 * Always logs errors regardless of debug mode for production monitoring.
 *
 * @param context - Context where the error occurred
 * @param err - The error object or message
 */
export function reportError(context: string, err: unknown): void {
  console.error(`[PDF-Viewer] ${context}`, err);
}
