import {EditorState, Rect, Rectangle} from '../types';
import {worldToScreen} from './CoordinateTransform';

/**
 * Canvas Renderer - Draws the scene to canvas
 */

/**
 * Draw the background grid (screen space)
 */
export function drawGrid(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number
): void {
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, width, height);

  ctx.strokeStyle = '#e0e0e0';
  ctx.lineWidth = 1;

  const gridSize = 20;
  for (let x = 0; x < width; x += gridSize) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
    ctx.stroke();
  }
  for (let y = 0; y < height; y += gridSize) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
  }
}

/**
 * Draw all shapes in the scene
 */
export function drawShapes(
  ctx: CanvasRenderingContext2D,
  state: EditorState
): void {
  for (const shape of state.shapes) {
    if (shape.type === 'rectangle') {
      drawRectangle(ctx, shape, state);
    }
  }
}

/**
 * Draw a single rectangle in world space, transformed to screen space
 */
function drawRectangle(
  ctx: CanvasRenderingContext2D,
  rect: Rectangle,
  state: EditorState
): void {
  // Convert world space corners to screen space
  const topLeft = worldToScreen({x: rect.x, y: rect.y}, state.transform);
  const bottomRight = worldToScreen(
    {x: rect.x + rect.width, y: rect.y + rect.height},
    state.transform
  );

  const screenWidth = bottomRight.x - topLeft.x;
  const screenHeight = bottomRight.y - topLeft.y;

  // Draw fill
  ctx.fillStyle = rect.fill;
  ctx.fillRect(topLeft.x, topLeft.y, screenWidth, screenHeight);

  // Draw stroke
  ctx.strokeStyle = rect.stroke;
  ctx.lineWidth = rect.strokeWidth;
  ctx.strokeRect(topLeft.x, topLeft.y, screenWidth, screenHeight);

  // Draw selection highlight
  if (state.selectedShapeId === rect.id) {
    ctx.strokeStyle = '#ff6b6b';
    ctx.lineWidth = 3;
    ctx.strokeRect(
      topLeft.x - 2,
      topLeft.y - 2,
      screenWidth + 4,
      screenHeight + 4
    );
  }
}

/**
 * Render the entire scene
 */
export function render(
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  state: EditorState
): void {
  // Clear and draw grid
  drawGrid(ctx, canvas.width, canvas.height);

  // Draw all shapes
  drawShapes(ctx, state);
}
