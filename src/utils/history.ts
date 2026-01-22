import {EditorState} from '../types';

/**
 * History Manager - Manages undo/redo state
 */

export interface HistoryState {
  past: EditorState[];
  present: EditorState;
  future: EditorState[];
}

/**
 * Create initial history state
 */
export function createHistoryState(initialState: EditorState): HistoryState {
  return {
    past: [],
    present: initialState,
    future: [],
  };
}

/**
 * Push a new state onto the history
 * Clears the future stack (redo history)
 */
export function pushHistory(
  history: HistoryState,
  newState: EditorState
): HistoryState {
  return {
    past: [...history.past, history.present],
    present: newState,
    future: [],
  };
}

/**
 * Undo: Move current state to future, pop from past
 * Returns null if there's nothing to undo
 */
export function undo(history: HistoryState): HistoryState | null {
  if (history.past.length === 0) return null;

  const newPast = history.past.slice(0, -1);
  const newPresent = history.past[history.past.length - 1];

  return {
    past: newPast,
    present: newPresent,
    future: [history.present, ...history.future],
  };
}

/**
 * Redo: Move future state to present, add current to past
 * Returns null if there's nothing to redo
 */
export function redo(history: HistoryState): HistoryState | null {
  if (history.future.length === 0) return null;

  const newPresent = history.future[0];
  const newFuture = history.future.slice(1);

  return {
    past: [...history.past, history.present],
    present: newPresent,
    future: newFuture,
  };
}

/**
 * Get current state from history
 */
export function getCurrentState(history: HistoryState): EditorState {
  return history.present;
}

/**
 * Check if we can undo
 */
export function canUndo(history: HistoryState): boolean {
  return history.past.length > 0;
}

/**
 * Check if we can redo
 */
export function canRedo(history: HistoryState): boolean {
  return history.future.length > 0;
}

/**
 * Get debug info about history
 */
export function getHistoryStats(history: HistoryState): {
  pastSize: number;
  futureSize: number;
} {
  return {
    pastSize: history.past.length,
    futureSize: history.future.length,
  };
}
