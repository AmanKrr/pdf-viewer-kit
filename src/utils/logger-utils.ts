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
 * Logger class for capturing and managing PDF viewer debug information.
 *
 * Provides structured logging with timestamp, log levels, and metadata support.
 * Logs can be downloaded as text files for debugging purposes.
 */
class Logger {
  private logs: string[] = [];

  /**
   * Formats a log entry with timestamp, level, message, and optional metadata.
   *
   * @param level - Log level (INFO, WARN, ERROR)
   * @param message - The log message
   * @param meta - Optional metadata object to include
   * @returns Formatted log entry string
   */
  private format(level: string, message: string, meta?: any): string {
    const ts = new Date().toISOString();
    let entry = `${ts} [${level}] ${message}`;
    if (meta !== undefined) {
      try {
        entry += '  ' + JSON.stringify(meta);
      } catch {
        entry += '  [unserializable metadata]';
      }
    }
    return entry;
  }

  /**
   * Captures an INFO-level log entry.
   *
   * @param message - The informational message
   * @param meta - Optional metadata object
   */
  public info(message: string, meta?: any): void {
    const entry = this.format('INFO', message, meta);
    this.logs.push(entry);
  }

  /**
   * Captures a WARNING-level log entry.
   *
   * @param message - The warning message
   * @param meta - Optional metadata object
   */
  public warn(message: string, meta?: any): void {
    const entry = this.format('WARN', message, meta);
    this.logs.push(entry);
  }

  /**
   * Captures an ERROR-level log entry.
   *
   * @param message - The error message
   * @param meta - Optional metadata object
   */
  public error(message: string, meta?: any): void {
    const entry = this.format('ERROR', message, meta);
    this.logs.push(entry);
  }

  /**
   * Downloads all captured logs to a text file.
   *
   * @param filename - Name of the file to download (default: 'pdfjs-debug-log.txt')
   */
  public download(filename = 'pdfjs-debug-log.txt'): void {
    const blob = new Blob([this.logs.join('\n')], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  /**
   * Clears all in-memory logs.
   */
  public clear(): void {
    this.logs = [];
  }
}

export default new Logger();
