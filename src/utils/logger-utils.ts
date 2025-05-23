// src/utils/logger.ts

class Logger {
  private logs: string[] = [];

  /** internal formatter */
  private format(level: string, message: string, meta?: any) {
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

  /** Capture an INFO-level entry */
  public info(message: string, meta?: any) {
    const entry = this.format('INFO', message, meta);
    this.logs.push(entry);
  }

  /** Capture a WARNING */
  public warn(message: string, meta?: any) {
    const entry = this.format('WARN', message, meta);
    this.logs.push(entry);
  }

  /** Capture an ERROR */
  public error(message: string, meta?: any) {
    const entry = this.format('ERROR', message, meta);
    this.logs.push(entry);
  }

  /** Download all captured logs to a `.txt` file */
  public download(filename = 'pdfjs-debug-log.txt') {
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

  /** Clear the in-memory logs */
  public clear() {
    this.logs = [];
  }
}

export default new Logger();
