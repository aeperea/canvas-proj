import {EditorState} from '../types';

const STORAGE_KEY = 'canvas-proj-state';

/**
 * Persistence utilities for localStorage
 * Saves/loads EditorState to browser storage
 */

/**
 * Save editor state to localStorage
 */
export function saveState(state: EditorState): void {
  try {
    const serialized = JSON.stringify(state);
    localStorage.setItem(STORAGE_KEY, serialized);
  } catch (error) {
    console.error('Failed to save state to localStorage:', error);
  }
}

/**
 * Load editor state from localStorage
 * Returns null if nothing is saved
 */
export function loadState(): EditorState | null {
  try {
    const serialized = localStorage.getItem(STORAGE_KEY);
    if (!serialized) return null;
    return JSON.parse(serialized);
  } catch (error) {
    console.error('Failed to load state from localStorage:', error);
    return null;
  }
}

/**
 * Clear all saved state from localStorage
 */
export function clearState(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error('Failed to clear state from localStorage:', error);
  }
}

/**
 * Get the size of saved state in bytes (for debugging)
 */
export function getStateSizeInBytes(): number {
  try {
    const serialized = localStorage.getItem(STORAGE_KEY);
    if (!serialized) return 0;
    return new Blob([serialized]).size;
  } catch (error) {
    console.error('Failed to get state size:', error);
    return 0;
  }
}
