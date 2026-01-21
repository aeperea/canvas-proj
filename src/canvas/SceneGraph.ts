import {EditorState, Rectangle, Transform, Shape} from '../types';

/**
 * Scene Graph - Manages all shapes in the editor
 */

/**
 * Create initial empty state
 */
export function createInitialState(): EditorState {
  return {
    shapes: [],
    selectedShapeId: null,
    transform: {
      panX: 0,
      panY: 0,
      zoom: 1,
    },
    resizing: null,
  };
}

/**
 * Create a new rectangle at the given world position
 */
export function createRectangle(
  x: number,
  y: number,
  width: number = 100,
  height: number = 60,
  fill: string = '#4a90e2',
  stroke: string = '#1e3a8a',
  strokeWidth: number = 2
): Rectangle {
  return {
    id: generateId(),
    type: 'rectangle',
    x,
    y,
    width,
    height,
    fill,
    stroke,
    strokeWidth,
  };
}

/**
 * Add a shape to the scene
 */
export function addShape(state: EditorState, shape: Shape): EditorState {
  return {
    ...state,
    shapes: [...state.shapes, shape],
    selectedShapeId: shape.id,
  };
}

/**
 * Remove a shape from the scene
 */
export function removeShape(state: EditorState, shapeId: string): EditorState {
  return {
    ...state,
    shapes: state.shapes.filter((s) => s.id !== shapeId),
    selectedShapeId:
      state.selectedShapeId === shapeId ? null : state.selectedShapeId,
  };
}

/**
 * Update a shape's properties
 */
export function updateShape(
  state: EditorState,
  shapeId: string,
  updates: Partial<Shape>
): EditorState {
  return {
    ...state,
    shapes: state.shapes.map((s) =>
      s.id === shapeId ? {...s, ...updates} : s
    ),
  };
}

/**
 * Select a shape
 */
export function selectShape(
  state: EditorState,
  shapeId: string | null
): EditorState {
  return {
    ...state,
    selectedShapeId: shapeId,
  };
}

/**
 * Get the currently selected shape
 */
export function getSelectedShape(state: EditorState): Shape | null {
  if (!state.selectedShapeId) return null;
  return state.shapes.find((s) => s.id === state.selectedShapeId) || null;
}

/**
 * Find a shape by ID
 */
export function getShapeById(state: EditorState, id: string): Shape | null {
  return state.shapes.find((s) => s.id === id) || null;
}

/**
 * Update the transform (pan/zoom)
 */
export function setTransform(
  state: EditorState,
  transform: Transform
): EditorState {
  return {
    ...state,
    transform,
  };
}

/**
 * Generate a unique ID for shapes
 */
function generateId(): string {
  return `shape_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}
