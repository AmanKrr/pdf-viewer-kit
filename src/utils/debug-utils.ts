const IS_DEBUG = false; // flip to true for local troubleshooting

export function debugLog(...args: any[]) {
  if (IS_DEBUG) {
    console.log('[PDF-Viewer]', ...args);
  }
}

export function debugWarn(...args: any[]) {
  if (IS_DEBUG) {
    console.warn('[PDF-Viewer]', ...args);
  }
}

export function reportError(context: string, err: unknown) {
  // Always log true errors (could also send to remote)
  console.error(`[PDF-Viewer] ${context}`, err);
}
