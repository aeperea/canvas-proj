/**
 * OS Detection utilities
 */

export type OS = 'mac' | 'windows' | 'linux' | 'unknown';

/**
 * Detect the current operating system
 */
export function detectOS(): OS {
  if (typeof navigator === 'undefined') return 'unknown';

  const userAgent = navigator.userAgent.toLowerCase();

  if (userAgent.includes('mac') || userAgent.includes('iphone')) {
    return 'mac';
  } else if (userAgent.includes('win')) {
    return 'windows';
  } else if (userAgent.includes('linux')) {
    return 'linux';
  }

  return 'unknown';
}

/**
 * Get the modifier key name for the current OS
 */
export function getModifierKey(): string {
  const os = detectOS();
  return os === 'mac' ? 'Cmd' : 'Ctrl';
}

/**
 * Get the modifier key symbol for the current OS
 */
export function getModifierSymbol(): string {
  const os = detectOS();
  return os === 'mac' ? '⌘' : 'Ctrl';
}

/**
 * Get undo shortcut display text for current OS
 */
export function getUndoShortcut(): string {
  const symbol = getModifierSymbol();
  return `${symbol}+Z`;
}

/**
 * Get redo shortcut display text for current OS
 */
export function getRedoShortcut(): string {
  const symbol = getModifierSymbol();
  const os = detectOS();
  if (os === 'mac') {
    return `${symbol}+Shift+Z`;
  }
  return `${symbol}+Shift+Z`;
}

/**
 * Check if a keyboard event is the undo shortcut
 */
export function isUndoShortcut(e: KeyboardEvent): boolean {
  return (e.ctrlKey || e.metaKey) && !e.shiftKey && e.key.toLowerCase() === 'z';
}

/**
 * Check if a keyboard event is the redo shortcut
 */
export function isRedoShortcut(e: KeyboardEvent): boolean {
  return (e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'z';
}
