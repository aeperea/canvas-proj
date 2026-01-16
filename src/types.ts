/**
 * 2D point - can represent world or screen coordinates
 */
export interface Point {
  x: number;
  y: number;
}

/**
 * 2D size
 */
export interface Size {
  width: number;
  height: number;
}

/**
 * Rectangle in world space
 */
export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Viewport transform - maps world space to screen space
 * pan: offset in screen space
 * zoom: scale factor (> 1 zooms in, < 1 zooms out)
 */
export interface Transform {
  panX: number;
  panY: number;
  zoom: number;
}

/**
 * Shapes that can be drawn
 */
export type Shape = Rectangle;

/**
 * Rectangle shape in world space
 */
export interface Rectangle {
  id: string;
  type: 'rectangle';
  x: number;
  y: number;
  width: number;
  height: number;
  fill: string;
  stroke: string;
  strokeWidth: number;
}

/**
 * Editor state
 */
export interface EditorState {
  shapes: Shape[];
  selectedShapeId: string | null;
  transform: Transform;
}
